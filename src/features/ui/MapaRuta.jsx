"use client";

import { useId, useState } from "react";
import { C, CAT } from "@/design/tokens";
import { aGpx, flechas, marcasKm, proyectar, tramosPorColor } from "@/domain/running/ruta";
import { textoTiempo } from "@/domain/running/gps";

/**
 * La ruta de una salida sobre OpenStreetMap, coloreada por ritmo, con los km
 * marcados, flechas de sentido, salida y llegada, y los datos en una franja
 * encima.
 *
 * Sin librerias: un mapa fijo (no se arrastra) con las teselas de OSM de
 * fondo y la ruta en SVG encima. Se dibuja en un lienzo de 360x260 que se
 * escala al ancho de la pantalla. Sin cobertura no hay calles, pero la ruta
 * se ve igual.
 */
const ANCHO = 360, ALTO = 260, FRANJA = 54;
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

export function MapaRuta({ ruta, objetivo, titulo, fecha, rutaCompleta, datos }) {
  const [sinTeselas, setSinTeselas] = useState(false);
  const uid = useId().replace(/:/g, "");
  const conDatos = datos && datos.m > 0;
  const m = proyectar(ruta, ANCHO, ALTO, 20, conDatos ? FRANJA + 8 : 20);
  if (!m) return null;
  const tramos = tramosPorColor(ruta, objetivo);
  const cats = [...new Set(tramos.map(t => t.cat))].filter(c => LEYENDA[c] && !(c === "suave" && !objetivo));
  const pct = (v, total) => (v / total * 100) + "%";
  const xy = (q) => { const p = m.punto(q); return p.x.toFixed(1) + "," + p.y.toFixed(1); };
  // Los km, en proporcion a la distancia medida: el "2" cae donde se contaron 2 km.
  const marcas = marcasKm(ruta, conDatos ? datos.m : null);
  const sentido = flechas(ruta, 3).map(f => {
    const a = m.punto(f.a), b = m.punto(f.b), p = m.punto([f.lat, f.lon]);
    return { x: p.x, y: p.y, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  });

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
          <defs>
            <pattern id={"meta" + uid} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#FFFFFF" />
              <rect width="2" height="2" fill="#111111" /><rect x="2" y="2" width="2" height="2" fill="#111111" />
            </pattern>
          </defs>
          {/* Un borde blanco debajo: la ruta se lee sobre cualquier calle. */}
          {tramos.map((t, i) => (
            <polyline key={"b" + i} points={t.puntos.map(xy).join(" ")} fill="none" stroke="#FFFFFF"
              strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {tramos.map((t, i) => (
            <polyline key={i} data-cat={t.cat} points={t.puntos.map(xy).join(" ")} fill="none" stroke={COLOR[t.cat]}
              strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {sentido.map((f, i) => (
            <g key={"f" + i} data-flecha transform={"translate(" + f.x.toFixed(1) + "," + f.y.toFixed(1) + ") rotate(" + f.ang.toFixed(0) + ")"}>
              <path d="M-2.4,-3 L1.7,0 L-2.4,3" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {marcas.map(k => {
            const p = m.punto([k.lat, k.lon]);
            return (
              <g key={"k" + k.n} data-km={k.n}>
                <circle cx={p.x} cy={p.y} r="8.5" fill="#171717" stroke="#FFFFFF" strokeWidth="1.8" />
                <text x={p.x} y={p.y + 3.4} textAnchor="middle" fontSize="9.5" fontWeight="800"
                  fontFamily="-apple-system, Inter, sans-serif" fill="#FAFAF9">{k.n}</text>
              </g>
            );
          })}
          <circle cx={m.inicio.x} cy={m.inicio.y} r="6.5" fill="#2FBF71" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx={m.fin.x} cy={m.fin.y} r="7.5" fill={"url(#meta" + uid + ")"} stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
        {conDatos && (
          <div data-franja style={{ position: "absolute", left: 8, right: 8, top: 8, height: FRANJA - 6, borderRadius: 10,
                                    background: "rgba(255,255,255,.9)", boxShadow: "0 1px 4px rgba(0,0,0,.15)",
                                    display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {[
              ["Distancia", (datos.m / 1000).toFixed(2).replace(".", ","), "km"],
              ["Tiempo", textoTiempo(datos.seg), ""],
              ["Ritmo", datos.m >= 200 ? textoTiempo(datos.seg / datos.m * 1000) : "–", "/km"],
            ].map(([et, v, u]) => (
              <div key={et} style={{ textAlign: "center", lineHeight: 1.1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#6B6B68", letterSpacing: 0.3 }}>{et}</div>
                <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: "#171717" }}>
                  {v}<span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B68" }}>{u ? " " + u : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
