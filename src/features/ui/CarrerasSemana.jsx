"use client";

import { A, C, CARD } from "@/design/tokens";

/**
 * EL NUMERO QUE MANDA: "Carreras esta semana: 1 de 3".
 *
 * Es lo que predice si llegas al 7K, por eso va arriba en HOY y en Progreso.
 * Sin culpa: lo que falta se dice como lo siguiente que toca, no como fallo.
 */
const CORTO = { Martes: "Mar", Jueves: "Jue", Domingo: "Dom", Sabado: "Sáb", Viernes: "Vie", Miercoles: "Mié", Lunes: "Lun" };

export function CarrerasSemana({ c, hoyIso }) {
  if (!c || !c.de) return null;
  const siguiente = c.dias.find(d => !d.hecha && d.iso >= hoyIso);
  const nombre = (d) => (d.iso === hoyIso ? "hoy" : "el " + d.dow.toLowerCase().replace("miercoles", "miércoles").replace("sabado", "sábado"));
  const frase = c.hechas >= c.de ? "Semana hecha. Así se llega al 7K."
    : siguiente ? "La siguiente: " + nombre(siguiente) + "."
    : "La semana que viene, otra vez a por " + c.de + ".";
  return (
    <div data-carreras-semana style={{ ...CARD, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textDim }}>Carreras esta semana</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.4, lineHeight: 1.15 }}>
          {c.hechas} <span style={{ fontSize: 16, fontWeight: 700, color: C.textDim }}>de {c.de}</span>
        </div>
        <div style={{ fontSize: 13, color: C.textDim, marginTop: 1 }}>{frase}</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {c.dias.map(d => (
          <div key={d.clave || d.iso} title={d.dow} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ width: 30, height: 30, borderRadius: 15, display: "flex", alignItems: "center", justifyContent: "center",
                           background: d.hecha ? A.verde : "transparent", color: "#fff", fontSize: 15, fontWeight: 800,
                           border: d.hecha ? "none" : "2px solid " + (d.iso === hoyIso ? A.azul : "#C7C7CC") }}>
              {d.hecha ? "✓" : ""}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: d.iso === hoyIso ? A.azul : C.textDim }}>{CORTO[d.dow] || d.dow}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
