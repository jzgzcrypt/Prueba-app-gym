"use client";

import { useState } from "react";
import { C, CAT } from "@/design/tokens";
import { flechas, marcasKm, proyectar, tramosPorColor } from "@/domain/running/ruta";
import { textoTiempo } from "@/domain/running/gps";

/**
 * PROPUESTAS DE MAPA, SOBRE TU PROPIA SALIDA.
 *
 * Antes de tocar el mapa de verdad: varias versiones, una debajo de otra,
 * todas con las calles a la vista, para elegir en el movil (las teselas solo
 * cargan alli). La primera es el mapa de ahora, como referencia. No cambia
 * nada: es solo para mirar.
 */
const COLOR = { objetivo: C.ok, cerca: "#D39B12", suave: CAT.running, corre: CAT.running, recupera: "#8A8A87" };
const OSM = { url: (z, x, y) => "https://tile.openstreetmap.org/" + z + "/" + x + "/" + y + ".png",
              atribucion: "© OpenStreetMap", enlace: "https://www.openstreetmap.org/copyright", fondo: "#E8E6E1" };
// Sin clave (CARTO ya la pide: salia "API KEY REQUIRED").
const ESRI_CALLES = { url: (z, x, y) => "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/" + z + "/" + y + "/" + x,
                      atribucion: "© Esri · © OpenStreetMap", enlace: "https://www.esri.com", fondo: "#F2EFE9" };
const HOT = { url: (z, x, y) => "https://a.tile.openstreetmap.fr/hot/" + z + "/" + x + "/" + y + ".png",
              atribucion: "© OpenStreetMap · HOT", enlace: "https://www.openstreetmap.org/copyright", fondo: "#F2EFE9" };

const PROPUESTAS = [
  { id: "A", nombre: "Como ahora", nota: "El mapa actual, como referencia.", teselas: OSM, alto: 240, km: false, franja: false, fino: true },
  { id: "B", nombre: "Calles + km y sentido", nota: "El de ahora, con la ruta más gruesa, los km marcados, flechas y bandera de llegada. Los datos, debajo.",
    teselas: OSM, alto: 240, km: true, franja: false },
  { id: "C", nombre: "Calles + datos encima", nota: "Como la B, con distancia, tiempo y ritmo en una franja blanca sobre el mapa.",
    teselas: OSM, alto: 260, km: true, franja: true },
  { id: "D", nombre: "Callejero Esri", nota: "Otro callejero: colores más suaves y nombres de calle claros, la ruta destaca más.",
    teselas: ESRI_CALLES, alto: 260, km: true, franja: true },
  { id: "E", nombre: "Calles, mapa más alto", nota: "Como la C pero más alto: se ve más barrio alrededor de la ruta.",
    teselas: OSM, alto: 360, km: true, franja: true, margen: 44 },
  { id: "F", nombre: "Callejero con más contraste", nota: "OpenStreetMap en su versión humanitaria: calles y edificios más marcados.",
    teselas: HOT, alto: 260, km: true, franja: true },
];

const km = (m) => (m / 1000).toFixed(2).replace(".", ",");
const ANCHO = 360, FRANJA = 54;

