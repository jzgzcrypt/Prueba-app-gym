"use client";

import { useState, useEffect, useRef } from "react";
import { C, R, SP, TAP_MIN } from "@/design/tokens";
import { storage, CLAVE_DATOS, VERSION_ESQUEMA, migrar } from "@/lib/storage";
import { cuantoHayEn, limpiarDia } from "@/lib/estado/limpiar-dia";
import { ICON_CUELLO, ICON_MOVILIDAD, ICON_NUTRICION } from "@/domain/assets/icons";
import { NUTRICION } from "@/domain/nutricion/nutricion";
import { BLOQUE, FECHA_FIN, FECHA_INICIO, FLAT_DAYS, WEEKS, claveDia, findTodayIndex, todayLocalIso } from "@/domain/plan/calendario";
import { getCuelloEj } from "@/domain/salud/cuello";
import { comidaDelDia } from "@/domain/nutricion/dias";
import { getMovilidadDelDia } from "@/domain/salud/movilidad";
import { CoachScreen } from "@/features/coach/CoachScreen";
import { EjerciciosScreen } from "@/features/ejercicios/EjerciciosScreen";
import { MagiaCatalogoScreen } from "@/features/habilidades/MagiaCatalogoScreen";
import { dominar, responder } from "@/domain/habilidades/repaso";
import { FUERA_POR_DEFECTO } from "@/domain/nutricion/compra";
import { HoyScreen } from "@/features/hoy/HoyScreen";
import { NutricionScreen } from "@/features/nutricion/NutricionScreen";
import { IconoNav } from "@/features/ui/iconos-nav";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { ProgresoScreen } from "@/features/progreso/ProgresoScreen";
import { SemanaScreen } from "@/features/semana/SemanaScreen";
import { WorkoutMode } from "@/features/workout/WorkoutMode";
import { CierreSesion } from "@/features/workout/CierreSesion";
import { copiaPendiente } from "@/domain/progreso/libreta";
import { ultimaVez } from "@/domain/fuerza/registro";
import { ritmoDelDia } from "@/domain/running/adaptar";
import { resumenSemana } from "@/domain/progreso/resumen";

