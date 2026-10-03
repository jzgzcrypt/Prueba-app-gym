"use client";

import { useEffect, useId, useRef, useState } from "react";
import { C } from "@/design/tokens";
import { aGpx, flechas, marcasKm, proyectar, remuestrear, suavizar, parcialesKm, tramosCorridos, tramosPorColor } from "@/domain/running/ruta";
import { textoTiempo } from "@/domain/running/gps";
import { PALETAS, recolorear } from "@/domain/running/teselas";

/**
 * La ruta de una salida sobre OpenStreetMap, en curvas, con los km marcados,
 * flechas de sentido, salida y llegada, y los datos encima. Estilo Arena:
 * callejero en tonos crema y ruta naranja con sombra suave; con series
 * (varios ritmos), el color de la ruta dice el ritmo.
 *
 * Cada tesela se repinta por tipo (parques verdes, agua azul, edificios,
 * calles, nombres suaves: ver teselas.js); si el navegador no deja, filtro
 * CSS. Las teselas van "retina" (zoom siguiente a la mitad): mas detalle y
 * los nombres de las calles pequeños.
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
  suave: "#F2542D",      // mas lento
  corre: "#F2542D",      // corriendo, sin ritmo objetivo
  recupera: "#A8A39A",   // trote o caminar entre series
};
// Arena: callejero en tonos crema, ruta naranja con sombra suave.
const E = {
  paleta: PALETAS.arena, fondo: PALETAS.arena.fondo, filtro: "grayscale(0.55) sepia(0.3) contrast(0.8) brightness(1.08)",
  linea: "#F2542D", km: { fondo: "#FFFFFF", borde: "#F2542D", texto: "#F2542D" },
  panel: "rgba(255,255,255,.82)", tinta: "#2B2622", tenue: "#8C8378",
};
const LEYENDA = { objetivo: "a tu ritmo", cerca: "algo más lento", suave: "suave", corre: "corriendo", recupera: "recuperación" };

/**
 * Una tesela de OSM repintada con la paleta del estilo. Se pide con CORS para
 * poder leer sus pixeles; si no se puede, la imagen normal con el filtro CSS.
 */