function Datos({ datos, enLinea }) {
  const items = [
    ["Distancia", km(datos.m), "km"],
    ["Tiempo", textoTiempo(datos.seg), ""],
    ["Ritmo", datos.m >= 200 ? textoTiempo(datos.seg / datos.m * 1000) : "–", "/km"],
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "100%",
                  ...(enLinea ? { padding: "8px 0 0" } : {}) }}>
      {items.map(([et, v, u]) => (
        <div key={et} style={{ textAlign: "center", lineHeight: 1.1 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: "#6B6B68", letterSpacing: 0.3 }}>{et}</div>
          <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: "#171717" }}>
            {v}<span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B68" }}>{u ? " " + u : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Variante({ p, ruta, objetivo, datos }) {
  const [sinTeselas, setSinTeselas] = useState(false);
  const conFranja = p.franja && datos && datos.m > 0;
  const margen = p.margen || 20;
  const m = proyectar(ruta, ANCHO, p.alto, margen, conFranja ? FRANJA + 8 : margen);
  if (!m) return null;
  const tramos = tramosPorColor(ruta, objetivo);
  const xy = (q) => { const r = m.punto(q); return r.x.toFixed(1) + "," + r.y.toFixed(1); };
  const pct = (v, total) => (v / total * 100) + "%";
  const marcas = p.km ? marcasKm(ruta, datos && datos.m > 0 ? datos.m : null) : [];
  const sentido = p.km ? flechas(ruta, 3).map(f => {
    const a = m.punto(f.a), b = m.punto(f.b), c = m.punto([f.lat, f.lon]);
    return { x: c.x, y: c.y, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  }) : [];
  const T = p.teselas;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", aspectRatio: ANCHO + " / " + p.alto, overflow: "hidden",
                    borderRadius: 12, background: T.fondo, border: "1px solid " + C.cardBorder }}>
        {!sinTeselas && m.teselas.map(t => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.z + "/" + t.x + "/" + t.y} alt="" draggable={false} loading="lazy" src={T.url(t.z, t.x, t.y)}
            onError={() => setSinTeselas(true)}
            style={{ position: "absolute", left: pct(t.left, ANCHO), top: pct(t.top, p.alto),
                     width: pct(256, ANCHO), height: pct(256, p.alto), userSelect: "none" }} />
        ))}
        <svg viewBox={"0 0 " + ANCHO + " " + p.alto} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <pattern id={"meta" + p.id} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#FFFFFF" />
              <rect width="2" height="2" fill="#111111" /><rect x="2" y="2" width="2" height="2" fill="#111111" />
            </pattern>
          </defs>
          {tramos.map((t, i) => (
            <polyline key={"h" + i} points={t.puntos.map(xy).join(" ")} fill="none" stroke="#FFFFFF"
              strokeWidth={p.fino ? 6 : 8} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {tramos.map((t, i) => (
            <polyline key={i} points={t.puntos.map(xy).join(" ")} fill="none" stroke={COLOR[t.cat]}
              strokeWidth={p.fino ? 3.5 : 4.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {sentido.map((f, i) => (
            <g key={"f" + i} data-flecha transform={"translate(" + f.x.toFixed(1) + "," + f.y.toFixed(1) + ") rotate(" + f.ang.toFixed(0) + ")"}>
              <path d="M-2.4,-3 L1.7,0 L-2.4,3" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {marcas.map(k => {
            const c = m.punto([k.lat, k.lon]);
            return (
              <g key={"k" + k.n} data-km={k.n}>
                <circle cx={c.x} cy={c.y} r="8.5" fill="#171717" stroke="#FFFFFF" strokeWidth="1.8" />
                <text x={c.x} y={c.y + 3.4} textAnchor="middle" fontSize="9.5" fontWeight="800"
                  fontFamily="-apple-system, Inter, sans-serif" fill="#FAFAF9">{k.n}</text>
              </g>
            );
          })}
          {p.fino
            ? <circle cx={m.inicio.x} cy={m.inicio.y} r="5.5" fill="#FFFFFF" stroke={C.ok} strokeWidth="3" />
            : <circle cx={m.inicio.x} cy={m.inicio.y} r="6.5" fill="#2FBF71" stroke="#FFFFFF" strokeWidth="2.5" />}
          <circle cx={m.fin.x} cy={m.fin.y} r="7.5" fill={p.km ? "url(#meta" + p.id + ")" : "#171717"} stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
        {conFranja && (
          <div data-franja style={{ position: "absolute", left: 8, right: 8, top: 8, height: FRANJA - 6, borderRadius: 10,
                                    background: "rgba(255,255,255,.9)", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }}>
            <Datos datos={datos} />
          </div>
        )}
        <a href={T.enlace} target="_blank" rel="noreferrer" style={{
          position: "absolute", right: 0, bottom: 0, fontSize: 9.5, color: "#4A4A47", background: "rgba(255,255,255,.8)",
          padding: "1px 5px", borderTopLeftRadius: 6, textDecoration: "none" }}>{T.atribucion}</a>
      </div>
      {!conFranja && !p.fino && datos && datos.m > 0 && <Datos datos={datos} enLinea />}
    </div>
  );
}

/** Pantalla entera con las propuestas. `datos`: { m, seg } de la salida. */
export function PropuestasMapa({ ruta, objetivo, datos, titulo, cerrar }) {
  return (
    <div data-propuestas style={{ position: "fixed", inset: 0, zIndex: 50, background: C.bg, overflowY: "auto" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: C.textDim }}>PROPUESTAS DE MAPA</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{titulo}</div>
          </div>
          <button className="btn" onClick={cerrar} style={{ minHeight: 40, padding: "0 14px", borderRadius: 10, background: C.accent,
                  color: "#FAFAF9", fontSize: 13, fontWeight: 800 }}>Cerrar</button>
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.45, margin: "8px 0 14px" }}>
          Solo para mirar: el mapa de la app no cambia hasta que elijas una. Dime la letra que te guste (o mezclas: «la C con el mapa de la D»).
        </div>
        {PROPUESTAS.map(p => (
          <Bloque key={p.id} id={p.id} nombre={p.nombre} nota={p.nota}>
            <Variante p={p} ruta={ruta} objetivo={objetivo} datos={datos} />
          </Bloque>
        ))}
      </div>
    </div>
  );
}

function Bloque({ id, nombre, nota, children }) {
  return (
    <div data-propuesta={id} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{id}</span>
        <span style={{ fontSize: 14.5, fontWeight: 800, color: C.text }}>{nombre}</span>
      </div>
      <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.4, marginBottom: 8 }}>{nota}</div>
      {children}
    </div>
  );
}
