"use client";

import { useState } from "react";
import { A, C, CARD, TAP_MIN, TYPE } from "@/design/tokens";
import { Boton, Chevron, Etiqueta, Icono, IconoCaja, Tarjeta } from "@/features/ui/aire";
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
import { nombreMes } from "@/domain/progreso/informe";
import { parseSeries } from "@/domain/fuerza/series";
import { BLOQUE, FECHA_FIN, FECHA_INICIO, FLAT_DAYS, claveDia, todayLocalIso } from "@/domain/plan/calendario";
import { getFraseHoy } from "@/domain/running/frases";
import { getTecnicaEj } from "@/domain/salud/tecnica";
import { GuerreroBlock, ListBlock, MagiaBlock, MoveDayBlock, PainBlock } from "@/features/hoy/bloques";
import { progresoMagia } from "@/domain/habilidades/magia";
import { WeekDots } from "@/features/ui/WeekDots";
import { destinoDe, llegadasA } from "@/lib/estado/mover-sesion";
import { dejarPasar, deshacer, diaHablado, esClave, nombreDe, pendienteDeRecolocar, proponerHueco } from "@/domain/plan/reprogramar";
import { Recolocar } from "@/features/hoy/Recolocar";
import { FinPrueba, SentirSemana } from "@/features/hoy/AhoraYAvance";
import { ListaHoy } from "@/features/hoy/ListaHoy";
import { ahoraToca } from "@/domain/hoy/ahora";
import { ritmoEsperado } from "@/domain/running/esperado";
import { compararPrueba, diaDePrueba, diaEnPrueba, lunesDe, quedarse, tocaDecidir, volverAlPlan } from "@/domain/hoy/prueba";
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

  // ── Lo de arriba de HOY: ahora toca, ¿avanzo?, la pregunta del domingo y el
  //    final de la prueba. Lo demas, plegado en "Todo lo de hoy". ──
  const [verTodo, setVerTodo] = useState(false);
  const plegado = !verTodo;
  const hoyIso = todayLocalIso();
  const prueba = props.prueba || null;
  const diasConPrueba = FLAT_DAYS.map(d => diaEnPrueba(d, prueba));
  // Los dias como se ven (prueba de 2 semanas + ajuste por paron): para
  // recolocar y preguntar por lo de ayer, una "calidad" que hoy es un suave
  // se trata como suave.
  const diasPlan = props.capas ? FLAT_DAYS.map(d => props.capas(d)) : diasConPrueba;
  // Lo movido: si esta sesión se fue a otro día no se enseña aquí, y si han
  // venido sesiones de otros días se enseñan (con los mismos ajustes que el resto).
  const movidaA = destinoDe(props.postponed, dayKey);
  const recibidas = llegadasA(props.postponed, dayKey)
    .map(origen => FLAT_DAYS.find(d => d.isoDate === origen))
    .filter(Boolean)
    .map(d => (props.capas ? props.capas(d, dayKey) : d));
  // La sesion que de verdad toca hoy: una recibida sin hacer manda sobre la propia.
  const llegadaPend = recibidas.find(o => !checked[o.isoDate]) || null;
  const diaSesion = llegadaPend || day;
  const [noHecha, setNoHecha] = useState(false);
  const noHechasHoy = (props.noHechas || {})[dayKey] || [];
  const marcarNo = (id, si) => props.setNoHechas && props.setNoHechas(p => {
    const l = (p[dayKey] || []).filter(x => x !== id);
    return { ...p, [dayKey]: si ? [...l, id] : l };
  });
  const startDate = new Date(FECHA_INICIO);
  const thisDate = new Date(day.isoDate || startDate);
  const daysSinceStart = Math.round((thisDate - startDate) / (1000*60*60*24));
  const isMedicionDay = daysSinceStart >= 0 && daysSinceStart % 14 === 0;
  const planAhora = ahoraToca({ hora: new Date().getHours(), day: diaSesion,
    sesionHecha: !llegadaPend && (day.tipo === "libre" || !!checked[dayKey] || !!movidaA),
    sesionNo: !llegadaPend && !checked[dayKey] && movidaA === "pasa",
    sesionMovida: !llegadaPend && !checked[dayKey] && /^\d{4}-/.test(movidaA || ""),
    extras: { pierna: !!day.pierna10 && !movidaA, piernaHecha: !!checked[dayKey + "-pierna"],
              medir: isMedicionDay, medirHecho: !!checked[dayKey + "-medir"] },
    cuello: { m: cM, t: cT, n: cN }, pesado: props.pesoDia != null, comidaApuntada: !!props.comidaDia, noHechas: noHechasHoy });
  const lunesHoy = lunesDe(hoyIso);
  const sentir = props.semanaSentir || {};
  const dowHoy = new Date(hoyIso + "T12:00:00").getDay();
  const lunesPregunta = dowHoy === 0 ? lunesHoy : dowHoy === 1 ? lunesDe(FLAT_DAYS[Math.max(0, flatIdx - 1)].isoDate) : null;
  const preguntaSentir = isToday && lunesPregunta && !sentir[lunesPregunta] && lunesPregunta >= FECHA_INICIO;
  const enLaPrueba = !!diaDePrueba(prueba, day.isoDate) || (prueba && prueba.decidido && !prueba.volver && day.isoDate >= prueba.desde);
  const [verExtrasEstado, setVerExtras] = useState(false);
  const verExtras = verExtrasEstado || expandedBlock === "magia" || expandedBlock === "guerrero";



  // Lo de este día se recolocó, cedió su sitio o se dejó pasar.
  const estadoMovida = movidaA && (
          <div data-estado-movida style={{ ...CARD, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 14, color: C.text, lineHeight: 1.4 }}>
              {movidaA === "pasa" ? "Dejaste pasar " + nombreDe(day) + ". Sin drama: se sigue."
                : /^\d{4}-/.test(movidaA) ? "La has movido " + (FLAT_DAYS.find(d => d.isoDate === movidaA) ? "al " + diaHablado(FLAT_DAYS.find(d => d.isoDate === movidaA)).slice(3) : "a " + movidaA) + "."
                : "Hoy " + nombreDe(day) + " deja su sitio a " + nombreDe(FLAT_DAYS.find(d => d.isoDate === movidaA.slice(5))) + "."}
            </div>
            <button className="btn" onClick={() => props.setPostponed(deshacer(props.postponed, movidaA.startsWith("cede:") ? movidaA.slice(5) : dayKey))}
              style={{ fontSize: 14, fontWeight: 600, color: A.azul, minHeight: 36 }}>Deshacer</button>
          </div>
        );

  // Un dia pasado: marcar que hiciste y que no.
  const esPasado = day.isoDate < hoyIso;
  // Una clave pasada que aun cabe en los proximos dias: se ofrece recolocarla.
  const [recolocarPasado, setRecolocarPasado] = useState(null);
  const marcarRepaso = (id, v) => {
    if (id === "sesion") {
      if (checked[dayKey] && v !== "si") toggleCheck(dayKey);
      if (v === "no" && esClave(day) && proponerHueco({ dia: day, dias: diasPlan, movidas: props.postponed, checked, hoyIso }).mejor) {
        setRecolocarPasado(dayKey);
        return;
      }
      setRecolocarPasado(null);
      if (!checked[dayKey] && v === "si") toggleCheck(dayKey);
      if (v === "no") props.setPostponed(dejarPasar(props.postponed, dayKey));
      else if (movidaA === "pasa") props.setPostponed(deshacer(props.postponed, dayKey));
      return;
    }
    if (id.startsWith("cuello-")) {
      const k = id.slice(-1), hecho = !!cuelloChecks[dayKey + "-" + k];
      if (hecho !== (v === "si")) toggleCuello(k);
    }
    marcarNo(id, v === "no");
  };


  // ── La lista del dia: filas, que hace el circulo y que se ve al abrir ──
  const ahoraId = isToday ? (planAhora.ahora.accion === "cuello" ? "cuello" : planAhora.ahora.id) : null;
  const esp = ritmoEsperado({ day: diaSesion, dias: FLAT_DAYS, ritmoReal: props.ritmoReal, gps: props.gps });
  const destinoTxt = (iso) => { const d = FLAT_DAYS.find(x => x.isoDate === iso); return d ? diaHablado(d).replace(/^el /, "") : iso; };
  const subSesion = () => {
    if (!llegadaPend && movidaA === "pasa") return "La dejaste pasar. Sin drama.";
    if (!llegadaPend && /^\d{4}-/.test(movidaA || "")) return "Movida al " + destinoTxt(movidaA);
    const partes = [];
    if (llegadaPend) partes.push("viene del " + destinoTxt(llegadaPend.isoDate));
    if (diaSesion.ajuste) partes.push(diaSesion.ajuste.motivo.split(":")[0]);
    if (esp && esp.desde) partes.push(esp.texto);
    return partes.join(" · ");
  };
  const filasLista = planAhora.dia.map(x => {
    if (x.id === "sesion") {
      const t = diaSesion.tipo;
      return { ...x, ahora: x.id === ahoraId, icono: t === "fuerza" ? "fuerza" : t === "compromiso" ? "tenis" : "sesion",
        titulo: t === "compromiso" ? "Tenis" : t === "fuerza" ? "Fuerza · " + diaSesion.titulo : diaSesion.titulo, sub: subSesion() };
    }
    if (x.id === "cuello") return { ...x, ahora: ahoraId === "cuello", sub: cuelloEj.nombre + (cuelloTotal ? " · " + cuelloTotal + " de 3 tomas" : "") };
    if (x.id === "pierna") return { ...x, sub: "Después de correr: " + day.pierna10.map(e => e.nombre.split(" ")[0].toLowerCase()).join(", ") };
    if (x.id === "medir") return { ...x, sub: "Cada 2 semanas, en ayunas" };
    if (x.id === "peso") return { ...x, ahora: ahoraId === "peso", sub: props.pesoDia != null ? String(props.pesoDia).replace(".", ",") + " kg" : "En ayunas" };
    return { ...x, ahora: ahoraId === "comida", sub: props.comidaDia ? "Apuntada" : "Lo que has comido" };
  });
  const estadoDe = (id) => (filasLista.find(f => f.id === id) || {}).estado;
  const sinNoCuello = () => props.setNoHechas && props.setNoHechas(p => ({ ...p, [dayKey]: (p[dayKey] || []).filter(x => !x.startsWith("cuello-")) }));
  const circulo = (id, abrir) => {
    const e = estadoDe(id);
    if (id === "sesion") {
      if (e === "movida") return abrir();
      if (e === "no") return props.setPostponed(deshacer(props.postponed, dayKey));
      const llegadaHecha = recibidas.find(o => checked[o.isoDate]);
      if (e === "hecho") return toggleCheck(llegadaHecha && !checked[dayKey] ? llegadaHecha.isoDate : dayKey);
      return toggleCheck(llegadaPend ? llegadaPend.isoDate : dayKey);
    }
    if (id === "cuello") {
      if (e === "no") return sinNoCuello();
      if (e === "hecho") { const k = cN ? "n" : cT ? "t" : "m"; return toggleCuello(k); }
      const h = new Date().getHours();
      const pref = !isToday ? ["m", "t", "n"] : h < 12 ? ["m", "t", "n"] : h < 21 ? ["t", "n", "m"] : ["n", "t", "m"];
      const hechas = { m: cM, t: cT, n: cN };
      return toggleCuello(pref.find(k => !hechas[k]) || "m");
    }
    if (e === "no") return marcarNo(id, false);
    if (id === "pierna" || id === "medir") return toggleCheck(dayKey + "-" + id);
    return abrir();
  };
  const enlace = { fontSize: 14, fontWeight: 600, color: A.azul, minHeight: 36, padding: "0 2px" };
  const detalleFila = (id, cerrar) => {
    if (id === "sesion") {
      if (!llegadaPend && movidaA) return estadoMovida;
      const t = diaSesion.tipo;
      const puedeEmpezar = !checked[diaSesion.isoDate] && (isToday || day.isoDate > hoyIso) && /^(run|test|objetivo|fuerza)$/.test(t);
      return (
        <div>
          {diaSesion.what && <div style={{ fontSize: 14, color: "#3A3A3C", lineHeight: 1.45, marginBottom: 6 }}>{diaSesion.what}</div>}
          {esp && esp.desde && <div data-ritmo-esperado style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>Ritmo esperado: {esp.texto} <span style={{ fontWeight: 400, color: C.textDim, fontSize: 12.5 }}>· {esp.fuente}</span></div>}
          {diaSesion.ajuste && <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.4, marginBottom: 8 }}>{diaSesion.ajuste.motivo}</div>}
          {puedeEmpezar && isToday && (
            <Boton tipo="color" color={A.rojo} data-empezar onClick={llegadaPend ? () => props.onStartWorkoutDe(llegadaPend.isoDate) : onStartWorkout} style={{ marginBottom: 6 }}>Empezar</Boton>
          )}
          {!checked[diaSesion.isoDate] && !noHecha && (
            <button className="btn" data-no-hoy onClick={() => (esPasado && !llegadaPend ? marcarRepaso("sesion", "no") : setNoHecha(true))} style={enlace}>
              {esPasado ? "No la hice" : t === "compromiso" ? "Hoy no voy" : "No hoy / moverla"}
            </button>
          )}
          {noHecha && (llegadaPend || (!movidaA && !checked[dayKey])) && (
            <Recolocar dias={diasPlan} key={"nh" + diaSesion.isoDate} dia={diaSesion} movidas={props.postponed} setMovidas={props.setPostponed} checked={checked}
              abiertaInicial onCerrar={() => setNoHecha(false)}>
              {!esClave(diaSesion) && t !== "compromiso" && !llegadaPend && (
                <MoveDayBlock dayKey={dayKey} day={day} dias={diasPlan} checked={checked} hoyIso={hoyIso}
                  postponed={props.postponed} setPostponed={props.setPostponed} />
              )}
            </Recolocar>
          )}
          {esPasado && recolocarPasado === dayKey && !movidaA && !checked[dayKey] && (
            <Recolocar dias={diasPlan} key={"p" + dayKey} dia={day} movidas={props.postponed} setMovidas={props.setPostponed} checked={checked}
              abiertaInicial titulo={"Faltó " + nombreDe(day) + ": aún cabe"} onCerrar={() => setRecolocarPasado(null)} />
          )}
        </div>
      );
    }
    if (id === "cuello") return (
      <div>
        {cuelloEj.pasos.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: A.azul, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ fontSize: 14, color: C.text, lineHeight: 1.45 }}>{p}</span>
          </div>
        ))}
        {cuelloEj.sensacion && <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.4, margin: "4px 0 8px" }}>Debe sentirse: {cuelloEj.sensacion}</div>}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {[["m", "Mañana", cM], ["t", "Tarde", cT], ["n", "Noche", cN]].map(([k, l, v]) => (
            <button key={k} className="btn" data-toma={k} onClick={() => toggleCuello(k)} style={{ flex: 1, minHeight: 38, borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              background: v ? A.azul : C.surfaceMuted, color: v ? "#fff" : C.text }}>{l}{v ? " ✓" : ""}</button>
          ))}
        </div>
        {!cuelloTotal && <button className="btn" data-no-hoy onClick={() => { if (props.setNoHechas) props.setNoHechas(p => ({ ...p, [dayKey]: [...new Set([...(p[dayKey] || []), "cuello-m", "cuello-t", "cuello-n"])] })); cerrar(); }} style={enlace}>No hoy</button>}
      </div>
    );
    if (id === "pierna") return (
      <div>
        {day.pierna10.map(e => (
          <div key={e.nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.text, padding: "4px 0" }}>
            <span>{e.nombre}</span><span style={{ color: C.textDim }}>{e.series}</span>
          </div>
        ))}
        <button className="btn" data-no-hoy onClick={() => { marcarNo("pierna", true); cerrar(); }} style={enlace}>No hoy</button>
      </div>
    );
    if (id === "medir") return (
      <div>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.45, marginBottom: 8 }}>Cintura, ancho de hombro y una foto de frente y otra de lado. En ayunas, con la misma luz que la última vez.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Boton tipo="color" color={A.morado} onClick={props.onVerProgreso} style={{ flex: 1 }}>Apuntar en Progreso</Boton>
          <button className="btn" data-no-hoy onClick={() => { marcarNo("medir", true); cerrar(); }} style={enlace}>No hoy</button>
        </div>
      </div>
    );
    if (id === "peso") return <PesoFila valor={props.pesoDia} guardar={(kg) => props.guardarPeso(kg, dayKey)} noHoy={() => { marcarNo("peso", true); cerrar(); }} />;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Boton tipo="color" color={A.verde} onClick={props.irANutricion} style={{ flex: 1 }}>{props.comidaDia ? "Ver en Nutrición" : "Apuntar en Nutrición"}</Boton>
        {!props.comidaDia && <button className="btn" data-no-hoy onClick={() => { marcarNo("comida", true); cerrar(); }} style={enlace}>No hoy</button>}
      </div>
    );
  };



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

      <WeekDots day={day} checked={checked} onJumpDay={props.onJumpDay} aplicar={(d) => diaEnPrueba(d, prueba)} movidas={props.postponed || {}} />


      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        {isToday && (() => {
          const falta = pendienteDeRecolocar({ dias: diasPlan, movidas: props.postponed, checked, hoyIso });
          return falta ? <Recolocar dias={diasPlan} key={falta.isoDate} dia={falta} movidas={props.postponed} setMovidas={props.setPostponed} checked={checked} ayer
            onHecha={esClave(falta) ? null : () => toggleCheck(claveDia(falta))} /> : null;
        })()}
        {isToday && prueba && tocaDecidir(prueba, hoyIso) && (
          <FinPrueba comp={compararPrueba({ dias: FLAT_DAYS, prueba, checked, cuelloChecks, sentir, aplicar: (d) => diaEnPrueba(d, prueba) })}
            onQuedarme={() => props.setPrueba(quedarse(prueba, FECHA_FIN))} onVolver={() => props.setPrueba(volverAlPlan(prueba))} />
        )}

        <ListaHoy key={dayKey} filas={filasLista} onCirculo={circulo} detalle={detalleFila} />

        {preguntaSentir && (
          <SentirSemana onGuardar={(v) => props.setSemanaSentir(p => ({ ...p, [lunesPregunta]: v }))} />
        )}

        <button className="btn" data-todo-hoy onClick={() => setVerTodo(!verTodo)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44, width: "100%", fontSize: 14.5, fontWeight: 600, color: A.azul }}>
          {verTodo ? "Ocultar" : "Notas, molestias, magia y guerrero"} <Chevron abierto={verTodo} />
        </button>
      </div>

      {!plegado && (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>



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
        {/* Antes de hacerla, todo esta en la fila de la lista: aqui solo el
            resultado y lo que apuntas despues. */}
        {isRunDay && !movidaA && mainDone && (
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
              {(() => {
                // El RPE en ritmo: lo que de verdad miras corriendo.
                const e = ritmoEsperado({ day, dias: FLAT_DAYS, ritmoReal: props.ritmoReal, gps: props.gps });
                if (!e) return null;
                return (
                  <div data-ritmo-esperado style={{ marginTop: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Ritmo esperado: {e.texto}</span>
                    <span style={{ fontSize: 12.5, color: C.textDim }}> · {e.fuente}</span>
                  </div>
                );
              })()}
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
              {day.pierna10 && (
                <div data-pierna10 style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: C.surfaceMuted }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Y al volver, 10 min de pierna (el sábado es libre)</div>
                  {day.pierna10.map(e => (
                    <div key={e.nombre} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: C.text, padding: "2px 0" }}>
                      <span>{e.nombre}</span><span style={{ color: C.textDim }}>{e.series}</span>
                    </div>
                  ))}
                </div>
              )}
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
          {(
            <>
              <Cuadro icono="magia" tono="morado" v={magiaProg.dominados + "/" + magiaProg.total} l={enLaPrueba ? "magia · extra" : "magia"} activo={expandedBlock === "magia"} onClick={() => habito("magia")} />
              <Cuadro icono="escudo" tono="gris" v={props.guerreroLog[dayKey] ? "✓" : "—"} l={enLaPrueba ? "guerrero · extra" : "guerrero"} hecho={!!props.guerreroLog[dayKey]} activo={expandedBlock === "guerrero"} onClick={() => habito("guerrero")} />
            </>
          )}
        </div>
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
              {!checked[claveDia(origen)] && props.onStartWorkoutDe && (origen.tipo === "run" || origen.tipo === "test" || origen.tipo === "objetivo" || origen.tipo === "fuerza") && (
                <Boton tipo="color" color={A.rojo} onClick={() => props.onStartWorkoutDe(claveDia(origen))} style={{ marginBottom: 8 }}>Empezar</Boton>
              )}
              <Boton tipo={checked[claveDia(origen)] ? "color" : "suave"} color={A.verde} onClick={() => toggleCheck(claveDia(origen))}>{checked[claveDia(origen)] ? "Hecha ✓" : "Ya la hice fuera de la app"}</Boton>
            </div>
          </div>
        ))}

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
      )}
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

