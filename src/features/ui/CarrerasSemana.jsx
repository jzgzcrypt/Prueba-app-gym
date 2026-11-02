"use client";

import { A, C, CARD } from "@/design/tokens";

/**
 * EL NUMERO QUE MANDA: las carreras de la semana, "1/3".
 * Es lo que predice si llegas al 7K. Cada circulo es una carrera, en su dia.
 */
const CORTO = { Martes: "Mar", Jueves: "Jue", Domingo: "Dom", Sabado: "Sáb", Viernes: "Vie", Miercoles: "Mié", Lunes: "Lun" };

export function CarrerasSemana({ c, hoyIso }) {
  if (!c || !c.de) return null;
  return (
    <div data-carreras-semana style={{ ...CARD, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.text }}>
        Carreras <span style={{ color: c.hechas >= c.de ? A.verde : C.textDim }}>{c.hechas}/{c.de}</span>
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
