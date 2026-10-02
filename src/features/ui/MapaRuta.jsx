"use client";

import { useEffect, useId, useState } from "react";
import { C } from "@/design/tokens";
import { aGpx, flechas, marcasKm, proyectar, tramosPorColor } from "@/domain/running/ruta";
import { textoTiempo } from "@/domain/running/gps";

/**
 * La ruta de una salida sobre un mapa, coloreada por ritmo, con los km
 * marcados, el sentido, la salida y la llegada, y los datos encima.
 *
 * Sin librerias: un mapa fijo con teselas de fondo y la ruta en SVG encima,
 * en un lienzo de 360x250 que se escala al ancho de la pantalla. Cuatro
 * estilos gratis y sin clave, para elegir; se recuerda el ultimo. Sin
 * cobertura no salen las calles, pero la ruta si.
 */
const ANCHO = 360, ALTO = 250, FRANJA = 54;

export const ESTILOS_MAPA = {
  oscuro: {
    nombre: "Oscuro", oscuro: true, fondo: "#1E1F22", halo: "#0A0A0B",
    tesela: (z, x, y) => "https://a.basemaps.cartocdn.com/dark_all/" + z + "/" + x + "/" + y + "@2x.png",
    atribucion: "© OpenStreetMap · © CARTO", enlace: "https://carto.com/attributions",
  },
  claro: {
    nombre: "Claro", oscuro: false, fondo: "#EEEDEA", halo: "#FFFFFF",
    tesela: (z, x, y) => "https://a.basemaps.cartocdn.com/light_all/" + z + "/" + x + "/" + y + "@2x.png",
    atribucion: "© OpenStreetMap · © CARTO", enlace: "https://carto.com/attributions",
  },
  satelite: {
    nombre: "Satélite", oscuro: true, fondo: "#2A332C", halo: "#0A0A0B",
    tesela: (z, x, y) => "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/" + z + "/" + y + "/" + x,
    atribucion: "© Esri", enlace: "https://www.esri.com",
  },
  callejero: {
    nombre: "Callejero", oscuro: false, fondo: "#E8E6E1", halo: "#FFFFFF",
    tesela: (z, x, y) => "https://tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png",
    atribucion: "© OpenStreetMap", enlace: "https://www.openstreetmap.org/copyright",
  },
};
const CLAVE_ESTILO = "programa7k:estilo-mapa";
const leerEstilo = () => { try { const e = window.localStorage.getItem(CLAVE_ESTILO); return ESTILOS_MAPA[e] ? e : "oscuro"; } catch { return "oscuro"; } };
const guardarEstilo = (e) => { try { window.localStorage.setItem(CLAVE_ESTILO, e); } catch { /* solo esta sesion */ } };

