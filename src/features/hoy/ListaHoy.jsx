"use client";

import { useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { Chevron, IconoCaja } from "@/features/ui/aire";

/**
 * HOY EN UNA LISTA.
 *
 * Una fila por cosa del dia. El circulo marca y desmarca (y devuelve lo que
 * dijiste que no); tocar la fila la abre ahi mismo con lo que hace falta. Lo
 * que toca ahora va resaltado. Sirve igual para hoy que para un dia pasado:
 * una sola forma de marcar.
 *
 * Presentacional: que pasa al tocar lo decide HoyScreen (`onCirculo`) y que
 * se ve al abrir una fila tambien (`detalle(id)`).
 */
const ICONO = { sesion: ["correr", "rojo"], fuerza: ["mancuerna", "azul"], tenis: ["tenis", "verde"], cuello: ["cuello", "azul"], peso: ["peso", "azul"], comida: ["plato", "verde"], pierna: ["pierna", "rojo"], medir: ["regla", "morado"] };

export function ListaHoy({ filas, onCirculo, detalle, abiertaInicial = null }) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  return (
    <div data-lista-hoy style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      {filas.map((f, i) => {
        const abiertaEsta = abierta === f.id;
        const [ic, tono] = ICONO[f.icono || f.id] || ["meta", "gris"];
        const hecho = f.estado === "hecho", no = f.estado === "no" || f.estado === "movida";
        return (
          <div key={f.id} data-fila={f.id} data-estado={f.estado} style={{ borderTop: i ? "1px solid " + C.divider : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 10px 10px", minHeight: 60,
                          background: f.ahora && !hecho ? A.fondo.azul : "transparent" }}>
              <button className="btn" data-circulo={f.id} aria-label={hecho ? "Desmarcar " + f.titulo : no ? "Devolver " + f.titulo : "Marcar " + f.titulo}
                onClick={() => onCirculo(f.id, () => setAbierta(f.id))}
                style={{ width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ width: 28, height: 28, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                               background: hecho ? A.verde : "transparent", border: hecho ? "none" : "2px solid " + (no ? C.textFaint : f.ahora ? A.azul : "#C7C7CC"),
                               color: "#fff", fontSize: 16, fontWeight: 800 }}>
                  {hecho ? "✓" : no ? <span style={{ color: C.textFaint, fontSize: 15 }}>↺</span> : ""}
                </span>
              </button>
              <button className="btn" data-abrir={f.id} onClick={() => setAbierta(abiertaEsta ? null : f.id)}
                style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                <IconoCaja nombre={ic} tono={tono} tam={34} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 16, fontWeight: f.ahora && !hecho ? 800 : 600, lineHeight: 1.25,
                                 color: no ? C.textFaint : C.text, textDecoration: f.estado === "no" ? "line-through" : "none" }}>
                    {f.titulo}
                  </span>
                  {f.sub && <span style={{ display: "block", fontSize: 13, color: C.textDim, marginTop: 2, lineHeight: 1.35 }}>{f.sub}</span>}
                </span>
                <Chevron abierto={abiertaEsta} />
              </button>
            </div>
            {abiertaEsta && (
              <div data-detalle={f.id} style={{ padding: "2px 16px 14px 64px" }}>{detalle(f.id, () => setAbierta(null))}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
