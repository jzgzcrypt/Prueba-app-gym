"use client";

import { useState, useEffect, useRef } from "react";
import { C, CAT } from "@/design/tokens";
export function IntervalTimer({ intervalos }) {
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
  const audioCtxRef = useRef(null);
  const wakeLockRef = useRef(null);

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

  // Mantiene la pantalla encendida mientras el temporizador corre, para que se oigan
  // los avisos. Los navegadores suspenden los timers de JS con la pantalla bloqueada.
  useEffect(() => {
    let cancelado = false;
    const pedirWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && corriendo && !terminado) {
          const wl = await navigator.wakeLock.request("screen");
          if (cancelado) { wl.release(); return; }
          wakeLockRef.current = wl;
        }
      } catch (e) { /* wake lock no disponible en este navegador */ }
    };
    const soltarWakeLock = () => {
      try {
        if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
      } catch (e) { /* nada que soltar */ }
    };
    if (corriendo && !terminado) pedirWakeLock(); else soltarWakeLock();
    return () => { cancelado = true; soltarWakeLock(); };
  }, [corriendo, terminado]);

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
          if (nuevoIdx >= tramos.length) { setTerminado(true); setCorriendo(false); return prevIdx; }
          setRestante(tramos[nuevoIdx].seg);
          return nuevoIdx;
        });
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

  if (terminado) {
    return (
      <div style={{ border: "1px solid " + C.ok, background: "#EAF7EE", borderRadius: 4, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ok, marginBottom: 4 }}>Intervalos completados</div>
        <div style={{ fontSize: 12.5, color: "#4A4A47" }}>{tramos.length} tramos hechos. Pulsa continuar para registrar el ritmo.</div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ background: colorTramo, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#FAFAF9", letterSpacing: 1.5, opacity: 0.9 }}>
          {actual ? actual.tipo.toUpperCase() : ""}
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

      <div style={{ padding: "14px 16px", display: "flex", gap: 8 }}>
        <button className="nb" onClick={() => { pitar(660, 100); setCorriendo(c => !c); }} style={{
          flex: 1, height: 46, borderRadius: 4, background: corriendo ? "#F2F2F0" : "#171717",
          border: "1px solid " + (corriendo ? "#D4D4D1" : "#171717"),
          fontSize: 13, fontWeight: 700, color: corriendo ? "#171717" : "#FAFAF9", letterSpacing: 0.5,
        }}>{corriendo ? "PAUSAR" : (idx === 0 && restante === (tramos[0] ? tramos[0].seg : 0) ? "EMPEZAR" : "REANUDAR")}</button>
        <button className="nb" onClick={() => {
          setIdx(prev => {
            const n = prev + 1;
            if (n >= tramos.length) { setTerminado(true); setCorriendo(false); return prev; }
            setRestante(tramos[n].seg);
            return n;
          });
        }} style={{
          width: 88, height: 46, borderRadius: 4, background: "#F2F2F0", border: "1px solid #D4D4D1",
          fontSize: 12, fontWeight: 700, color: "#787774",
        }}>SALTAR</button>
      </div>

      <div style={{ padding: "0 16px 14px", fontSize: 10.5, color: "#8A8A87", lineHeight: 1.4 }}>
        Deja la pantalla encendida durante la sesión — si bloqueas el móvil, el navegador puede silenciar los avisos. Sube el volumen del móvil al máximo.
      </div>
    </div>
  );
}
