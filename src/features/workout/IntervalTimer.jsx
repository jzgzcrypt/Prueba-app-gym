"use client";

import { useState, useEffect, useRef } from "react";
import { C, CAT } from "@/design/tokens";
import { comoVa, entre, foto, ritmoActual, ritmoMedio } from "@/domain/running/gps";
import { avisoGps, useGps } from "@/features/workout/useGps";
import { decir, guardarVoz, leerVoz, ritmoHablado, textoRitmo, usePantallaEncendida } from "@/features/workout/voz";

/** 90 -> "90 segundos"; 120 -> "2 minutos"; 150 -> "2 minutos y medio". */
function duracionHablada(seg) {
  if (seg < 100) return seg + " segundos";
  const m = Math.floor(seg / 60), r = seg % 60;
  if (r === 0) return m + (m === 1 ? " minuto" : " minutos");
  if (r === 30) return m + " minutos y medio";
  return m + " minutos " + r;
}
/** Lo que dice la voz al empezar un tramo. Numera las series rapidas: es lo
 *  que se pierde de vista con el movil en el bolsillo. */
function anuncio(tramo, nSerie, totalSeries, ritmo) {
  if (tramo.tipo === "rapido") {
    return "Serie " + nSerie + " de " + totalSeries + ". " + (ritmo ? "A " + ritmoHablado(ritmo) + ". " : "") + "¡Ya!";
  }
  if (tramo.tipo === "correr") return "Corre. " + duracionHablada(tramo.seg) + ".";
  if (tramo.tipo === "caminar") return "Camina. " + duracionHablada(tramo.seg) + ".";
  return "Recupera, trote suave. " + duracionHablada(tramo.seg) + ".";
}
const CORRIDO = new Set(["rapido", "correr"]);
const COLOR_COMO = { bien: C.ok, rapido: C.amber, lento: C.amber };

/**
 * El temporizador de las series, con GPS: mide cada tramo corrido y ensena a
 * que ritmo vas (en verde si vas en el objetivo, en ambar si no). La voz solo
 * dice los tramos, como antes. `resultadoRef` recibe { tramos, total } para
 * la libreta.
 */
