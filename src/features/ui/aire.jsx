"use client";

/**
 * PIEZAS DEL ESTILO AIRE.
 *
 * Lo que repiten todas las pantallas desde el rediseño: tarjeta blanca,
 * iconos de linea dentro de un cuadrado de color suave, filas de lista,
 * checks redondos, botones de pastilla, anillos y el selector segmentado.
 * Nada de emoticonos ni dibujos: iconos de trazo, como la barra de abajo.
 */

import { A, C, CARD } from "@/design/tokens";

/** Trazos de los iconos, sobre 24x24. */
const TRAZOS = {
  correr: '<circle cx="13.5" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v5M6 12l3-3 4 1 3 3 3 1M11 15l-1-5"/>',
  meta: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  peso: '<path d="M12 4v16M7 20h10M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  calendario: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  aviso: '<path d="M12 4l9 16H3zM12 10v4M12 17h.01"/>',
  cuello: '<circle cx="12" cy="5" r="2"/><path d="M12 8v6M6 11l6 2 6-2M8 20l4-6 4 6"/>',
  pierna: '<path d="M9 3v8l-2 9h4l2-7 3 7h3l-4-10V3"/>',
  cafe: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
  plato: '<circle cx="12" cy="13" r="6"/><path d="M3 4v6a2 2 0 0 0 2 2v8M5 4v4M21 4c-2 1-2 5-2 8h2v8"/>',
  huevo: '<path d="M12 3c3.5 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2.5-10 6-10z"/>',
  vaso: '<path d="M7 7h10l-1 13H8zM6 7h12M12 7l2-4"/>',
  manzana: '<path d="M12 7c-3-2-7 0-7 5s3 9 5 9c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-9s-4-7-7-5zM12 7c0-2 1-3 3-4"/>',
  regla: '<path d="M4 16L16 4l4 4L8 20zM8 12l2 2M11 9l2 2M14 6l2 2"/>',
  portapapeles: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
  estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  idea: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  fuego: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-6 1-8z"/>',
  mancuerna: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  magia: '<path d="M4 20L15 9M14 4v2M14 10v2M10 8h2M16 8h2M18 3l1 1M18 13l1-1"/>',
  escudo: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/>',
  tenis: '<circle cx="12" cy="12" r="8"/><path d="M5 7c4 2 4 8 0 10M19 7c-4 2-4 8 0 10"/>',
  nota: '<path d="M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h5"/>',
  dolor: '<circle cx="12" cy="12" r="8"/><path d="M9 15c1.5-1.5 4.5-1.5 6 0M9 9.5h.01M15 9.5h.01"/>',
  mover: '<path d="M4 12h14M14 6l6 6-6 6"/>',
  copia: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  campana: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  grafica: '<path d="M4 18l5-6 4 3 7-8"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  flecha: '<path d="M9 5l7 7-7 7"/>',
  izquierda: '<path d="M15 5l-7 7 7 7"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  buscar: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
};

/** Un icono de trazo. `nombre` de TRAZOS; hereda el color si no se le da. */
export function Icono({ nombre, tam = 20, color = "currentColor", grosor = 1.9, style }) {
  const d = TRAZOS[nombre];
  if (!d) return null;
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={grosor}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: d }} />
  );
}

/** El icono dentro de su cuadrado de color suave (`tono`: azul, verde, rojo, naranja, morado, gris). */
export function IconoCaja({ nombre, tono = "azul", tam = 38 }) {
  return (
    <div style={{ width: tam, height: tam, borderRadius: tam * 0.29, background: A.fondo[tono] || A.fondo.gris,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: A[tono] || A.gris }}>
      <Icono nombre={nombre} tam={Math.round(tam * 0.56)} />
    </div>
  );
}

/** Tarjeta blanca del estilo. */
export function Tarjeta({ children, style, ...resto }) {
  return <div style={{ ...CARD, ...style }} {...resto}>{children}</div>;
}

/** Fila de lista: icono, titulo, subtitulo y algo a la derecha. */
export function Fila({ icono, tono, titulo, sub, derecha, onClick, primera = false, style, ...resto }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={onClick ? "btn" : undefined} onClick={onClick} {...resto} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", width: "100%", textAlign: "left",
      borderTop: primera ? "none" : "1px solid " + C.divider, minHeight: 56, background: "transparent", ...style }}>
      {icono && <IconoCaja nombre={icono} tono={tono} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{titulo}</div>
        {sub && <div style={{ fontSize: 12.5, fontWeight: 500, color: C.textDim, marginTop: 1 }}>{sub}</div>}
      </div>
      {derecha}
    </Tag>
  );
}

