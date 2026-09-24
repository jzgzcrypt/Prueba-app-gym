"use client";

import { useEffect, useState } from "react";
import { C, CAT } from "@/design/tokens";
import { CATALOGO } from "@/domain/fuerza/catalogo";
import { parseSeries } from "@/domain/fuerza/series";
import { descansoEntreSeries, objetivoSerie, pasoPeso, propuestaSerie, textoSeries } from "@/domain/fuerza/registro";
import { getPatronesDeSesion } from "@/domain/salud/patrones";
import { IntervalTimer } from "@/features/workout/IntervalTimer";
/** "5:05" a partir de segundos. */
function textoRitmo(seg) { return Math.floor(seg / 60) + ":" + String(Math.round(seg % 60)).padStart(2, "0"); }

/** Las series rapidas son de distancia: si el ritmo se ajusta, cada una dura
 *  lo que tarda en cubrir sus metros a ese ritmo. */
function intervalosDelDia(day, ritmoSeries) {
  if (!ritmoSeries || !ritmoSeries.ajustado || !day.tramoM) return day.intervalos;
  const seg = Math.round(day.tramoM / 1000 * ritmoSeries.ritmo);
  return day.intervalos.map(b => ({ ...b, s: b.s.map(([t, d]) => t === "rapido" ? [t, seg] : [t, d]) }));
}