/** El peso del dia: escribirlo, cambiarlo o quitarlo. */
function PesoFila({ valor, guardar, noHoy }) {
  const [kg, setKg] = useState(valor != null ? String(valor).replace(".", ",") : "");
  const ok = () => { const n = Number(String(kg).replace(",", ".")); if (n > 40 && n < 200) guardar(Math.round(n * 10) / 10); };
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input inputMode="decimal" value={kg} placeholder="86,0" data-peso onChange={e => setKg(e.target.value.replace(/[^\d.,]/g, ""))}
          onKeyDown={e => { if (e.key === "Enter") ok(); }}
          style={{ flex: 1, minWidth: 0, padding: "11px 14px", borderRadius: 999, border: "none", background: C.surfaceMuted, fontSize: 17, fontWeight: 700, textAlign: "center", fontFamily: "inherit" }} />
        <Boton tipo="color" color={A.azul} onClick={ok} style={{ width: "auto", padding: "0 22px" }}>OK</Boton>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        {valor != null && <button className="btn" onClick={() => { guardar(null); setKg(""); }} style={{ fontSize: 14, fontWeight: 600, color: C.textDim, minHeight: 36 }}>Quitar</button>}
        {valor == null && <button className="btn" data-no-hoy onClick={noHoy} style={{ fontSize: 14, fontWeight: 600, color: A.azul, minHeight: 36 }}>No hoy</button>}
      </div>
    </div>
  );
}
