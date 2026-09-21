"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { DATE_MAP, WEEKS, claveDia } from "@/domain/plan/calendario";
import { comidaDelDia } from "@/domain/nutricion/dias";
import { KpiBlock } from "@/features/semana/KpiBlock";
export function SemanaScreen({ weekIdx, setWeekIdx, jumpToDay, checked, todayIso, workoutWeights, ritmoReal, pausedRanges, setPausedRanges }) {
  const week = WEEKS[weekIdx];
  const [kpiOpen, setKpiOpen] = useState(null);
  const [pauseMode, setPauseMode] = useState(false);
  const [pauseSelection, setPauseSelection] = useState([]);

  const isPaused = (dayKey) => pausedRanges.some(r => r.days.includes(dayKey));

  const toggleDaySelection = (dayKey) => {
    setPauseSelection(prev => prev.includes(dayKey) ? prev.filter(k => k !== dayKey) : [...prev, dayKey]);
  };

  const confirmPause = () => {
    if (pauseSelection.length === 0) { setPauseMode(false); return; }
    setPausedRanges(prev => [...prev, { days: pauseSelection, label: "Pausa · " + pauseSelection.length + " días" }]);
    setPauseSelection([]);
    setPauseMode(false);
  };

  return (
    <div>
      <div style={{ padding: SP.xl + "px " + SP.lg + "px " + SP.md + "px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ ...TYPE.screenTitle, color: C.text }}>SEMANA {week.n}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, fontWeight: 600 }}>{week.fase} · {week.dates}</div>
        </div>
        <button className="btn" onClick={() => { setPauseMode(!pauseMode); setPauseSelection([]); }} style={{
          fontSize: 11, fontWeight: 700, color: pauseMode ? "#FAFAF9" : C.textDim, background: pauseMode ? C.accent : C.surfaceMuted,
          padding: "8px 12px", borderRadius: R.md, minHeight: 36,
        }}>{pauseMode ? "CANCELAR" : "MARCAR PAUSA"}</button>
      </div>

      {pauseMode && (
        <div style={{ padding: "0 " + SP.lg + "px " + SP.md + "px" }}>
          <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: SP.sm, lineHeight: 1.4 }}>Toca los días de viaje o imprevisto. Luego confirma.</div>
          <button className="btn" onClick={confirmPause} disabled={pauseSelection.length === 0} style={{
            width: "100%", padding: SP.sm + 2 + "px", borderRadius: R.md,
            background: pauseSelection.length > 0 ? C.accent : C.surfaceMuted,
            color: pauseSelection.length > 0 ? "#FAFAF9" : C.textFaint, fontSize: 12.5, fontWeight: 800,
          }}>CONFIRMAR PAUSA ({pauseSelection.length} días)</button>
        </div>
      )}

      <div style={{ display: "flex", gap: SP.xs + 2, padding: "0 " + SP.lg + "px " + SP.lg + "px", overflowX: "auto" }}>
        {WEEKS.map((w,i) => (
          <button key={w.n} className="btn" onClick={() => setWeekIdx(i)} style={{
            flexShrink: 0, minWidth: 40, height: 36, padding: "0 " + SP.md + "px", borderRadius: R.md,
            background: weekIdx===i ? C.accent : C.surfaceMuted, color: weekIdx===i ? "#FAFAF9" : C.textDim,
            fontSize: 13, fontWeight: 800,
          }}>S{w.n}</button>
        ))}
      </div>
      <div style={{ padding: "0 " + SP.lg + "px", display: "flex", flexDirection: "column", gap: SP.sm }}>
        {week.days.map((day, i) => {
          const key = claveDia(day);
          const done = checked[key];
          const isT = DATE_MAP[day.date] === todayIso;
          const isFuerza = day.tipo === "fuerza";
          const paused = isPaused(key);
          const selected = pauseSelection.includes(key);
          return (
            <div key={i} onClick={() => pauseMode ? toggleDaySelection(key) : jumpToDay(weekIdx, i)} className="block" style={{
              background: selected ? "#F2F2F0" : paused ? "#F4F4F2" : isT ? "#FDF6E3" : C.card,
              border: "1px solid " + (selected ? C.accent : paused ? "#D4D4D1" : isT ? "#E8D9A8" : C.cardBorder),
              borderRadius: R.lg, padding: SP.md + "px " + SP.md + "px", minHeight: TAP_MIN, cursor: "pointer",
              opacity: paused ? 0.55 : done ? 0.5 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ ...TYPE.micro, fontSize: 10, color: C.textDim }}>
                    {day.dow.toUpperCase()} {day.date} {isT && "· HOY"} {paused && "· PAUSA"}
                    {day.tipo !== "libre" && (
                      <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3,
                                     color: comidaDelDia(day).id === "comer" ? CAT.fuerza : C.textFaint }}>
                        · {comidaDelDia(day).etiqueta}
                      </span>
                    )}
                  </div>
                  <div style={{ ...TYPE.cardTitle, fontSize: 14, color: paused ? C.textDim : C.text, marginTop: 3, textDecoration: paused ? "line-through" : "none" }}>{day.titulo}</div>
                  {isFuerza && !paused && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{day.ejercicios.length} ejercicios · {day.dur}</div>}
                </div>
                <span style={{ fontSize: 16, color: selected ? C.accent : done ? C.ok : C.textFaint, flexShrink: 0, marginLeft: SP.sm }}>
                  {pauseMode ? (selected ? "✓" : "○") : done ? "✓" : "›"}
                </span>
              </div>
            </div>
          );
        })}

        <KpiBlock title={"RESUMEN SEMANA " + week.n} isOpen={kpiOpen === "semana"}
          onToggle={() => setKpiOpen(kpiOpen === "semana" ? null : "semana")}
          weeks={[week]} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal} />

        <KpiBlock title="ACUMULADO DEL PLAN" isOpen={kpiOpen === "total"}
          onToggle={() => setKpiOpen(kpiOpen === "total" ? null : "total")}
          weeks={WEEKS.filter(w => w.n <= week.n)} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal}
          isAcumulado currentWeekN={week.n} />

      </div>
    </div>
  );
}