export function WorkoutMode({ day, mov, progress, onUpdateProgress, onFinish, onExit, weights, onUpdateWeight, reps, onUpdateReps, ultimaVez, ritmoSeries, flaggedExercises }) {
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
  // Fin del descanso en curso (timestamp), o null.
  const [descansoHasta, setDescansoHasta] = useState(null);

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
    // Los patrones de movilidad van con la sesion de gimnasio que los calienta
    // (hombro con empuje, columna con tiron, cadera y cadena posterior con
    // pierna), progresando de nivel por semana. En running no hay patron: el
    // calentamiento es el que pide el plan.
    const patrones = phase === "cal" ? getPatronesDeSesion(day.cat, day.weekN) : [];
    const bloque = [
      ...patrones.map(p => ({ ex: p.nivelNombre, t: "", patron: p.nombre, habito: true, objetivo: p.objetivo, pasos: p.pasos })),
      ...baseBloque,
    ];
    const doneMap = phase === "cal" ? calDone : enfDone;
    const setDoneMap = phase === "cal" ? setCalDone : setEnfDone;
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
            {/* Siempre dice lo que viene, nunca "saltar": el boton no puede
                invitar a escaquearse. Marcar cada ejercicio es opcional. */}
            <button className="nb" onClick={goNextPhase} style={{
              flex: 1, height: 52, borderRadius: 12, background: "#171717", border: "1px solid #171717",
              fontSize: 13.5, fontWeight: 800, color: "#FAFAF9", letterSpacing: 0.5,
            }}>{phase === "cal" ? "YA ESTOY CALIENTE · A LA SESIÓN" : phaseIdx === phases.length - 1 ? "TERMINAR" : "SIGUIENTE"}</button>
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

            {ritmoSeries && ritmoSeries.ajustado && (
              <div style={{ padding: "11px 13px", borderRadius: 10, background: "#FDF6E3", border: "1px solid #E8D9A8", marginBottom: 14 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#171717" }}>Hoy, las series a {textoRitmo(ritmoSeries.ritmo)}/km</div>
                <div style={{ fontSize: 12, color: "#4A4A47", marginTop: 2, lineHeight: 1.4 }}>
                  Ajustado a tu prueba de {ritmoSeries.fuente.distKm} km ({textoRitmo(ritmoSeries.fuente.total)}). El plan pide {textoRitmo(ritmoSeries.plan)}: se llega subiendo prueba a prueba, no reventando hoy.
                </div>
              </div>
            )}

            {day.intervalos ? (
              <IntervalTimer intervalos={intervalosDelDia(day, ritmoSeries)} ritmo={ritmoSeries ? ritmoSeries.ritmo : null} />
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

  // ═══ FASE: SESIÓN PRINCIPAL — FUERZA (la libreta) ═══
  const ejercicio = day.ejercicios[exIdx];
  const totalSeries = parseSeries(ejercicio.series);
  const seriesDone = progress[exIdx] || 0;
  const totalEj = day.ejercicios.length;
  const ejCompletos = day.ejercicios.filter((e,i) => (progress[i]||0) >= parseSeries(e.series)).length;
  const isLastEj = exIdx === totalEj - 1;
  const exWeights = (weights && weights[exIdx]) || {};
  const exReps = (reps && reps[exIdx]) || {};
  const ultima = ultimaVez ? ultimaVez(ejercicio.nombre) : null;
  const objetivo = objetivoSerie(ejercicio.series);
  const ejercicioHecho = seriesDone >= totalSeries;
  const siguienteTexto = isLastEj ? (phaseIdx === phases.length - 1 ? "TERMINAR" : "SIGUIENTE FASE") : "SIGUIENTE EJERCICIO";

  const apuntarSerie = (si, valor) => {
    onUpdateWeight(exIdx, si, valor.peso == null ? "" : String(valor.peso));
    if (onUpdateReps) onUpdateReps(exIdx, si, valor.reps);
    onUpdateProgress(exIdx, si + 1);
    // Descanso tras cada serie menos la ultima del ejercicio.
    if (si + 1 < totalSeries) setDescansoHasta(Date.now() + descansoEntreSeries(ejercicio) * 1000);
    else setDescansoHasta(null);
  };
  const reabrirSerie = (si) => { onUpdateProgress(exIdx, si); setDescansoHasta(null); };
  const irAEjercicio = (i) => { setExIdx(i); setDescansoHasta(null); };

  return (
    <div style={wrapStyle}>
      <style>{globalCss}</style>
      <div style={containerStyle}>

        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E5E3" }}>
          <button className="rb" onClick={onExit} style={{ fontSize: 12, color: "#8A8A87", fontWeight: 600, letterSpacing: 0.3, minHeight: 32 }}>SALIR</button>
          <div style={{ fontSize: 10.5, color: "#8A8A87", fontWeight: 700, letterSpacing: 0.5 }}>{day.titulo.toUpperCase()}</div>
          <div className="mono" style={{ fontSize: 11, color: "#8A8A87" }}>{phaseIdx+1}/{phases.length}</div>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: "1px solid #E5E5E3" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {day.ejercicios.map((e,i) => {
              const d = (progress[i]||0) >= parseSeries(e.series);
              return <button key={i} aria-label={"Ejercicio " + (i+1)} onClick={() => irAEjercicio(i)} style={{ flex: 1, height: 14, padding: "5px 0", cursor: "pointer" }}>
                <span style={{ display: "block", height: 4, borderRadius: 2, background: d ? "#2F7D4F" : i===exIdx ? "#171717" : "#D4D4D1" }} />
              </button>;
            })}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: "#8A8A87" }}>EJERCICIO {exIdx+1}/{totalEj} · {ejCompletos} COMPLETOS</div>
        </div>

        <div style={{ flex: 1, padding: "18px 16px 8px", display: "flex", flexDirection: "column" }}>

          <div style={{ fontSize: 10, fontWeight: 700, color: "#8A8A87", letterSpacing: 1, marginBottom: 4 }}>{ejercicio.grupo.toUpperCase()}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#171717", lineHeight: 1.25, marginBottom: 6 }}>{ejercicio.nombre}</div>
          <div style={{ fontSize: 13, color: "#4A4A47", marginBottom: 12 }}>
            <b>{totalSeries} series</b> · {objetivo.texto}
          </div>

          {flaggedExercises && flaggedExercises[ejercicio.nombre] && (
            <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 13 }}>⚠</span>
              <div>
                <div style={{ fontSize: 10, color: CAT.running, fontWeight: 800, letterSpacing: 0.3, marginBottom: 2 }}>TE HA DADO MOLESTIAS ANTES</div>
                <div style={{ fontSize: 11.5, color: "#4A4A47", lineHeight: 1.4 }}>{flaggedExercises[ejercicio.nombre]}</div>
              </div>
            </div>
          )}

          <div style={{ padding: "10px 12px", background: "#F2F2F0", borderRadius: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#8A8A87", fontWeight: 800, letterSpacing: 0.4 }}>
              {ultima ? "LA ÚLTIMA VEZ · " + ultima.fecha : "LA ÚLTIMA VEZ"}
            </div>
            <div className="mono" style={{ fontSize: 15, color: "#171717", fontWeight: 700, marginTop: 2 }}>
              {ultima ? textoSeries(ultima.series) : "Primera vez: apunta lo que hagas y la próxima tendrás con qué comparar."}
            </div>
            {ultima && (
              <div style={{ fontSize: 11.5, color: "#4A4A47", marginTop: 3 }}>Hoy, una rep más o un poco más de peso.</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: totalSeries }).map((_, si) => {
              const hecha = si < seriesDone;
              const activa = si === seriesDone;
              if (hecha) {
                const pw = exWeights[si], rp = exReps[si];
                return (
                  <button key={si} className="rb" onClick={() => reabrirSerie(si)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, minHeight: 48,
                    background: "#EAF4EE", border: "1px solid #CFE3D6", textAlign: "left",
                  }}>
                    <span style={{ width: 24, height: 24, borderRadius: 12, background: "#2F7D4F", color: "#FAFAF9", fontSize: 13, fontWeight: 800,
                                   display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#171717" }}>Serie {si+1}</span>
                    <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: "#171717", marginLeft: "auto" }}>
                      {(pw ? pw + " kg" : "sin peso") + (rp != null ? " × " + rp : "")}
                    </span>
                  </button>
                );
              }
              if (activa) {
                return <SerieActiva key={si + "-" + exIdx} si={si} ejercicio={ejercicio} objetivo={objetivo}
                  propuesta={propuestaSerie({ si, pesosHoy: exWeights, repsHoy: exReps, ultima, objetivo })}
                  onApuntar={(v) => apuntarSerie(si, v)} />;
              }
              return (
                <div key={si} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                                       border: "1px dashed #D4D4D1", color: "#A8A8A5", fontSize: 13, fontWeight: 700 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, border: "1.5px solid #D4D4D1", flexShrink: 0 }} />
                  Serie {si+1}
                </div>
              );
            })}
          </div>

          {ejercicioHecho && (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#2F7D4F" }}>
              Ejercicio hecho. Toca una serie para corregirla.
            </div>
          )}
        </div>

        {descansoHasta && <Descanso hasta={descansoHasta} onFin={() => setDescansoHasta(null)} />}

        <div style={{ padding: "12px 16px 24px", display: "flex", gap: 8 }}>
          <button className="nb" aria-label="Ejercicio anterior" onClick={() => exIdx>0 && irAEjercicio(exIdx-1)} style={{
            width: 52, height: 52, borderRadius: 12, background: "#F2F2F0",
            fontSize: 18, color: exIdx===0 ? "#D4D4D1" : "#8A8A87",
          }}>&lsaquo;</button>
          <button className="nb" onClick={() => isLastEj ? goNextPhase() : irAEjercicio(exIdx+1)} style={{
            flex: 1, height: 52, borderRadius: 12,
            background: ejercicioHecho ? "#171717" : "#FAFAF9", border: "1px solid #171717",
            fontSize: 13.5, fontWeight: 800, color: ejercicioHecho ? "#FAFAF9" : "#171717", letterSpacing: 0.5,
          }}>{siguienteTexto}</button>
        </div>
      </div>
    </div>
  );
}