export function IntervalTimer({ intervalos, ritmo, resultadoRef }) {
  // Expande la estructura comprimida [{r:6, s:[["correr",90],["caminar",120]]}] en una lista plana de tramos
  const tramos = [];
  intervalos.forEach(bloque => {
    for (let i = 0; i < bloque.r; i++) {
      bloque.s.forEach(([tipo, seg]) => tramos.push({ tipo, seg }));
    }
  });

  const [idx, setIdx] = useState(0);
  const [restante, setRestante] = useState(tramos[0] ? tramos[0].seg : 0);
  const [corriendo, setCorriendo] = useState(false);
  const [terminado, setTerminado] = useState(false);
  // Voz: con el movil en el bolsillo no se ve la pantalla. Se puede apagar.
  const [voz, setVoz] = useState(true);
  // El intervalo lee la voz de un ref: si se apaga a mitad de tramo, calla ya.
  const vozRef = useRef(true);
  useEffect(() => { const v = leerVoz(); setVoz(v); vozRef.current = v; }, []);
  const hablar = (texto) => { if (vozRef.current && texto) decir(texto); };

  const gps = useGps();
  // El GPS empieza a buscar al abrir la sesion: al pulsar EMPEZAR ya tiene
  // señal y los primeros metros cuentan bien. Hasta entonces no se cuenta nada.
  useEffect(() => { gps.escuchar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Cada tramo corrido, medido: { [idx]: { tipo, m, seg, ritmo } }. Por indice,
  // asi cerrar el mismo tramo dos veces no lo duplica.
  const [medidos, setMedidos] = useState({});
  const medidosRef = useRef({});
  const inicioTramoRef = useRef({ idx: 0, foto: { m: 0, seg: 0 } });

  // Numero de serie rapida de cada tramo, para decir "serie 3 de 5".
  const totalRapidas = tramos.filter(t => t.tipo === "rapido").length;
  const nSerieDe = (i) => tramos.slice(0, i + 1).filter(t => t.tipo === "rapido").length;

  const guardarResultado = () => {
    if (!resultadoRef) return;
    const lista = Object.keys(medidosRef.current).sort((a, b) => a - b).map(k => medidosRef.current[k]);
    resultadoRef.current = { tramos: lista, total: foto(gps.regRef.current), traza: gps.regRef.current.traza };
  };
  /** Cierra el tramo `i`: lo mide, cortando en este instante exacto. */
  const cerrarTramo = (i) => {
    const t = tramos[i];
    const ini = inicioTramoRef.current;
    const ahora = foto(gps.regRef.current, Date.now());
    inicioTramoRef.current = { idx: i + 1, foto: ahora };
    if (!t || !CORRIDO.has(t.tipo) || ini.idx !== i) return;
    const med = { tipo: t.tipo, ...entre(ini.foto, ahora) };
    if (!med.ritmo) return;
    medidosRef.current = { ...medidosRef.current, [i]: med };
    setMedidos(medidosRef.current);
    guardarResultado();
  };
  const anunciar = (i) => { const t = tramos[i]; if (t) hablar(anuncio(t, nSerieDe(i), totalRapidas, ritmo)); };
  const terminar = (ultimo) => {
    cerrarTramo(ultimo);
    setTerminado(true); setCorriendo(false);
    gps.parar(); guardarResultado();
    hablar("Terminado. Buen trabajo.");
  };
  const audioCtxRef = useRef(null);

  const pitar = (frecuencia, duracionMs) => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = frecuencia;
      osc.type = "square"; // mas penetrante que "sine", se oye mucho mejor al aire libre
      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duracionMs / 1000);
      osc.start(); osc.stop(ctx.currentTime + duracionMs / 1000);
    } catch (e) { /* audio no disponible, seguimos sin sonido */ }
  };
  const vibrar = (patron) => {
    try { if (navigator.vibrate) navigator.vibrate(patron); } catch (e) { /* sin vibracion */ }
  };

  // Para el mapa: las series en color, la recuperacion en gris.
  useEffect(() => { const t = tramos[idx]; gps.marcar(t && CORRIDO.has(t.tipo) ? 0 : 1); }, [idx]);

  // Pantalla encendida mientras corre: con ella apagada, Chrome suspende los
  // avisos y deja de dar GPS.
  usePantallaEncendida(corriendo && !terminado);

  useEffect(() => {
    if (!corriendo || terminado) return;
    // Marca de tiempo real de finalizacion del tramo actual: si el navegador suspende
    // los timers (pantalla bloqueada), al volver el tiempo restante sigue siendo correcto.
    const finTramo = Date.now() + restante * 1000;
    let ultimoAvisado = null;
    const t = setInterval(() => {
      const seg = Math.max(0, Math.round((finTramo - Date.now()) / 1000));
      setRestante(seg);
      if (seg <= 5 && seg >= 1 && seg !== ultimoAvisado) {
        ultimoAvisado = seg;
        pitar(880, 140); vibrar(90);
      }
      if (seg <= 0) {
        pitar(1320, 450); vibrar([180, 90, 180]);
        setIdx(prevIdx => {
          const nuevoIdx = prevIdx + 1;
          if (nuevoIdx >= tramos.length) { terminar(prevIdx); return prevIdx; }
          cerrarTramo(prevIdx);
          setRestante(tramos[nuevoIdx].seg);
          anunciar(nuevoIdx);
          return nuevoIdx;
        });
      }
      // A mitad de una serie larga, un aviso: ayuda a no cebarse al principio.
      const t0 = tramos[idx];
      if (t0 && t0.tipo === "rapido" && t0.seg >= 240 && seg === Math.round(t0.seg / 2) && ultimoAvisado !== "mitad") {
        ultimoAvisado = "mitad"; hablar("Mitad de la serie.");
      }
    }, 250); // 250ms para no perder avisos si hay microcortes
    return () => clearInterval(t);
  }, [corriendo, terminado, idx, tramos.length]);

  const actual = tramos[idx] || tramos[tramos.length - 1];
  const esCorrer = actual && (actual.tipo === "correr" || actual.tipo === "rapido");
  const colorTramo = esCorrer ? CAT.running : "#3A6EA5";
  const mm = String(Math.floor(restante / 60)).padStart(2, "0");
  const ss = String(restante % 60).padStart(2, "0");
  const completados = tramos.filter((_, i) => i < idx).length;

  const aviso = avisoGps(gps.estado);
  const series = Object.keys(medidos).sort((a, b) => a - b).map(k => ({ i: Number(k), ...medidos[k] })).filter(m => m.tipo === "rapido");
  const media = ritmoMedio(series);
  const ListaSeries = () => series.length ? (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
      {series.map((m, k) => {
        const como = comoVa(m.ritmo, ritmo);
        return (
          <span key={m.i} className="mono" style={{ fontSize: 12, fontWeight: 700, padding: "3px 7px", borderRadius: 6,
            background: "#F2F2F0", color: como ? COLOR_COMO[como] : "#171717" }}>S{k + 1} {textoRitmo(m.ritmo)}</span>
        );
      })}
    </div>
  ) : null;

  if (terminado) {
    return (
      <div style={{ border: "1px solid " + C.ok, background: "#EAF7EE", borderRadius: 4, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ok, marginBottom: 4 }}>Intervalos completados</div>
        {media ? (
          <>
            <div style={{ fontSize: 12.5, color: "#4A4A47" }}>Media de las series: <b className="mono" style={{ color: "#171717" }}>{textoRitmo(media)}/km</b>{ritmo ? " · objetivo " + textoRitmo(ritmo) : ""}</div>
            <div style={{ display: "flex", justifyContent: "center" }}><ListaSeries /></div>
            <div style={{ fontSize: 11.5, color: "#4A4A47", marginTop: 8 }}>Se apunta solo al terminar.</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "#4A4A47" }}>{tramos.length} tramos hechos. Pulsa continuar para registrar el ritmo.</div>
        )}
      </div>
    );
  }

  // Ritmo de ahora y metros del tramo en curso (solo en los tramos corridos).
  const rAhora = corriendo && esCorrer ? ritmoActual(gps.reg, Date.now()) : null;
  const mTramo = corriendo && esCorrer && inicioTramoRef.current.idx === idx ? Math.max(0, Math.round(foto(gps.reg, Date.now()).m - inicioTramoRef.current.foto.m)) : null;
  // Sin velocidad Doppler (algunos moviles), las series cortas salen con ±10-20 s/km: se dice.
  const aproximado = corriendo && gps.reg.modo === "posicion";
  const como = actual && actual.tipo === "rapido" ? comoVa(rAhora, ritmo) : null;

  return (
    <div style={{ border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ background: colorTramo, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#FAFAF9", letterSpacing: 1.5, opacity: 0.9 }}>
          {actual ? (actual.tipo === "rapido" ? "SERIE " + nSerieDe(idx) + " DE " + totalRapidas
            : { correr: "CORRE", caminar: "CAMINA", suave: "RECUPERA" }[actual.tipo] || actual.tipo.toUpperCase()) : ""}
          {actual && actual.tipo === "rapido" && ritmo ? " · A " + textoRitmo(ritmo) + "/KM" : ""}
        </div>
        <div className="mono" style={{ fontSize: 48, fontWeight: 800, color: "#FAFAF9", lineHeight: 1.1, marginTop: 4 }}>
          {mm}:{ss}
        </div>
        <div style={{ fontSize: 11.5, color: "#FAFAF9", opacity: 0.85, marginTop: 2 }}>
          Tramo {idx + 1} de {tramos.length}
        </div>
      </div>

      <div style={{ display: "flex", height: 6, background: "#EDEDEB" }}>
        <div style={{ width: (tramos.length ? (completados / tramos.length) * 100 : 0) + "%", background: C.ok, transition: "width 0.3s ease" }} />
      </div>

      {esCorrer && corriendo && (
        <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8 }}>RITMO AHORA</div>
            <div className="mono" data-ritmo-ahora style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: como ? COLOR_COMO[como] : "#171717" }}>
              {rAhora ? textoRitmo(rAhora) : "–:––"}<span style={{ fontSize: 14, color: "#8A8A87" }}>/km</span>
            </div>
            {como && como !== "bien" && <div style={{ fontSize: 12, fontWeight: 800, color: COLOR_COMO[como] }}>{como === "rapido" ? "Vas rápido: afloja" : "Aprieta un poco"}</div>}
          </div>
          {mTramo != null && gps.estado === "ok" && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8 }}>ESTE TRAMO</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "#171717" }}>{mTramo} m</div>
            </div>
          )}
        </div>
      )}
      {aproximado && <div style={{ padding: "6px 16px 0", fontSize: 11, color: "#8A8A87" }}>Tu móvil no da velocidad GPS: el ritmo de las series es aproximado.</div>}
      {series.length > 0 && <div style={{ padding: "0 16px" }}><ListaSeries /></div>}
      {!corriendo && gps.estado === "ok" && gps.precision != null && (
        <div data-gps-listo style={{ padding: "10px 16px 0", fontSize: 12, fontWeight: 800, color: C.ok }}>GPS listo · ±{Math.round(gps.precision)} m</div>
      )}
      {aviso && <div style={{ padding: "10px 16px 0", fontSize: 12, fontWeight: 700, color: C.amber, lineHeight: 1.4 }}>{aviso}</div>}

      <div style={{ padding: "14px 16px", display: "flex", gap: 8 }}>
        <button className="nb" onClick={() => {
          pitar(660, 100);
          // El primer "hablar" tiene que salir de un toque: iOS no deja hablar
          // a una pagina que no ha tocado nadie.
          if (!corriendo) { anunciar(idx); gps.iniciar(); } else gps.pausar();
          setCorriendo(c => !c);
        }} style={{
          flex: 1, height: 46, borderRadius: 4, background: corriendo ? "#F2F2F0" : "#171717",
          border: "1px solid " + (corriendo ? "#D4D4D1" : "#171717"),
          fontSize: 13, fontWeight: 700, color: corriendo ? "#171717" : "#FAFAF9", letterSpacing: 0.5,
        }}>{corriendo ? "PAUSAR" : (idx === 0 && restante === (tramos[0] ? tramos[0].seg : 0) ? "EMPEZAR" : "REANUDAR")}</button>
        <button className="nb" onClick={() => {
          setIdx(prev => {
            const n = prev + 1;
            if (n >= tramos.length) { terminar(prev); return prev; }
            cerrarTramo(prev);
            setRestante(tramos[n].seg);
            if (corriendo) anunciar(n);
            return n;
          });
        }} style={{
          width: 88, height: 46, borderRadius: 4, background: "#F2F2F0", border: "1px solid #D4D4D1",
          fontSize: 12, fontWeight: 700, color: "#787774",
        }}>SALTAR</button>
      </div>

      <div style={{ padding: "0 16px 10px" }}>
        <button className="nb" onClick={() => { const n = !voz; setVoz(n); vozRef.current = n; guardarVoz(n); if (n) decir("Voz activada."); else try { window.speechSynthesis.cancel(); } catch { /* nada */ } }} style={{
          fontSize: 12, fontWeight: 800, color: voz ? "#171717" : "#8A8A87", minHeight: 36,
        }}>{voz ? "VOZ: SÍ" : "VOZ: NO"} · te dice cada serie</button>
      </div>

      <div style={{ padding: "0 16px 14px", fontSize: 10.5, color: "#8A8A87", lineHeight: 1.4 }}>
        Móvil en la mano o en el brazo, con la app delante: con la pantalla bloqueada el navegador deja de dar GPS y los avisos. Sube el volumen al máximo.
      </div>
    </div>
  );
}
