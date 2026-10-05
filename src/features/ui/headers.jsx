"use client";

import { C, SP, TYPE } from "@/design/tokens";

/**
 * Cabecera de pantalla del estilo Aire: una linea pequeña en gris encima
 * (fecha o contexto) y el titulo grande. `derecha`: algo pequeño alineado al
 * titulo (un enlace, una cifra). `icon` se ignora: los dibujos de antes no
 * casan con el estilo.
 */
export function ScreenHeader({ title, subtitle, derecha }) {
  return (
    <div style={{ marginBottom: SP.md }}>
      {subtitle && <div style={{ fontSize: 14, fontWeight: 600, color: C.textDim }}>{subtitle}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: SP.sm }}>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>{title}</div>
        {derecha && <div style={{ marginBottom: 7, flexShrink: 0 }}>{derecha}</div>}
      </div>
    </div>
  );
}

export function SectionHeader({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: C.textDim, margin: "18px 4px 8px" }}>{children}</div>;
}
