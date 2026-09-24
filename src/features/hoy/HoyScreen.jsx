"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { AvisoRitmo, LecturaSesion, queApuntar } from "@/features/ui/lectura";
import { TarjetaResumen } from "@/features/ui/resumen";
import { TarjetaCalendario } from "@/features/ui/calendario";
import { ICON_FUERZA, ICON_MOVILIDAD, ICON_RUNNING, LOGO_7K } from "@/domain/assets/icons";
import { parseSeries } from "@/domain/fuerza/series";
import { BLOQUE, FECHA_FIN, FECHA_INICIO, FLAT_DAYS, WEEKS, claveDia, todayLocalIso } from "@/domain/plan/calendario";
import { getFraseHoy } from "@/domain/running/frases";
import { MOVILIDAD } from "@/domain/salud/movilidad";
import { getTecnicaEj } from "@/domain/salud/tecnica";
import { GuerreroBlock, HabitBlock, ListBlock, MagiaBlock, MoveDayBlock, PainBlock } from "@/features/hoy/bloques";
import { progresoMagia } from "@/domain/habilidades/magia";
import { WeekDots } from "@/features/ui/WeekDots";
import { destinoDe, llegadasA } from "@/lib/estado/mover-sesion";
import { PROTEINA_DIARIA } from "@/domain/nutricion/dias";
import { macrosDelDia } from "@/domain/nutricion/iifym";
export function HoyScreen(props) {
  const { day, dayKey, isToday, flatIdx, goDay, goToday, isFuerzaDay, isRunDay, isCompromisoDay, mov,
          comida, vaciarDia, cosasEnElDia, apuntesComida,
    cuelloEj, cuelloChecks, toggleCuello, checked, toggleCheck, mainDone, workoutProgress, onStartWorkout,
    notes, noteInput, setNoteInput, editingNote, setEditingNote, saveNote, openCatalogo,
    expandedBlock, setExpandedBlock, magiaRepaso, bloquesHistorial } = props;

  // Lo que llevas comido hoy, para que la tira de comida diga algo util en
  // vez de repetir siempre el mismo numero.
  const llevaComido = Math.round(macrosDelDia(apuntesComida).kcal);

  const frase = getFraseHoy(flatIdx);
  // Cuanto falta para el dia del objetivo. Es el dato que de verdad empuja.
  const diasParaObjetivo = Math.max(0, Math.round(
    (new Date(FECHA_FIN + "T12:00:00") - new Date(todayLocalIso() + "T12:00:00")) / 86400000));
  const fechaObjetivoLarga = new Date(FECHA_FIN + "T12:00:00")
    .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const tecnicaEj = getTecnicaEj(day.weekN);
  const cM = !!cuelloChecks[dayKey + "-m"], cT = !!cuelloChecks[dayKey + "-t"], cN = !!cuelloChecks[dayKey + "-n"];
  const cuelloTotal = (cM?1:0)+(cT?1:0)+(cN?1:0);
  const totalSeries = isFuerzaDay ? day.ejercicios.reduce((s,e) => s + parseSeries(e.series), 0) : 0;
  const doneSeries = isFuerzaDay && workoutProgress ? Object.values(workoutProgress).reduce((s,v) => s+(v||0),0) : 0;

  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false);

  // Lo movido: si esta sesión se fue a otro día no se enseña aquí, y si han
  // venido sesiones de otros días se enseñan. Esta segunda mitad es justo la
  // que faltaba: antes el día de destino no se enteraba de nada.
  const movidaA = destinoDe(props.postponed, dayKey);
  const recibidas = llegadasA(props.postponed, dayKey)
    .map(origen => FLAT_DAYS.find(d => d.isoDate === origen))
    .filter(Boolean);

  const startDate = new Date(FECHA_INICIO);
  const thisDate = new Date(day.isoDate || startDate);
  const daysSinceStart = Math.round((thisDate - startDate) / (1000*60*60*24));
  const isMedicionDay = daysSinceStart >= 0 && daysSinceStart % 14 === 0;

  const prevDay = flatIdx > 0 ? FLAT_DAYS[flatIdx - 1] : null;
  const prevWasImportant = prevDay && (prevDay.tipo === "test" || prevDay.esCalidad);
  const prevKey = prevDay ? claveDia(prevDay) : null;
  const missedImportantDay = prevWasImportant && prevKey && !checked[prevKey];

  const toggleBlock = (id) => setExpandedBlock(prev => prev === id ? null : id);

  // ── Barra de progreso del bloque activo ──
  const bloqueActivo = (bloquesHistorial || []).find(b => b.estado === "activo") || (bloquesHistorial || [])[0];
  const totalDiasBloque = FLAT_DAYS.length;
  const diaActualBloque = flatIdx + 1;
  const pctBloque = Math.min(100, Math.round((diaActualBloque / totalDiasBloque) * 100));

  // ── Insignias de identidad: patrones dominados, trucos aprendidos, fases superadas ──
  const trucosDominados = progresoMagia(magiaRepaso).dominados;
  const guerreroNivel = day.weekN <= 3 ? 1 : day.weekN <= 7 ? 2 : 3;
  const movilidadNivel = day.weekN <= 4 ? 1 : day.weekN <= 8 ? 2 : 3;
  const fasesSuperadas = (guerreroNivel - 1) + (movilidadNivel - 1) + (day.weekN > 2 ? 1 : 0); // cuello parte1->2 en semana 3
  const patronesTotales = 4; // hombro, cadena posterior, columna, cadera — todos activos en paralelo desde semana 1

  return (
    <div>
      {/* ═══ EL OBJETIVO — lo primero que ves, porque es por lo que haces esto ═══
           Antes aqui habia: logo, barra de progreso, una frase que regañaba y
           tres contadores que en el dia 1 marcaban 4 / 0 / 0. Lo primero que
           veias al abrir la app era que no habias hecho nada. ═══ */}
      <div style={{ padding: SP.lg + "px " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ background: C.accent, borderRadius: R.xl, padding: "16px 18px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{bloqueActivo ? bloqueActivo.nombre.toUpperCase() : "BLOQUE 1"}</span>
            <span style={{ ...TYPE.micro, color: "#8A8A87" }}>
              DÍA {diaActualBloque} DE {totalDiasBloque}
              {props.semanasCumplidas > 0 && (
                <span style={{ color: "#7FC79A" }}> · {props.semanasCumplidas} {props.semanasCumplidas === 1 ? "SEMANA CUMPLIDA" : "SEMANAS CUMPLIDAS"}</span>
              )}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: SP.md, marginTop: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 23, fontWeight: 800, color: "#FAFAF9", letterSpacing: -0.5, lineHeight: 1.1 }}>
                {BLOQUE.objetivo}
              </div>
              <div style={{ ...TYPE.meta, color: "#A8A8A5", marginTop: 4 }}>{fechaObjetivoLarga}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: "#FAFAF9", lineHeight: 1, letterSpacing: -1 }}>
                {diasParaObjetivo}
              </div>
              <div style={{ ...TYPE.micro, color: "#8A8A87", marginTop: 3 }}>DÍAS</div>
            </div>
          </div>

          <div style={{ height: 4, background: "#3A3A38", borderRadius: 3, overflow: "hidden", marginTop: 14 }}>
            <div style={{ width: pctBloque + "%", height: "100%", background: "#FAFAF9", borderRadius: 3, transition: "width .3s ease" }} />
          </div>
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

      {/* La comida del dia. En cuanto apuntas algo deja de decir la regla y
          pasa a decir lo que te queda, que es lo unico que necesitas saber a
          las nueve de la noche. Se toca y lleva a NUTRICION. */}
      {comida && (
        <div style={{ padding: "0 16px 10px" }}>
          <button className="btn" onClick={props.irANutricion} style={{
            width: "100%", textAlign: "left",
            display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderRadius: 11,
            background: C.card, border: "1px solid " + C.cardBorder,
            borderLeft: "3px solid " + (comida.id === "comer" ? CAT.fuerza : C.textFaint) }}>
            <div style={{ ...TYPE.micro, color: comida.id === "comer" ? CAT.fuerza : C.textDim,
                          background: C.card, padding: "4px 8px", borderRadius: 999, flexShrink: 0 }}>
              {comida.etiqueta}
            </div>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              {llevaComido > 0 ? (
                <>
                  <div style={{ ...TYPE.bodyStrong, color: C.text }}>
                    {llevaComido} de {comida.macros.kcal} kcal · quedan {comida.macros.kcal - llevaComido}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 1 }}>Toca para ver qué cenar</div>
                </>
              ) : (
                <>
                  <div style={{ ...TYPE.bodyStrong, color: C.text }}>{comida.kcal} · proteína {PROTEINA_DIARIA}</div>
                  <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 1 }}>{comida.detalle}</div>
                </>
              )}
            </div>
            <span style={{ color: C.textFaint, fontSize: 16, flexShrink: 0 }}>›</span>
          </button>
        </div>
      )}

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>

        {missedImportantDay && (
          <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#171717" }}>Ayer tocaba {prevDay.tipo === "test" ? "un test" : "calidad"} y no quedó registrada</div>
            <div style={{ fontSize: 10.5, color: "#787774", marginTop: 2 }}>{prevDay.titulo} — márcala en Semana si la hiciste.</div>
          </div>
        )}

        {isMedicionDay && (
          <div style={{ background: "#FDF6E3", border: "1px solid #E8D9A8", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#171717" }}>Hoy toca medir</div>
            <div style={{ fontSize: 11.5, color: "#4A4A47", marginTop: 2, lineHeight: 1.4 }}>
              Cintura, ancho de hombro y una foto de frente y otra de lado. En ayunas, con la misma luz que la última vez. Se apunta en PROGRESO.
            </div>
          </div>
        )}

        {props.resumenSemana && <TarjetaResumen resumen={props.resumenSemana} nombreBloque="Base 7K" />}

        {isToday && <TarjetaCalendario modo="hoy" />}

        {isToday && props.copia && props.copia.toca && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 12, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text }}>Guarda la copia de la semana</div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2, lineHeight: 1.4 }}>
                {props.copia.dias == null ? "Todavía no tienes ninguna." : "La última es de hace " + props.copia.dias + " días."} Todo vive solo en este móvil.
              </div>
            </div>
            <button className="btn" onClick={props.onCopia} style={{
              minHeight: TAP_MIN, padding: "0 14px", borderRadius: 10, background: C.accent,
              fontSize: 12, fontWeight: 800, color: "#FAFAF9", flexShrink: 0,
            }}>GUARDAR</button>
          </div>
        )}

        {/* ═══ RUNNING — colapsable ═══ */}
        {isRunDay && !movidaA && (
          <ListBlock id="main" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icon={ICON_RUNNING} accent={CAT.running} title={day.titulo}
            statusText={day.dur} statusDone={mainDone}>
            <div style={{ fontSize: 13, color: "#4A4A47", marginTop: 4, marginBottom: 14, lineHeight: 1.5 }}>{day.what}</div>
            <AvisoRitmo day={day} ritmoReal={props.ritmoReal} />

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
            {mainDone && <BotonDesmarcar onClick={() => toggleCheck(dayKey)} />}
            {!mainDone && (
              <button className="btn" onClick={() => toggleCheck(dayKey)} style={{
                width: "100%", marginTop: 8, padding: "10px", fontSize: 11.5, fontWeight: 700, color: "#8A8A87",
              }}>Ya la hice fuera de la app — marcar directamente</button>
            )}

            {(mainDone || day.isoDate < todayLocalIso()) && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 5 }}>
                  {mainDone ? queApuntar(day).label : "¿CORRISTE ESTE DÍA? " + queApuntar(day).label}
                </div>
                {props.ritmoReal[dayKey] && !props.editingRitmo[dayKey] ? (
                  <div onClick={() => { props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:props.ritmoReal[dayKey]})); props.setEditingRitmo(p=>Object.assign({},p,{[dayKey]:true})); }}
                    style={{ fontSize: 14, fontWeight: 700, color: C.text, background: "#F2F2F0", borderRadius: 10, padding: "8px 12px" }}>
                    {props.ritmoReal[dayKey]}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={props.ritmoInput[dayKey] || ""} onChange={e => props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                      placeholder={queApuntar(day).ph} style={{
                        flex: 1, fontSize: 13, padding: "8px 12px", borderRadius: 10,
                        background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                      }} />
                    <button className="btn" onClick={() => { props.saveRitmo(dayKey); }} style={{
                      fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: C.accent, padding: "0 14px", borderRadius: 10,
                    }}>OK</button>
                  </div>
                )}
                {props.ritmoReal[dayKey] && !props.editingRitmo[dayKey] && (
                  <LecturaSesion day={day} texto={props.ritmoReal[dayKey]} ritmoReal={props.ritmoReal} />
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
        {isFuerzaDay && !movidaA && (
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
            {mainDone && <BotonDesmarcar onClick={() => toggleCheck(dayKey)} />}
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

        {/* ═══ LO DE CADA DÍA — debajo de la sesión, que es lo que manda ═══ */}
        {/* ═══ CUELLO — habito minimo, espacio propio ═══ */}
        <HabitBlock cuelloEj={cuelloEj} cM={cM} cT={cT} cN={cN} cuelloTotal={cuelloTotal} toggleCuello={toggleCuello}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock} />

        {/* ═══ MAGIA — habilidad aparte, espacio propio ═══ */}
        <MagiaBlock day={day} magiaRepaso={props.magiaRepaso}
          dominarTruco={props.dominarTruco} responderRepaso={props.responderRepaso}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock}
          onOpenCatalogo={props.onOpenMagiaCatalogo} />

        {/* ═══ GUERRERO — habilidad aparte, control bajo presion ═══ */}
        <GuerreroBlock day={day} dayKey={dayKey} guerreroLog={props.guerreroLog} setGuerreroLog={props.setGuerreroLog}
          expandedBlock={expandedBlock} toggleBlock={toggleBlock} />

        <div style={{ ...TYPE.body, color: C.textFaint, textAlign: "center", padding: "2px 8px 4px" }}>{frase}</div>

        {day.tipo === "libre" && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Descanso</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>Sin fuerza, running ni movilidad. Descansar también es el plan.</div>
          </div>
        )}

        {/* ═══ TENIS — su movilidad, en la pista. Los dias de descanso no llevan
            movilidad: todo va dentro de alguna sesion, no suelto para casa. ═══ */}
        {isCompromisoDay && (mov.cal.length + mov.enf.length) > 0 && (
          <ListBlock id="mov" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icon={ICON_MOVILIDAD} accent={CAT.movilidad} title="Antes y después del tenis"
            statusText={(mov.cal.length + mov.enf.length) + " ej."} statusDone={!!checked[dayKey+"-movenf"]}>
            {[["ANTES, EN LA PISTA", mov.cal], ["DESPUÉS", mov.enf]].filter(([, l]) => l.length).map(([titulo, lista]) => (
              <div key={titulo} style={{ marginTop: 4, marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: 0.5, marginBottom: 6 }}>{titulo}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {lista.map((m,i) => (
                    <div key={i} onClick={() => m.id && openCatalogo(m.id)} className="btn" style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 12px",
                      background: "#F2F2F0", borderRadius: 10, cursor: "pointer",
                    }}>
                      <span style={{ fontSize: 13, color: "#3A3A38", fontWeight: 600 }}>{m.ex}</span>
                      <span style={{ fontSize: 11, color: "#8A8A87" }}>{m.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn" onClick={() => toggleCheck(dayKey+"-movenf")} style={{
              width: "100%", padding: "12px", borderRadius: 10,
              background: checked[dayKey+"-movenf"] ? C.ok : "#EDEDEB",
              fontSize: 13, fontWeight: 800, color: checked[dayKey+"-movenf"] ? "#FAFAF9" : "#787774",
            }}>{checked[dayKey+"-movenf"] ? "HECHO" : "MARCAR COMO HECHO"}</button>
          </ListBlock>
        )}

        {/* ═══ VACIAR EL DÍA — solo aparece si hay algo que vaciar ═══ */}
        {cosasEnElDia > 0 && (
          <div style={{ marginTop: 4 }}>
            {confirmandoVaciar ? (
              <div style={{ background: C.card, border: "1px solid " + CAT.running, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ ...TYPE.bodyStrong, color: C.text }}>
                  Se borra todo lo registrado este día
                </div>
                <div style={{ ...TYPE.body, color: C.textDim, marginTop: 2 }}>
                  {cosasEnElDia} {cosasEnElDia === 1 ? "registro" : "registros"}: marcas, pesos, ritmo y sensaciones.
                  Podrás deshacerlo durante unos segundos.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn" onClick={() => { vaciarDia(dayKey); setConfirmandoVaciar(false); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 10, minHeight: TAP_MIN,
                             background: CAT.running, color: "#FAFAF9", fontSize: 12.5, fontWeight: 800 }}>
                    VACIAR
                  </button>
                  <button className="btn" onClick={() => setConfirmandoVaciar(false)}
                    style={{ flex: 1, padding: "11px", borderRadius: 10, minHeight: TAP_MIN,
                             background: "#EDEDEB", color: C.textDim, fontSize: 12.5, fontWeight: 800 }}>
                    CANCELAR
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn" onClick={() => setConfirmandoVaciar(true)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, minHeight: TAP_MIN,
                         background: "transparent", color: C.textFaint, fontSize: 11.5, fontWeight: 700 }}>
                Vaciar este día
              </button>
            )}
          </div>
        )}

        {/* ═══ SESIONES QUE HAN VENIDO DE OTRO DÍA ═══ */}
        {recibidas.map(origen => (
          <div key={origen.isoDate} style={{ background: C.card, border: "1px solid " + C.cardBorder,
                                             borderLeft: "3px solid " + CAT.running, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ ...TYPE.sectionLabel, color: CAT.running }}>MOVIDA DESDE {origen.dow.toUpperCase()} {origen.date}</div>
            <div style={{ ...TYPE.cardTitle, color: C.text, marginTop: 4 }}>{origen.titulo}</div>
            {origen.dur && <div style={{ ...TYPE.meta, color: C.textDim, marginTop: 2 }}>{origen.dur}{origen.rpe ? " · RPE " + origen.rpe : ""}</div>}
            {origen.what && <div style={{ ...TYPE.body, color: C.textDim, marginTop: 6 }}>{origen.what}</div>}
            {origen.ejercicios && (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {origen.ejercicios.map((e, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#4A4A47" }}>
                    <span>{e.nombre}</span><span className="mono" style={{ color: C.textFaint }}>{e.series}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn" onClick={() => toggleCheck(claveDia(origen))} style={{
              width: "100%", marginTop: 12, padding: "12px", borderRadius: 10, minHeight: TAP_MIN,
              background: checked[claveDia(origen)] ? C.ok : "#EDEDEB",
              fontSize: 13, fontWeight: 800, color: checked[claveDia(origen)] ? "#FAFAF9" : "#787774",
            }}>{checked[claveDia(origen)] ? "HECHA" : "MARCAR COMO HECHA"}</button>
          </div>
        ))}

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

/** Deshace el "hecho" de la sesion principal. Marcarla es un toque y se hace
 *  sin querer; sin esto no habia forma de volver atras ni de repetirla. Solo
 *  quita el check: el ritmo, las sensaciones y las series se quedan. */
function BotonDesmarcar({ onClick }) {
  return (
    <button className="btn" onClick={onClick} style={{
      width: "100%", marginTop: 8, padding: "10px", minHeight: TAP_MIN,
      fontSize: 11.5, fontWeight: 700, color: "#8A8A87",
    }}>Me equivoqué — desmarcar para repetirla</button>
  );
}
