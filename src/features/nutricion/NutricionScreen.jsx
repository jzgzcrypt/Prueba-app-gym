"use client";

import { C, R, SP, TYPE } from "@/design/tokens";
import { ICON_NUTRICION } from "@/domain/assets/icons";
import { NUTRICION } from "@/domain/nutricion/nutricion";
import { ScreenHeader, SectionHeader } from "@/features/ui/headers";
export function NutricionScreen() {
  return (
    <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
      <ScreenHeader icon={ICON_NUTRICION} title="NUTRICIÓN" />

      <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.xl }}>
        {NUTRICION.macros.map((m,i) => (
          <div key={i} style={{ flex: 1, background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg, padding: SP.md + "px " + SP.sm + "px", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.v}</div>
            <div style={{ fontSize: 9.5, color: C.textDim, fontWeight: 700, marginTop: 3, letterSpacing: 0.3 }}>{m.n.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <SectionHeader>REGLAS FIJAS · CANTINA</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: SP.sm, marginBottom: SP.xxl }}>
        {NUTRICION.reglas.map((r,i) => (
          <div key={i} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg, padding: SP.md + "px " + SP.lg + "px" }}>
            <div style={{ ...TYPE.bodyStrong, fontSize: 13.5, color: C.text }}>{r.t}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 3, lineHeight: 1.45 }}>{r.d}</div>
          </div>
        ))}
      </div>

      <SectionHeader>SEGÚN LA FASE</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: SP.sm, marginBottom: SP.xxl }}>
        {NUTRICION.timing.map((t,i) => (
          <div key={i} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + C.accent, borderRadius: R.lg, padding: SP.md + "px " + SP.lg + "px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.accent }}>{t.fase}</div>
            <div style={{ fontSize: 12.5, color: "#4A4A47", marginTop: 3, lineHeight: 1.45 }}>{t.d}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: R.lg, padding: SP.lg + "px" }}>
        <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.accent, marginBottom: SP.xs + 2 }}>SEÑAL DE ALARMA</div>
        <div style={{ fontSize: 12.5, color: "#3A3A38", lineHeight: 1.5 }}>{NUTRICION.alarma}</div>
      </div>
    </div>
  );
}
