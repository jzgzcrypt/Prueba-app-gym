"use client";

import { useState } from "react";
import { C, CAT, GRUPO_COLOR, R, SP, TYPE } from "@/design/tokens";
import { GRUPO_ENFOQUE } from "@/domain/fuerza/enfoque";
import { parseSeries } from "@/domain/fuerza/series";
import { WEEKS } from "@/domain/plan/bloque-1-base-7k";
export function KpiBlock({ title, isOpen, onToggle, weeks, checked, workoutWeights, ritmoReal, isAcumulado, currentWeekN, noCollapse }) {
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const gruposPlan = {};
  const gruposHecho = {};
  let runPlanificadas = 0, runHechas = 0;
  let calidadPlanificadas = 0, calidadHechas = 0;
  let ritmosRegistrados = [];

  weeks.forEach(wk => {
    wk.days.forEach((day, di) => {
      const dayKey = wk.n + "-" + di;
      if (day.tipo === "fuerza") {
        day.ejercicios.forEach((ej, ei) => {
          const s = parseSeries(ej.series);
          gruposPlan[ej.grupo] = (gruposPlan[ej.grupo] || 0) + s;
          const dw = workoutWeights[dayKey];
          const done = dw && dw[ei] ? Object.keys(dw[ei]).length : (checked[dayKey] ? s : 0);
          gruposHecho[ej.grupo] = (gruposHecho[ej.grupo] || 0) + Math.min(done, s);
        });
      }
      if (day.tipo === "run" || day.tipo === "test" || day.tipo === "objetivo") {
        runPlanificadas++;
        if (checked[dayKey]) runHechas++;
        if (day.esCalidad || day.tipo === "test" || day.tipo === "objetivo") {
          calidadPlanificadas++;
          if (checked[dayKey]) calidadHechas++;
        }
        if (ritmoReal[dayKey]) ritmosRegistrados.push({ fecha: day.date, ritmo: ritmoReal[dayKey] });
      }
    });
  });

  const gruposList = Object.keys(gruposPlan).sort();

  // Objetivo total del plan completo (las 11 semanas, no solo hasta hoy)
  let objetivoGruposPlan = {};
  let objetivoRunTotal = 0, objetivoCalidadTotal = 0;
  if (isAcumulado) {
    WEEKS.forEach(wk => {
      wk.days.forEach(day => {
        if (day.tipo === "fuerza") {
          day.ejercicios.forEach(ej => {
            objetivoGruposPlan[ej.grupo] = (objetivoGruposPlan[ej.grupo] || 0) + parseSeries(ej.series);
          });
        }
        if (day.tipo === "run" || day.tipo === "test" || day.tipo === "objetivo") {
          objetivoRunTotal++;
          if (day.esCalidad || day.tipo === "test" || day.tipo === "objetivo") objetivoCalidadTotal++;
        }
      });
    });
  }

  // Progresion semanal de volumen de fuerza: planificado vs real, por semana
  let volumenSemanal = [];
  let volumenSemanalPorGrupo = {}; // { grupo: [{semana, plan, hecho}] }
  if (isAcumulado) {
    WEEKS.forEach(wk => {
      let planWk = 0, hechoWk = 0;
      const planWkGrupo = {}, hechoWkGrupo = {};
      wk.days.forEach((day, di) => {
        if (day.tipo !== "fuerza") return;
        const dayKey = wk.n + "-" + di;
        day.ejercicios.forEach((ej, ei) => {
          const s = parseSeries(ej.series);
          planWk += s;
          planWkGrupo[ej.grupo] = (planWkGrupo[ej.grupo] || 0) + s;
          if (wk.n <= currentWeekN) {
            const dw = workoutWeights[dayKey];
            const done = dw && dw[ei] ? Object.keys(dw[ei]).length : (checked[dayKey] ? s : 0);
            const doneClamped = Math.min(done, s);
            hechoWk += doneClamped;
            hechoWkGrupo[ej.grupo] = (hechoWkGrupo[ej.grupo] || 0) + doneClamped;
          }
        });
      });
      volumenSemanal.push({ semana: wk.n, plan: planWk, hecho: hechoWk });
      Object.keys(planWkGrupo).forEach(g => {
        if (!volumenSemanalPorGrupo[g]) volumenSemanalPorGrupo[g] = [];
        volumenSemanalPorGrupo[g].push({ semana: wk.n, plan: planWkGrupo[g] || 0, hecho: hechoWkGrupo[g] || 0 });
      });
    });
  }

  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, overflow: "hidden", marginTop: 4 }}>
      {noCollapse ? (
        <div style={{ padding: "13px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 0.3 }}>{title}</span>
        </div>
      ) : (
        <div onClick={onToggle} className="block" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", cursor: "pointer" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: 0.3 }}>{title}</span>
          <span style={{ fontSize: 13, color: "#C7C7C4", transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>&rsaquo;</span>
        </div>
      )}
      {(isOpen || noCollapse) && (
        <div style={{ padding: "0 14px 16px", borderTop: "1px solid " + C.cardBorder, paddingTop: 12 }}>

          {isAcumulado && (
            <div style={{ background: "#F2F2F0", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 6 }}>OBJETIVO TOTAL DEL PLAN (11 SEMANAS)</div>
              <div style={{ display: "flex", gap: 14 }}>
                <div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{objetivoRunTotal}</div>
                  <div style={{ fontSize: 9.5, color: "#8A8A87" }}>sesiones running</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{objetivoCalidadTotal}</div>
                  <div style={{ fontSize: 9.5, color: "#8A8A87" }}>calidad/test</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                    {Object.values(objetivoGruposPlan).reduce((a,b) => a+b, 0)}
                  </div>
                  <div style={{ fontSize: 9.5, color: "#8A8A87" }}>series fuerza</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, fontWeight: 800, color: CAT.running, letterSpacing: 0.8, marginBottom: 8 }}>RUNNING</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <KpiStat label="SESIONES" val={runHechas} total={runPlanificadas} color={CAT.running} />
            <KpiStat label="CALIDAD/TEST" val={calidadHechas} total={calidadPlanificadas} color={CAT.running} />
          </div>
          {ritmosRegistrados.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#8A8A87", marginBottom: 4 }}>RITMOS REGISTRADOS</div>
              {ritmosRegistrados.slice(-4).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#4A4A47", padding: "3px 0" }}>
                  <span>{r.fecha}</span><span style={{ fontWeight: 700, color: C.text }}>{r.ritmo}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 10, fontWeight: 800, color: CAT.fuerza, letterSpacing: 0.8, marginBottom: 8 }}>FUERZA — VOLUMEN POR GRUPO{isAcumulado ? " (HASTA HOY)" : ""}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: isAcumulado ? 16 : 0 }}>
            {gruposList.map(g => {
              const plan = gruposPlan[g] || 0;
              const hecho = Math.min(gruposHecho[g] || 0, plan);
              const pct = plan > 0 ? Math.round((hecho / plan) * 100) : 0;
              const gc = GRUPO_COLOR[g] || CAT.fuerza;
              const isSelected = selectedGrupo === g;
              return (
                <div key={g} onClick={() => isAcumulado && setSelectedGrupo(isSelected ? null : g)}
                  style={{ cursor: isAcumulado ? "pointer" : "default", padding: isAcumulado ? "6px 8px" : 0, margin: isAcumulado ? "0 -8px" : 0, borderRadius: 8, background: isSelected ? gc + "12" : "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: isSelected ? gc : C.text }}>{g}{isAcumulado ? " ›" : ""}</span>
                    <span className="mono" style={{ fontSize: 11.5, color: "#787774", fontWeight: 700 }}>{hecho}/{plan}</span>
                  </div>
                  <div style={{ height: 5, background: "#EDEDEB", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: gc, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
            {gruposList.length === 0 && (
              <div style={{ fontSize: 12, color: "#8A8A87" }}>Sin sesiones de fuerza en este rango.</div>
            )}
          </div>

          {isAcumulado && selectedGrupo && (
            <div style={{ marginBottom: 16, padding: "12px 14px", background: (GRUPO_COLOR[selectedGrupo] || CAT.fuerza) + "10", borderRadius: 10, border: "1px solid " + (GRUPO_COLOR[selectedGrupo] || CAT.fuerza) + "30" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GRUPO_COLOR[selectedGrupo] || CAT.fuerza, letterSpacing: 0.5, marginBottom: 5 }}>ENFOQUE — {selectedGrupo.toUpperCase()}</div>
              <div style={{ fontSize: 12.5, color: "#4A4A47", lineHeight: 1.5, marginBottom: 12 }}>{GRUPO_ENFOQUE[selectedGrupo] || "Sin descripción."}</div>
              <VolumeBarChart data={volumenSemanalPorGrupo[selectedGrupo] || []} currentWeekN={currentWeekN} color={GRUPO_COLOR[selectedGrupo] || CAT.fuerza} showNumbers />
            </div>
          )}

          {isAcumulado && !selectedGrupo && volumenSemanal.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: CAT.fuerza, letterSpacing: 0.8, marginBottom: 8 }}>PROGRESIÓN DE VOLUMEN SEMANAL (TOTAL)</div>
              <VolumeBarChart data={volumenSemanal} currentWeekN={currentWeekN} color={CAT.fuerza} showNumbers />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: CAT.fuerza }} />
                  <span style={{ fontSize: 10, color: "#787774" }}>Hecho</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: "#D4D4D1" }} />
                  <span style={{ fontSize: 10, color: "#787774" }}>Planificado</span>
                </div>
              </div>
              <div style={{ fontSize: 10.5, color: "#8A8A87", marginTop: 8, fontStyle: "italic" }}>Toca cualquier grupo arriba para ver su curva individual y el enfoque de entrenamiento.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VolumeBarChart({ data, currentWeekN, color, showNumbers }) {
  const barColor = color || CAT.fuerza;
  const maxVal = Math.max(...data.map(d => d.plan), 1);
  return (
    <div>
      <svg width="100%" viewBox="0 0 320 105" style={{ display: "block" }}>
        {data.map((d, i) => {
          const x = i * (320 / data.length) + 2;
          const w = (320 / data.length) - 4;
          const planH = (d.plan / maxVal) * 68;
          const hechoH = (d.hecho / maxVal) * 68;
          const isFuture = d.semana > currentWeekN;
          return (
            <g key={i}>
              {showNumbers && d.plan > 0 && (
                <text x={x + w/2} y={78 - planH - 3} fontSize="6" fill="#A8A8A5" textAnchor="middle" fontFamily="monospace">{d.plan}</text>
              )}
              <rect x={x} y={78 - planH} width={w} height={planH} fill="#E5E5E3" rx="1.5" />
              {!isFuture && (
                <rect x={x} y={78 - hechoH} width={w} height={hechoH} fill={barColor} rx="1.5" />
              )}
              <text x={x + w/2} y={92} fontSize="6.5" fill="#8A8A87" textAnchor="middle">S{d.semana}</text>
              {isFuture && <text x={x + w/2} y={100} fontSize="5.5" fill="#C7C7C4" textAnchor="middle">futuro</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function KpiStat({ label, val, total, color }) {
  const ok = val >= total;
  return (
    <div style={{ flex: 1, border: "1px solid " + C.cardBorder, borderRadius: R.md, padding: SP.md + "px" }}>
      <div style={{ ...TYPE.micro, fontSize: 9, color: C.textDim, marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: ok ? C.ok : color, fontVariantNumeric: "tabular-nums" }}>
        {val}<span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>/{total}</span>
      </div>
    </div>
  );
}
