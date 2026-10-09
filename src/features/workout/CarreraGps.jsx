"use client";

import { useEffect, useRef, useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { comoVa, foto, ritmoActual, tiempoHasta, textoTiempo, segundosEnHuecos } from "@/domain/running/gps";
import { avisosCuentaAtras, estrategiaPrueba, fraseFin, objetivoCarrera, ritmoDePrueba, vozDelKm, vozFinPrueba } from "@/domain/running/objetivo";
import { veredictoCadencia } from "@/domain/running/cadencia";
import { avisoGps, useGps } from "@/features/workout/useGps";
import { useCadencia } from "@/features/workout/useCadencia";
import { decir, guardarVoz, leerVoz, textoRitmo, usePantallaEncendida } from "@/features/workout/voz";

const COLOR_COMO = { bien: A.verde, rapido: A.naranja, lento: A.naranja };
const km = (m) => (m / 1000).toFixed(2).replace(".", ",");
const vibrar = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch { /* sin vibracion */ } };

/**
 * Rodajes, tiradas y pruebas: crono + GPS, como Strava pero dentro del plan.
 *
 * En un rodaje con minutos ("16 min corriendo muy suave") el crono cuenta
 * hacia atras y avisa: mitad, ultimo minuto, 3-2-1 y "¡Hecho!" con vibracion.
 * Si sigues, cuenta "+0:20" y todo lo corrido vale. Al cerrar cada km la voz
 * dice el parcial y como vas: contra el ritmo del dia o, en los suaves,
 * contra tu suave de siempre (`suave`, s/km).
 *
 * En una prueba de distancia, al llegar a los km se para el reloj de la
 * prueba y ese tiempo es el que se apunta. `resultadoRef` recibe
 * { tramos: [], total, tiempoPrueba, traza, huecos, cadencia } para la libreta.
 */