export default function App() {
  const todayIdx = findTodayIndex();
  const [flatIdx, setFlatIdx] = useState(todayIdx);
  const [screen, setScreen] = useState("hoy");
  const [weekIdx, setWeekIdx] = useState(FLAT_DAYS[todayIdx].weekIdx);
  const [checked, setChecked] = useState({});
  const [cuelloChecks, setCuelloChecks] = useState({});
  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState({});
  const [editingNote, setEditingNote] = useState({});
  const [catalogoSelected, setCatalogoSelected] = useState(null);
  const [youtubeLinks, setYoutubeLinks] = useState({});
  const [customExercises, setCustomExercises] = useState({}); // { id: {nombre, grupo, pasos, sensacion, errores} }
  const [painLog, setPainLog] = useState({}); // { dayKey: { cuello: 1-5, hombro: 1-5, rodilla: 1-5 } }
  const [flaggedExercises, setFlaggedExercises] = useState({}); // { nombreEjercicio: "nota de por que molesta" }
  const [pausedRanges, setPausedRanges] = useState([]); // [{ from: dayKey, to: dayKey, label }]
  const [workoutProgress, setWorkoutProgress] = useState({});
  const [magiaProgress, setMagiaProgress] = useState({}); // { truco_id: true } - historico, anterior al repaso espaciado
  // El repaso espaciado de la magia: por truco, en que escalon esta y cuando
  // vuelve. { truco_id: { escalon, proximo, ultimo, aciertos, fallos } }
  const [magiaRepaso, setMagiaRepaso] = useState({});
  // Se conserva en cada guardado: si no, el primer autoguardado despues del
  // onboarding se llevaba la marca por delante.
  const [onboardingVisto, setOnboardingVisto] = useState(false);
  const [magiaLog, setMagiaLog] = useState({}); // { dayKey: true } - dias que has practicado magia
  const [guerreroLog, setGuerreroLog] = useState({}); // { dayKey: true } - dias que has practicado guerrero
  const [workoutWeights, setWorkoutWeights] = useState({}); // { dayKey: { exerciseIdx: { serieIdx: "20" } } }
  // Reps de cada serie, con la misma forma que los pesos. Es un campo nuevo:
  // los dias guardados antes no lo tienen y se leen como "reps sin apuntar".
  const [workoutReps, setWorkoutReps] = useState({}); // { dayKey: { exerciseIdx: { serieIdx: 12 } } }
  const [activeWorkout, setActiveWorkout] = useState(null);
  // La pagina de la libreta que sale al terminar una sesion: la clave del dia.
  const [cierre, setCierre] = useState(null);
  const [medidas, setMedidas] = useState([]); // [{fecha, peso, cintura, cadera}]
  const [ritmoReal, setRitmoReal] = useState({}); // { dayKey: "5:12/km" }
  const [ritmoTramos, setRitmoTramos] = useState({}); // { dayKey: "6:00" } - ritmo en los tramos corriendo (fase correr/caminar)
  const [sensaciones, setSensaciones] = useState({}); // { dayKey: "texto" } - como te sentiste en la sesion
  const [ritmoInput, setRitmoInput] = useState({});
  const [editingRitmo, setEditingRitmo] = useState({});
  const [postponed, setPostponed] = useState({}); // { dayKey: {destino, titulo} }
  const [phaseAdjustNote, setPhaseAdjustNote] = useState(""); // nota libre sobre desviacion de fases/calendario
  const [currentWeekOverride, setCurrentWeekOverride] = useState(null); // numero de semana manual, o null = automatico por fecha
  const [weeklyLog, setWeeklyLog] = useState({}); // { weekN: "texto de la bitacora" }
  // Lo que has comido, por dia. Cada apunte es {origen, id, gramos|racion}:
  // "casa" lleva gramos, "cantina" lleva racion, "rapida" no lleva nada porque
  // ya es una comida entera. Ver src/domain/nutricion/iifym.js.
  const [comidasLog, setComidasLog] = useState({}); // { dayKey: [apunte] }
  // Los cambios de alimento sobre el menu del dia: "hoy no hay salmon, hay
  // merluza". { dayKey: { "cena:salmon": "merluza" } }
  const [cambiosMenu, setCambiosMenu] = useState({});
  // Tu dieta, editada por ti. Es por tipo de dia, no por fecha: si quitas el
  // desayuno, lo quitas de todos los dias de COMER.
  // { comer: { desayuno: [{id,g}] | null }, recortar: {...} }
  const [menuEditado, setMenuEditado] = useState({});
  // Lo ya tachado de la compra, por semana: { "2026-09-21:pollo": true }. Va
  // por semana a proposito — el lunes la lista vuelve a estar entera.
  const [compraMarcada, setCompraMarcada] = useState({});
  // Que comidas haces fuera de casa, por dia de la semana (0 = lunes). No
  // entran en la compra, pero SI cuentan para los macros del dia.
  const [comidasFuera, setComidasFuera] = useState(FUERA_POR_DEFECTO);
  // El historial arranca con el bloque en curso, con sus fechas sacadas del
  // calendario: si se mueve FECHA_INICIO, el historial se mueve con el.
  const [bloquesHistorial, setBloquesHistorial] = useState([
    { numero: BLOQUE.numero, nombre: BLOQUE.nombre, inicio: FECHA_INICIO, fin: FECHA_FIN,
      objetivoRunning: BLOQUE.objetivo, estado: "activo", revision: "" }
  ]); // historial de bloques de entrenamiento encadenados
  // Fecha del ultimo backup descargado. Sin esto no hay forma de saber cuanto
  // hace que los datos no salen del dispositivo, que es el unico riesgo
  // irreversible que tiene hoy la app.
  const [ultimoBackup, setUltimoBackup] = useState(null); // "YYYY-MM-DD" | null
  // Hora del ultimo guardado confirmado, para poder enseñarla y no tener que
  // fiarse de que "se habra guardado".
  const [ultimoGuardado, setUltimoGuardado] = useState(null);
  // Fase del cuello fijada a mano (lo que diga el fisio). null = automatica.
  const [cuelloFaseManual, setCuelloFaseManual] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState("main"); // que bloque esta abierto en HoyScreen

  // ─── Sistema global de deshacer (Undo) ─────────────────────────────────────
  const [undoStack, setUndoStack] = useState(null); // { label, restore: () => void } | null
  const undoTimerRef = useRef(null);

  const pushUndo = (label, restore) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoStack({ label, restore });
    undoTimerRef.current = setTimeout(() => setUndoStack(null), 6000);
  };
  const runUndo = () => {
    if (undoStack) undoStack.restore();
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoStack(null);
  };

  // ─── Persistencia real entre sesiones (capa @/lib/storage) ────────────────
  // La app no sabe DONDE se guarda. Habla con el adaptador y con migrar().
  const [storageReady, setStorageReady] = useState(false);
  const [storageStatus, setStorageStatus] = useState(null); // null | "ok" | "error"
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Carga los datos guardados una sola vez, al montar la app
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let loadedOk = false;
      try {
        const result = await storage.get(CLAVE_DATOS);
        if (cancelled) return;
        if (result && result.value) {
          // migrar() lleva los datos de cualquier version anterior a la actual
          // antes de que ninguna pantalla los vea. Sin esto, un cambio de forma
          // en el futuro romperia los datos ya guardados.
          const { datos: d } = migrar(JSON.parse(result.value));
          if (d.checked) setChecked(d.checked);
          if (d.cuelloChecks) setCuelloChecks(d.cuelloChecks);
          if (d.notes) setNotes(d.notes);
          if (d.youtubeLinks) setYoutubeLinks(d.youtubeLinks);
          if (d.customExercises) setCustomExercises(d.customExercises);
          if (d.painLog) setPainLog(d.painLog);
          if (d.flaggedExercises) setFlaggedExercises(d.flaggedExercises);
          if (d.pausedRanges) setPausedRanges(d.pausedRanges);
          if (d.workoutProgress) setWorkoutProgress(d.workoutProgress);
          if (d.magiaProgress) setMagiaProgress(d.magiaProgress);
          if (d.magiaRepaso) setMagiaRepaso(d.magiaRepaso);
          if (d.onboardingVisto) setOnboardingVisto(true);
          if (d.magiaLog) setMagiaLog(d.magiaLog);
          if (d.guerreroLog) setGuerreroLog(d.guerreroLog);
          if (d.workoutWeights) setWorkoutWeights(d.workoutWeights);
          if (d.workoutReps) setWorkoutReps(d.workoutReps);
          if (d.medidas) setMedidas(d.medidas);
          if (d.ritmoReal) setRitmoReal(d.ritmoReal);
        if (d.ritmoTramos) setRitmoTramos(d.ritmoTramos);
        if (d.sensaciones) setSensaciones(d.sensaciones);
          if (d.postponed) setPostponed(d.postponed);
          if (d.phaseAdjustNote != null) setPhaseAdjustNote(d.phaseAdjustNote);
          if (d.currentWeekOverride !== undefined) setCurrentWeekOverride(d.currentWeekOverride);
          if (d.weeklyLog) setWeeklyLog(d.weeklyLog);
          if (d.comidasLog) setComidasLog(d.comidasLog);
          if (d.cambiosMenu) setCambiosMenu(d.cambiosMenu);
          if (d.menuEditado) setMenuEditado(d.menuEditado);
          if (d.compraMarcada) setCompraMarcada(d.compraMarcada);
          if (d.comidasFuera) setComidasFuera(d.comidasFuera);
          if (d.bloquesHistorial) setBloquesHistorial(d.bloquesHistorial);
          if (d.ultimoBackup) setUltimoBackup(d.ultimoBackup);
          if (d.cuelloFaseManual) setCuelloFaseManual(d.cuelloFaseManual);
          loadedOk = true;
        }
      } catch (err) {
        // get() puede lanzar si la clave no existe todavia - no es necesariamente "primera vez real",
        // asi que no decidimos el onboarding aqui. Lo confirmamos abajo con list().
      }
      if (cancelled) return;
      if (!loadedOk) {
        // No se pudo cargar nada - comprobamos con list() si la clave existe de verdad
        // antes de asumir que es la primera vez (list() no lanza excepcion como get()).
        try {
          const listing = await storage.list(CLAVE_DATOS);
          const existe = listing && listing.keys && listing.keys.length > 0;
          if (!existe) setShowOnboarding(true);
        } catch (err2) {
          // Si ni siquiera list() responde, el storage no esta disponible en este contexto
          // (artifact no publicado). No mostramos onboarding para no interrumpir con un
          // mensaje que parecera repetirse en cada sesion sin persistencia real.
        }
      }
      if (!cancelled) setStorageReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // El ultimo estado conocido, listo para escribirse sin esperar.
  const pendienteRef = useRef(null);

  // Guarda ahora mismo, sin esperar. localStorage escribe de forma sincrona,
  // asi que esto llega a completarse incluso cuando el navegador esta cerrando
  // la pagina.
  const guardarYa = () => {
    const payload = pendienteRef.current;
    if (!payload) return;
    try {
      const ok = storage.set(CLAVE_DATOS, JSON.stringify(payload));
      Promise.resolve(ok).then(r => {
        setStorageStatus(r ? "ok" : "error");
        if (r) setUltimoGuardado(new Date().toISOString());
      }).catch(() => setStorageStatus("error"));
    } catch (err) {
      setStorageStatus("error");
    }
  };

  // Sin esto habia medio segundo en el que un cambio podia perderse: marcar
  // algo y cerrar la app de inmediato es un gesto normal con el movil en la
  // mano. Se guarda cuando la app pasa a segundo plano y cuando se descarga.
  // visibilitychange es el evento fiable en movil; pagehide cubre el resto.
  useEffect(() => {
    if (!storageReady) return;
    const alOcultarse = () => { if (document.visibilityState === "hidden") guardarYa(); };
    document.addEventListener("visibilitychange", alOcultarse);
    window.addEventListener("pagehide", guardarYa);
    return () => {
      document.removeEventListener("visibilitychange", alOcultarse);
      window.removeEventListener("pagehide", guardarYa);
    };
  });

  // Guarda automaticamente cada vez que cambia cualquier dato real del usuario.
  // No guarda hasta que la carga inicial ha terminado, para no sobreescribir con valores vacios.
  useEffect(() => {
    if (!storageReady) return;
    const payload = {
      version: VERSION_ESQUEMA,
      checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, magiaProgress, magiaRepaso, magiaLog,
      guerreroLog, workoutWeights, workoutReps, medidas, ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote,
      currentWeekOverride, weeklyLog, comidasLog, cambiosMenu, menuEditado, compraMarcada, comidasFuera,
      bloquesHistorial, ultimoBackup, cuelloFaseManual, onboardingVisto,
    };
    // Se deja a mano el ultimo estado conocido para poder guardarlo de golpe
    // si la app se cierra antes de que venza la espera de abajo.
    pendienteRef.current = payload;
    const t = setTimeout(() => { guardarYa(); }, 500); // agrupa cambios rapidos
    return () => clearTimeout(t);
  }, [checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, magiaProgress, magiaRepaso, magiaLog,
      guerreroLog, workoutWeights, workoutReps, medidas, ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote,
      currentWeekOverride, weeklyLog, comidasLog, cambiosMenu, menuEditado, compraMarcada, comidasFuera,
      bloquesHistorial, ultimoBackup, cuelloFaseManual, onboardingVisto, storageReady]);

  const currentDay = FLAT_DAYS[flatIdx] || FLAT_DAYS[todayIdx] || FLAT_DAYS[0];
  const isToday = flatIdx === todayIdx;
  const dayKey = claveDia(currentDay);
  const isFuerzaDay = currentDay.tipo === "fuerza";
  const isRunDay = currentDay.tipo === "run" || currentDay.tipo === "test" || currentDay.tipo === "objetivo";
  const mov = getMovilidadDelDia(currentDay);
  // La fase del cuello sale de los dias practicados, no de la semana del bloque.
  const cuelloEj = getCuelloEj(cuelloChecks, cuelloFaseManual);
  const comida = comidaDelDia(currentDay);
  const mainDone = currentDay.tipo === "libre" ? true : !!checked[dayKey];
  const isCompromisoDay = currentDay.tipo === "compromiso";

  // Vaciar el dia que se esta viendo. Devuelve cuantas cosas se han borrado,
  // para poder decirlo, y deja el deshacer preparado por si era un error.
  const vaciarDia = (clave) => {
    const actual = { checked, cuelloChecks, notes, painLog, magiaLog, guerreroLog,
                     workoutWeights, workoutReps, workoutProgress, ritmoReal, ritmoTramos, sensaciones, postponed, comidasLog, cambiosMenu };
    const cuantas = cuantoHayEn(actual, clave);
    if (!cuantas) return 0;
    const { estado } = limpiarDia(actual, clave);
    setChecked(estado.checked); setCuelloChecks(estado.cuelloChecks); setNotes(estado.notes);
    setPainLog(estado.painLog); setMagiaLog(estado.magiaLog); setGuerreroLog(estado.guerreroLog);
    setWorkoutWeights(estado.workoutWeights); setWorkoutReps(estado.workoutReps);
    setWorkoutProgress(estado.workoutProgress); setRitmoReal(estado.ritmoReal);
    setRitmoTramos(estado.ritmoTramos); setSensaciones(estado.sensaciones);
    setPostponed(estado.postponed); setComidasLog(estado.comidasLog); setCambiosMenu(estado.cambiosMenu);
    pushUndo("Día vaciado", () => {
      setChecked(actual.checked); setCuelloChecks(actual.cuelloChecks); setNotes(actual.notes);
      setPainLog(actual.painLog); setMagiaLog(actual.magiaLog); setGuerreroLog(actual.guerreroLog);
      setWorkoutWeights(actual.workoutWeights); setWorkoutReps(actual.workoutReps);
      setWorkoutProgress(actual.workoutProgress); setRitmoReal(actual.ritmoReal);
      setRitmoTramos(actual.ritmoTramos); setSensaciones(actual.sensaciones);
      setPostponed(actual.postponed); setComidasLog(actual.comidasLog); setCambiosMenu(actual.cambiosMenu);
    });
    return cuantas;
  };

  // Apuntar y desapuntar comida del dia que se esta viendo. Se anade al final
  // porque el orden en que comes es el orden en que lo apuntas.
  const apuntarComida = (apunte) => apuntarVarias([apunte]);
  const apuntarVarias = (nuevos) => setComidasLog(p =>
    Object.assign({}, p, { [dayKey]: (p[dayKey] || []).concat(nuevos) }));

  // Deshacer una comida entera del menu, o un apunte suelto por su posicion.
  const deshacerComida = (comidaId, indice) => setComidasLog(p =>
    Object.assign({}, p, { [dayKey]: (p[dayKey] || []).filter((ap, j) =>
      comidaId ? ap.comida !== comidaId : j !== indice) }));

  /** Marcar que una comida de un dia de la semana la haces fuera. */
  const marcarFuera = (comidaId, dayIdx) => setComidasFuera(p => {
    const actuales = (p && p[comidaId]) || [];
    const nuevos = actuales.includes(dayIdx)
      ? actuales.filter(d => d !== dayIdx)
      : actuales.concat([dayIdx]).sort((a, b) => a - b);
    return Object.assign({}, p, { [comidaId]: nuevos });
  });

  /** Tachar y destachar de la lista de la compra. */
  const marcarCompra = (clave) => setCompraMarcada(p =>
    Object.assign({}, p, { [clave]: !p[clave] }));

  // ─── Magia: repaso espaciado ───────────────────────────────────────────
  //
  // Dominar un truco no lo archiva: lo mete en la cola de repaso y deja libre
  // el sitio para el siguiente. Responder a un repaso mueve su escalera.
  const dominarTruco = (id) => setMagiaRepaso(p =>
    Object.assign({}, p, { [id]: dominar(todayLocalIso()) }));

  const responderRepaso = (id, respuesta) => setMagiaRepaso(p =>
    Object.assign({}, p, { [id]: responder(p[id], respuesta, todayLocalIso()) }));

  // ─── Editar la dieta ───────────────────────────────────────────────────
  //
  // Una sola accion para las tres cosas que se pueden hacer con una comida:
  // dejarla con otros ingredientes (una lista), quitarla del menu (null) y
  // devolverla a como estaba (undefined). Menos superficie, menos que romper.
  const guardarComidaDelMenu = (tipoDia, comidaId, ingredientes) => setMenuEditado(p => {
    const delTipo = Object.assign({}, p[tipoDia]);
    if (ingredientes === undefined) delete delTipo[comidaId];
    else delTipo[comidaId] = ingredientes;
    return Object.assign({}, p, { [tipoDia]: delTipo });
  });

  /** Volver al menu de partida entero, para ese tipo de dia. */
  const restaurarMenu = (tipoDia) => setMenuEditado(p =>
    Object.assign({}, p, { [tipoDia]: {} }));

  // Cambiar un alimento del menu por un equivalente, o volver al original.
  const cambiarAlimento = (clave, nuevoId) => setCambiosMenu(p => {
    const delDia = Object.assign({}, p[dayKey]);
    if (nuevoId) delDia[clave] = nuevoId; else delete delDia[clave];
    return Object.assign({}, p, { [dayKey]: delDia });
  });

  const toggleCheck = (key) => setChecked(p => Object.assign({}, p, { [key]: !p[key] }));
  const toggleCuello = (m) => setCuelloChecks(p => Object.assign({}, p, { [dayKey + "-" + m]: !p[dayKey + "-" + m] }));
  const saveNote = (key) => { setNotes(p => Object.assign({}, p, { [key]: noteInput[key] || "" })); setEditingNote(p => Object.assign({}, p, { [key]: false })); };
  const goDay = (d) => { setFlatIdx(Math.max(0, Math.min(FLAT_DAYS.length - 1, flatIdx + d))); setExpandedBlock("main"); };
  const goToday = () => { setFlatIdx(todayIdx); setScreen("hoy"); setExpandedBlock("main"); };
  const jumpToDay = (wIdx, dIdx) => { setFlatIdx(FLAT_DAYS.findIndex(d => d.weekIdx === wIdx && d.dayIdx === dIdx)); setScreen("hoy"); };

  // Si anotas un ritmo, esa sesion se da por hecha automaticamente.
  const guardarRitmo = (key, valor) => {
    setRitmoReal(p => Object.assign({}, p, { [key]: valor }));
    if (valor.trim()) setChecked(p => Object.assign({}, p, { [key]: true }));
  };

  // ─── Exportar / Importar todos los datos como JSON ─────────────────────
  const exportData = () => {
    const payload = {
      version: VERSION_ESQUEMA, exportedAt: new Date().toISOString(),
      checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, workoutWeights, workoutReps, medidas,
      ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote, currentWeekOverride, weeklyLog,
      comidasLog, cambiosMenu, menuEditado, compraMarcada, comidasFuera, magiaProgress, magiaRepaso,
      magiaLog, guerreroLog, bloquesHistorial,
    };
    const nombre = "programa-7k-backup-" + todayLocalIso() + ".json";
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    // En el movil, compartir deja guardarla en Archivos o iCloud, que es donde
    // sobrevive a un cambio de telefono. Una descarga en Safari se pierde.
    try {
      const archivo = new File([blob], nombre, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        navigator.share({ files: [archivo], title: "Copia del Programa 7K" })
          .then(() => setUltimoBackup(todayLocalIso()))
          .catch(() => { /* cancelada: no cuenta como copia */ });
        return;
      }
    } catch { /* sin Web Share: se descarga */ }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nombre;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setUltimoBackup(todayLocalIso());
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Un backup puede ser de una version antigua del esquema: se migra igual
        // que los datos cargados de storage, para que importar nunca pierda nada.
        const { datos: data } = migrar(JSON.parse(e.target.result));
        if (data.checked) setChecked(data.checked);
        if (data.cuelloChecks) setCuelloChecks(data.cuelloChecks);
        if (data.notes) setNotes(data.notes);
        if (data.youtubeLinks) setYoutubeLinks(data.youtubeLinks);
        if (data.customExercises) setCustomExercises(data.customExercises);
        if (data.painLog) setPainLog(data.painLog);
        if (data.flaggedExercises) setFlaggedExercises(data.flaggedExercises);
        if (data.pausedRanges) setPausedRanges(data.pausedRanges);
        if (data.workoutProgress) setWorkoutProgress(data.workoutProgress);
        if (data.workoutWeights) setWorkoutWeights(data.workoutWeights);
        if (data.workoutReps) setWorkoutReps(data.workoutReps);
        if (data.medidas) setMedidas(data.medidas);
        if (data.ritmoReal) setRitmoReal(data.ritmoReal);
        if (data.ritmoTramos) setRitmoTramos(data.ritmoTramos);
        if (data.sensaciones) setSensaciones(data.sensaciones);
        if (data.postponed) setPostponed(data.postponed);
        if (data.phaseAdjustNote != null) setPhaseAdjustNote(data.phaseAdjustNote);
        if (data.currentWeekOverride !== undefined) setCurrentWeekOverride(data.currentWeekOverride);
        if (data.weeklyLog) setWeeklyLog(data.weeklyLog);
        if (data.comidasLog) setComidasLog(data.comidasLog);
        if (data.cambiosMenu) setCambiosMenu(data.cambiosMenu);
        if (data.menuEditado) setMenuEditado(data.menuEditado);
        if (data.compraMarcada) setCompraMarcada(data.compraMarcada);
        if (data.comidasFuera) setComidasFuera(data.comidasFuera);
        if (data.magiaProgress) setMagiaProgress(data.magiaProgress);
        if (data.magiaRepaso) setMagiaRepaso(data.magiaRepaso);
        if (data.magiaLog) setMagiaLog(data.magiaLog);
        if (data.guerreroLog) setGuerreroLog(data.guerreroLog);
        if (data.bloquesHistorial) setBloquesHistorial(data.bloquesHistorial);
        alert("Datos importados correctamente.");
      } catch (err) {
        alert("El archivo no es un backup válido de Programa 7K.");
      }
    };
    reader.readAsText(file);
  };

  if (showOnboarding) {
    return <OnboardingScreen onFinish={() => {
      setShowOnboarding(false);
      setOnboardingVisto(true);
      // Se escribe ya, sin esperar al autoguardado, para que list() vea que la
      // clave existe aunque cierres sin marcar nada.
      //
      // Y se escribe SOBRE lo que hubiera, no en su lugar. Antes esto guardaba
      // un objeto minimo con solo la version y la marca, y se llevaba por
      // delante todo lo demas: si el onboarding volvia a salir por cualquier
      // motivo —una lectura fallida, un storage que tarda— terminarlo borraba
      // meses de registro. Un guardado nunca puede tener menos datos que el
      // que ya habia.
      const actual = pendienteRef.current || {};
      storage.set(CLAVE_DATOS, JSON.stringify(
        Object.assign({}, actual, { version: VERSION_ESQUEMA, onboardingVisto: true })
      )).catch(() => {});
    }} />;
  }

  if (cierre) {
    return <CierreSesion dayKey={cierre} workoutWeights={workoutWeights} workoutReps={workoutReps} ritmoReal={ritmoReal}
      onGuardarRitmo={guardarRitmo} onVolver={() => { setCierre(null); setExpandedBlock("main"); }} />;
  }

  if (activeWorkout) {
    const wDay = FLAT_DAYS.find(d => claveDia(d) === activeWorkout);
    const wMov = getMovilidadDelDia(wDay);


    return (
      <WorkoutMode day={wDay} mov={wMov} progress={workoutProgress[activeWorkout] || {}}
        onUpdateProgress={(ei, sd) => setWorkoutProgress(p => Object.assign({}, p, { [activeWorkout]: Object.assign({}, p[activeWorkout]||{}, { [ei]: sd }) }))}
        onFinish={() => { setChecked(p => Object.assign({}, p, { [activeWorkout]: true })); setCierre(activeWorkout); setActiveWorkout(null); }}
        onExit={() => setActiveWorkout(null)}
        weights={workoutWeights[activeWorkout] || {}}
        onUpdateWeight={(ei, si, val) => {
          const prevVal = (workoutWeights[activeWorkout] || {})[ei] ? (workoutWeights[activeWorkout][ei][si] || "") : "";
          setWorkoutWeights(p => {
            const dayW = Object.assign({}, p[activeWorkout] || {});
            const exW = Object.assign({}, dayW[ei] || {});
            exW[si] = val;
            dayW[ei] = exW;
            return Object.assign({}, p, { [activeWorkout]: dayW });
          });
          if (prevVal && prevVal !== val) {
            pushUndo("Peso cambiado (" + prevVal + "→" + val + ")", () => setWorkoutWeights(p => {
              const dayW = Object.assign({}, p[activeWorkout] || {});
              const exW = Object.assign({}, dayW[ei] || {});
              exW[si] = prevVal;
              dayW[ei] = exW;
              return Object.assign({}, p, { [activeWorkout]: dayW });
            }));
          }
        }}
        reps={workoutReps[activeWorkout] || {}}
        onUpdateReps={(ei, si, val) => setWorkoutReps(p => {
          const dayR = Object.assign({}, p[activeWorkout] || {});
          dayR[ei] = Object.assign({}, dayR[ei] || {}, { [si]: val });
          return Object.assign({}, p, { [activeWorkout]: dayR });
        })}
        ultimaVez={(nombre) => ultimaVez(nombre, wDay.isoDate, FLAT_DAYS, workoutWeights, workoutReps)}
        ritmoSeries={ritmoDelDia(wDay, FLAT_DAYS, ritmoReal)}
        flaggedExercises={flaggedExercises} />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; font-family: -apple-system, 'Inter', sans-serif; }
        button { cursor: pointer; border: none; background: none; }
        input { font-family: inherit; }
        .btn { transition: opacity 0.1s, transform 0.1s; }
        .btn:active { opacity: 0.65; transform: scale(0.97); }
        .block { transition: transform 0.1s; }
        .block:active { transform: scale(0.98); }
        .expand-in { animation: expandIn 0.18s ease; }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: #D4D4D1; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 90 }}>

        {/* Si el guardado falla, lo tiene que ver en cualquier pantalla: antes
            solo se avisaba dentro de Coach > Ajustes, y se podian perder dias
            de registro sin enterarse. */}
        {storageStatus === "error" && (
          <div role="alert" style={{ margin: "12px 16px 0", padding: "11px 14px", borderRadius: 12,
                                     background: "#FBF0EF", border: "1px solid #E8C9C6" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#171717" }}>No se está guardando lo que apuntas</div>
            <div style={{ fontSize: 12, color: "#4A4A47", marginTop: 3, lineHeight: 1.4 }}>
              El navegador no deja guardar más. Exporta una copia en Coach → Ajustes y, si acabas de añadir una foto, quítala.
            </div>
          </div>
        )}

        {screen === "hoy" && (
          <HoyScreen day={currentDay} dayKey={dayKey} isToday={isToday} flatIdx={flatIdx}
            goDay={goDay} goToday={goToday} onJumpDay={jumpToDay}
            isFuerzaDay={isFuerzaDay} isRunDay={isRunDay} isCompromisoDay={isCompromisoDay} mov={mov}
            comida={comida} vaciarDia={vaciarDia}
            apuntesComida={comidasLog[dayKey] || []} irANutricion={() => setScreen("nutricion")}
            cosasEnElDia={cuantoHayEn({ checked, cuelloChecks, notes, painLog, magiaLog, guerreroLog, workoutWeights, workoutReps, workoutProgress, ritmoReal, ritmoTramos, sensaciones, postponed, comidasLog, cambiosMenu }, dayKey)}
            cuelloEj={cuelloEj} cuelloChecks={cuelloChecks} toggleCuello={toggleCuello}
            checked={checked} toggleCheck={toggleCheck} mainDone={mainDone}
            workoutProgress={workoutProgress[dayKey]} onStartWorkout={() => setActiveWorkout(dayKey)}
            notes={notes} noteInput={noteInput} setNoteInput={setNoteInput} editingNote={editingNote} setEditingNote={setEditingNote} saveNote={saveNote}
            openCatalogo={(id) => { setCatalogoSelected(id); setScreen("ejercicios"); }}
            ritmoReal={ritmoReal} ritmoInput={ritmoInput} setRitmoInput={setRitmoInput}
            ritmoTramos={ritmoTramos} setRitmoTramos={setRitmoTramos}
            sensaciones={sensaciones} setSensaciones={setSensaciones}
            editingRitmo={editingRitmo} setEditingRitmo={setEditingRitmo}
            saveRitmo={(key) => {
              guardarRitmo(key, ritmoInput[key] || "");
              setEditingRitmo(p => Object.assign({}, p, { [key]: false }));
            }}
            copia={copiaPendiente(ultimoBackup, todayLocalIso(), Object.values(checked).some(Boolean))}
            resumenSemana={isToday && currentDay.dayIdx <= 2 && currentDay.weekIdx > 0
              ? resumenSemana(WEEKS[currentDay.weekIdx - 1], { checked, ritmoReal, pesos: workoutWeights, reps: workoutReps }, FLAT_DAYS)
              : null}
            onCopia={exportData}
            postponed={postponed} setPostponed={setPostponed}
            expandedBlock={expandedBlock} setExpandedBlock={setExpandedBlock}
            painLog={painLog} setPainLog={setPainLog}
            magiaRepaso={magiaRepaso} dominarTruco={dominarTruco} responderRepaso={responderRepaso}
            magiaLog={magiaLog} setMagiaLog={setMagiaLog}
            onOpenMagiaCatalogo={() => setScreen("magia-catalogo")}
            guerreroLog={guerreroLog} setGuerreroLog={setGuerreroLog}
            bloquesHistorial={bloquesHistorial} />
        )}

        {screen === "magia-catalogo" && (
          <MagiaCatalogoScreen onBack={() => setScreen("hoy")}
            magiaRepaso={magiaRepaso} dominarTruco={dominarTruco} responderRepaso={responderRepaso} />
        )}

        {screen === "semana" && (
          <SemanaScreen weekIdx={weekIdx} setWeekIdx={setWeekIdx} jumpToDay={jumpToDay}
            checked={checked} todayIso={FLAT_DAYS[todayIdx].isoDate}
            workoutWeights={workoutWeights} ritmoReal={ritmoReal}
            pausedRanges={pausedRanges} setPausedRanges={setPausedRanges} />
        )}

        {screen === "ejercicios" && (
          <EjerciciosScreen selectedId={catalogoSelected} setSelectedId={setCatalogoSelected}
            youtubeLinks={youtubeLinks} setYoutubeLinks={setYoutubeLinks}
            customExercises={customExercises} setCustomExercises={setCustomExercises}
            flaggedExercises={flaggedExercises} setFlaggedExercises={setFlaggedExercises} pushUndo={pushUndo} />
        )}

        {screen === "nutricion" && (
          <NutricionScreen comida={comida} apuntes={comidasLog[dayKey] || []}
            cambios={cambiosMenu[dayKey]} apuntarComida={apuntarComida} apuntarVarias={apuntarVarias}
            deshacerComida={deshacerComida} cambiarAlimento={cambiarAlimento}
            edits={menuEditado} guardarComidaDelMenu={guardarComidaDelMenu} restaurarMenu={restaurarMenu}
            esHoy={isToday}
            diasSemana={WEEKS[currentDay.weekIdx] ? WEEKS[currentDay.weekIdx].days : null}
            inicioSemana={WEEKS[currentDay.weekIdx] ? claveDia(WEEKS[currentDay.weekIdx].days[0]) : ""}
            compraMarcada={compraMarcada} marcarCompra={marcarCompra}
            comidasFuera={comidasFuera} marcarFuera={marcarFuera} />
        )}

        {screen === "progreso" && (
          <ProgresoScreen medidas={medidas} setMedidas={setMedidas}
            ritmoReal={ritmoReal} weeks={WEEKS} checked={checked} workoutWeights={workoutWeights} workoutReps={workoutReps} />
        )}

        {screen === "coach" && (
          <CoachScreen jumpToDay={jumpToDay} setWeekIdx={setWeekIdx} checked={checked}
            workoutWeights={workoutWeights} ritmoReal={ritmoReal} setScreen={setScreen}
            weeklyLog={weeklyLog} setWeeklyLog={setWeeklyLog}
            phaseAdjustNote={phaseAdjustNote} setPhaseAdjustNote={setPhaseAdjustNote}
            currentWeekOverride={currentWeekOverride} setCurrentWeekOverride={setCurrentWeekOverride}
            exportData={exportData} importData={importData} ultimoBackup={ultimoBackup} ultimoGuardado={ultimoGuardado} painLog={painLog} medidas={medidas}
            bloquesHistorial={bloquesHistorial} setBloquesHistorial={setBloquesHistorial}
            storageStatus={storageStatus}
            cuelloChecks={cuelloChecks} magiaLog={magiaLog} guerreroLog={guerreroLog} />
        )}

      </div>

      {undoStack && (
        <div style={{
          position: "fixed", bottom: 74, left: SP.lg, right: SP.lg, zIndex: 20,
          background: C.accent, borderRadius: R.lg, padding: "12px " + SP.lg + "px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}>
          <span style={{ fontSize: 12.5, color: "#FAFAF9", fontWeight: 600 }}>{undoStack.label}</span>
          <button className="btn" onClick={runUndo} style={{ fontSize: 12.5, fontWeight: 800, color: "#FAFAF9", textDecoration: "underline", flexShrink: 0, marginLeft: SP.md }}>DESHACER</button>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#FFFFFF", borderTop: "1px solid " + C.divider, paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
          {[
            { k: "hoy", label: "HOY" },
            { k: "semana", label: "SEMANA" },
            { k: "ejercicios", label: "EJERCICIOS" },
            { k: "nutricion", label: "NUTRICIÓN" },
            { k: "progreso", label: "PROGRESO" },
            { k: "coach", label: "COACH" },
          ].map(t => {
            const active = screen === t.k;
            return (
              <button key={t.k} className="btn" onClick={() => { setScreen(t.k); if (t.k === "semana") setWeekIdx(currentDay.weekIdx); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, minHeight: TAP_MIN, padding: "8px 2px 6px", position: "relative",
                }}>
                {active && <div style={{ position: "absolute", top: 0, left: "30%", right: "30%", height: 2, background: C.accent, borderRadius: 1 }} />}
                <span style={{ color: active ? C.accent : C.textFaint, display: "flex" }}>
                  <IconoNav nombre={t.k} activo={active} />
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.2, color: active ? C.accent : C.textFaint }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

