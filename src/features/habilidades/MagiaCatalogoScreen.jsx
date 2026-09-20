"use client";

import { useState } from "react";
import { C, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { MAGIA_TRUCOS } from "@/domain/habilidades/magia";
import { SectionHeader } from "@/features/ui/headers";
export function MagiaCatalogoScreen({ onBack, currentWeekN, magiaProgress, setMagiaProgress, magiaLog }) {
  const [selectedId, setSelectedId] = useState(null);
  const colorMagia = "#6B4C8A";

  if (selectedId) {
    const truco = MAGIA_TRUCOS.find(t => t.id === selectedId);
    const dominado = !!magiaProgress[truco.id];
    const disponible = truco.semana <= currentWeekN;
    return (
      <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
        <button className="btn" onClick={() => setSelectedId(null)} style={{ fontSize: 13, color: colorMagia, fontWeight: 700, marginBottom: SP.lg, minHeight: 36, padding: "6px 0" }}>&lsaquo; TODOS LOS TRUCOS</button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim }}>SEMANA {truco.semana} · {truco.dificultad.toUpperCase()}</span>
          {!disponible && <span style={{ fontSize: 8.5, fontWeight: 800, color: "#8A8A87", background: "#F2F2F0", padding: "2px 6px", borderRadius: R.sm }}>TODAVÍA NO TOCA</span>}
          {dominado && <span style={{ fontSize: 8.5, fontWeight: 800, color: "#2F7D4F", background: "#EAF7EE", padding: "2px 6px", borderRadius: R.sm }}>DOMINADO</span>}
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.text, marginTop: 4, marginBottom: SP.lg, letterSpacing: -0.3 }}>{truco.nombre}</div>
        <div style={{ fontSize: 13.5, color: "#4A4A47", lineHeight: 1.55, marginBottom: SP.lg }}>{truco.descripcion}</div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: "#787774", marginBottom: 5 }}>QUÉ NECESITAS</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.necesitas}</div>
        </div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <SectionHeader>MÉTODO</SectionHeader>
          {truco.metodo.map((paso, i) => (
            <div key={i} style={{ display: "flex", gap: SP.sm + 2, marginBottom: SP.sm }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: colorMagia, flexShrink: 0 }}>{i+1}.</span>
              <span style={{ fontSize: 13.5, color: "#3A3A38", lineHeight: 1.55 }}>{paso}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: "#787774", marginBottom: 5 }}>CÓMO PRESENTARLO</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.presentacion}</div>
        </div>

        <div style={{ background: colorMagia + "10", border: "1px solid " + colorMagia + "30", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.lg }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: colorMagia, marginBottom: 5 }}>CUÁNDO LO DOMINAS</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.dominio}</div>
        </div>

        <button className="btn" onClick={() => setMagiaProgress(p => Object.assign({}, p, { [truco.id]: !p[truco.id] }))} style={{
          width: "100%", padding: SP.md + "px", borderRadius: R.md, background: dominado ? "#2F7D4F" : colorMagia,
          color: "#FAFAF9", fontWeight: 800, fontSize: 13,
        }}>{dominado ? "✓ MARCADO COMO DOMINADO" : "MARCAR COMO DOMINADO"}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: SP.md, marginBottom: 4 }}>
        <button className="btn" onClick={onBack} style={{ fontSize: 20, color: "#787774" }}>&lsaquo;</button>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>TRUCOS DE MAGIA</div>
      </div>
      <div style={{ fontSize: 12, color: C.textDim, marginBottom: SP.xl, marginLeft: 34, fontWeight: 600 }}>8 trucos totales, se desbloquean por semana</div>

      <div style={{ display: "flex", flexDirection: "column", gap: SP.xs + 2 }}>
        {MAGIA_TRUCOS.map(truco => {
          const disponible = truco.semana <= currentWeekN;
          const dominado = !!magiaProgress[truco.id];
          return (
            <div key={truco.id} onClick={() => setSelectedId(truco.id)} className="block" style={{
              background: C.card, border: "1px solid #E2D5EC", borderRadius: R.lg,
              padding: SP.md + "px " + SP.md + "px", minHeight: TAP_MIN, cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center", opacity: disponible ? 1 : 0.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP.sm, flexWrap: "wrap" }}>
                {dominado && <span style={{ fontSize: 12 }}>✓</span>}
                <span style={{ fontSize: 13.5, color: "#3A3A38", fontWeight: 600 }}>{truco.nombre}</span>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#787774", background: "#F2F2F0", padding: "1px 6px", borderRadius: R.sm }}>S{truco.semana}</span>
              </div>
              <span style={{ fontSize: 15, color: C.textFaint, flexShrink: 0, marginLeft: SP.sm }}>&rsaquo;</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