/** Un valor con − y +, que tambien se puede escribir. `vacio` es lo que se
 *  ensena cuando no hay valor (p. ej. "sin peso"). */
function Paso({ valor, setValor, paso, unidad, vacio, min = 0 }) {
  const [texto, setTexto] = useState(valor == null ? "" : String(valor));
  const fijar = (v) => { setValor(v); setTexto(v == null ? "" : String(v)); };
  const mover = (d) => {
    const base = valor == null ? (d > 0 ? 0 : null) : valor;
    if (base == null) return;
    const n = Math.round((base + d * paso) * 10) / 10;
    fijar(n <= min ? (min === 0 && unidad === "kg" ? null : min) : n);
  };
  const boton = { width: 44, height: 48, borderRadius: 10, background: "#F2F2F0", fontSize: 22, fontWeight: 700, color: "#171717", flexShrink: 0 };
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button className="nb" aria-label={"Menos " + unidad} onClick={() => mover(-1)} style={boton}>−</button>
        <input value={texto} inputMode="decimal" placeholder={vacio}
          onChange={e => { setTexto(e.target.value); const n = parseFloat(e.target.value.replace(",", ".")); setValor(Number.isFinite(n) && n > 0 ? n : null); }}
          className="mono" style={{ width: "100%", minWidth: 0, height: 48, textAlign: "center", fontSize: 20, fontWeight: 800,
                                    border: "none", background: "transparent", color: "#171717", outline: "none" }} />
        <button className="nb" aria-label={"Más " + unidad} onClick={() => mover(1)} style={boton}>+</button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#8A8A87", textAlign: "center", letterSpacing: 0.4, marginTop: 2 }}>
        {unidad === "kg" ? (valor == null ? "SIN PESO" : "KG") : unidad.toUpperCase()}
      </div>
    </div>
  );
}