/** Flecha gris de "abre algo". */
export const Chevron = ({ abierto = false }) => (
  <Icono nombre="flecha" tam={16} color="#C7C7CC" grosor={2.4}
    style={{ transform: abierto ? "rotate(90deg)" : "none", transition: "transform .2s ease" }} />
);

/** Check redondo: relleno de color si esta hecho, aro gris si no. */
export function Check({ hecho, color = A.verde, onClick, tam = 26, etiqueta }) {
  const estilo = {
    width: tam, height: tam, borderRadius: tam / 2, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
    background: hecho ? color : "transparent", border: hecho ? "none" : "2px solid #D1D1D6", color: "#fff",
  };
  const dentro = hecho ? <Icono nombre="check" tam={tam * 0.6} grosor={3} /> : null;
  return onClick
    ? <button className="btn" aria-label={etiqueta} onClick={(e) => { e.stopPropagation(); onClick(); }} style={estilo}>{dentro}</button>
    : <div style={estilo}>{dentro}</div>;
}

/** Boton de pastilla. `tipo`: oscuro (por defecto), color (con `color`), suave. */
export function Boton({ children, onClick, tipo = "oscuro", color = A.azul, style, ...resto }) {
  const fondos = { oscuro: ["#1C1C1E", "#fff"], color: [color, "#fff"], suave: ["#E5E5EA", "#1C1C1E"] };
  const [bg, fg] = fondos[tipo] || fondos.oscuro;
  return (
    <button className="btn" onClick={onClick} {...resto} style={{
      width: "100%", minHeight: 50, borderRadius: 999, background: bg, color: fg,
      fontSize: 16, fontWeight: 700, padding: "0 18px", ...style }}>{children}</button>
  );
}

/** Etiqueta pequeña de color en mayusculas ("CARRERA · 28 MIN"). */
export const Etiqueta = ({ children, color = A.azul, style }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color, textTransform: "uppercase", ...style }}>{children}</div>
);

/** Anillo de progreso (0-1), con lo que se ponga en el centro. */
export function Anillo({ pct, color = A.verde, tam = 120, grosor, children }) {
  const g = grosor || Math.max(8, tam * 0.09);
  const r = tam / 2 - g / 2 - 1, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: tam, height: tam, flexShrink: 0 }}>
      <svg width={tam} height={tam} viewBox={`${-tam / 2} ${-tam / 2} ${tam} ${tam}`} style={{ display: "block" }}>
        <circle r={r} fill="none" stroke={color} strokeOpacity=".16" strokeWidth={g} />
        <circle r={r} fill="none" stroke={color} strokeWidth={g} strokeLinecap="round"
          strokeDasharray={`${c * Math.max(0, Math.min(1, pct))} ${c}`} transform="rotate(-90)" />
      </svg>
      {children && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>}
    </div>
  );
}

/** Selector segmentado tipo iOS. `opciones`: [[valor, texto]]. */
export function Segmentado({ opciones, valor, cambiar, style }) {
  return (
    <div style={{ display: "flex", background: "#E4E4E9", borderRadius: 10, padding: 2, ...style }}>
      {opciones.map(([v, t]) => (
        <button key={v} className="btn" onClick={() => cambiar(v)} style={{
          flex: 1, minHeight: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: v === valor ? "#fff" : "transparent", color: v === valor ? C.text : "#3A3A3C",
          boxShadow: v === valor ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>{t}</button>
      ))}
    </div>
  );
}

/** Titulo de seccion dentro de una pantalla ("Esta semana", "Por hacer"). */
export const Seccion = ({ children, derecha }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "20px 4px 8px" }}>
    <div style={{ fontSize: 19, fontWeight: 700, color: C.text }}>{children}</div>
    {derecha}
  </div>
);

/** Pastilla de estado ("Alto", "Bien", "Ajustado"). */
export const Pastilla = ({ children, color = A.azul }) => (
  <span style={{ fontSize: 11.5, fontWeight: 700, color, background: color + "1A", borderRadius: 999, padding: "3px 9px", flexShrink: 0 }}>{children}</span>
);
