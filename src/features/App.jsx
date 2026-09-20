"use client";

import { useState, useEffect, useRef } from "react";
import { C, R, SP, TAP_MIN } from "@/design/tokens";
import { storage, CLAVE_DATOS, VERSION_ESQUEMA, migrar } from "@/lib/storage";
import { ICON_CUELLO, ICON_MOVILIDAD, ICON_NUTRICION } from "@/domain/assets/icons";
import { NUTRICION } from "@/domain/nutricion/nutricion";
import { WEEKS } from "@/domain/plan/bloque-1-base-7k";
import { FLAT_DAYS, findTodayIndex, todayLocalIso } from "@/domain/plan/calendario";
import { getCuelloEj } from "@/domain/salud/cuello";
import { getMovilidad } from "@/domain/salud/movilidad";
import { CoachScreen } from "@/features/coach/CoachScreen";
import { EjerciciosScreen } from "@/features/ejercicios/EjerciciosScreen";
import { MagiaCatalogoScreen } from "@/features/habilidades/MagiaCatalogoScreen";
import { HoyScreen } from "@/features/hoy/HoyScreen";
import { NutricionScreen } from "@/features/nutricion/NutricionScreen";
import { OnboardingScreen } from "@/features/onboarding/OnboardingScreen";
import { ProgresoScreen } from "@/features/progreso/ProgresoScreen";
import { SemanaScreen } from "@/features/semana/SemanaScreen";
import { WorkoutMode } from "@/features/workout/WorkoutMode";

