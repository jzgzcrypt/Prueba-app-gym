"use client";

import { useState } from "react";
import { A, C, TAP_MIN, TYPE } from "@/design/tokens";
import { Boton, Check, Chevron, IconoCaja, Tarjeta } from "@/features/ui/aire";
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

  const tituloLargo = (day) => day.titulo;
  const iconoDe = (day) => day.tipo === "fuerza" ? ["mancuerna", "azul"] : day.tipo === "compromiso" ? ["tenis", "verde"]
    : day.tipo === "libre" ? ["reloj", "gris"] : day.tipo === "test" || day.tipo === "objetivo" ? ["meta", "naranja"] : ["correr", "rojo"];

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.textDim }}>{week.dates} · {String(week.fase || "").charAt(0) + String(week.fase || "").slice(1).toLowerCase()}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>Semana {week.n}</div>
        <button className="btn" onClick={() => { setPauseMode(!pauseMode); setPauseSelection([]); }} style={{
          fontSize: 15, fontWeight: 600, color: A.azul, minHeight: TAP_MIN, marginBottom: 2,
        }}>{pauseMode ? "Cancelar" : "Pausa"}</button>
      </div>

      {pauseMode && (
        <Tarjeta style={{ padding: "12px 14px", marginTop: 8 }}>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 10, lineHeight: 1.4 }}>Toca los días de viaje o imprevisto. Luego confirma.</div>
          <Boton tipo={pauseSelection.length > 0 ? "oscuro" : "suave"} onClick={confirmPause} disabled={pauseSelection.length === 0}>
            Confirmar pausa ({pauseSelection.length} días)
          </Boton>
        </Tarjeta>
      )}

      <div style={{ display: "flex", background: "#E4E4E9", borderRadius: 10, padding: 2, marginTop: 12, overflowX: "auto" }}>
        {WEEKS.map((w, i) => (
          <button key={w.n} className="btn" onClick={() => setWeekIdx(i)} style={{
            flex: "1 0 auto", minWidth: 42, minHeight: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: weekIdx === i ? "#fff" : "transparent", color: weekIdx === i ? C.text : "#3A3A3C",
            boxShadow: weekIdx === i ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>S{w.n}</button>
        ))}
      </div>

      <Tarjeta data-dias style={{ marginTop: 14, overflow: "hidden" }}>
        {week.days.map((day, i) => {
          const key = claveDia(day);
          const done = !!checked[key];
          const isT = DATE_MAP[day.date] === todayIso;
          const paused = isPaused(key);
          const selected = pauseSelection.includes(key);
          const comida = day.tipo !== "libre" ? comidaDelDia(day) : null;
          const [ico, tono] = iconoDe(day);
          return (
            <button key={i} className="btn" onClick={() => pauseMode ? toggleDaySelection(key) : jumpToDay(weekIdx, i)} style={{
              width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", minHeight: 64,
              borderTop: i ? "1px solid " + C.divider : "none", background: selected ? A.fondo.azul : isT ? "#F0F6FF" : "transparent",
              opacity: paused ? 0.5 : 1 }}>
              <div style={{ width: 34, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{day.dow.slice(0, 3)}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: isT ? A.azul : C.text }}>{String(day.date).split(" ")[0]}</div>
              </div>
              <IconoCaja nombre={ico} tono={tono} tam={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: done || paused ? C.textDim : C.text, textDecoration: paused ? "line-through" : "none",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tituloLargo(day)}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1, color: comida && comida.id === "comer" ? C.ok : C.textDim }}>
                  {isT ? "Hoy · " : ""}{paused ? "Pausa" : comida ? (comida.id === "comer" ? "Comer" : "Recortar") : "Descanso"}
                  {day.tipo === "fuerza" && !paused ? <span style={{ color: C.textDim, fontWeight: 500 }}> · {day.ejercicios.length} ejercicios · {day.dur}</span> : null}
                </div>
              </div>
              {pauseMode ? <Check hecho={selected} color={A.azul} /> : day.tipo === "libre" ? <Chevron /> : <Check hecho={done} />}
            </button>
          );
        })}
      </Tarjeta>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <KpiBlock title={"Resumen de la semana " + week.n} isOpen={kpiOpen === "semana"}
          onToggle={() => setKpiOpen(kpiOpen === "semana" ? null : "semana")}
          weeks={[week]} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal} />

        <KpiBlock title="Acumulado del plan" isOpen={kpiOpen === "total"}
          onToggle={() => setKpiOpen(kpiOpen === "total" ? null : "total")}
          weeks={WEEKS.filter(w => w.n <= week.n)} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal}
          isAcumulado currentWeekN={week.n} />
      </div>
    </div>
  );
}
