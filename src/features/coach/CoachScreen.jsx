"use client";

import { useState } from "react";
import { C, CAT, R, SP, TYPE } from "@/design/tokens";
import { WEEKS } from "@/domain/plan/bloque-1-base-7k";
import { DATE_MAP, FLAT_DAYS, todayLocalIso } from "@/domain/plan/calendario";
import { RITMO_ESPERADO, parseRitmoToSeconds } from "@/domain/running/ritmo";
import { MOVILIDAD } from "@/domain/salud/movilidad";
import { HitosContent, PaceComparisonChart, PhaseAdjustContent, PlanGlobalContent, WeeklyLogContent } from "@/features/coach/paneles";
import { KpiBlock } from "@/features/semana/KpiBlock";
import { SimpleLineChart } from "@/features/ui/charts";
export function CoachScreen({ jumpToDay, setWeekIdx, checked, workoutWeights, ritmoReal, setScreen, weeklyLog, setWeeklyLog, phaseAdjustNote, setPhaseAdjustNote, currentWeekOverride, setCurrentWeekOverride, exportData, importData, painLog, medidas, bloquesHistorial, setBloquesHistorial, storageStatus, cuelloChecks, magiaLog, guerreroLog }) {
  const [subTab, setSubTab] = useState("resumen");
  const todayIso = todayLocalIso();
  let currentWeekN = WEEKS[0].n;
  for (const wk of WEEKS) {
    for (const d of wk.days) {
      if (DATE_MAP[d.date] <= todayIso) currentWeekN = wk.n;
    }
  }
  if (currentWeekOverride != null) currentWeekN = currentWeekOverride;

  // Adherencia global: todos los dias del plan hasta hoy, cualquier tipo de sesion
  let totalDiasPlan = 0, totalDiasHechos = 0;
  WEEKS.filter(w => w.n <= currentWeekN).forEach(wk => {
    wk.days.forEach((day, di) => {
      if (day.tipo === "libre") return; // dias de descanso no cuentan como tarea
      totalDiasPlan++;
      const dayKey = wk.n + "-" + di;
      if (checked[dayKey]) totalDiasHechos++;
    });
  });
  const adherenciaPct = totalDiasPlan > 0 ? Math.round((totalDiasHechos / totalDiasPlan) * 100) : 0;

  // Ultima actividad completada (cualquier tipo), y dias transcurridos desde entonces
  const pastDaysWithActivity = FLAT_DAYS.filter(d => d.tipo !== "libre" && d.isoDate <= todayIso);
  let lastActivityDate = null;
  for (let i = pastDaysWithActivity.length - 1; i >= 0; i--) {
    const d = pastDaysWithActivity[i];
    if (checked[d.weekN + "-" + d.dayIdx]) { lastActivityDate = d.isoDate; break; }
  }
  const daysSinceLastActivity = lastActivityDate ? Math.round((new Date(todayIso) - new Date(lastActivityDate)) / (1000*60*60*24)) : null;

  // Adherencia por habito individual (Cuello, Magia, Guerrero) — dias transcurridos del plan hasta hoy
  const pastDays = FLAT_DAYS.filter(d => d.isoDate <= todayIso);
  const totalPastDays = pastDays.length;
  let cuelloDiasCompletos = 0, magiaDiasCompletos = 0, guerreroDiasCompletos = 0;
  pastDays.forEach(d => {
    const dk = d.weekN + "-" + d.dayIdx;
    const cM = !!(cuelloChecks || {})[dk + "-m"], cT = !!(cuelloChecks || {})[dk + "-t"], cN = !!(cuelloChecks || {})[dk + "-n"];
    if (cM && cT && cN) cuelloDiasCompletos++;
    if ((magiaLog || {})[dk]) magiaDiasCompletos++;
    if ((guerreroLog || {})[dk]) guerreroDiasCompletos++;
  });
  const habitosAdherencia = [
    { nombre: "Cuello", pct: totalPastDays > 0 ? Math.round((cuelloDiasCompletos / totalPastDays) * 100) : 0, color: CAT.cuello },
    { nombre: "Movilidad", pct: totalPastDays > 0 ? Math.round((totalDiasHechos / totalDiasPlan) * 100) : 0, color: "#8A5A2F" }, // vive dentro del entreno, usa la adherencia general como proxy
    { nombre: "Magia", pct: totalPastDays > 0 ? Math.round((magiaDiasCompletos / totalPastDays) * 100) : 0, color: "#6B4C8A" },
    { nombre: "Guerrero", pct: totalPastDays > 0 ? Math.round((guerreroDiasCompletos / totalPastDays) * 100) : 0, color: "#3A3A38" },
  ];

  // Movilidad: evolucion del test de hombro, sacado directamente de medidas
  const hombroData = (medidas || []).filter(m => m.hombro != null).map(m => ({ fecha: m.fecha, v: m.hombro }));
  const cadenaPosteriorData = (medidas || []).filter(m => m.cadenaPosterior != null).map(m => ({ fecha: m.fecha, v: m.cadenaPosterior }));
  const columnaData = (medidas || []).filter(m => m.columna != null).map(m => ({ fecha: m.fecha, v: m.columna }));
  const caderaMovData = (medidas || []).filter(m => m.caderaMov != null).map(m => ({ fecha: m.fecha, v: m.caderaMov }));

  // Curva de ritmo: esperado vs real, semanas con dato esperado
  const ritmoComparativa = [];
  Object.keys(RITMO_ESPERADO).map(Number).sort((a,b) => a-b).forEach(wn => {
    const wk = WEEKS.find(w => w.n === wn);
    if (!wk) return;
    let realSec = null, realStr = null;
    wk.days.forEach((day, di) => {
      if (!(day.esCalidad || day.tipo === "test" || day.tipo === "objetivo")) return;
      const dayKey = wn + "-" + di;
      const r = ritmoReal[dayKey];
      if (r) {
        const sec = parseRitmoToSeconds(r);
        if (sec) { realSec = sec; realStr = r; }
      }
    });
    ritmoComparativa.push({ semana: wn, esperado: RITMO_ESPERADO[wn], real: realSec, realStr, isFuture: wn > currentWeekN });
  });

  // Alerta: ultima semana con dato real, si esta mas de 10s/km por encima de lo esperado
  const ultimoConDato = [...ritmoComparativa].reverse().find(r => r.real != null);
  const alertaRitmo = ultimoConDato && (ultimoConDato.real - ultimoConDato.esperado > 10);

  // Deteccion de 2+ dias de calidad/test fallados seguidos (entre los ya pasados)
  const qualityDaysPast = FLAT_DAYS.filter(d => (d.esCalidad || d.tipo === "test" || d.tipo === "objetivo") && d.isoDate <= todayIso);
  let missedStreak = 0;
  for (let i = qualityDaysPast.length - 1; i >= 0; i--) {
    const d = qualityDaysPast[i];
    const dk = d.weekN + "-" + d.dayIdx;
    if (checked[dk]) break;
    missedStreak++;
  }
  const sugerenciaAjuste = missedStreak >= 2
    ? "Llevas " + missedStreak + " sesiones de calidad seguidas sin completar. Sugerencia: la próxima, baja el ritmo objetivo un escalón (repite el de la semana anterior) en vez de forzar el de esta semana — es mejor completar a un ritmo conservador que fallar otra vez a uno exigente."
    : null;

  // Resumen de molestias — ultimos 14 dias con dato, por zona
  const painDays = FLAT_DAYS.filter(d => d.isoDate <= todayIso).slice(-14);
  const painZonas = ["cuello", "hombro", "rodilla"];
  const painSummary = {}; // { zona: { avg, max, count } }
  painZonas.forEach(zona => {
    const vals = painDays.map(d => {
      const dk = d.weekN + "-" + d.dayIdx;
      return painLog[dk] ? painLog[dk][zona] : null;
    }).filter(v => v != null);
    if (vals.length > 0) {
      painSummary[zona] = { avg: vals.reduce((a,b)=>a+b,0) / vals.length, max: Math.max(...vals), count: vals.length };
    }
  });
  const painZonasConDatos = Object.keys(painSummary);
  const zonaPreocupante = painZonasConDatos.find(z => painSummary[z].avg >= 3);

  return (
    <div>
      <div style={{ padding: SP.xl + "px " + SP.lg + "px 4px" }}>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>COACH</div>
        <div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600, marginTop: 2 }}>Vista de programa · progreso del atleta</div>
      </div>

      <div style={{ display: "flex", gap: SP.xs, padding: SP.md + "px " + SP.lg + "px 14px", overflowX: "auto" }}>
        {[["resumen","RESUMEN"],["plan","PLAN"],["hitos","HITOS"],["bitacora","BITÁCORA"],["ajustes","AJUSTES"]].map(([key, label]) => (
          <button key={key} className="btn" onClick={() => setSubTab(key)} style={{
            flexShrink: 0, minWidth: 68, height: 38, padding: "0 10px", borderRadius: R.md, fontSize: 10.5, fontWeight: 800,
            background: subTab === key ? C.accent : C.surfaceMuted, color: subTab === key ? "#FAFAF9" : C.textDim,
          }}>{label}</button>
        ))}
      </div>

      {subTab === "resumen" && (
        <div style={{ padding: "0 " + SP.lg + "px 30px", display: "flex", flexDirection: "column", gap: SP.md }}>

          {/* ADHERENCIA GLOBAL */}
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px " + SP.xl + "px" }}>
            <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim, marginBottom: SP.md }}>ADHERENCIA GLOBAL — HASTA SEMANA {currentWeekN}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: SP.sm, marginBottom: SP.sm }}>
              <span className="mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5, color: adherenciaPct >= 80 ? C.ok : adherenciaPct >= 60 ? C.amber : CAT.running }}>{adherenciaPct}%</span>
              <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600 }}>{totalDiasHechos}/{totalDiasPlan} días completados</span>
            </div>
            <div style={{ height: 7, background: C.divider, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: adherenciaPct + "%", height: "100%", background: adherenciaPct >= 80 ? C.ok : adherenciaPct >= 60 ? C.amber : CAT.running, borderRadius: 4, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: 10.5, color: C.textDim, marginTop: SP.sm, lineHeight: 1.4 }}>Incluye running, fuerza, cuello y movilidad. No cuenta días de descanso.</div>
            {daysSinceLastActivity != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: SP.md, paddingTop: SP.md, borderTop: "1px solid " + C.divider }}>
                <span style={{ fontSize: 11, color: daysSinceLastActivity >= 3 ? CAT.running : C.textDim, fontWeight: 700 }}>
                  {daysSinceLastActivity === 0 ? "Última actividad: hoy" : daysSinceLastActivity === 1 ? "Última actividad: ayer" : "Última actividad: hace " + daysSinceLastActivity + " días"}
                </span>
              </div>
            )}
          </div>

          {/* ADHERENCIA POR HÁBITO */}
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px " + SP.xl + "px" }}>
            <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim, marginBottom: SP.md }}>ADHERENCIA POR HÁBITO — DESDE EL INICIO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: SP.sm + 2 }}>
              {habitosAdherencia.map(h => (
                <div key={h.nombre}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{h.nombre}</span>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 800, color: h.pct >= 80 ? C.ok : h.pct >= 50 ? C.amber : h.color }}>{h.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: C.divider, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: h.pct + "%", height: "100%", background: h.color, borderRadius: 3, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: C.textDim, marginTop: SP.md, lineHeight: 1.4 }}>Movilidad se registra dentro del entreno, así que usa la adherencia general como referencia.</div>
          </div>

          {/* MOLESTIAS — resumen ultimos 14 dias */}
          {painZonasConDatos.length > 0 && (
            <div style={{ background: zonaPreocupante ? "#FBF0EF" : C.card, border: "1px solid " + (zonaPreocupante ? "#E8C9C6" : C.cardBorder), borderRadius: R.xl, padding: SP.lg + "px " + SP.xl + "px" }}>
              <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim, marginBottom: SP.md }}>MOLESTIAS — ÚLTIMOS 14 DÍAS</div>
              <div style={{ display: "flex", gap: SP.sm }}>
                {["cuello","hombro","rodilla"].map(zona => {
                  const s = painSummary[zona];
                  const label = zona.charAt(0).toUpperCase() + zona.slice(1);
                  return (
                    <div key={zona} style={{ flex: 1, textAlign: "center" }}>
                      {s ? (
                        <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: s.avg >= 3 ? CAT.running : s.avg >= 2 ? C.amber : C.ok }}>{s.avg.toFixed(1)}</div>
                      ) : (
                        <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: C.textFaint }}>—</div>
                      )}
                      <div style={{ fontSize: 10, color: C.textDim, fontWeight: 700, marginTop: 2 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
              {zonaPreocupante && (
                <div style={{ fontSize: 11, color: "#787774", marginTop: SP.md, lineHeight: 1.4 }}>
                  {zonaPreocupante.charAt(0).toUpperCase() + zonaPreocupante.slice(1)} con molestia media alta ({painSummary[zonaPreocupante].avg.toFixed(1)}/5) en los últimos 14 días. Si persiste, considera hablarlo con tu fisio.
                </div>
              )}
            </div>
          )}

          {/* SUGERENCIA DE AJUSTE - dias de calidad fallados */}
          {sugerenciaAjuste && (
            <div style={{ background: "#FDF6E3", border: "1px solid #E8D9A8", borderRadius: 14, padding: "13px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#171717" }}>Sugerencia de ajuste</div>
              <div style={{ fontSize: 11.5, color: "#787774", marginTop: 3, lineHeight: 1.4, marginBottom: 8 }}>{sugerenciaAjuste}</div>
              <button className="btn" onClick={() => setScreen("hoy")} style={{ fontSize: 11.5, fontWeight: 800, color: C.accent, textDecoration: "underline" }}>Ir a la sesión de hoy</button>
            </div>
          )}

          {/* ALERTA DE RITMO */}
          {alertaRitmo && (
            <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 14, padding: "13px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#171717" }}>El ritmo real se aleja del objetivo</div>
              <div style={{ fontSize: 11.5, color: "#787774", marginTop: 3, lineHeight: 1.4, marginBottom: 8 }}>
                Última sesión de calidad registrada: {ultimoConDato.realStr} — {(ultimoConDato.real - ultimoConDato.esperado)}s/km más lento de lo esperado en semana {ultimoConDato.semana}. Puede ser normal en una sesión suelta, pero si se repite conviene revisar el plan.
              </div>
              <button className="btn" onClick={() => jumpToDay(ultimoConDato.semana - 1, 0)} style={{ fontSize: 11.5, fontWeight: 800, color: CAT.running, textDecoration: "underline" }}>Ver semana {ultimoConDato.semana}</button>
            </div>
          )}

          {/* CURVA DE RITMO */}
          {ritmoComparativa.length > 0 && (
            <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: CAT.running, letterSpacing: 0.8, marginBottom: 4 }}>RITMO — REAL VS ESPERADO</div>
              <div style={{ fontSize: 10.5, color: "#8A8A87", marginBottom: 10 }}>Objetivo final: 4:45/km</div>
              <PaceComparisonChart data={ritmoComparativa} />
              <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: "#D4D4D1" }} />
                  <span style={{ fontSize: 10, color: "#787774" }}>Esperado</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: CAT.running }} />
                  <span style={{ fontSize: 10, color: "#787774" }}>Real registrado</span>
                </div>
              </div>
            </div>
          )}

          {/* MOVILIDAD — evolucion de los 4 patrones */}
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: CAT.cuello, letterSpacing: 0.8, marginBottom: 4 }}>MOVILIDAD — 4 PATRONES</div>
            <div style={{ fontSize: 10.5, color: "#8A8A87", marginBottom: 12 }}>Hombro, cadena posterior, columna y cadera — mide en Progreso</div>
            {[
              ["Hombro (manos espalda)", hombroData, "cm", CAT.cuello],
              ["Cadena posterior (tocar suelo)", cadenaPosteriorData, "cm", "#3A6EA5"],
              ["Columna (puente)", columnaData, "nivel", "#6B4C8A"],
              ["Cadera (ATG/Cossack)", caderaMovData, "nivel", CAT.movilidad],
            ].map(([label, data, unit, color], i) => (
              data.length > 1 ? (
                <div key={i} style={{ marginBottom: i < 3 ? 16 : 0 }}>
                  <SimpleLineChart data={data} label={label} unit={unit} color={color} />
                </div>
              ) : data.length === 1 ? (
                <div key={i} style={{ fontSize: 11.5, color: "#8A8A87", marginBottom: i < 3 ? 14 : 0, paddingBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? "1px solid " + C.divider : "none" }}>
                  <span style={{ fontWeight: 700, color: color }}>{label}:</span> primer dato registrado ({data[0].v}{unit === "nivel" ? "" : unit}). Repite en 2 semanas para ver la curva.
                </div>
              ) : (
                <div key={i} style={{ fontSize: 11.5, color: "#A8A8A5", marginBottom: i < 3 ? 14 : 0, paddingBottom: i < 3 ? 10 : 0, borderBottom: i < 3 ? "1px solid " + C.divider : "none" }}>
                  <span style={{ fontWeight: 700 }}>{label}:</span> aún sin registrar.
                </div>
              )
            ))}
          </div>

          <KpiBlock title={"ACUMULADO — HASTA SEMANA " + currentWeekN} isOpen
            onToggle={() => {}} weeks={WEEKS.filter(w => w.n <= currentWeekN)}
            checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal}
            isAcumulado currentWeekN={currentWeekN} noCollapse />
        </div>
      )}

      {subTab === "plan" && (
        <PlanGlobalContent jumpToDay={jumpToDay} setWeekIdx={setWeekIdx} onJumpAway={() => setScreen("semana")} checked={checked} />
      )}

      {subTab === "hitos" && (
        <HitosContent bloquesHistorial={bloquesHistorial} setBloquesHistorial={setBloquesHistorial}
          currentWeekN={currentWeekN} checked={checked} />
      )}

      {subTab === "bitacora" && (
        <WeeklyLogContent weeklyLog={weeklyLog} setWeeklyLog={setWeeklyLog} currentWeekN={currentWeekN} />
      )}

      {subTab === "ajustes" && (
        <PhaseAdjustContent currentWeekN={currentWeekN} currentWeekOverride={currentWeekOverride}
          setCurrentWeekOverride={setCurrentWeekOverride}
          phaseAdjustNote={phaseAdjustNote} setPhaseAdjustNote={setPhaseAdjustNote}
          exportData={exportData} importData={importData} storageStatus={storageStatus} />
      )}
    </div>
  );
}