/** La serie que toca: peso y reps ya rellenos con lo que se propone, y un
 *  boton grande para darla por hecha. Un toque si repites lo de la ultima vez. */
function SerieActiva({ si, ejercicio, objetivo, propuesta, onApuntar }) {
  const [peso, setPeso] = useState(propuesta.peso);
  const [rep, setRep] = useState(propuesta.reps);
  const unidadReps = objetivo.unidad === "s" ? "seg" : objetivo.porLado ? "reps/lado" : "reps";
  return (
    <div style={{ padding: "12px 12px 14px", borderRadius: 14, background: "#FFFFFF", border: "2px solid #171717" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, padding: "0 2px" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#171717" }}>Serie {si+1}</span>
        <span style={{ fontSize: 11.5, color: "#8A8A87", fontWeight: 600 }}>objetivo: {objetivo.texto}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Paso valor={peso} setValor={setPeso} paso={pasoPeso(ejercicio.nombre)} unidad="kg" vacio="—" />
        <Paso valor={rep} setValor={setRep} paso={objetivo.unidad === "s" ? 5 : 1} unidad={unidadReps} vacio="—" min={1} />
      </div>
      <button className="nb" onClick={() => onApuntar({ peso, reps: rep })} style={{
        width: "100%", height: 52, marginTop: 10, borderRadius: 12, background: "#2F7D4F",
        fontSize: 15, fontWeight: 900, color: "#FAFAF9", letterSpacing: 0.3,
      }}>✓ HECHA{peso != null || rep != null ? " · " + (peso != null ? peso + " kg" : "") + (rep != null ? (peso != null ? " × " : "× ") + rep : "") : ""}</button>
    </div>
  );
}

/** Cuenta atras del descanso entre series. Vibra al acabar. */
function Descanso({ hasta, onFin }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const quedan = Math.max(0, Math.ceil((hasta - ahora) / 1000));
  useEffect(() => {
    if (quedan === 0) {
      try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* sin vibracion */ }
      const t = setTimeout(onFin, 1500);
      return () => clearTimeout(t);
    }
  }, [quedan, onFin]);
  const mm = Math.floor(quedan / 60), ss = String(quedan % 60).padStart(2, "0");
  return (
    <div style={{ margin: "0 16px", padding: "10px 14px", borderRadius: 12, background: quedan ? "#171717" : "#2F7D4F",
                  display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#B0B0AD", letterSpacing: 0.6 }}>{quedan ? "DESCANSO" : "¡A POR LA SIGUIENTE!"}</span>
      {quedan > 0 && <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: "#FAFAF9" }}>{mm}:{ss}</span>}
      <button className="nb" onClick={onFin} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "#FAFAF9", minHeight: 32, padding: "0 6px" }}>SALTAR</button>
    </div>
  );
}
