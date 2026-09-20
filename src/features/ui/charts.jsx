"use client";

import { useState } from "react";
import { C, CAT, R } from "@/design/tokens";
export function SimpleLineChart({ data, label, unit, color, onAddData }) {
  if (data.length === 0) {
    return (
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "#8A8A87", marginBottom: onAddData ? 10 : 0 }}>
          Aún no hay registros de {label.toLowerCase()}.
        </div>
        {onAddData && (
          <button className="btn" onClick={onAddData} style={{
            fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: color || C.accent,
            padding: "8px 16px", borderRadius: R.md,
          }}>+ AÑADIR EL PRIMERO</button>
        )}
      </div>
    );
  }
  if (data.length === 1) {
    return (
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "#8A8A87" }}>
          Primer dato de {label.toLowerCase()} registrado ({data[0].v}{unit}). Añade otro para ver la evolución.
        </div>
      </div>
    );
  }
  const values = data.map(d => d.v);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const W = 320, H = 100, PAD = 10;
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.v - min) / range) * (H - PAD * 2);
    return x + "," + y;
  }).join(" ");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: color }}>{values[values.length-1]}{unit}</span>
      </div>
      <svg width="100%" viewBox={"0 0 " + W + " " + H} style={{ display: "block" }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
          const y = H - PAD - ((d.v - min) / range) * (H - PAD * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8A8A87", marginTop: 2 }}>
        <span>{data[0].fecha}</span>
        <span>{data[data.length-1].fecha}</span>
      </div>
    </div>
  );
}

export function QuickFieldInput({ fieldKey, onSave, onBack }) {
  const [value, setValue] = useState("");
  const meta = {
    peso: { label: "Peso", unit: "kg", color: "#171717" },
    cintura: { label: "Cintura", unit: "cm", color: "#3A6EA5" },
    cadera: { label: "Cadera", unit: "cm", color: "#946800" },
    hombro: { label: "Hombro (test manos espalda)", unit: "cm", color: CAT.cuello },
    cadenaPosterior: { label: "Tocar suelo (distancia dedos-suelo)", unit: "cm", color: "#3A6EA5" },
    columna: { label: "Puente (nivel alcanzado: 1 glúteo, 2 manos, 3 completo)", unit: "nivel", color: "#6B4C8A" },
    caderaMov: { label: "ATG/Cossack (nivel: 1 parcial, 2 pausa, 3 con carga)", unit: "nivel", color: CAT.movilidad },
  }[fieldKey];

  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "20px 18px", marginBottom: 12, textAlign: "center" }}>
      <button className="btn" onClick={onBack} style={{ fontSize: 11.5, color: "#787774", fontWeight: 700, marginBottom: 14, display: "block" }}>&lsaquo; Elegir otro dato</button>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{meta.label}</div>
      <div style={{ fontSize: 11, color: "#8A8A87", marginBottom: 16 }}>Hoy · {new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        <input
          value={value} onChange={e => setValue(e.target.value)}
          type="number" inputMode="decimal" autoFocus placeholder="0"
          style={{
            width: 120, fontSize: 40, fontWeight: 800, textAlign: "center", padding: "8px 4px",
            borderRadius: 12, border: "2px solid " + meta.color, color: "#171717", outline: "none",
          }}
        />
        <span style={{ fontSize: 18, color: "#8A8A87", fontWeight: 700 }}>{meta.unit}</span>
      </div>
      <button className="btn" onClick={() => onSave(fieldKey, value)} disabled={!value} style={{
        width: "100%", padding: "14px", borderRadius: 12, background: value ? meta.color : "#EDEDEB",
        color: value ? "#FAFAF9" : "#A8A8A5", fontWeight: 800, fontSize: 14,
      }}>GUARDAR</button>
    </div>
  );
}
