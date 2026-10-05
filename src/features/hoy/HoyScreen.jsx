"use client";

import { useState } from "react";
import { A, C, CARD, TAP_MIN, TYPE } from "@/design/tokens";
import { Boton, Etiqueta, Icono, IconoCaja, Tarjeta } from "@/features/ui/aire";
import { AvisoRitmo, LecturaSesion, queApuntar } from "@/features/ui/lectura";
import { MapaRuta } from "@/features/ui/MapaRuta";
import { textoTiempo } from "@/domain/running/gps";

/** La traza entera guardada de la ultima salida, si es la de este dia (para el GPX completo). */
function trazaCompletaDe(dayKey) {
  try {
    const t = JSON.parse(window.localStorage.getItem("programa7k:ultima-traza") || "null");
    return t && t.dia === dayKey ? t.ruta : null;
  } catch { return null; }
}
import { TarjetaResumen } from "@/features/ui/resumen";
import { TarjetaCalendario } from "@/features/ui/calendario";
import { LineaPlan } from "@/features/ui/plan-vs-real";
import { nombreMes } from "@/domain/progreso/informe";
import { parseSeries } from "@/domain/fuerza/series";
import { BLOQUE, FECHA_FIN, FECHA_INICIO, FLAT_DAYS, WEEKS, claveDia, todayLocalIso } from "@/domain/plan/calendario";
import { getFraseHoy } from "@/domain/running/frases";
import { getTecnicaEj } from "@/domain/salud/tecnica";
import { GuerreroBlock, HabitBlock, ListBlock, MagiaBlock, MoveDayBlock, PainBlock } from "@/features/hoy/bloques";
import { progresoMagia } from "@/domain/habilidades/magia";
import { WeekDots } from "@/features/ui/WeekDots";
import { destinoDe, llegadasA } from "@/lib/estado/mover-sesion";
export function HoyScreen(props) {
  const { day, dayKey, isToday, flatIdx, goDay, goToday, isFuerzaDay, isRunDay, isCompromisoDay, mov,
          comida, vaciarDia, cosasEnElDia,
    cuelloEj, cuelloChecks, toggleCuello, checked, toggleCheck, mainDone, workoutProgress, onStartWorkout,
    notes, noteInput, setNoteInput, editingNote, setEditingNote, saveNote, openCatalogo,
    expandedBlock, setExpandedBlock, magiaRepaso, bloquesHistorial } = props;



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

  const habito = (id) => setExpandedBlock(prev => prev === id ? null : id);
  // El mapa de portada: la salida de este dia si la hay (se ve entera abajo,
  // al apuntar) o, si no, la ultima que hiciste.
  const salidaPortada = props.gpsDelDia && props.gpsDelDia.ruta ? null : props.ultimaSalida;
  const etiquetaSesion = day.tipo === "test" ? "Test" : day.tipo === "objetivo" ? "El objetivo" : day.esCalidad ? "Calidad" : "Carrera";
  const [durNum, durUd] = String(day.dur || "").split(" ");
  const magiaProg = progresoMagia(magiaRepaso);

  return (
    <div style={{ padding: "12px 20px 0" }}>
      {/* ═══ CABECERA: la fecha, cuanto falta y la semana de un vistazo ═══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textDim }}>{day.dow}, {day.date}</div>
        <div title={BLOQUE.objetivo + " · " + fechaObjetivoLarga} style={{ display: "flex", alignItems: "center", gap: 5, background: C.card,
                      borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 700, color: C.text, boxShadow: CARD.boxShadow }}>
          <Icono nombre="meta" tam={14} color={A.verde} grosor={2.2} /> {diasParaObjetivo} días
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>{isToday ? "Hoy" : day.dow}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {!isToday && (
            <button className="btn" onClick={goToday} style={{ fontSize: 14, fontWeight: 600, color: A.azul, padding: "0 8px", minHeight: TAP_MIN }}>Volver a hoy</button>
          )}
          <button className="btn" aria-label="Día anterior" onClick={() => goDay(-1)} style={{ width: 36, height: TAP_MIN, color: A.azul, display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="izquierda" tam={22} grosor={2.4} /></button>
          <button className="btn" aria-label="Día siguiente" onClick={() => goDay(1)} style={{ width: 36, height: TAP_MIN, color: A.azul, display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="flecha" tam={22} grosor={2.4} /></button>
        </div>
      </div>

      <WeekDots day={day} checked={checked} onJumpDay={props.onJumpDay} />

      {isToday && (
        <div style={{ marginTop: 12 }}>
          <LineaPlan ritmoReal={props.ritmoReal} onVer={props.onVerProgreso} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>

        {missedImportantDay && (
          <Tarjeta style={{ padding: "13px 16px", background: A.fondo.naranja }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Ayer tocaba {prevDay.tipo === "test" ? "un test" : "calidad"} y no quedó registrada</div>
            <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>{prevDay.titulo} — márcala en Semana si la hiciste.</div>
          </Tarjeta>
        )}

        {isMedicionDay && (
          <Tarjeta style={{ padding: "13px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <IconoCaja nombre="regla" tono="azul" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Hoy toca medir</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2, lineHeight: 1.4 }}>
                Cintura, ancho de hombro y una foto de frente y otra de lado. En ayunas, con la misma luz que la última vez. Se apunta en Progreso.
              </div>
            </div>
          </Tarjeta>
        )}

        {props.informePendiente && (
          <button className="btn" onClick={() => props.onVerInforme(props.informePendiente)} style={{
            ...CARD, width: "100%", textAlign: "left", background: "#1C1C1E", padding: "16px",
            display: "flex", alignItems: "center", gap: 12, minHeight: TAP_MIN,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#AEAEB2" }}>Tu mes está listo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>Tu {nombreMes(props.informePendiente)}</div>
            </div>
            <Icono nombre="flecha" tam={20} color={A.verde} grosor={2.4} />
          </button>
        )}

        {props.resumenSemana && <TarjetaResumen resumen={props.resumenSemana} nombreBloque="Base 7K" />}

        {isToday && <TarjetaCalendario modo="hoy" />}

        {isToday && props.copia && props.copia.toca && (
          <Tarjeta style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <IconoCaja nombre="copia" tono="gris" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Guarda la copia de la semana</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2, lineHeight: 1.4 }}>
                {props.copia.dias == null ? "Todavía no tienes ninguna." : "La última es de hace " + props.copia.dias + " días."} Todo vive solo en este móvil.
              </div>
            </div>
            <button className="btn" onClick={props.onCopia} style={{
              minHeight: 36, padding: "0 14px", borderRadius: 999, background: A.azul,
              fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>Guardar</button>
          </Tarjeta>
        )}

        {/* ═══ LA SESION — manda la pantalla: mapa, titulo, datos y empezar ═══ */}
        {isRunDay && !movidaA && (
          <Tarjeta data-sesion style={{ overflow: "hidden" }}>
            {salidaPortada && salidaPortada.ruta && (
              <MapaRuta mini alto={220} ruta={salidaPortada.ruta} objetivo={salidaPortada.obj} titulo={day.titulo} fecha={day.isoDate}
                etiqueta={"Último: " + (salidaPortada.m / 1000).toFixed(2).replace(".", ",") + " km" + (salidaPortada.m >= 500 ? " · " + textoTiempo(salidaPortada.seg / salidaPortada.m * 1000) + "/km" : "")} />
            )}
            <div style={{ padding: 16 }}>
              <Etiqueta color={A.rojo}>{etiquetaSesion}</Etiqueta>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15, color: C.text, marginTop: 2 }}>{day.titulo}</div>
              <div style={{ display: "flex", gap: 20, margin: "12px 0 4px" }}>
                {durNum && <Dato v={durNum} l={durUd || ""} />}
                {day.rpe && <Dato v={day.rpe} l="RPE" />}
                {comida && <Dato v={comida.macros.kcal.toLocaleString("es-ES")} l={"kcal · " + comida.etiqueta.toLowerCase()} />}
              </div>
              <div style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.5, margin: "8px 0 12px" }}>{day.what}</div>
              <AvisoRitmo day={day} ritmoReal={props.ritmoReal} />

              <div style={{ background: A.fondo.azul, borderRadius: 14, padding: "11px 13px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: A.azul }}>Foco de técnica</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.azul, background: "#fff", padding: "1px 7px", borderRadius: 999 }}>{tecnicaEj.foco}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{tecnicaEj.nombre}</div>
                <div style={{ fontSize: 13, color: "#3A3A3C", lineHeight: 1.4 }}>{tecnicaEj.verificable}</div>
              </div>

              {!mainDone && <Boton tipo="color" color={A.rojo} onClick={onStartWorkout}>Empezar sesión</Boton>}
              {mainDone && (
                <div style={{ minHeight: 50, borderRadius: 999, background: A.fondo.verde, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              fontSize: 15, fontWeight: 700, color: C.ok }}><Icono nombre="check" tam={18} grosor={2.6} /> Sesión completada</div>
              )}
              {mainDone && <BotonDesmarcar onClick={() => toggleCheck(dayKey)} />}
              {!mainDone && (
                <button className="btn" onClick={() => toggleCheck(dayKey)} style={{
                  width: "100%", marginTop: 6, padding: "10px", fontSize: 13, fontWeight: 600, color: A.azul,
                }}>Ya la hice fuera de la app — marcar directamente</button>
              )}

              {(mainDone || day.isoDate < todayLocalIso()) && (
                <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid " + C.divider }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.textDim, marginBottom: 6 }}>
                    {mainDone ? queApuntar(day).label : "¿Corriste este día? " + queApuntar(day).label}
                  </div>
                  {props.ritmoReal[dayKey] && !props.editingRitmo[dayKey] ? (
                    <div onClick={() => { props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:props.ritmoReal[dayKey]})); props.setEditingRitmo(p=>Object.assign({},p,{[dayKey]:true})); }}
                      style={{ fontSize: 16, fontWeight: 700, color: C.text, background: C.surfaceMuted, borderRadius: 12, padding: "10px 14px" }}>
                      {props.ritmoReal[dayKey]}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={props.ritmoInput[dayKey] || ""} onChange={e => props.setRitmoInput(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                        placeholder={queApuntar(day).ph} style={campo} />
                      <button className="btn" onClick={() => { props.saveRitmo(dayKey); }} style={botonOk}>OK</button>
                    </div>
                  )}
                  {props.ritmoReal[dayKey] && !props.editingRitmo[dayKey] && (
                    <LecturaSesion day={day} texto={props.ritmoReal[dayKey]} ritmoReal={props.ritmoReal} />
                  )}

                  {/* La salida con GPS de ese dia: lo medido y su mapa, tambien dias despues. */}
                  {props.gpsDelDia && props.gpsDelDia.m > 0 && (
                    <div data-salida style={{ marginTop: 12 }}>
                      {!props.gpsDelDia.ruta && (
                        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.textDim, marginBottom: 8 }}>
                          GPS: {(props.gpsDelDia.m / 1000).toFixed(2).replace(".", ",")} km · {textoTiempo(props.gpsDelDia.seg)}
                          {props.gpsDelDia.m >= 500 ? " · " + textoTiempo(props.gpsDelDia.seg / props.gpsDelDia.m * 1000) + "/km" : ""}
                        </div>
                      )}
                      {props.gpsDelDia.ruta && (
                        <MapaRuta ruta={props.gpsDelDia.ruta} objetivo={props.gpsDelDia.obj} titulo={day.titulo} fecha={day.isoDate} rutaCompleta={trazaCompletaDe(dayKey)} datos={props.gpsDelDia} />
                      )}
                    </div>
                  )}

                  {day.weekN <= 3 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: A.rojo, marginBottom: 2 }}>Ritmo en los tramos corriendo</div>
                      <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 6, lineHeight: 1.35 }}>El dato que de verdad mide tu progreso ahora — el ritmo medio incluye lo que caminas.</div>
                      <input value={props.ritmoTramos[dayKey] || ""} onChange={e => props.setRitmoTramos(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                        placeholder="Ej: 6:00" style={{ ...campo, width: "100%" }} />
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textDim, marginBottom: 2 }}>Cómo te sentiste</div>
                    <div style={{ fontSize: 12.5, color: C.textDim, marginBottom: 6, lineHeight: 1.35 }}>Molestias, piernas pesadas, si completaste todo. Esto predice más que cualquier número.</div>
                    <textarea value={props.sensaciones[dayKey] || ""} onChange={e => props.setSensaciones(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                      placeholder="Ej: bien de piernas, el cuello sin molestias, completé los 6 bloques"
                      style={{ ...campo, width: "100%", minHeight: 60, fontFamily: "inherit", resize: "vertical" }} />
                  </div>
                </div>
              )}
            </div>
          </Tarjeta>
        )}

        {isFuerzaDay && !movidaA && (
          <Tarjeta data-sesion style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <IconoCaja nombre="mancuerna" tono="verde" tam={46} />
              <div style={{ minWidth: 0 }}>
                <Etiqueta color={C.ok}>Fuerza</Etiqueta>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15, color: C.text, marginTop: 1 }}>{day.titulo}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, margin: "14px 0 14px" }}>
              <Dato v={day.ejercicios.length} l="ejercicios" />
              {durNum && <Dato v={durNum} l={durUd || ""} />}
              <Dato v={doneSeries + "/" + totalSeries} l="series" />
            </div>
            {!mainDone && <Boton onClick={onStartWorkout}>{doneSeries > 0 ? "Continuar sesión" : "Empezar sesión"}</Boton>}
            {mainDone && (
              <div style={{ minHeight: 50, borderRadius: 999, background: A.fondo.verde, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            fontSize: 15, fontWeight: 700, color: C.ok }}><Icono nombre="check" tam={18} grosor={2.6} /> Entreno completado</div>
            )}
            {mainDone && <BotonDesmarcar onClick={() => toggleCheck(dayKey)} />}
          </Tarjeta>
        )}

        {isCompromisoDay && (
          <Tarjeta data-sesion style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <IconoCaja nombre="tenis" tono="verde" tam={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Etiqueta color={C.ok}>Compromiso · {day.hora}</Etiqueta>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, color: C.text, marginTop: 1 }}>{day.titulo}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.5, marginTop: 10 }}>{day.what}</div>
            {day.notaPlan && (
              <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ok, marginTop: 10, padding: "10px 12px", background: A.fondo.verde, borderRadius: 12 }}>{day.notaPlan}</div>
            )}
            {day.reglas && (
              <div style={{ marginTop: 10 }}>
                {day.reglas.map((r, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: "#3A3A3C", lineHeight: 1.45, display: "flex", gap: 8, marginTop: i ? 4 : 0 }}>
                    <span style={{ color: A.verde, fontWeight: 800 }}>·</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Boton tipo={checked[dayKey] ? "color" : "oscuro"} color={A.verde} onClick={() => toggleCheck(dayKey)}>{checked[dayKey] ? "Hecho ✓" : "Marcar como hecho"}</Boton>
            </div>
          </Tarjeta>
        )}

        {day.tipo === "libre" && (
          <Tarjeta style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <IconoCaja nombre="reloj" tono="gris" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Descanso</div>
              <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>Sin fuerza, running ni movilidad. Descansar también es el plan.</div>
            </div>
          </Tarjeta>
        )}

        {/* ═══ TENIS — su movilidad, en la pista ═══ */}
        {isCompromisoDay && (mov.cal.length + mov.enf.length) > 0 && (
          <ListBlock id="mov" expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            icono="pierna" tono="naranja" title="Antes y después del tenis"
            statusText={(mov.cal.length + mov.enf.length) + " ej."} statusDone={!!checked[dayKey+"-movenf"]}>
            {[["Antes, en la pista", mov.cal], ["Después", mov.enf]].filter(([, l]) => l.length).map(([titulo, lista]) => (
              <div key={titulo} style={{ marginTop: 4, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textDim, marginBottom: 6 }}>{titulo}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {lista.map((m,i) => (
                    <div key={i} onClick={() => m.id && openCatalogo(m.id)} className="btn" style={{
                      display: "flex", justifyContent: "space-between", padding: "11px 13px",
                      background: C.surfaceMuted, borderRadius: 12, cursor: "pointer",
                    }}>
                      <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{m.ex}</span>
                      <span style={{ fontSize: 12.5, color: C.textDim }}>{m.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Boton tipo={checked[dayKey+"-movenf"] ? "color" : "oscuro"} color={A.verde} onClick={() => toggleCheck(dayKey+"-movenf")}>{checked[dayKey+"-movenf"] ? "Hecho ✓" : "Marcar como hecho"}</Boton>
          </ListBlock>
        )}

        {/* ═══ LO DE CADA DIA, EN 4 CUADROS: toca uno y se abre debajo ═══ */}
        <div data-habitos style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {comida && (
            <Cuadro icono="plato" tono="verde" v={comida.macros.kcal.toLocaleString("es-ES")} l={"kcal · " + comida.etiqueta.toLowerCase()} onClick={props.irANutricion} />
          )}
          <Cuadro icono="cuello" tono="azul" v={cuelloTotal + "/3"} l="cuello" hecho={cuelloTotal === 3} activo={expandedBlock === "cuello"} onClick={() => habito("cuello")} />
          <Cuadro icono="magia" tono="morado" v={magiaProg.dominados + "/" + magiaProg.total} l="magia" activo={expandedBlock === "magia"} onClick={() => habito("magia")} />
          <Cuadro icono="escudo" tono="gris" v={props.guerreroLog[dayKey] ? "✓" : "—"} l="guerrero" hecho={!!props.guerreroLog[dayKey]} activo={expandedBlock === "guerrero"} onClick={() => habito("guerrero")} />
        </div>
        {expandedBlock === "cuello" && (
          <HabitBlock cuelloEj={cuelloEj} cM={cM} cT={cT} cN={cN} cuelloTotal={cuelloTotal} toggleCuello={toggleCuello}
            expandedBlock={expandedBlock} toggleBlock={toggleBlock} />
        )}
        {expandedBlock === "magia" && (
          <MagiaBlock day={day} magiaRepaso={props.magiaRepaso}
            dominarTruco={props.dominarTruco} responderRepaso={props.responderRepaso}
            expandedBlock={expandedBlock} toggleBlock={toggleBlock}
            onOpenCatalogo={props.onOpenMagiaCatalogo} />
        )}
        {expandedBlock === "guerrero" && (
          <GuerreroBlock day={day} dayKey={dayKey} guerreroLog={props.guerreroLog} setGuerreroLog={props.setGuerreroLog}
            expandedBlock={expandedBlock} toggleBlock={toggleBlock} />
        )}

        <div style={{ fontSize: 13.5, color: C.textFaint, textAlign: "center", padding: "2px 8px 0", lineHeight: 1.45 }}>{frase}</div>

        {/* ═══ VACIAR EL DÍA — solo aparece si hay algo que vaciar ═══ */}
        {cosasEnElDia > 0 && (
          <div style={{ marginTop: 4 }}>
            {confirmandoVaciar ? (
              <div style={{ ...CARD, padding: "14px 16px" }}>
                <div style={{ ...TYPE.bodyStrong, color: C.text }}>
                  Se borra todo lo registrado este día
                </div>
                <div style={{ ...TYPE.body, color: C.textDim, marginTop: 2 }}>
                  {cosasEnElDia} {cosasEnElDia === 1 ? "registro" : "registros"}: marcas, pesos, ritmo y sensaciones.
                  Podrás deshacerlo durante unos segundos.
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn" onClick={() => { vaciarDia(dayKey); setConfirmandoVaciar(false); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 999, minHeight: TAP_MIN,
                             background: A.rojo, color: "#fff", fontSize: 14, fontWeight: 700 }}>
                    Vaciar
                  </button>
                  <button className="btn" onClick={() => setConfirmandoVaciar(false)}
                    style={{ flex: 1, padding: "11px", borderRadius: 999, minHeight: TAP_MIN,
                             background: "#E5E5EA", color: C.text, fontSize: 14, fontWeight: 700 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn" onClick={() => setConfirmandoVaciar(true)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, minHeight: TAP_MIN,
                         background: "transparent", color: C.textFaint, fontSize: 13, fontWeight: 600 }}>
                Vaciar este día
              </button>
            )}
          </div>
        )}

        {/* ═══ SESIONES QUE HAN VENIDO DE OTRO DÍA ═══ */}
        {recibidas.map(origen => (
          <div key={origen.isoDate} style={{ ...CARD, padding: "14px 16px" }}>
            <Etiqueta color={A.naranja}>Movida desde {origen.dow} {origen.date}</Etiqueta>
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
            <div style={{ marginTop: 12 }}>
              <Boton tipo={checked[claveDia(origen)] ? "color" : "oscuro"} color={A.verde} onClick={() => toggleCheck(claveDia(origen))}>{checked[claveDia(origen)] ? "Hecha ✓" : "Marcar como hecha"}</Boton>
            </div>
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
          icono="nota" tono="gris" title="Tu nota"
          statusText={notes[dayKey] ? "Escrita" : ""} statusDone={!!notes[dayKey]}>
          {notes[dayKey] && !editingNote[dayKey] ? (
            <div onClick={() => { setNoteInput(p=>Object.assign({},p,{[dayKey]:notes[dayKey]})); setEditingNote(p=>Object.assign({},p,{[dayKey]:true})); }}
              style={{ fontSize: 14, color: C.text, background: C.surfaceMuted, borderRadius: 12, padding: "10px 14px" }}>
              {notes[dayKey]}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={noteInput[dayKey] || ""} onChange={e => setNoteInput(p=>Object.assign({},p,{[dayKey]:e.target.value}))}
                placeholder="Cómo ha ido..." style={campo} />
              <button className="btn" onClick={() => saveNote(dayKey)} style={botonOk}>OK</button>
            </div>
          )}
        </ListBlock>

      </div>
    </div>
  );
}

/** Un dato grande con su unidad debajo ("28 / min"). */
function Dato({ v, l }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.4 }}>{v}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.textDim }}>{l}</div>
    </div>
  );
}

/** Cuadro de habito: icono, cifra y que es. Toca para abrir su bloque. */
function Cuadro({ icono, tono, v, l, hecho, activo, onClick }) {
  return (
    <button className="btn" onClick={onClick} data-cuadro={l} style={{
      ...CARD, padding: 14, textAlign: "left", minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between",
      outline: activo ? "2px solid " + A.azul : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <IconoCaja nombre={icono} tono={tono} tam={34} />
        {hecho && <Icono nombre="check" tam={18} color={A.verde} grosor={2.8} />}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>{v}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: C.textDim }}>{l}</div>
      </div>
    </button>
  );
}

const campo = { flex: 1, fontSize: 16, padding: "10px 14px", borderRadius: 12, background: C.surfaceMuted, border: "none", color: C.text, outline: "none" };
const botonOk = { fontSize: 15, fontWeight: 700, color: "#fff", background: A.azul, padding: "0 18px", borderRadius: 12, minHeight: TAP_MIN };

/** Deshace el "hecho" de la sesion principal. Marcarla es un toque y se hace
 *  sin querer; sin esto no habia forma de volver atras ni de repetirla. Solo
 *  quita el check: el ritmo, las sensaciones y las series se quedan. */
function BotonDesmarcar({ onClick }) {
  return (
    <button className="btn" onClick={onClick} style={{
      width: "100%", marginTop: 8, padding: "10px", minHeight: TAP_MIN,
      fontSize: 13, fontWeight: 600, color: C.textDim,
    }}>Me equivoqué — desmarcar para repetirla</button>
  );
}
