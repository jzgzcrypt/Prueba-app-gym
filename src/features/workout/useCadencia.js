"use client";

import { useEffect, useRef, useState } from "react";
import { contarPasos, spmManual } from "@/domain/running/cadencia";

/**
 * Medir la cadencia en un minuto con el sensor de movimiento del movil. Si no
 * hay sensor (o no da pasos claros), pasa solo a la forma manual: 15 s
 * contando las pisadas de un pie.
 *
 * estado: "nada" | "midiendo" | "manual-listo" | "manual" | "apuntar" | "hecho"
 */
const DURACION_MS = 60000;
const MANUAL_MS = 15000;

export function useCadencia({ alAvisar } = {}) {
  const [estado, setEstado] = useState("nada");
  const [quedan, setQuedan] = useState(0);
  const [spm, setSpm] = useState(null);
  const muestras = useRef([]);
  const fin = useRef(0);
  const oyente = useRef(null);
  const avisar = useRef(alAvisar); avisar.current = alAvisar;

  const soltar = () => { if (oyente.current) { window.removeEventListener("devicemotion", oyente.current); oyente.current = null; } };
  useEffect(() => soltar, []);

  // Reloj de la medicion: cuenta atras y cierre.
  useEffect(() => {
    if (estado !== "midiendo" && estado !== "manual") return;
    const t = setInterval(() => {
      const q = Math.max(0, fin.current - Date.now());
      setQuedan(Math.ceil(q / 1000));
      if (estado === "midiendo" && DURACION_MS - q > 2500 && muestras.current.length === 0) {
        // A los 2,5 s sin ninguna muestra: este movil no da el sensor.
        soltar(); setEstado("manual-listo"); return;
      }
      if (q > 0) return;
      if (estado === "midiendo") {
        soltar();
        const r = contarPasos(muestras.current);
        if (r.fiable) { setSpm(r.spm); setEstado("hecho"); avisar.current?.(r.spm); }
        else setEstado("manual-listo");
      } else {
        setEstado("apuntar"); avisar.current?.(null, "Para. ¿Cuántas pisadas?");
      }
    }, 250);
    return () => clearInterval(t);
  }, [estado]);

  /** Empieza a medir con el sensor. Llamar desde un toque (el iPhone pide permiso ahí). */
  const medir = async () => {
    setSpm(null);
    try {
      const DM = typeof window !== "undefined" ? window.DeviceMotionEvent : null;
      if (!DM) { setEstado("manual-listo"); return; }
      if (typeof DM.requestPermission === "function") {
        const r = await DM.requestPermission();
        if (r !== "granted") { setEstado("manual-listo"); return; }
      }
      muestras.current = [];
      oyente.current = (e) => {
        const g = e.accelerationIncludingGravity;
        if (!g || g.x == null) return;
        muestras.current.push({ t: performance.now(), a: Math.hypot(g.x, g.y, g.z) });
      };
      window.addEventListener("devicemotion", oyente.current);
      fin.current = Date.now() + DURACION_MS; setQuedan(60); setEstado("midiendo");
    } catch { setEstado("manual-listo"); }
  };

  /** Forma manual: 15 s contando las pisadas de un pie. */
  const manual = () => {
    fin.current = Date.now() + MANUAL_MS; setQuedan(15); setEstado("manual");
    avisar.current?.(null, "Ya. Cuenta las pisadas de un pie.");
  };
  const apuntar = (pasos) => {
    const v = spmManual(pasos);
    if (!(v > 60 && v < 260)) return;
    setSpm(v); setEstado("hecho"); avisar.current?.(v);
  };
  const cancelar = () => { soltar(); setEstado("nada"); };

  return { estado, quedan, spm, medir, manual, apuntar, cancelar };
}