export default function App() {
  const todayIdx = findTodayIndex();
  const [flatIdx, setFlatIdx] = useState(todayIdx);
  const [screen, setScreen] = useState("hoy");
  const [weekIdx, setWeekIdx] = useState(FLAT_DAYS[todayIdx].weekIdx);
  const [checked, setChecked] = useState({ "1-1": true, "1-3": true, "1-6": true, "2-1": true });
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
  const [magiaProgress, setMagiaProgress] = useState({}); // { truco_id: true } - trucos marcados como dominados
  const [magiaLog, setMagiaLog] = useState({}); // { dayKey: true } - dias que has practicado magia
  const [guerreroLog, setGuerreroLog] = useState({}); // { dayKey: true } - dias que has practicado guerrero
  const [workoutWeights, setWorkoutWeights] = useState({}); // { dayKey: { exerciseIdx: { serieIdx: "20" } } }
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [medidas, setMedidas] = useState([]); // [{fecha, peso, cintura, cadera}]
  const [ritmoReal, setRitmoReal] = useState({ "1-3": "8:38", "1-6": "7:46" }); // { dayKey: "5:12/km" }
  const [ritmoTramos, setRitmoTramos] = useState({ "1-3": "6:00", "1-6": "6:00" }); // { dayKey: "6:00" } - ritmo en los tramos corriendo (fase correr/caminar)
  const [sensaciones, setSensaciones] = useState({
    "1-3": "Completé los 6 bloques. Km 2 más lento (9:09 vs 8:15 y 8:13).",
    "1-6": "3ª salida de la semana, mejor que el jueves — menos tiempo caminando, primer km a 7:24. Sensaciones buenas.",
  }); // { dayKey: "texto" } - como te sentiste en la sesion
  const [ritmoInput, setRitmoInput] = useState({});
  const [editingRitmo, setEditingRitmo] = useState({});
  const [postponed, setPostponed] = useState({}); // { dayKey: {destino, titulo} }
  const [phaseAdjustNote, setPhaseAdjustNote] = useState(""); // nota libre sobre desviacion de fases/calendario
  const [currentWeekOverride, setCurrentWeekOverride] = useState(null); // numero de semana manual, o null = automatico por fecha
  const [weeklyLog, setWeeklyLog] = useState({
    1: "Semana 1 (31 Ago - 6 Sep) — CERRADA. Running: 3/3 salidas completadas. Progresión real: martes 2,40km a 8:38/km medio (tramos ~6:00/km); domingo 2,52km a 7:46/km medio (tramos ~6:00/km) — casi 1 min más rápido de media en la misma semana, con más distancia. La mejora viene de menos tiempo caminando entre bloques, no de correr más rápido — es la adaptación esperada en esta fase. Magia solo puntualmente. Cuello, movilidad y guerrero no arrancaron — motivo real: pereza en el momento, no falta de tiempo. Diagnóstico: los hábitos sin momento fijo dependen de decidir cada vez, y esa decisión se pierde; el running funciona porque tiene día y hora claros. Ajuste aplicado: running intacto, los 4 hábitos reiniciados a nivel 1 desde semana 2 con anclaje fijo a un momento del día (cuello: levantarte/comer/acostarte; guerrero: al llegar a casa; magia: antes de dormir).",
    2: "Nuevo compromiso fijo: tenis todos los lunes, 20:00-21:30, esfuerzo moderado (1:30 de intervalos — cardio real). Empezó el lunes 7 sep. El martes 8 sep no se corrió por cansancio del tenis. RESULTADO REAL de la semana: solo 1 de 3 salidas de running, 0 sesiones de fuerza, 0 de los 4 hábitos. DIAGNÓSTICO CORREGIDO: no es fatiga general — es fatiga de piernas y cardio por el tenis, que compite directamente con running y con fuerza de pierna. Guerrero, Magia y Movilidad NO generan esa fatiga y no había motivo real para pausarlos — se mantienen activos sin cambios. AJUSTE DE FONDO (semanas 3-5, fase ESTÉTICA): el tenis del lunes cuenta como sesión de calidad/cardio semanal — nada de running el lunes. El martes (día después del tenis) pasa a suave o descanso — el running de calidad que antes iba el martes se mueve al jueves, cuando las piernas ya han recuperado. Fuerza reorganizada por fatiga real de cada grupo, no de forma genérica: hombro y brazos (bíceps/tríceps) son casi gratis en fatiga sistémica y van a frecuencia alta sin recortar — es además la prioridad estética real. Pecho y espalda se mantienen pero moderando solo los movimientos pesados/compuestos (menos series de press y dominadas a fallo). Pierna es el único grupo realmente recortado (sin carga, solo patrón y salud de cadera) porque compite en directo con las mismas piernas del tenis. Se retoma volumen de pierna normal en semana 6 si el running lo pide por rendimiento.",
  }); // { weekN: "texto de la bitacora" }
  const [bloquesHistorial, setBloquesHistorial] = useState([
    { numero: 1, nombre: "Bloque 1 — Base 7K", inicio: "2026-08-31", fin: "2026-11-15",
      objetivoRunning: "7km @ 4:45/km", estado: "activo", revision: "" }
  ]); // historial de bloques de entrenamiento encadenados
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
          if (d.magiaLog) setMagiaLog(d.magiaLog);
          if (d.guerreroLog) setGuerreroLog(d.guerreroLog);
          if (d.workoutWeights) setWorkoutWeights(d.workoutWeights);
          if (d.medidas) setMedidas(d.medidas);
          if (d.ritmoReal) setRitmoReal(d.ritmoReal);
        if (d.ritmoTramos) setRitmoTramos(d.ritmoTramos);
        if (d.sensaciones) setSensaciones(d.sensaciones);
          if (d.postponed) setPostponed(d.postponed);
          if (d.phaseAdjustNote != null) setPhaseAdjustNote(d.phaseAdjustNote);
          if (d.currentWeekOverride !== undefined) setCurrentWeekOverride(d.currentWeekOverride);
          if (d.weeklyLog) setWeeklyLog(d.weeklyLog);
          if (d.bloquesHistorial) setBloquesHistorial(d.bloquesHistorial);
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

  // Guarda automaticamente cada vez que cambia cualquier dato real del usuario.
  // No guarda hasta que la carga inicial ha terminado, para no sobreescribir con valores vacios.
  useEffect(() => {
    if (!storageReady) return;
    const payload = {
      version: VERSION_ESQUEMA,
      checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, magiaProgress, magiaLog,
      guerreroLog, workoutWeights, medidas, ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote,
      currentWeekOverride, weeklyLog, bloquesHistorial,
    };
    const t = setTimeout(async () => {
      try {
        const result = await storage.set(CLAVE_DATOS, JSON.stringify(payload));
        setStorageStatus(result ? "ok" : "error");
      } catch (err) {
        setStorageStatus("error");
      }
    }, 500); // debounce - agrupa cambios rapidos seguidos en un solo guardado
    return () => clearTimeout(t);
  }, [checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, magiaProgress, magiaLog,
      guerreroLog, workoutWeights, medidas, ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote,
      currentWeekOverride, weeklyLog, bloquesHistorial, storageReady]);

  const currentDay = FLAT_DAYS[flatIdx] || FLAT_DAYS[todayIdx] || FLAT_DAYS[0];
  const isToday = flatIdx === todayIdx;
  const dayKey = currentDay.weekN + "-" + currentDay.dayIdx;
  const isFuerzaDay = currentDay.tipo === "fuerza";
  const isRunDay = currentDay.tipo === "run" || currentDay.tipo === "test" || currentDay.tipo === "objetivo";
  const mov = getMovilidad(currentDay.cat, currentDay.weekN);
  const cuelloEj = getCuelloEj(currentDay.weekN);
  const mainDone = currentDay.tipo === "libre" ? true : !!checked[dayKey];

  const toggleCheck = (key) => setChecked(p => Object.assign({}, p, { [key]: !p[key] }));
  const toggleCuello = (m) => setCuelloChecks(p => Object.assign({}, p, { [dayKey + "-" + m]: !p[dayKey + "-" + m] }));
  const saveNote = (key) => { setNotes(p => Object.assign({}, p, { [key]: noteInput[key] || "" })); setEditingNote(p => Object.assign({}, p, { [key]: false })); };
  const goDay = (d) => { setFlatIdx(Math.max(0, Math.min(FLAT_DAYS.length - 1, flatIdx + d))); setExpandedBlock("main"); };
  const goToday = () => { setFlatIdx(todayIdx); setScreen("hoy"); setExpandedBlock("main"); };
  const jumpToDay = (wIdx, dIdx) => { setFlatIdx(FLAT_DAYS.findIndex(d => d.weekIdx === wIdx && d.dayIdx === dIdx)); setScreen("hoy"); };

  // ─── Exportar / Importar todos los datos como JSON ─────────────────────
  const exportData = () => {
    const payload = {
      version: VERSION_ESQUEMA, exportedAt: new Date().toISOString(),
      checked, cuelloChecks, notes, youtubeLinks, customExercises, painLog,
      flaggedExercises, pausedRanges, workoutProgress, workoutWeights, medidas,
      ritmoReal, ritmoTramos, sensaciones, postponed, phaseAdjustNote, currentWeekOverride, weeklyLog,
      magiaProgress, magiaLog, guerreroLog, bloquesHistorial,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "programa-7k-backup-" + todayLocalIso() + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        if (data.medidas) setMedidas(data.medidas);
        if (data.ritmoReal) setRitmoReal(data.ritmoReal);
        if (data.ritmoTramos) setRitmoTramos(data.ritmoTramos);
        if (data.sensaciones) setSensaciones(data.sensaciones);
        if (data.postponed) setPostponed(data.postponed);
        if (data.phaseAdjustNote != null) setPhaseAdjustNote(data.phaseAdjustNote);
        if (data.currentWeekOverride !== undefined) setCurrentWeekOverride(data.currentWeekOverride);
        if (data.weeklyLog) setWeeklyLog(data.weeklyLog);
        if (data.magiaProgress) setMagiaProgress(data.magiaProgress);
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
      // Guarda de inmediato un dato minimo para que list() detecte que la clave ya existe,
      // aunque el usuario cierre sin haber marcado nada todavia
      storage.set(CLAVE_DATOS, JSON.stringify({ version: VERSION_ESQUEMA, onboardingVisto: true })).catch(() => {});
    }} />;
  }

  if (activeWorkout) {
    const wDay = FLAT_DAYS.find(d => (d.weekN + "-" + d.dayIdx) === activeWorkout);
    const wMov = getMovilidad(wDay.cat, wDay.weekN);

    // Busca el ultimo registro de peso de un ejercicio por nombre, en dias anteriores al actual
    const getExerciseHistory = (nombreEjercicio) => {
      let best = null; // { fecha, pesoMax, weekN, dayIdx }
      WEEKS.forEach(wk => {
        wk.days.forEach((d, di) => {
          if (d.tipo !== "fuerza") return;
          const dk = wk.n + "-" + di;
          if (dk === activeWorkout) return; // excluir el dia actual
          const dw = workoutWeights[dk];
          if (!dw) return;
          const exIdx = d.ejercicios.findIndex(e => e.nombre === nombreEjercicio);
          if (exIdx === -1) return;
          const serieWeights = dw[exIdx];
          if (!serieWeights) return;
          const vals = Object.values(serieWeights).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
          if (vals.length === 0) return;
          const maxW = Math.max(...vals);
          const isNewer = !best || (wk.n > best.weekN) || (wk.n === best.weekN && di > best.dayIdx);
          if (isNewer) best = { fecha: d.date, pesoMax: maxW, weekN: wk.n, dayIdx: di };
        });
      });
      return best;
    };

    return (
      <WorkoutMode day={wDay} mov={wMov} progress={workoutProgress[activeWorkout] || {}}
        onUpdateProgress={(ei, sd) => setWorkoutProgress(p => Object.assign({}, p, { [activeWorkout]: Object.assign({}, p[activeWorkout]||{}, { [ei]: sd }) }))}
        onFinish={() => { setChecked(p => Object.assign({}, p, { [activeWorkout]: true })); setActiveWorkout(null); }}
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
        getExerciseHistory={getExerciseHistory} flaggedExercises={flaggedExercises} />
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

        {screen === "hoy" && (
          <HoyScreen day={currentDay} dayKey={dayKey} isToday={isToday} flatIdx={flatIdx}
            goDay={goDay} goToday={goToday} onJumpDay={jumpToDay}
            isFuerzaDay={isFuerzaDay} isRunDay={isRunDay} mov={mov}
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
              const valor = ritmoInput[key] || "";
              setRitmoReal(p => Object.assign({}, p, { [key]: valor }));
              setEditingRitmo(p => Object.assign({}, p, { [key]: false }));
              // Si anotas un ritmo, esa sesion se da por hecha automaticamente
              if (valor.trim()) setChecked(p => Object.assign({}, p, { [key]: true }));
            }}
            postponed={postponed} setPostponed={setPostponed}
            expandedBlock={expandedBlock} setExpandedBlock={setExpandedBlock}
            painLog={painLog} setPainLog={setPainLog}
            magiaProgress={magiaProgress} setMagiaProgress={setMagiaProgress}
            magiaLog={magiaLog} setMagiaLog={setMagiaLog}
            onOpenMagiaCatalogo={() => setScreen("magia-catalogo")}
            guerreroLog={guerreroLog} setGuerreroLog={setGuerreroLog}
            bloquesHistorial={bloquesHistorial} />
        )}

        {screen === "magia-catalogo" && (
          <MagiaCatalogoScreen onBack={() => setScreen("hoy")} currentWeekN={currentDay ? currentDay.weekN : 1}
            magiaProgress={magiaProgress} setMagiaProgress={setMagiaProgress} magiaLog={magiaLog} />
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

        {screen === "nutricion" && <NutricionScreen />}

        {screen === "progreso" && (
          <ProgresoScreen medidas={medidas} setMedidas={setMedidas}
            ritmoReal={ritmoReal} weeks={WEEKS} checked={checked} workoutWeights={workoutWeights} />
        )}

        {screen === "coach" && (
          <CoachScreen jumpToDay={jumpToDay} setWeekIdx={setWeekIdx} checked={checked}
            workoutWeights={workoutWeights} ritmoReal={ritmoReal} setScreen={setScreen}
            weeklyLog={weeklyLog} setWeeklyLog={setWeeklyLog}
            phaseAdjustNote={phaseAdjustNote} setPhaseAdjustNote={setPhaseAdjustNote}
            currentWeekOverride={currentWeekOverride} setCurrentWeekOverride={setCurrentWeekOverride}
            exportData={exportData} importData={importData} painLog={painLog} medidas={medidas}
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
            { k: "hoy", label: "HOY", icon: null },
            { k: "semana", label: "SEMANA", icon: null },
            { k: "ejercicios", label: "EJERCICIOS", icon: ICON_MOVILIDAD },
            { k: "nutricion", label: "NUTRICION", icon: ICON_NUTRICION },
            { k: "progreso", label: "PROGRESO", icon: ICON_CUELLO },
            { k: "coach", label: "COACH", icon: null },
          ].map(t => {
            const active = screen === t.k;
            return (
              <button key={t.k} className="btn" onClick={() => { setScreen(t.k); if (t.k === "semana") setWeekIdx(currentDay.weekIdx); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, minHeight: TAP_MIN, padding: "8px 2px 6px", position: "relative",
                }}>
                {active && <div style={{ position: "absolute", top: 0, left: "30%", right: "30%", height: 2, background: C.accent, borderRadius: 1 }} />}
                {t.icon ? (
                  <img src={t.icon} alt="" style={{ width: 19, height: 19, objectFit: "contain", opacity: active ? 1 : 0.38 }} />
                ) : (
                  <div style={{ width: 19, height: 19, borderRadius: 5, border: "1.8px solid " + (active ? C.accent : C.textFaint), opacity: active ? 1 : 0.5 }} />
                )}
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.2, color: active ? C.accent : C.textFaint }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

