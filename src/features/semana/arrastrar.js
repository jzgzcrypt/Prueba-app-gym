"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MANTENER PULSADO Y ARRASTRAR una fila encima de otra.
 *
 * Mantener 300 ms activa el arrastre (si antes el dedo se mueve, es scroll y
 * no pasa nada). Mientras se arrastra no hay scroll. Al soltar encima de otra
 * fila que acepta, se llama a `alSoltar(desde, hasta)`. El toque que termina
 * un arrastre no cuenta como clic.
 *
 * @param {{ puede:(i:number)=>boolean, alSoltar:(desde:number,hasta:number)=>void }} p
 * @returns {{ arrastre:null|{desde:number,sobre:number|null,dy:number}, filaProps:(i:number)=>object, tragarClic:()=>boolean }}
 */
export function useArrastrar({ puede, alSoltar }) {
  const [arrastre, setArrastre] = useState(null);
  const filas = useRef([]);
  const gesto = useRef(null);
  const reciente = useRef(false);
  const ultimo = useRef(null);
  ultimo.current = { puede, alSoltar, arrastre };

  useEffect(() => {
    // La fila que se arrastra va encima de las demas: no cuenta como destino.
    const sobreQue = (y, desde) => {
      const i = filas.current.findIndex((el, k) => { if (!el || k === desde) return false; const r = el.getBoundingClientRect(); return y >= r.top && y <= r.bottom; });
      return i >= 0 ? i : null;
    };
    const mover = (e) => {
      const g = gesto.current;
      if (!g) return;
      if (!g.activo) {
        if (Math.abs(e.clientY - g.y0) > 8 || Math.abs(e.clientX - g.x0) > 8) { clearTimeout(g.timer); gesto.current = null; }
        return;
      }
      const sobre = sobreQue(e.clientY, g.desde);
      setArrastre({ desde: g.desde, dy: e.clientY - g.y0, sobre: sobre !== null && sobre !== g.desde && ultimo.current.puede(sobre) ? sobre : null });
    };
    const soltar = () => {
      const g = gesto.current;
      gesto.current = null;
      if (!g) return;
      clearTimeout(g.timer);
      if (!g.activo) return;
      const a = ultimo.current.arrastre;
      setArrastre(null);
      reciente.current = true;
      setTimeout(() => { reciente.current = false; }, 50);
      if (a && a.sobre !== null) ultimo.current.alSoltar(a.desde, a.sobre);
    };
    // Mientras se arrastra, el dedo no hace scroll (hace falta passive: false).
    const sinScroll = (e) => { if (gesto.current && gesto.current.activo) e.preventDefault(); };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    window.addEventListener("touchmove", sinScroll, { passive: false });
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      window.removeEventListener("touchmove", sinScroll);
    };
  }, []);

  const filaProps = (i) => ({
    ref: (el) => { filas.current[i] = el; },
    onPointerDown: (e) => {
      if (!puede(i) || (e.pointerType === "mouse" && e.button !== 0)) return;
      const g = { desde: i, x0: e.clientX, y0: e.clientY, activo: false };
      g.timer = setTimeout(() => {
        g.activo = true;
        if (navigator.vibrate) navigator.vibrate(10);
        setArrastre({ desde: i, dy: 0, sobre: null });
      }, 300);
      gesto.current = g;
    },
    onContextMenu: (e) => { if (gesto.current) e.preventDefault(); },
  });

  return { arrastre, filaProps, tragarClic: () => reciente.current };
}
