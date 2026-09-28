"use client";

import { useEffect } from "react";

/**
 * Lo que comparten el temporizador de series y la carrera con GPS: la voz
 * (con el movil en el brazo no se mira la pantalla) y la pantalla encendida
 * (con ella apagada, Chrome deja de dar GPS y de contar).
 */

const CLAVE_VOZ = "programa7k:voz";
export function leerVoz() { try { return window.localStorage.getItem(CLAVE_VOZ) !== "no"; } catch { return true; } }
export function guardarVoz(si) { try { window.localStorage.setItem(CLAVE_VOZ, si ? "si" : "no"); } catch { /* sin storage: solo esta sesion */ } }

/** Dice un texto en castellano. Corta lo que se estuviera diciendo. */
export function decir(texto) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "es-ES"; u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch { /* sin voz en este navegador */ }
}

/** "4:45" dicho como se dice corriendo: "4 45". */
export function ritmoHablado(seg) {
  const r = Math.round(seg), m = Math.floor(r / 60), s = r % 60;
  return m + " " + (s === 0 ? "en punto" : String(s).padStart(2, "0"));
}

/** "4:41" a partir de segundos. */
export function textoRitmo(seg) {
  const r = Math.round(seg);
  return Math.floor(r / 60) + ":" + String(r % 60).padStart(2, "0");
}

/** Mantiene la pantalla encendida mientras `activo`. */
export function usePantallaEncendida(activo) {
  useEffect(() => {
    if (!activo) return;
    let cancelado = false, wl = null;
    const pedir = async () => {
      try {
        if (!("wakeLock" in navigator)) return;
        const l = await navigator.wakeLock.request("screen");
        if (cancelado) l.release(); else wl = l;
      } catch { /* wake lock no disponible */ }
    };
    pedir();
    // Al volver a la app (p. ej. tras mirar un mensaje) el navegador lo suelta: se pide otra vez.
    const alVolver = () => { if (document.visibilityState === "visible") pedir(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      try { if (wl) wl.release(); } catch { /* nada que soltar */ }
    };
  }, [activo]);
}
