"use client";

import { useState } from "react";
import { A, C, CARD, TAP_MIN } from "@/design/tokens";
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
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.4 }}>{valor}</div>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: C.textDim }}>{etiqueta}</div>
    </div>
  );
  return (
    <div style={{ ...CARD, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>Tu semana {r.n} <span style={{ fontSize: 12.5, fontWeight: 500, color: C.textDim }}>· {r.dates}</span></div>
        {r.completa && <div style={{ fontSize: 12, fontWeight: 700, color: C.ok }}>Completa ✓</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {dato(r.sesiones.hechas + "/" + r.sesiones.total, "sesiones")}
        {dato(r.minutosCorriendo, "min corriendo")}
        {dato(r.series, "series")}
        {dato(r.records.length, r.records.length === 1 ? "récord" : "récords")}
      </div>
      {r.ritmoCalidad && (
        <div style={{ fontSize: 12.5, color: "#3A3A3C", marginTop: 10 }}>Series de running a <b>{r.ritmoCalidad}</b></div>
      )}
      {r.records.map((x, i) => (
        <div key={i} style={{ fontSize: 12.5, color: "#3A3A3C", marginTop: i ? 2 : 8 }}>
          <b style={{ color: A.naranja }}>Récord</b> · {x.nombre}: {x.texto}
        </div>
      ))}
      <button className="btn" onClick={compartir} style={{
        width: "100%", minHeight: TAP_MIN, marginTop: 12, borderRadius: 999, background: "#E5E5EA",
        fontSize: 15, fontWeight: 700, color: C.text,
      }}>{copiado ? "Copiado" : "Compartir mi semana"}</button>
    </div>
  );
}
