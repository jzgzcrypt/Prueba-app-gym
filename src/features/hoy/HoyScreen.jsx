"use client";

import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ICON_FUERZA, ICON_MOVILIDAD, ICON_RUNNING, LOGO_7K } from "@/domain/assets/icons";
import { parseSeries } from "@/domain/fuerza/series";
import { FECHA_INICIO, FLAT_DAYS, WEEKS, todayLocalIso } from "@/domain/plan/calendario";
import { getFraseHoy } from "@/domain/running/frases";
import { MOVILIDAD } from "@/domain/salud/movilidad";
import { getTecnicaEj } from "@/domain/salud/tecnica";
import { GuerreroBlock, HabitBlock, ListBlock, MagiaBlock, MoveDayBlock, PainBlock } from "@/features/hoy/bloques";
import { WeekDots } from "@/features/ui/WeekDots";
export function HoyScreen(props) {
  const { day, dayKey, isToday, flatIdx, goDay, goToday, isFuerzaDay, isRunDay, isCompromisoDay, mov,
    cuelloEj, cuelloChecks, toggleCuello, checked, toggleCheck, mainDone, workoutProgress, onStartWorkout,
    notes, noteInput, setNoteInput, editingNote, setEditingNote, saveNote, openCatalogo,
    expandedBlock, setExpandedBlock, magiaProgress, bloquesHistorial } = props;

  const frase = getFraseHoy(flatIdx);
  const tecnicaEj = getTecnicaEj(day.weekN);
  const cM = !!cuelloChecks[dayKey + "-m"], cT = !!cuelloChecks[dayKey + "-t"], cN = !!cuelloChecks[dayKey + "-n"];
  const cuelloTotal = (cM?1:0)+(cT?1:0)+(cN?1:0);
  const totalSeries = isFuerzaDay ? day.ejercicios.reduce((s,e) => s + parseSeries(e.series), 0) : 0;
  const doneSeries = isFuerzaDay && workoutProgress ? Object.values(workoutProgress).reduce((s,v) => s+(v||0),0) : 0;

  const startDate = new Date(FECHA_INICIO);
  const thisDate = new Date(day.isoDate || startDate);
  const daysSinceStart = Math.round((thisDate - startDate) / (1000*60*60*24));
  const isMedicionDay = daysSinceStart >= 0 && daysSinceStart % 14 === 0;

  const prevDay = flatIdx > 0 ? FLAT_DAYS[flatIdx - 1] : null;
  const prevWasImportant = prevDay && (prevDay.tipo === "test" || prevDay.esCalidad);
  const prevKey = prevDay ? prevDay.weekN + "-" + prevDay.dayIdx : null;
  const missedImportantDay = prevWasImportant && prevKey && !checked[prevKey];

  const toggleBlock = (id) => setExpandedBlock(prev => prev === id ? null : id);

  // ── Barra de progreso del bloque activo ──
  const bloqueActivo = (bloquesHistorial || []).find(b => b.estado === "activo") || (bloquesHistorial || [])[0];
  const totalDiasBloque = FLAT_DAYS.length;
  const diaActualBloque = flatIdx + 1;
  const pctBloque = Math.min(100, Math.round((diaActualBloque / totalDiasBloque) * 100));

  // ── Insignias de identidad: patrones dominados, trucos aprendidos, fases superadas ──
  const trucosDominados = Object.keys(magiaProgress || {}).filter(k => magiaProgress[k]).length;
  const guerreroNivel = day.weekN <= 3 ? 1 : day.weekN <= 7 ? 2 : 3;
  const movilidadNivel = day.weekN <= 4 ? 1 : day.weekN <= 8 ? 2 : 3;
  const fasesSuperadas = (guerreroNivel - 1) + (movilidadNivel - 1) + (day.weekN > 2 ? 1 : 0); // cuello parte1->2 en semana 3
  const patronesTotales = 4; // hombro, cadena posterior, columna, cadera — todos activos en paralelo desde semana 1

  return (
    <div>
      <div style={{ padding: SP.xxl + "px " + SP.xl + "px " + SP.lg + "px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
          <img src={LOGO_7K} alt="7K" style={{ width: 22, height: 16, objectFit: "contain" }} />
          <div style={{ ...TYPE.micro, color: C.accent, letterSpacing: 1.5 }}>PROGRAMA 7K</div>
        </div>
      </div>

      {/* ── Barra de progreso del bloque ── */}
      {bloqueActivo && (
        <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint, letterSpacing: 0.4 }}>DÍA {diaActualBloque} DE {totalDiasBloque}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint }}>{bloqueActivo.nombre.toUpperCase()}</span>
          </div>
          <div style={{ height: 7, background: C.surfaceMuted, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: pctBloque + "%", height: "100%", background: C.accent, borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* ── Frase con gancho del dia ── */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.lg + "px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.text, lineHeight: 1.32, letterSpacing: -0.3 }}>
          {frase}
        </div>
      </div>

      {/* ── Insignias de identidad ── */}
      <div style={{ display: "flex", gap: SP.sm, padding: "0 " + SP.xl + "px " + SP.lg + "px" }}>
        <div style={{ flex: 1, background: C.surfaceMuted, borderRadius: R.lg, padding: SP.sm + "px " + SP.md + "px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{patronesTotales}</div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Patrones activos</div>
        </div>
        <div style={{ flex: 1, background: C.surfaceMuted, borderRadius: R.lg, padding: SP.sm + "px " + SP.md + "px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{trucosDominados}</div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Trucos aprendidos</div>
        </div>
        <div style={{ flex: 1, background: C.surfaceMuted, borderRadius: R.lg, padding: SP.sm + "px " + SP.md + "px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{fasesSuperadas}</div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>Fases superadas</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 " + SP.md + "px " + SP.lg + "px" }}>
        <button className="btn" onClick={() => goDay(-1)} style={{
          fontSize: 22, color: C.textFaint, width: TAP_MIN, height: TAP_MIN,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>&lsaquo;</button>
        <div style={{ textAlign: "center", minHeight: 36, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...TYPE.meta, color: C.textDim, letterSpacing: 0.3 }}>{day.dow.toUpperCase()} · {day.date}</div>
          {isToday ? (
            <div style={{ fontSize: 10.5, color: C.ok, fontWeight: 800, marginTop: 3, letterSpacing: 0.5 }}>● HOY</div>
          ) : (
            <button onClick={goToday} style={{ fontSize: 10.5, color: C.accent, fontWeight: 700, marginTop: 3, padding: "4px 8px", textDecoration: "underline" }}>VOLVER A HOY</button>
          )}
        </div>
        <button className="btn" onClick={() => goDay(1)} style={{
          fontSize: 22, color: C.textFaint, width: TAP_MIN, height: TAP_MIN,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>&rsaquo;</button>
      </div>

      <WeekDots day={day} checked={checked} onJumpDay={props.onJumpDay} />

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>

        {missedImportantDay && (
          <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#171717" }}>Ayer tocaba {prevDay.tipo === "test" ? "un test" : "calidad"} y no quedó registrada</div>
            <div style={{ fontSize: 10.5, color: "#787774", marginTop: 2 }}>{prevDay.titulo} — márcala en Semana si la hiciste.</div>
          </div>
        )}

        {isMedicionDay && (
          <div style={{ background: "#FDF6E3", border: "1px solid #E8D9A8", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#171717" }}>Toca medición — ve a PROGRESO</div>
          </div>
        )}

        {/* ═══ CUELLO — habito minimo, espacio propio ═══ */}
        <HabitBlock cuelloEj={cuelloEj} cM={cM} cT={cT} cN={cN} cuelloTotal={cuelloTotal} toggleCuello={toggleCuello}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock} />

        {/* ═══ MAGIA — habilidad aparte, espacio propio ═══ */}
        <MagiaBlock day={day} dayKey={dayKey} magiaProgress={props.magiaProgress} setMagiaProgress={props.setMagiaProgress}
          magiaLog={props.magiaLog} setMagiaLog={props.setMagiaLog}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock}
          onOpenCatalogo={props.onOpenMagiaCatalogo} />

        {/* ═══ GUERRERO — habilidad aparte, control bajo presion ═══ */}
        <GuerreroBlock day={day} dayKey={dayKey} guerreroLog={props.guerreroLog} setGuerreroLog={props.setGuerreroLog}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock} />

        {/* ═══ RUNNING — colapsable ═══ */}
        {isRunDay && (
          <ListBlock id="main" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icon={ICON_RUNNING} accent={CAT.running} title={day.titulo}
            statusText={day.dur} statusDone={mainDone}>
            <div style={{ fontSize: 13, color: "#4A4A47", marginTop: 4, marginBottom: 14, lineHeight: 1.5 }}>{day.what}</div>

            <div style={{ background: "#F0F5F8", border: "1px solid #D8E5EC", borderRadius: 10, padding: "11px 13px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: CAT.cuello, letterSpacing: 0.5 }}>FOCO DE TÉCNICA</span>
                <span style={{ fontSize: 8.5, fontWeight: 800, color: CAT.cuello, background: CAT.cuello + "16", padding: "1px 6px", borderRadius: 5 }}>{tecnicaEj.foco}</span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 3 }}>{tecnicaEj.nombre}</div>
              <div style={{ fontSize: 11.5, color: "#4A4A47", lineHeight: 1.4 }}>{tecnicaEj.verificable}</div>
            </div>

            {!mainDone && (
              <button className="btn" onClick={onStartWorkout} style={{
                width: "100%", padding: "16px", borderRadius: 12, background: CAT.running,
                fontSize: 15, fontWeight: 900, color: "#FAFAF9", letterSpacing: 0.3,
              }}>EMPEZAR SESIÓN</button>
            )}
            {mainDone && (
              <div style={{ padding: "14px", borderRadius: 12, background: C.ok, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#FAFAF9" }}>
                SESIÓN COMPLETADA
              </div>
            )}
            {!mainDone && (
              <button className="btn" onClick={() => toggleCheck(dayKey)} style={{
                width: "100%", marginTop: 8, padding: "10px", fontSize: 11.5, fontWeight: 700, color: "#8A8A87",
              }}>Ya la hice fuera de la app — marcar directamente</button>
            )}

            {(mainDone || day.isoDate < todayLocalIso()) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 5 }}>
                  {mainDone ? "RITMO REAL" : "¿CORRISTE ESTE DÍA? ANOTA TU RITMO"}
                </div>
                {props.ritmoReal[dayKey] && !props.editingRitmo[dayKey] ? (
                  <div onClick={() => { props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:props.ritmoReal[dayKey]})); props.setEditingRitmo(p=>Object.assign({},p,{[dayKey]:true})); }}
                    style={{ fontSize: 14, fontWeight: 700, color: C.text, background: "#F2F2F0", borderRadius: 10, padding: "8px 12px" }}>
                    {props.ritmoReal[dayKey]}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={props.ritmoInput[dayKey] || ""} onChange={e => props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                      placeholder="Ej: 5:12/km o 31:20" style={{
                        flex: 1, fontSize: 13, padding: "8px 12px", borderRadius: 10,
                        background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                      }} />
                    <button className="btn" onClick={() => { props.saveRitmo(dayKey); }} style={{
                      fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: C.accent, padding: "0 14px", borderRadius: 10,
                    }}>OK</button>
                  </div>
                )}

                {day.weekN <= 3 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: CAT.running, letterSpacing: 0.5, marginBottom: 3 }}>RITMO EN LOS TRAMOS CORRIENDO</div>
                    <div style={{ fontSize: 10.5, color: "#8A8A87", marginBottom: 5, lineHeight: 1.35 }}>El dato que de verdad mide tu progreso ahora — el ritmo medio incluye lo que caminas.</div>
                    <input value={props.ritmoTramos[dayKey] || ""} onChange={e => props.setRitmoTramos(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                      placeholder="Ej: 6:00" style={{
                        width: "100%", fontSize: 13, padding: "8px 12px", borderRadius: 10, boxSizing: "border-box",
                        background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                      }} />
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 3 }}>CÓMO TE SENTISTE</div>
                  <div style={{ fontSize: 10.5, color: "#8A8A87", marginBottom: 5, lineHeight: 1.35 }}>Molestias, piernas pesadas, si completaste todo. Esto predice más que cualquier número.</div>
                  <textarea value={props.sensaciones[dayKey] || ""} onChange={e => props.setSensaciones(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                    placeholder="Ej: bien de piernas, el cuello sin molestias, completé los 6 bloques"
                    style={{
                      width: "100%", minHeight: 54, fontSize: 13, padding: "8px 12px", borderRadius: 10, boxSizing: "border-box",
                      background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                      fontFamily: "inherit", resize: "vertical",
                    }} />
                </div>
              </div>
            )}
          </ListBlock>
        )}

        {/* ═══ FUERZA — colapsable ═══ */}
        {isFuerzaDay && (
          <ListBlock id="main" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icon={ICON_FUERZA} accent={CAT.fuerza} title={day.titulo}
            statusText={doneSeries>0 && !mainDone ? (doneSeries + "/" + totalSeries) : day.dur} statusDone={mainDone}>
            <div style={{ fontSize: 12.5, color: "#787774", marginTop: 4, marginBottom: 14 }}>{day.ejercicios.length} ejercicios · {day.dur}</div>
            {!mainDone && (
              <button className="btn" onClick={onStartWorkout} style={{
                width: "100%", padding: "16px", borderRadius: 12, background: CAT.fuerza,
                fontSize: 15, fontWeight: 900, color: "#FAFAF9", letterSpacing: 0.3,
              }}>{doneSeries > 0 ? "CONTINUAR SESIÓN" : "EMPEZAR SESIÓN"}</button>
            )}
            {mainDone && (
              <div style={{ padding: "14px", borderRadius: 12, background: C.ok, textAlign: "center", fontSize: 14, fontWeight: 800, color: "#FAFAF9" }}>
                ENTRENO COMPLETADO
              </div>
            )}
          </ListBlock>
        )}

        {isCompromisoDay && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + CAT.tenis,
                        borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{day.titulo}</div>
              <div style={{ ...TYPE.meta, color: CAT.tenis }}>{day.hora}</div>
            </div>
            <div style={{ ...TYPE.body, color: C.textDim, marginTop: 6 }}>{day.what}</div>
            {day.notaPlan && (
              <div style={{ ...TYPE.bodyStrong, color: CAT.tenis, marginTop: 8, padding: "8px 10px",
                            background: C.surfaceMuted, borderRadius: 8 }}>{day.notaPlan}</div>
            )}
            {day.reglas && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid " + C.divider }}>
                {day.reglas.map((r, i) => (
                  <div key={i} style={{ ...TYPE.body, color: C.textDim, display: "flex", gap: 8, marginTop: i ? 4 : 0 }}>
                    <span style={{ color: CAT.tenis }}>·</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn" onClick={() => toggleCheck(dayKey)} style={{
              width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, minHeight: TAP_MIN,
              background: checked[dayKey] ? C.ok : "#EDEDEB",
              fontSize: 13, fontWeight: 800, color: checked[dayKey] ? "#FAFAF9" : "#787774",
            }}>{checked[dayKey] ? "HECHO" : "MARCAR COMO HECHO"}</button>
          </div>
        )}

        {day.tipo === "libre" && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Descanso</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>Sin fuerza ni running hoy</div>
          </div>
        )}

        {/* ═══ MOVILIDAD (día libre) — colapsable ═══ */}
        {(day.tipo === "libre" || isCompromisoDay) && mov.enf.length > 0 && (
          <ListBlock id="mov" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icon={ICON_MOVILIDAD} accent={CAT.movilidad} title="Movilidad del día"
            statusText={mov.enf.length + " ej."} statusDone={!!checked[dayKey+"-movenf"]}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, marginBottom: 10 }}>
              {mov.enf.map((m,i) => (
                <div key={i} onClick={() => openCatalogo(m.id)} className="btn" style={{
                  display: "flex", justifyContent: "space-between", padding: "10px 12px",
                  background: "#F2F2F0", borderRadius: 10, cursor: "pointer",
                }}>
                  <span style={{ fontSize: 13, color: "#3A3A38", fontWeight: 600 }}>{m.ex}</span>
                  <span style={{ fontSize: 11, color: "#8A8A87" }}>{m.t}</span>
                </div>
              ))}
            </div>
            <button className="btn" onClick={() => toggleCheck(dayKey+"-movenf")} style={{
              width: "100%", padding: "12px", borderRadius: 10,
              background: checked[dayKey+"-movenf"] ? C.ok : "#EDEDEB",
              fontSize: 13, fontWeight: 800, color: checked[dayKey+"-movenf"] ? "#FAFAF9" : "#787774",
            }}>{checked[dayKey+"-movenf"] ? "HECHO" : "MARCAR COMO HECHO"}</button>
          </ListBlock>
        )}

        {/* ═══ MOVER SESIÓN — colapsable, muy discreto ═══ */}
        {(isRunDay || isFuerzaDay) && (
          <MoveDayBlock dayKey={dayKey} weekN={day.weekN} dayIdx={day.dayIdx} day={day}
            week={WEEKS[day.weekIdx]} postponed={props.postponed} setPostponed={props.setPostponed} />
        )}

        {/* ═══ MOLESTIAS — colapsable ═══ */}
        <PainBlock dayKey={dayKey} expandedBlock={expandedBlock} toggleBlock={toggleBlock}
          painLog={props.painLog} setPainLog={props.setPainLog} />

        {/* ═══ NOTA — colapsable ═══ */}
        <ListBlock id="nota" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
          icon={null} accent="#8A8A87" title="Tu nota"
          statusText={notes[dayKey] ? "Escrita" : ""} statusDone={!!notes[dayKey]}>
          {notes[dayKey] && !editingNote[dayKey] ? (
            <div onClick={() => { setNoteInput(p=>Object.assign({},p,{[dayKey]:notes[dayKey]})); setEditingNote(p=>Object.assign({},p,{[dayKey]:true})); }}
              style={{ fontSize: 13, color: "#3A3A38", background: "#F2F2F0", borderRadius: 10, padding: "10px 12px" }}>
              {notes[dayKey]}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={noteInput[dayKey] || ""} onChange={e => setNoteInput(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                placeholder="Cómo ha ido..." style={{
                  flex: 1, fontSize: 13, padding: "10px 12px", borderRadius: 10,
                  background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                }} />
              <button className="btn" onClick={() => saveNote(dayKey)} style={{
                fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: C.accent, padding: "0 16px", borderRadius: 10,
              }}>OK</button>
            </div>
          )}
        </ListBlock>

      </div>
    </div>
  );
}
