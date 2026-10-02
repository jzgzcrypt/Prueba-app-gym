"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/design/tokens";
import { comoVa, foto, ritmoActual, tiempoHasta, textoTiempo, segundosEnHuecos } from "@/domain/running/gps";
import { avisoGps, useGps } from "@/features/workout/useGps";
import { textoRitmo, usePantallaEncendida } from "@/features/workout/voz";

const COLOR_COMO = { bien: C.ok, rapido: C.amber, lento: C.amber };
const km = (m) => (m / 1000).toFixed(2).replace(".", ",");

/**
 * Rodajes, tiradas y pruebas: crono + GPS, como Strava pero dentro del plan.
 * En una prueba de distancia, al llegar a los km se para el reloj de la
 * prueba y ese tiempo es el que se apunta (vibra para avisar). `resultadoRef`
 * recibe { tramos: [], total, tiempoPrueba } para la libreta.
 */
export function CarreraGps({ day, resultadoRef }) {
  const distPrueba = day.prueba && day.prueba.distKm ? day.prueba.distKm * 1000 : null;
  const objetivo = day.ritmo || null;
  const gps = useGps();
  // El GPS empieza a buscar al abrir la sesion: al pulsar EMPEZAR ya tiene
  // señal y los primeros metros cuentan bien. Hasta entonces no se cuenta nada.
  useEffect(() => { gps.escuchar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [corriendo, setCorriendo] = useState(false);
  const [empezado, setEmpezado] = useState(false);
  const [, setTic] = useState(0);
  const [tiempoPrueba, setTiempoPrueba] = useState(null);
  // Crono de pared sin pausas: vale aunque no haya GPS.
  const cronoRef = useRef({ acumulado: 0, desde: null });
  const pruebaRef = useRef(null);

  usePantallaEncendida(corriendo);

  const segCrono = () => {
    const c = cronoRef.current;
    return (c.acumulado + (c.desde ? Date.now() - c.desde : 0)) / 1000;
  };

  // Cada segundo: repinta el crono y mira si ya se llego a la distancia de la prueba.
  useEffect(() => {
    if (!corriendo) return;
    const t = setInterval(() => {
      setTic(x => x + 1);
      const reg = gps.regRef.current;
      if (distPrueba && !pruebaRef.current && foto(reg).m >= distPrueba) {
        const tp = tiempoHasta(reg, distPrueba) || reg.seg;
        pruebaRef.current = tp; setTiempoPrueba(tp);
        try { if (navigator.vibrate) navigator.vibrate([300, 120, 300]); } catch { /* sin vibracion */ }
      }
      if (resultadoRef) resultadoRef.current = { tramos: [], total: foto(reg), tiempoPrueba: pruebaRef.current, traza: reg.traza, huecos: segundosEnHuecos(reg) };
    }, 1000);
    return () => clearInterval(t);
  }, [corriendo]);

  const alternar = () => {
    const c = cronoRef.current;
    if (corriendo) {
      c.acumulado += Date.now() - c.desde; c.desde = null;
      gps.pausar(); setCorriendo(false);
      if (resultadoRef) resultadoRef.current = { tramos: [], total: foto(gps.regRef.current), tiempoPrueba: pruebaRef.current, traza: gps.regRef.current.traza, huecos: segundosEnHuecos(gps.regRef.current) };
    } else {
      c.desde = Date.now();
      gps.iniciar(); setCorriendo(true);
      if (!empezado) setEmpezado(true);
    }
  };

  const f = foto(gps.reg, corriendo ? Date.now() : undefined);
  const rAhora = corriendo ? ritmoActual(gps.reg, Date.now()) : null;
  const rMedio = f.m >= 200 ? f.seg / f.m * 1000 : null;
  const como = comoVa(rMedio, objetivo);
  const aviso = avisoGps(gps.estado);
  const s = segCrono();

  return (
    <div style={{ border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ background: "#171717", padding: "18px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#FAFAF9", letterSpacing: 1.5, opacity: 0.8 }}>
          {distPrueba ? (tiempoPrueba ? day.prueba.distKm + " KM HECHOS" : "PRUEBA " + day.prueba.distKm + " KM") : "CARRERA"}
        </div>
        <div className="mono" data-crono style={{ fontSize: 48, fontWeight: 800, color: "#FAFAF9", lineHeight: 1.1, marginTop: 4 }}>
          {textoTiempo(tiempoPrueba || s)}
        </div>
        <div className="mono" style={{ fontSize: 14, color: "#FAFAF9", opacity: 0.85, marginTop: 2 }}>
          {km(f.m)} km{distPrueba && !tiempoPrueba ? " · faltan " + km(Math.max(0, distPrueba - f.m)) : ""}
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #E5E5E3" }}>
        <div style={{ flex: 1, padding: "10px 16px", borderRight: "1px solid #E5E5E3" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8 }}>RITMO AHORA</div>
          <div className="mono" data-ritmo-ahora style={{ fontSize: 24, fontWeight: 800, color: "#171717" }}>{rAhora ? textoRitmo(rAhora) : "–:––"}</div>
        </div>
        <div style={{ flex: 1, padding: "10px 16px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8 }}>MEDIO{objetivo ? " · OBJ. " + textoRitmo(objetivo) : ""}</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: como ? COLOR_COMO[como] : "#171717" }}>{rMedio ? textoRitmo(rMedio) : "–:––"}</div>
        </div>
      </div>

      {!corriendo && gps.estado === "ok" && gps.precision != null && (
        <div data-gps-listo style={{ padding: "10px 16px 0", fontSize: 12, fontWeight: 800, color: C.ok }}>GPS listo · ±{Math.round(gps.precision)} m</div>
      )}
      {aviso && <div style={{ padding: "10px 16px 0", fontSize: 12, fontWeight: 700, color: C.amber, lineHeight: 1.4 }}>{aviso}</div>}

      <div style={{ padding: "14px 16px" }}>
        <button className="nb" onClick={alternar} style={{
          width: "100%", height: 50, borderRadius: 4, background: corriendo ? "#F2F2F0" : "#171717",
          border: "1px solid " + (corriendo ? "#D4D4D1" : "#171717"),
          fontSize: 14, fontWeight: 800, color: corriendo ? "#171717" : "#FAFAF9", letterSpacing: 0.5,
        }}>{corriendo ? "PAUSAR" : empezado ? "REANUDAR" : distPrueba ? "EMPEZAR LOS " + day.prueba.distKm + " KM" : "EMPEZAR A CORRER"}</button>
      </div>

      <div style={{ padding: "0 16px 14px", fontSize: 10.5, color: "#8A8A87", lineHeight: 1.4 }}>
        Móvil en la mano o en el brazo, con la app delante. Al terminar, el tiempo y el ritmo se apuntan solos.
      </div>
    </div>
  );
}