// Colores por ritmo. Sobre fondo oscuro, mas vivos (el naranja es el de Strava).
const COLORES = {
  claro: { objetivo: "#2F7D4F", cerca: "#D39B12", suave: "#B8462F", corre: "#B8462F", recupera: "#8A8A87" },
  oscuro: { objetivo: "#3DD68C", cerca: "#F5B83D", suave: "#FC5200", corre: "#FC5200", recupera: "#A8A8A5" },
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

const km = (m) => (m / 1000).toFixed(2).replace(".", ",");

export function MapaRuta({ ruta, objetivo, titulo, fecha, rutaCompleta, datos }) {
  const [estilo, setEstilo] = useState("oscuro");
  const [sinTeselas, setSinTeselas] = useState(false);
  const uid = useId().replace(/:/g, "");
  useEffect(() => { setEstilo(leerEstilo()); }, []);
  const E = ESTILOS_MAPA[estilo];
  const conDatos = datos && datos.m > 0;
  const m = proyectar(ruta, ANCHO, ALTO, 20, conDatos ? FRANJA + 8 : 20);
  if (!m) return null;
  const tema = E.oscuro ? "oscuro" : "claro";
  const COLOR = COLORES[tema];
  const tramos = tramosPorColor(ruta, objetivo);
  const cats = [...new Set(tramos.map(t => t.cat))].filter(c => LEYENDA[c] && !(c === "suave" && !objetivo));
  const pct = (v, total) => (v / total * 100) + "%";
  const xy = (q) => { const p = m.punto(q); return p.x.toFixed(1) + "," + p.y.toFixed(1); };
  const marcas = marcasKm(ruta, conDatos ? datos.m : null);
  const sentido = flechas(ruta, 3).map(f => {
    const a = m.punto(f.a), b = m.punto(f.b), p = m.punto([f.lat, f.lon]);
    return { x: p.x, y: p.y, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  });
  const cambiar = (e) => { setEstilo(e); guardarEstilo(e); setSinTeselas(false); };
  const panel = E.oscuro ? "rgba(14,14,15,.78)" : "rgba(255,255,255,.86)";
  const tinta = E.oscuro ? "#FAFAF9" : "#171717", tenue = E.oscuro ? "#A8A8A5" : "#6B6B68";

  return (
    <div data-mapa data-estilo={estilo}>
      <div style={{ position: "relative", width: "100%", aspectRatio: ANCHO + " / " + ALTO, overflow: "hidden",
                    borderRadius: 14, background: E.fondo }}>
        {!sinTeselas && m.teselas.map(t => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={estilo + t.z + "/" + t.x + "/" + t.y} alt="" draggable={false} loading="lazy"
            src={E.tesela(t.z, t.x, t.y)} onError={() => setSinTeselas(true)}
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
          {/* Un borde debajo para que la ruta se lea sobre cualquier fondo. */}
          {tramos.map((t, i) => (
            <polyline key={"h" + i} points={t.puntos.map(xy).join(" ")} fill="none" stroke={E.halo}
              strokeOpacity={E.oscuro ? 0.85 : 1} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {tramos.map((t, i) => (
            <polyline key={i} data-cat={t.cat} points={t.puntos.map(xy).join(" ")} fill="none" stroke={COLOR[t.cat]}
              strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {sentido.map((f, i) => (
            <g key={"f" + i} data-flecha transform={"translate(" + f.x.toFixed(1) + "," + f.y.toFixed(1) + ") rotate(" + f.ang.toFixed(0) + ")"}>
              <path d="M-2.6,-3.2 L1.8,0 L-2.6,3.2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {marcas.map(k => {
            const p = m.punto([k.lat, k.lon]);
            return (
              <g key={"k" + k.n} data-km={k.n}>
                <circle cx={p.x} cy={p.y} r="8.5" fill={E.oscuro ? "#FAFAF9" : "#171717"} stroke={E.halo} strokeWidth="1.5" />
                <text x={p.x} y={p.y + 3.4} textAnchor="middle" fontSize="9.5" fontWeight="800"
                  fontFamily="-apple-system, Inter, sans-serif" fill={E.oscuro ? "#171717" : "#FAFAF9"}>{k.n}</text>
              </g>
            );
          })}
          <circle cx={m.inicio.x} cy={m.inicio.y} r="6.5" fill="#2FBF71" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx={m.fin.x} cy={m.fin.y} r="7.5" fill={"url(#meta" + uid + ")"} stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>

        {conDatos && (
          <div data-franja style={{ position: "absolute", left: 8, right: 8, top: 8, height: FRANJA - 6, borderRadius: 10,
                                    background: panel, display: "flex", alignItems: "center", justifyContent: "space-around",
                                    backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
            {[
              ["Distancia", km(datos.m), "km"],
              ["Tiempo", textoTiempo(datos.seg), ""],
              ["Ritmo", datos.m >= 200 ? textoTiempo(datos.seg / datos.m * 1000) : "–", "/km"],
            ].map(([et, v, u]) => (
              <div key={et} style={{ textAlign: "center", lineHeight: 1.1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: tenue, letterSpacing: 0.3 }}>{et}</div>
                <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: tinta }}>
                  {v}<span style={{ fontSize: 11, fontWeight: 700, color: tenue }}>{u ? " " + u : ""}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <a href={E.enlace} target="_blank" rel="noreferrer" style={{
          position: "absolute", right: 0, bottom: 0, fontSize: 9, color: tenue, background: panel,
          padding: "1px 5px", borderTopLeftRadius: 6, textDecoration: "none" }}>{E.atribucion}</a>
      </div>

      {/* Estilos: se prueban aqui mismo y se queda el ultimo elegido. */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
        {Object.entries(ESTILOS_MAPA).map(([k, v]) => (
          <button key={k} className="btn" onClick={() => cambiar(k)} data-estilo-boton={k} style={{
            fontSize: 11.5, fontWeight: 800, padding: "0 11px", minHeight: 30, borderRadius: 999, whiteSpace: "nowrap",
            background: k === estilo ? C.accent : C.card, color: k === estilo ? "#FAFAF9" : C.textDim,
            border: "1px solid " + (k === estilo ? C.accent : "#D4D4D1") }}>{v.nombre}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
          {cats.length > 1 && cats.map(c => (
            <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>
              <span style={{ width: 14, height: 4, borderRadius: 2, background: COLORES.claro[c] }} />{LEYENDA[c]}
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
            padding: "0 10px", minHeight: 32, background: C.card }}>GPX</button>
        </div>
      </div>
    </div>
  );
}