export function CarreraGps({ day, resultadoRef, suave = null, tecnica = false }) {
  const distPrueba = day.prueba && day.prueba.distKm ? day.prueba.distKm * 1000 : null;
  // El ritmo del dia: el de las series o el de la prueba (3 km a 4:50...). Tu
  // suave de siempre solo cuenta en los rodajes: en una prueba no se suelta.
  const objetivo = day.ritmo || ritmoDePrueba(day) || null;
  const estrategia = estrategiaPrueba(day);
  const obj = objetivoCarrera(day);
  const ritmoComparar = objetivo || (day.prueba ? null : suave);
  const gps = useGps();
  // El GPS empieza a buscar al abrir la sesion: al pulsar EMPEZAR ya tiene
  // señal y los primeros metros cuentan bien. Hasta entonces no se cuenta nada.
  useEffect(() => { gps.escuchar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [corriendo, setCorriendo] = useState(false);
  const [empezado, setEmpezado] = useState(false);
  const [, setTic] = useState(0);
  const [tiempoPrueba, setTiempoPrueba] = useState(null);
  const [hecho, setHecho] = useState(false);
  const [voz, setVoz] = useState(true);
  const vozRef = useRef(true);
  useEffect(() => { const v = leerVoz(); setVoz(v); vozRef.current = v; }, []);
  const hablar = (texto) => { if (vozRef.current && texto) decir(texto); };
  // Crono de pared sin pausas: vale aunque no haya GPS.
  const cronoRef = useRef({ acumulado: 0, desde: null });
  const pruebaRef = useRef(null);
  const antesRef = useRef({ s: 0, m: 0, km: 0 });
  const cadRef = useRef(null);

  const cad = useCadencia({
    alAvisar: (spm, texto) => {
      vibrar(200);
      if (spm) { cadRef.current = spm; hablar(veredictoCadencia(spm).texto); } else hablar(texto);
    },
  });

  usePantallaEncendida(corriendo);

  const segCrono = () => {
    const c = cronoRef.current;
    return (c.acumulado + (c.desde ? Date.now() - c.desde : 0)) / 1000;
  };
  const resultado = () => {
    const reg = gps.regRef.current;
    return { tramos: [], total: foto(reg), tiempoPrueba: pruebaRef.current, traza: reg.traza, huecos: segundosEnHuecos(reg), cadencia: cadRef.current };
  };

  // Cada segundo: repinta, avisa de la cuenta atras, dice cada km y mira si
  // ya se llego a la distancia de la prueba.
  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      setTic(x => x + 1);
      const reg = gps.regRef.current;
      const s = segCrono(), m = foto(reg).m, antes = antesRef.current;
      const frases = [];
      // La cuenta atras (en minutos o en km).
      const avisos = !obj ? [] : obj.tipo === "min" ? avisosCuentaAtras(obj.seg, antes.s, s) : avisosCuentaAtras(obj.m, antes.m, m, true);
      for (const a of avisos) {
        if (a.fin) { setHecho(true); vibrar([300, 120, 300, 120, 300]); frases.push(fraseFin(obj)); }
        else { vibrar(a.id.startsWith("c") ? 80 : 200); frases.push(a.texto); }
      }
      // Cada km cerrado: el parcial y como vas.
      // El km se da por cerrado cuando ya esta en la traza guardada (la
      // distancia de ahora va un pelin por delante): si aun no, al segundo siguiente.
      let k = antes.km;
      while (m >= (k + 1) * 1000) {
        const t1 = tiempoHasta(reg, (k + 1) * 1000), t0 = k > 0 ? tiempoHasta(reg, k * 1000) : 0;
        if (t1 == null || t0 == null) break;
        k++;
        // En una prueba, pasada la distancia ya es soltar: sin comparar.
        const enPrueba = !distPrueba || k <= distPrueba / 1000;
        frases.push(vozDelKm({ km: k, segKm: t1 - t0, objetivo: enPrueba ? ritmoComparar : null, suave: !objetivo && !day.prueba }));
        if (distPrueba && k === distPrueba / 1000 - 1) frases.push("Último kilómetro: lo que quede.");
      }
      antesRef.current = { s, m, km: k };
      if (distPrueba && !pruebaRef.current && m >= distPrueba) {
        const tp = tiempoHasta(reg, distPrueba) || reg.seg;
        pruebaRef.current = tp; setTiempoPrueba(tp);
        vibrar([300, 120, 300]);
        // El tiempo de la prueba manda: va antes que el ultimo parcial.
        const fin = vozFinPrueba(day, tp);
        if (fin) frases.unshift(fin);
      }
      if (frases.length) hablar(frases.join(" "));
      if (resultadoRef) resultadoRef.current = resultado();
    }, 1000);
    return () => clearInterval(t);
  }, [corriendo]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = () => {
    const c = cronoRef.current;
    if (corriendo) {
      c.acumulado += Date.now() - c.desde; c.desde = null;
      gps.pausar(); setCorriendo(false);
      if (resultadoRef) resultadoRef.current = resultado();
    } else {
      c.desde = Date.now();
      gps.iniciar(); setCorriendo(true);
      if (!empezado) { setEmpezado(true); if (obj) hablar("Vamos: " + obj.texto + "."); else if (estrategia) hablar(estrategia); }
    }
  };

  const f = foto(gps.reg, corriendo ? Date.now() : undefined);
  const rAhora = corriendo ? ritmoActual(gps.reg, Date.now()) : null;
  const rMedio = f.m >= 200 ? f.seg / f.m * 1000 : null;
  const como = comoVa(rMedio, objetivo);
  const aviso = avisoGps(gps.estado);
  const s = segCrono();

  // Lo grande: lo que queda (rodaje con minutos), o el crono.
  let etiqueta, grande, sub, pct = null;
  if (obj && obj.tipo === "min") {
    const queda = obj.seg - s;
    etiqueta = hecho ? "¡HECHO!" : "QUEDAN";
    grande = queda >= 0 ? textoTiempo(Math.ceil(queda)) : "+" + textoTiempo(Math.floor(-queda));
    sub = km(f.m) + " km · " + textoTiempo(s) + " corriendo";
    pct = Math.min(1, s / obj.seg);
  } else if (obj && obj.tipo === "km") {
    etiqueta = hecho ? "¡HECHO!" : "FALTAN " + km(Math.max(0, obj.m - f.m)) + " KM";
    grande = textoTiempo(s);
    sub = km(f.m) + " de " + km(obj.m) + " km";
    pct = Math.min(1, f.m / obj.m);
  } else {
    etiqueta = distPrueba ? (tiempoPrueba ? day.prueba.distKm + " KM HECHOS" : "PRUEBA " + day.prueba.distKm + " KM") : "CARRERA";
    grande = textoTiempo(tiempoPrueba || s);
    sub = km(f.m) + " km" + (distPrueba && !tiempoPrueba ? " · faltan " + km(Math.max(0, distPrueba - f.m)) : "");
  }
  const fondo = hecho ? A.verde : "#1C1C1E";
  const v = cad.estado === "hecho" ? veredictoCadencia(cad.spm) : null;

  return (
    <div style={{ ...CARD, overflow: "hidden" }}>
      <div data-crono-caja style={{ background: fondo, padding: "18px 16px 16px", textAlign: "center", transition: "background .3s" }}>
        <div data-etiqueta style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: 1, opacity: 0.85 }}>{etiqueta}</div>
        <div data-crono style={{ fontSize: 60, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginTop: 4, fontVariantNumeric: "tabular-nums", letterSpacing: -1.5 }}>{grande}</div>
        <div style={{ fontSize: 15, color: "#fff", opacity: 0.85, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{sub}</div>
        {pct != null && (
          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,.2)", marginTop: 12 }}>
            <div style={{ width: pct * 100 + "%", height: "100%", borderRadius: 3, background: "#fff" }} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid " + C.divider }}>
        <div style={{ flex: 1, padding: "12px 16px", borderRight: "1px solid " + C.divider }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim }}>Ritmo ahora</div>
          <div data-ritmo-ahora style={{ fontSize: 26, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>{rAhora ? textoRitmo(rAhora) : "–:––"}</div>
        </div>
        <div style={{ flex: 1, padding: "12px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim }}>
            Medio{objetivo ? " · obj. " + textoRitmo(objetivo) : suave ? " · tu suave " + textoRitmo(suave) : ""}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: como ? COLOR_COMO[como] : C.text, fontVariantNumeric: "tabular-nums" }}>{rMedio ? textoRitmo(rMedio) : "–:––"}</div>
        </div>
      </div>

      {!empezado && estrategia && (
        <div data-estrategia style={{ margin: "12px 16px 0", padding: "10px 12px", borderRadius: 12, background: A.fondo.rojo, fontSize: 14, color: C.text, lineHeight: 1.45 }}>
          <b>Cómo correrla.</b> {estrategia}
        </div>
      )}
      {!corriendo && gps.estado === "ok" && gps.precision != null && (
        <div data-gps-listo style={{ padding: "10px 16px 0", fontSize: 13, fontWeight: 600, color: A.verde }}>GPS listo · ±{Math.round(gps.precision)} m</div>
      )}
      {aviso && <div style={{ padding: "10px 16px 0", fontSize: 13, fontWeight: 600, color: A.naranja, lineHeight: 1.4 }}>{aviso}</div>}

      <div style={{ padding: "14px 16px 6px" }}>
        <button className="nb" data-empezar onClick={alternar} style={{
          width: "100%", height: 54, borderRadius: 999, background: corriendo ? "#E5E5EA" : A.rojo,
          fontSize: 17, fontWeight: 700, color: corriendo ? C.text : "#fff",
        }}>{corriendo ? "Pausar" : empezado ? "Reanudar" : distPrueba ? "Empezar los " + day.prueba.distKm + " km" : "Empezar a correr"}</button>
      </div>

      {tecnica && empezado && (
        <div data-cadencia style={{ margin: "8px 16px 4px", padding: "12px 14px", borderRadius: 14, background: A.fondo.azul }}>
          {cad.estado === "nada" && (
            <button className="nb" data-medir-cadencia onClick={cad.medir} style={{ width: "100%", minHeight: 40, fontSize: 15, fontWeight: 700, color: A.azul }}>
              Medir cadencia (1 min)
            </button>
          )}
          {cad.estado === "midiendo" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 14, color: C.text }}><b>Midiendo cadencia… {cad.quedan} s</b><br /><span style={{ color: C.textDim }}>Corre normal, con el móvil donde lo llevas.</span></div>
              <button className="nb" onClick={cad.cancelar} style={{ fontSize: 14, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cancelar</button>
            </div>
          )}
          {cad.estado === "manual-listo" && (
            <div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.45, marginBottom: 8 }}>El móvil no ha podido contar solo. A mano: cuenta las pisadas de <b>un pie</b> durante 15 segundos.</div>
              <button className="nb" data-cadencia-manual onClick={cad.manual} style={{ width: "100%", minHeight: 40, borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700 }}>Empezar 15 s</button>
            </div>
          )}
          {cad.estado === "manual" && (
            <div style={{ fontSize: 15, color: C.text, textAlign: "center" }}><b>Cuenta las pisadas de un pie… {cad.quedan}</b></div>
          )}
          {cad.estado === "apuntar" && <ApuntarPisadas apuntar={cad.apuntar} />}
          {cad.estado === "hecho" && v && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div data-cadencia-resultado style={{ flex: 1, fontSize: 15, fontWeight: 600, color: v.tono === "bien" ? A.verde : A.naranja }}>{v.texto}</div>
              <button className="nb" onClick={cad.medir} style={{ fontSize: 14, color: A.azul, fontWeight: 600, minHeight: 36 }}>Otra vez</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px 14px" }}>
        <div style={{ flex: 1, fontSize: 12.5, color: C.textDim, lineHeight: 1.4 }}>
          Móvil en la mano o en el brazo, con la pantalla encendida. Al terminar, el tiempo y el ritmo se apuntan solos.
        </div>
        <button className="nb" data-voz onClick={() => { const n = !voz; setVoz(n); vozRef.current = n; guardarVoz(n); if (n) decir("Voz activada."); else try { window.speechSynthesis.cancel(); } catch { /* nada */ } }}
          style={{ fontSize: 13, fontWeight: 600, color: voz ? A.azul : C.textDim, minHeight: 36, flexShrink: 0 }}>{voz ? "Voz: sí" : "Voz: no"}</button>
      </div>
    </div>
  );
}

function ApuntarPisadas({ apuntar }) {
  const [n, setN] = useState("");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, fontSize: 14, color: C.text }}>¿Cuántas pisadas de un pie?</div>
      <input inputMode="numeric" value={n} onChange={e => setN(e.target.value.replace(/\D/g, ""))} data-pisadas
        style={{ width: 64, padding: "9px 10px", borderRadius: 10, border: "none", background: "#fff", fontSize: 17, fontWeight: 700, textAlign: "center", fontFamily: "inherit" }} />
      <button className="nb" onClick={() => apuntar(n)} style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700 }}>OK</button>
    </div>
  );
}
