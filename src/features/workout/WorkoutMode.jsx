"use client";

import { useState } from "react";
import { C, CAT } from "@/design/tokens";
import { CATALOGO } from "@/domain/fuerza/catalogo";
import { parseSeries } from "@/domain/fuerza/series";
import { getPatronMovilidadDelDia } from "@/domain/salud/patrones";
import { IntervalTimer } from "@/features/workout/IntervalTimer";
export function WorkoutMode({ day, mov, progress, onUpdateProgress, onFinish, onExit, weights, onUpdateWeight, getExerciseHistory, flaggedExercises }) {
  const isFuerza = day.tipo === "fuerza";
  const hasCal = mov.cal && mov.cal.length > 0;
  const hasEnf = mov.enf && mov.enf.length > 0;

  const phases = [];
  if (hasCal) phases.push("cal");
  phases.push("main");
  if (hasEnf) phases.push("enf");

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [calDone, setCalDone] = useState({});
  const [enfDone, setEnfDone] = useState({});
  const [expandedRows, setExpandedRows] = useState(() => new Set());
  const [exIdx, setExIdx] = useState(() => {
    if (!isFuerza) return 0;
    const fi = day.ejercicios.findIndex((e,i) => (progress[i]||0) < parseSeries(e.series));
    return fi === -1 ? 0 : fi;
  });
  const [activeWeightInput, setActiveWeightInput] = useState(null);
  const [weightDraft, setWeightDraft] = useState("");

  const phase = phases[phaseIdx];
  const catColor = isFuerza ? CAT.fuerza : CAT.running;

  const goNextPhase = () => {
    if (phaseIdx < phases.length - 1) setPhaseIdx(phaseIdx + 1);
    else onFinish();
  };
  const goPrevPhase = () => { if (phaseIdx > 0) setPhaseIdx(phaseIdx - 1); };

  const wrapStyle = { minHeight: "100vh", background: "#FAFAF9", display: "flex", flexDirection: "column" };
  const containerStyle = { maxWidth: 480, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", minHeight: "100vh" };
  const fontImport = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');";
  const globalCss = fontImport + " * { box-sizing: border-box; font-family: -apple-system, 'Inter', sans-serif; } button { cursor: pointer; border: none; background: none; } input { font-family: inherit; } .mono { font-family: 'JetBrains Mono', monospace; } .rb { transition: opacity 0.1s; } .rb:active { opacity: 0.6; } .nb { transition: opacity 0.1s; } .nb:active { opacity: 0.7; }";

  // ═══ FASE: CALENTAMIENTO / ENFRIAMIENTO ═══
  if (phase === "cal" || phase === "enf") {
    const baseBloqueRaw = phase === "cal" ? mov.cal : mov.enf;
    // Enlaza cada ejercicio con su ficha completa del catalogo (pasos reales), por id
    const baseBloque = baseBloqueRaw.map(item => {
      const ficha = CATALOGO[item.id];
      return ficha ? Object.assign({}, item, { pasos: ficha.pasos }) : item;
    });
    // El habito de movilidad rota entre 4 patrones (hombro/cadena posterior/columna/cadera), progresando de nivel por semana
    const patronDia = getPatronMovilidadDelDia(day.weekN, day.dayIdx);
    const bloque = phase === "cal"
      ? [{ ex: patronDia.nivelNombre, t: "", patron: patronDia.nombre, habito: true, objetivo: patronDia.objetivo, pasos: patronDia.pasos }, ...baseBloque]
      : baseBloque;
    const doneMap = phase === "cal" ? calDone : enfDone;
    const setDoneMap = phase === "cal" ? setCalDone : setEnfDone;
    const allDone = bloque.every((_, i) => doneMap[i]);
    const label = phase === "cal" ? "CALENTAMIENTO" : "ENFRIAMIENTO";

    return (
      <div style={wrapStyle}>
        <style>{globalCss}</style>
        <div style={containerStyle}>

          <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E5E3" }}>
            <button className="rb" onClick={onExit} style={{ fontSize: 12, color: "#8A8A87", fontWeight: 600, letterSpacing: 0.3 }}>SALIR</button>
            <div style={{ fontSize: 10.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>{day.titulo.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 11, color: "#8A8A87" }}>{phaseIdx+1}/{phases.length}</div>
          </div>

          <div style={{ padding: "16px 20px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8A8A87", letterSpacing: 1.5 }}>{label}</div>
          </div>

          <div style={{ flex: 1, padding: "8px 20px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden" }}>
              {bloque.map((m, i) => {
                const isExpanded = expandedRows.has(i);
                return (
                  <div key={i} style={{ borderBottom: i < bloque.length - 1 ? "1px solid #E5E5E3" : "none" }}>
                    <button className="rb" onClick={() => setDoneMap(p => Object.assign({}, p, { [i]: !p[i] }))} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", width: "100%",
                      background: doneMap[i] ? "#EAF7EE" : "transparent",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                          border: "1.5px solid " + (doneMap[i] ? "#2F7D4F" : "#D4D4D1"),
                          background: doneMap[i] ? "#2F7D4F" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#FAFAF9", fontWeight: 800,
                        }}>{doneMap[i] ? "✓" : ""}</div>
                        <div>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: doneMap[i] ? "#2F7D4F" : "#171717", textAlign: "left" }}>{m.ex}</span>
                          {m.reps && <div style={{ fontSize: 10.5, color: doneMap[i] ? "#2F7D4F" : "#8A8A87", marginTop: 1 }}>{m.reps}</div>}
                        </div>
                      </div>
                      {m.t && <span className="mono" style={{ fontSize: 11.5, color: "#8A8A87", flexShrink: 0, marginLeft: 8 }}>{m.t}</span>}
                    </button>
                    {m.pasos && (
                      <div style={{ padding: "0 16px 12px" }}>
                        <button className="btn" onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRows(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                        }} style={{ fontSize: 11, fontWeight: 700, color: "#787774", marginBottom: isExpanded ? 8 : 0 }}>
                          {isExpanded ? "OCULTAR ▲" : "CÓMO SE HACE ▼"}
                        </button>
                        {isExpanded && (
                          <div className="expand-in">
                            {m.pasos.map((p, pi) => (
                              <div key={pi} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: "#787774", flexShrink: 0 }}>{pi+1}.</span>
                                <span style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.45 }}>{p}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "16px 20px 24px", display: "flex", gap: 8 }}>
            {phaseIdx > 0 && (
              <button className="nb" onClick={goPrevPhase} style={{
                width: 48, height: 48, borderRadius: 4, background: "#F2F2F0", fontSize: 16, color: "#8A8A87",
              }}>&lsaquo;</button>
            )}
            <button className="nb" onClick={goNextPhase} style={{
              flex: 1, height: 48, borderRadius: 4, background: allDone ? "#171717" : "#FFFFFF",
              border: "1px solid " + (allDone ? "#171717" : "#D4D4D1"),
              fontSize: 13, fontWeight: 700, color: allDone ? "#FAFAF9" : "#8A8A87", letterSpacing: 0.5,
            }}>{allDone ? "CONTINUAR" : "SALTAR"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ FASE: SESIÓN PRINCIPAL — RUNNING ═══
  if (!isFuerza) {
    return (
      <div style={wrapStyle}>
        <style>{globalCss}</style>
        <div style={containerStyle}>

          <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E5E3" }}>
            <button className="rb" onClick={onExit} style={{ fontSize: 12, color: "#8A8A87", fontWeight: 600, letterSpacing: 0.3 }}>SALIR</button>
            <div style={{ fontSize: 10.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>{day.titulo.toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 11, color: "#8A8A87" }}>{phaseIdx+1}/{phases.length}</div>
          </div>

          <div style={{ flex: 1, padding: "24px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8A8A87", letterSpacing: 1.5, marginBottom: 8 }}>SESIÓN</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "#171717", lineHeight: 1.3, marginBottom: 16 }}>{day.titulo}</div>

            <div style={{ border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "flex", borderBottom: "1px solid #E5E5E3" }}>
                <div style={{ flex: 1, padding: "12px 16px", borderRight: "1px solid #E5E5E3" }}>
                  <div style={{ fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>DURACIÓN</div>
                  <div className="mono" style={{ fontSize: 16, color: "#171717", fontWeight: 700, marginTop: 2 }}>{day.dur}</div>
                </div>
                <div style={{ flex: 1, padding: "12px 16px" }}>
                  <div style={{ fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>RPE</div>
                  <div className="mono" style={{ fontSize: 16, color: "#171717", fontWeight: 700, marginTop: 2 }}>{day.rpe}</div>
                </div>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>SESIÓN</div>
                <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{day.what}</div>
              </div>
            </div>

            {day.intervalos ? (
              <IntervalTimer intervalos={day.intervalos} />
            ) : (
              <div style={{ fontSize: 11.5, color: "#8A8A87", lineHeight: 1.5 }}>Al terminar, pulsa continuar para registrar el ritmo real.</div>
            )}
          </div>

          <div style={{ padding: "16px 20px 24px", display: "flex", gap: 8 }}>
            {phaseIdx > 0 && (
              <button className="nb" onClick={goPrevPhase} style={{
                width: 48, height: 48, borderRadius: 4, background: "#F2F2F0", fontSize: 16, color: "#8A8A87",
              }}>&lsaquo;</button>
            )}
            <button className="nb" onClick={goNextPhase} style={{
              flex: 1, height: 48, borderRadius: 4, background: "#171717", border: "1px solid #171717",
              fontSize: 13, fontWeight: 700, color: "#FAFAF9", letterSpacing: 0.5,
            }}>{phaseIdx === phases.length - 1 ? "TERMINAR" : "HE TERMINADO DE CORRER"}</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ FASE: SESIÓN PRINCIPAL — FUERZA (tabla densa + historial) ═══
  const ejercicio = day.ejercicios[exIdx];
  const totalSeries = parseSeries(ejercicio.series);
  const seriesDone = progress[exIdx] || 0;
  const totalEj = day.ejercicios.length;
  const ejCompletos = day.ejercicios.filter((e,i) => (progress[i]||0) >= parseSeries(e.series)).length;
  const isLastEj = exIdx === totalEj - 1;
  const exWeights = (weights && weights[exIdx]) || {};
  const history = getExerciseHistory ? getExerciseHistory(ejercicio.nombre) : null;

  const handleSerieClick = (si) => {
    const isDone = si < seriesDone;
    if (isDone) { onUpdateProgress(exIdx, si); return; }
    setActiveWeightInput(si);
    setWeightDraft(exWeights[si] || (history ? String(history.pesoMax) : ""));
  };
  const confirmWeight = () => {
    if (activeWeightInput === null) return;
    onUpdateWeight(exIdx, activeWeightInput, weightDraft);
    onUpdateProgress(exIdx, activeWeightInput + 1);
    setActiveWeightInput(null);
    setWeightDraft("");
  };

  return (
    <div style={wrapStyle}>
      <style>{globalCss}</style>
      <div style={containerStyle}>

        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E5E3" }}>
          <button className="rb" onClick={onExit} style={{ fontSize: 12, color: "#8A8A87", fontWeight: 600, letterSpacing: 0.3 }}>SALIR</button>
          <div style={{ fontSize: 10.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>{day.titulo.toUpperCase()}</div>
          <div className="mono" style={{ fontSize: 11, color: "#8A8A87" }}>{phaseIdx+1}/{phases.length}</div>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: "1px solid #E5E5E3" }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
            {day.ejercicios.map((e,i) => {
              const d = (progress[i]||0) >= parseSeries(e.series);
              return <div key={i} onClick={() => { setExIdx(i); setActiveWeightInput(null); }} style={{ flex: 1, height: 3, cursor: "pointer", background: d ? "#2F7D4F" : i===exIdx ? "#171717" : "#D4D4D1" }} />;
            })}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: "#8A8A87" }}>EJERCICIO {exIdx+1}/{totalEj} · {ejCompletos} COMPLETOS</div>
        </div>

        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>

          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#8A8A87", letterSpacing: 1 }}>{ejercicio.grupo.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#171717", lineHeight: 1.3, marginBottom: 4 }}>{ejercicio.nombre}</div>
          <div className="mono" style={{ fontSize: 13, color: "#8A8A87", marginBottom: 16 }}>{ejercicio.series}</div>

          {flaggedExercises && flaggedExercises[ejercicio.nombre] && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 4, marginBottom: 12 }}>
              <span style={{ fontSize: 13 }}>⚠</span>
              <div>
                <div style={{ fontSize: 10, color: CAT.running, fontWeight: 800, letterSpacing: 0.3, marginBottom: 2 }}>TE HA DADO MOLESTIAS ANTES</div>
                <div style={{ fontSize: 11.5, color: "#4A4A47", lineHeight: 1.4 }}>{flaggedExercises[ejercicio.nombre]}</div>
              </div>
            </div>
          )}

          {history && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#F2F2F0", border: "1px solid #E5E5E3", borderRadius: 4, marginBottom: 16 }}>
              <span style={{ fontSize: 10, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.3 }}>ÚLTIMA VEZ ({history.fecha})</span>
              <span className="mono" style={{ fontSize: 13, color: "#171717", fontWeight: 700, marginLeft: "auto" }}>{history.pesoMax}kg</span>
            </div>
          )}

          <div style={{ border: "1px solid #E5E5E3", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ display: "flex", padding: "8px 14px", background: "#F2F2F0", borderBottom: "1px solid #E5E5E3" }}>
              <div style={{ width: 50, fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>SERIE</div>
              <div style={{ flex: 1, fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>PESO (KG)</div>
              <div style={{ width: 60, fontSize: 9.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5, textAlign: "right" }}>ESTADO</div>
            </div>
            {Array.from({ length: totalSeries }).map((_, si) => {
              const isDone = si < seriesDone;
              const w = exWeights[si];
              const isActive = activeWeightInput === si;
              return (
                <div key={si} style={{
                  display: "flex", alignItems: "center", padding: "12px 14px",
                  borderBottom: si < totalSeries - 1 ? "1px solid #E5E5E3" : "none",
                  background: isActive ? "#EAF7EE" : "transparent",
                }}>
                  <div className="mono" style={{ width: 50, fontSize: 14, color: "#171717", fontWeight: 700 }}>{si+1}</div>
                  <div style={{ flex: 1 }}>
                    {isActive ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number" inputMode="decimal" autoFocus value={weightDraft}
                          onChange={e => setWeightDraft(e.target.value)}
                          placeholder="0"
                          className="mono"
                          style={{
                            width: 70, fontSize: 15, fontWeight: 700, padding: "6px 8px",
                            borderRadius: 3, border: "1px solid #2F7D4F", background: "#FAFAF9", color: "#171717", outline: "none",
                          }}
                        />
                        <button className="nb" onClick={confirmWeight} style={{
                          padding: "6px 12px", borderRadius: 3, background: "#2F7D4F", color: "#FAFAF9", fontWeight: 800, fontSize: 11,
                        }}>OK</button>
                      </div>
                    ) : (
                      <span className="mono" style={{ fontSize: 14, color: isDone ? "#171717" : "#D4D4D1", fontWeight: 700 }}>
                        {isDone ? (w || "—") : "—"}
                      </span>
                    )}
                  </div>
                  <div style={{ width: 60, textAlign: "right" }}>
                    <button className="rb" onClick={() => handleSerieClick(si)} style={{
                      width: 26, height: 26, borderRadius: 4,
                      border: "1.5px solid " + (isDone ? "#2F7D4F" : "#D4D4D1"),
                      background: isDone ? "#2F7D4F" : "transparent",
                      fontSize: 12, fontWeight: 800, color: isDone ? "#FAFAF9" : "transparent",
                    }}>{isDone ? "✓" : ""}</button>
                  </div>
                </div>
              );
            })}
          </div>

          {activeWeightInput !== null && (
            <button onClick={() => { onUpdateProgress(exIdx, activeWeightInput + 1); setActiveWeightInput(null); }}
              style={{ fontSize: 11, color: "#8A8A87", fontWeight: 600, marginTop: 10, textAlign: "left" }}>Marcar sin peso</button>
          )}
        </div>

        <div style={{ padding: "16px 20px 24px", display: "flex", gap: 8 }}>
          <button className="nb" onClick={() => exIdx>0 && setExIdx(exIdx-1)} style={{
            width: 48, height: 48, borderRadius: 4, background: "#F2F2F0",
            fontSize: 16, color: exIdx===0 ? "#D4D4D1" : "#8A8A87",
          }}>&lsaquo;</button>
          <button className="nb" onClick={() => isLastEj ? goNextPhase() : setExIdx(exIdx+1)} style={{
            flex: 1, height: 48, borderRadius: 4, background: "#171717", border: "1px solid #171717",
            fontSize: 13, fontWeight: 700, color: "#FAFAF9", letterSpacing: 0.5,
          }}>{isLastEj ? (phaseIdx === phases.length - 1 ? "TERMINAR" : "SIGUIENTE FASE") : "SIGUIENTE EJERCICIO"}</button>
        </div>
      </div>
    </div>
  );
}
