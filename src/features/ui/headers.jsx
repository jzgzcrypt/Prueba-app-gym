"use client";

import { C, SP, TYPE } from "@/design/tokens";
export function ScreenHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: SP.xl }}>
      <div style={{ display: "flex", alignItems: "center", gap: SP.md }}>
        {icon && <img src={icon} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />}
        <div style={{ ...TYPE.screenTitle, color: C.text }}>{title}</div>
      </div>
      {subtitle && <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, marginTop: 3, marginLeft: icon ? 38 : 0 }}>{subtitle}</div>}
    </div>
  );
}

export function SectionHeader({ children }) {
  return <div style={{ ...TYPE.sectionLabel, color: C.textFaint, marginBottom: SP.sm }}>{children}</div>;
}
