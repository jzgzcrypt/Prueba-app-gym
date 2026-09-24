"use client";

import { useState } from "react";
import { C, CAT, TAP_MIN } from "@/design/tokens";
import { textoResumen } from "@/domain/progreso/resumen";

/** El resumen de la semana que acaba de terminar, como hacen Strava y Hevy
 *  los lunes. Se puede compartir tal cual. */
export function TarjetaResumen({ resumen: r, nombreBloque }) {
  const [copiado, setCopiado] = useState(false);
  const texto = textoResumen(r, nombreBloque);
  const compartir = async () => {
    try {
      if (navigator.share) { await navigator.share({ text: texto }); return; }
      await navigator.clipboard.writeText(texto);
      setCopiado(true); setTimeout(() => setCopiado(false), 2000);
    } catch { /* cancelado */ }
  };
  const dato = (valor, etiqueta) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{valor}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textDim, letterSpacing: 0.3 }}>{etiqueta}</div>
    </div>
  );
  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + (r.completa ? C.ok : CAT.fuerza),
                  borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6 }}>TU SEMANA {r.n} · {r.dates}</div>
        {r.completa && <div style={{ fontSize: 11, fontWeight: 800, color: C.ok }}>COMPLETA</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {dato(r.sesiones.hechas + "/" + r.sesiones.total, "SESIONES")}
        {dato(r.minutosCorriendo, "MIN CORRIENDO")}
        {dato(r.series, "SERIES")}
        {dato(r.records.length, r.records.length === 1 ? "RÉCORD" : "RÉCORDS")}
      </div>
      {r.ritmoCalidad && (
        <div style={{ fontSize: 12.5, color: "#4A4A47", marginTop: 10 }}>Series de running a <b>{r.ritmoCalidad}</b></div>
      )}
      {r.records.map((x, i) => (
        <div key={i} style={{ fontSize: 12.5, color: "#4A4A47", marginTop: i ? 2 : 8 }}>
          <b style={{ color: "#946800" }}>Récord</b> · {x.nombre}: {x.texto}
        </div>
      ))}
      <button className="btn" onClick={compartir} style={{
        width: "100%", minHeight: TAP_MIN, marginTop: 12, borderRadius: 10, background: C.surfaceMuted,
        fontSize: 12.5, fontWeight: 800, color: C.text,
      }}>{copiado ? "COPIADO" : "COMPARTIR MI SEMANA"}</button>
    </div>
  );
}