function TeselaPintada({ src, paleta, filtro, style, onError }) {
  const lienzo = useRef(null);
  const [respaldo, setRespaldo] = useState(false);
  useEffect(() => {
    if (respaldo) return;
    let vivo = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!vivo || !lienzo.current) return;
      try {
        const c = lienzo.current, ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const datos = ctx.getImageData(0, 0, c.width, c.height);
        recolorear(datos.data, paleta);
        ctx.putImageData(datos, 0, 0);
      } catch { setRespaldo(true); }
    };
    img.onerror = () => { if (vivo) setRespaldo(true); };
    img.src = src;
    return () => { vivo = false; };
  }, [src, paleta, respaldo]);
  if (respaldo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" draggable={false} loading="lazy" src={src} onError={onError} style={{ ...style, filter: filtro }} />;
  }
  return <canvas ref={lienzo} width={256} height={256} data-tesela style={style} />;
}

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
  const m = proyectar(ruta, ANCHO, ALTO, 20, conDatos ? FRANJA + 8 : 20, true);
  if (!m) return null;
  const tramos = tramosPorColor(ruta, objetivo);
  const cats = [...new Set(tramos.map(t => t.cat))].filter(c => LEYENDA[c] && !(c === "suave" && !objetivo));
  const pct = (v, total) => (v / total * 100) + "%";
  const linea = (pts) => pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  // Cada tramo en pixeles y con las esquinas redondeadas.
  const curvas = tramos.map(t => ({ cat: t.cat, puntos: suavizar(remuestrear(t.puntos.map(q => { const p = m.punto(q); return [p.x, p.y]; }), 9), 3) }));
  // Con tramos distintos (series y recuperacion, o ritmos), cada uno de su color.
  const porRitmo = new Set(tramos.map(t => t.cat)).size > 1;
  const trazos = curvas.map(c => ({ cat: c.cat, color: porRitmo ? COLOR[c.cat] : E.linea, puntos: c.puntos }));
  // El ritmo de cada tramo corrido, en sesiones con recuperaciones.
  const corridos = tramosCorridos(ruta);
  // En un rodaje continuo, el tiempo de cada km (los parciales).
  const parciales = corridos.length ? [] : parcialesKm(ruta, conDatos ? datos.m : null);
  // Los km, en proporcion a la distancia medida: el "2" cae donde se contaron 2 km.
  const marcas = marcasKm(ruta, conDatos ? datos.m : null);
  const sentido = flechas(ruta, 3).map(f => {
    const a = m.punto(f.a), b = m.punto(f.b), p = m.punto([f.lat, f.lon]);
    return { x: p.x, y: p.y, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  });

  return (
    <div data-mapa>
      <div style={{ position: "relative", width: "100%", aspectRatio: ANCHO + " / " + ALTO, overflow: "hidden",
                    borderRadius: 14, background: E.fondo, border: "1px solid " + C.cardBorder }}>
        {!sinTeselas && m.teselas.map(t => (
          <TeselaPintada key={t.z + "/" + t.x + "/" + t.y}
            src={"https://tile.openstreetmap.org/" + t.z + "/" + t.x + "/" + t.y + ".png"}
            paleta={E.paleta} filtro={E.filtro} onError={() => setSinTeselas(true)}
            style={{ position: "absolute", left: pct(t.left, ANCHO), top: pct(t.top, ALTO),
                     width: pct(t.size, ANCHO), height: pct(t.size, ALTO), userSelect: "none" }} />
        ))}
        <svg viewBox={"0 0 " + ANCHO + " " + ALTO} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <pattern id={"meta" + uid} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill="#FFFFFF" />
              <rect width="2" height="2" fill="#111111" /><rect x="2" y="2" width="2" height="2" fill="#111111" />
            </pattern>
          </defs>
          <filter id={"sombra" + uid} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
          {/* Sombra suave detras, borde blanco y la linea encima. */}
          <g filter={"url(#sombra" + uid + ")"} opacity="0.2" transform="translate(1,2)">
            {curvas.map((c, i) => <polyline key={"s" + i} points={linea(c.puntos)} fill="none" stroke="#000000"
              strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
          {curvas.map((c, i) => (
            <polyline key={"b" + i} points={linea(c.puntos)} fill="none" stroke="#FFFFFF"
              strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {trazos.map((t, i) => (
            <polyline key={i} data-cat={t.cat} points={linea(t.puntos)} fill="none" stroke={t.color}
              strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
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
                <circle cx={p.x} cy={p.y} r="8.5" fill={E.km.fondo} stroke={E.km.borde} strokeWidth="1.8" />
                <text x={p.x} y={p.y + 3.4} textAnchor="middle" fontSize="9.5" fontWeight="800"
                  fontFamily="-apple-system, Inter, sans-serif" fill={E.km.texto}>{k.n}</text>
              </g>
            );
          })}
          {parciales.filter(k => k.n).map(k => {
            const p = m.punto([k.lat, k.lon]), texto = textoTiempo(k.seg), w = texto.length * 5.6 + 8;
            // A la derecha del circulo; si se sale del mapa, a la izquierda.
            const x = p.x + 11 + w > ANCHO - 4 ? p.x - 11 - w / 2 : p.x + 11 + w / 2;
            const y = conDatos && p.y - 7 < FRANJA + 2 ? FRANJA + 9 : p.y;
            return (
              <g key={"p" + k.n} data-parcial={k.n} transform={"translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")"}>
                <rect x={-w / 2} y="-7" width={w} height="14" rx="7" fill="#FFFFFF" stroke={E.linea} strokeWidth="1.3" />
                <text y="3.4" textAnchor="middle" fontSize="9.5" fontWeight="800" fontFamily="ui-monospace, Menlo, monospace" fill={E.tinta}>{texto}</text>
              </g>
            );
          })}
          {corridos.map(t => {
            const p = m.punto([t.lat, t.lon]), texto = textoTiempo(t.ritmo), w = texto.length * 5.6 + 8;
            // Encima de la linea; si ahi la tapa la franja de datos, debajo.
            const y = conDatos && p.y - 20 < FRANJA + 2 ? p.y + 13 : p.y - 13;
            return (
              <g key={"r" + t.n} data-ritmo-tramo={t.n} transform={"translate(" + p.x.toFixed(1) + "," + y.toFixed(1) + ")"}>
                <rect x={-w / 2} y="-7" width={w} height="14" rx="7" fill="#FFFFFF" stroke={E.linea} strokeWidth="1.3" />
                <text y="3.4" textAnchor="middle" fontSize="9.5" fontWeight="800" fontFamily="ui-monospace, Menlo, monospace" fill={E.tinta}>{texto}</text>
              </g>
            );
          })}
          <circle cx={m.inicio.x} cy={m.inicio.y} r="6.5" fill="#2FBF71" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx={m.fin.x} cy={m.fin.y} r="7.5" fill={"url(#meta" + uid + ")"} stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
        {conDatos && (
          <div data-franja style={{ position: "absolute", left: 8, right: 8, top: 8, height: FRANJA - 6, borderRadius: 10,
                                    background: E.panel, boxShadow: "0 2px 10px rgba(0,0,0,.12)",
                                    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                                    display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            {[
              ["Distancia", (datos.m / 1000).toFixed(2).replace(".", ","), "km"],
              ["Tiempo", textoTiempo(datos.seg), ""],
              ["Ritmo", datos.m >= 200 ? textoTiempo(datos.seg / datos.m * 1000) : "–", "/km"],
            ].map(([et, v, u]) => (
              <div key={et} style={{ textAlign: "center", lineHeight: 1.1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: E.tenue, letterSpacing: 0.3 }}>{et}</div>
                <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: E.tinta }}>
                  {v}<span style={{ fontSize: 11, fontWeight: 700, color: E.tenue }}>{u ? " " + u : ""}</span>
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
      {parciales.length > 0 && (
        <div data-parciales style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6, marginBottom: 4 }}>PARCIALES</div>
          {parciales.map((k, i) => (
            <div key={i} className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.textDim,
                                                   padding: "3px 0", borderTop: i ? "1px solid " + C.cardBorder : "none" }}>
              <span>{k.n ? <>km <b style={{ color: C.text }}>{k.n}</b></> : (k.metros / 1000).toFixed(2).replace(".", ",") + " km"}</span>
              <span><b style={{ color: C.text }}>{textoTiempo(k.seg)}</b>{k.n ? "" : " (" + textoTiempo(k.seg / k.metros * 1000) + "/km)"}</span>
            </div>
          ))}
        </div>
      )}
      {corridos.length > 0 && (
        <div data-tramos style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6, marginBottom: 4 }}>TRAMOS CORRIENDO</div>
          {corridos.map(t => (
            <div key={t.n} className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.textDim,
                                                      padding: "3px 0", borderTop: t.n > 1 ? "1px solid " + C.cardBorder : "none" }}>
              <span><b style={{ color: C.text }}>{t.n}</b> · {textoTiempo(t.seg)} · {t.metros} m</span>
              <b style={{ color: C.text }}>{textoTiempo(t.ritmo)}/km</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
