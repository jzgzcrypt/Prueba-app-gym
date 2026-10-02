"use client";

import { useState } from "react";
import { C, CAT } from "@/design/tokens";
import { aGpx, proyectar, tramosPorColor } from "@/domain/running/ruta";

/**
 * La ruta de una salida sobre OpenStreetMap, coloreada por ritmo.
 *
 * Sin librerias: un mapa fijo (no se arrastra) con las teselas de OSM de
 * fondo y la ruta en SVG encima. Se dibuja en un lienzo de 360x240 que se
 * escala al ancho de la pantalla. Sin cobertura no hay calles, pero la ruta
 * se ve igual.
 */
const ANCHO = 360, ALTO = 240;
const COLOR = {
  objetivo: C.ok,        // a tu ritmo o mas rapido
  cerca: "#D39B12",      // hasta 30 s/km mas lento
  suave: CAT.running,    // mas lento
  corre: CAT.running,    // rodaje sin ritmo objetivo
  recupera: "#8A8A87",   // trote o caminar entre series
};
const LEYENDA = { objetivo: "a tu ritmo", cerca: "algo más lento", suave: "suave", recupera: "recuperación" };

async function descargarGpx(ruta, titulo, fecha) {
  const nombre = "carrera-" + fecha + ".gpx";
  const blob = new Blob([aGpx(ruta, titulo)], { type: "application/gpx+xml" });
  try {
    const archivo = new File([blob], nombre, { type: "application/gpx+xml" });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) { await navigator.share({ files: [archivo], title: titulo }); return; }
  } catch { /* cancelado o sin Web Share: se descarga */ }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function MapaRuta({ ruta, objetivo, titulo, fecha, rutaCompleta }) {
  const [sinTeselas, setSinTeselas] = useState(false);
  const m = proyectar(ruta, ANCHO, ALTO);
  if (!m) return null;
  const tramos = tramosPorColor(ruta, objetivo);
  const cats = [...new Set(tramos.map(t => t.cat))].filter(c => LEYENDA[c] && !(c === "suave" && !objetivo));
  const pct = (v, total) => (v / total * 100) + "%";

  return (
    <div data-mapa>
      <div style={{ position: "relative", width: "100%", aspectRatio: ANCHO + " / " + ALTO, overflow: "hidden",
                    borderRadius: 12, background: "#E8E6E1", border: "1px solid " + C.cardBorder }}>
        {!sinTeselas && m.teselas.map(t => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.z + "/" + t.x + "/" + t.y} alt="" draggable={false} loading="lazy"
            src={"https://tile.openstreetmap.org/" + t.z + "/" + t.x + "/" + t.y + ".png"}
            onError={() => setSinTeselas(true)}
            style={{ position: "absolute", left: pct(t.left, ANCHO), top: pct(t.top, ALTO),
                     width: pct(256, ANCHO), height: pct(256, ALTO), userSelect: "none" }} />
        ))}
        <svg viewBox={"0 0 " + ANCHO + " " + ALTO} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {/* Un borde blanco debajo: la ruta se lee sobre cualquier calle. */}
          {tramos.map((t, i) => (
            <polyline key={"b" + i} points={t.puntos.map(q => { const p = m.punto(q); return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ")}
              fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {tramos.map((t, i) => (
            <polyline key={i} data-cat={t.cat} points={t.puntos.map(q => { const p = m.punto(q); return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ")}
              fill="none" stroke={COLOR[t.cat]} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          <circle cx={m.inicio.x} cy={m.inicio.y} r="5.5" fill="#FFFFFF" stroke={C.ok} strokeWidth="3" />
          <circle cx={m.fin.x} cy={m.fin.y} r="5.5" fill="#171717" stroke="#FFFFFF" strokeWidth="2" />
        </svg>
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{
          position: "absolute", right: 0, bottom: 0, fontSize: 9.5, color: "#4A4A47", background: "rgba(255,255,255,.8)",
          padding: "1px 5px", borderTopLeftRadius: 6, textDecoration: "none" }}>© OpenStreetMap</a>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
          {cats.length > 1 && cats.map(c => (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>
              <span style={{ width: 14, height: 4, borderRadius: 2, background: COLOR[c] }} />{LEYENDA[c]}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {rutaCompleta && (
            <button className="btn" onClick={() => descargarGpx(rutaCompleta, titulo, fecha + "-completo")} style={{
              fontSize: 11.5, fontWeight: 800, color: C.textDim, border: "1px solid #D4D4D1", borderRadius: 8,
              padding: "0 10px", minHeight: 32, background: C.card }}>GPX completo</button>
          )}
          <button className="btn" onClick={() => descargarGpx(ruta, titulo, fecha)} style={{
          fontSize: 11.5, fontWeight: 800, color: C.text, border: "1px solid #D4D4D1", borderRadius: 8,
          padding: "0 10px", minHeight: 32, background: C.card, flexShrink: 0 }}>GPX</button>
        </div>
      </div>
    </div>
  );
}
