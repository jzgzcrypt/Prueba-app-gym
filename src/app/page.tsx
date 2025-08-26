'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { WorkoutModal } from '@/components/WorkoutModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { WeightEntry, CardioEntry, DietEntry, DailyAdherence, WorkoutEntry, Exercise, NeatEntry, SeguimientoEntry, EntrenoNoProgramado } from '@/types';
import { LoadingFallback } from '@/components/LoadingFallback';
import { getCurrentMesocicloDay, setMesocicloStartDate, getMesocicloStartDate, testMesocicloTracking, calcularCaloriasEntrenoNoProgramado } from '@/utils/mesocicloUtils';

export default function Dashboard() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'mesociclo' | 'history' | 'settings'>('today');
  const [showStartDateConfig, setShowStartDateConfig] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [workoutType] = useState('Pull');
  const [selectedWorkout, setSelectedWorkout] = useState<{
    dia: string;
    entrenamiento: string;
    ejercicios: string[];
    cardio?: { tipo: string; duracion: number; intensidad: string; };
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    info: boolean;
    volumen: boolean;
    microciclos: { [key: number]: boolean };
  }>({
    info: false,
    volumen: false,
    microciclos: {}
  });
  
  // Estado para forzar re-render cuando cambia la fecha
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Local storage hooks
  const [estado, setEstado] = useLocalStorage<WeightEntry[]>('estado', []);
  const [cardio, setCardio] = useLocalStorage<CardioEntry[]>('cardio', []);
  const [dieta, setDieta] = useLocalStorage<DietEntry[]>('dieta', []);
  const [workouts, setWorkouts] = useLocalStorage<WorkoutEntry[]>('workouts', []);
  const [neat, setNeat] = useLocalStorage<NeatEntry[]>('neat', []);
  const [seguimiento, setSeguimiento] = useLocalStorage<SeguimientoEntry[]>('seguimiento', []);
  const [entrenosNoProgramados, setEntrenosNoProgramados] = useLocalStorage<EntrenoNoProgramado[]>('entrenosNoProgramados', []);
  const [adherenciaDiaria, setAdherenciaDiaria] = useLocalStorage<DailyAdherence>('adherenciaDiaria', {});

  // Effect para manejar la carga inicial
  useEffect(() => {
    // Asegurar que localStorage esté disponible
    if (typeof window !== 'undefined') {
      try {
        // Test localStorage access
        localStorage.getItem('test');
        setIsLoading(false);
      } catch (error) {
        console.error('localStorage not available:', error);
        setIsLoading(false);
      }
    }
  }, []);

  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [cardioKm, setCardioKm] = useState('');
  const [cardioTime, setCardioTime] = useState('');
  const [dietCalories, setDietCalories] = useState('');
  const [dietProtein, setDietProtein] = useState('');
  
  // NEAT form states
  const [neatTipo, setNeatTipo] = useState<'pasos' | 'cinta'>('pasos');
  const [neatPasos, setNeatPasos] = useState('');
  const [neatRitmo, setNeatRitmo] = useState('');
  const [neatKm, setNeatKm] = useState('');
  const [neatRitmoKmH, setNeatRitmoKmH] = useState('');
  const [neatInclinacion, setNeatInclinacion] = useState('');
  const [neatDuracion, setNeatDuracion] = useState('');
  
  // Seguimiento form states
  const [seguimientoPeso, setSeguimientoPeso] = useState('');
  const [seguimientoCintura, setSeguimientoCintura] = useState('');
  const [seguimientoNotas, setSeguimientoNotas] = useState('');
  
  // Entreno no programado form states
  const [entrenoTipo, setEntrenoTipo] = useState<'tenis' | 'natacion' | 'alpinismo' | 'ciclismo' | 'running' | 'futbol' | 'baloncesto' | 'escalada' | 'yoga' | 'pilates' | 'crossfit' | 'otro'>('tenis');
  const [entrenoDuracion, setEntrenoDuracion] = useState('');
  const [entrenoIntensidad, setEntrenoIntensidad] = useState<'baja' | 'moderada' | 'alta' | 'muy alta'>('moderada');
  const [entrenoEsfuerzo, setEntrenoEsfuerzo] = useState('');
  const [entrenoNotas, setEntrenoNotas] = useState('');
  
  // Campos específicos por actividad
  const [entrenoTenisSets, setEntrenoTenisSets] = useState('');
  const [entrenoTenisDuracionSet, setEntrenoTenisDuracionSet] = useState('');
  const [entrenoTenisNivel, setEntrenoTenisNivel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  
  const [entrenoNatacionMetros, setEntrenoNatacionMetros] = useState('');
  const [entrenoNatacionEstilo, setEntrenoNatacionEstilo] = useState<'libre' | 'espalda' | 'braza' | 'mariposa' | 'combinado'>('libre');
  const [entrenoNatacionRitmo, setEntrenoNatacionRitmo] = useState<'lento' | 'moderado' | 'rápido' | 'competitivo'>('moderado');
  
  const [entrenoAlpinismoRuta, setEntrenoAlpinismoRuta] = useState('');
  const [entrenoAlpinismoDesnivel, setEntrenoAlpinismoDesnivel] = useState('');
  const [entrenoAlpinismoDificultad, setEntrenoAlpinismoDificultad] = useState<'facil' | 'moderada' | 'dificil' | 'muy dificil'>('moderada');
  const [entrenoAlpinismoCondiciones, setEntrenoAlpinismoCondiciones] = useState<'buenas' | 'regulares' | 'malas'>('buenas');
  
  const [entrenoCiclismoKm, setEntrenoCiclismoKm] = useState('');
  const [entrenoCiclismoRitmo, setEntrenoCiclismoRitmo] = useState('');
  const [entrenoCiclismoDesnivel, setEntrenoCiclismoDesnivel] = useState('');
  const [entrenoCiclismoTipo, setEntrenoCiclismoTipo] = useState<'carretera' | 'mtb' | 'urbano'>('carretera');
  
  const [entrenoRunningKm, setEntrenoRunningKm] = useState('');
  const [entrenoRunningRitmo, setEntrenoRunningRitmo] = useState('');
  const [entrenoRunningTipo, setEntrenoRunningTipo] = useState<'carrera' | 'trail' | 'intervalos'>('carrera');
  
  const [entrenoFutbolDuracion, setEntrenoFutbolDuracion] = useState('');
  const [entrenoFutbolPosicion, setEntrenoFutbolPosicion] = useState<'portero' | 'defensa' | 'centrocampista' | 'delantero'>('centrocampista');
  const [entrenoFutbolIntensidad, setEntrenoFutbolIntensidad] = useState<'amistoso' | 'competitivo'>('amistoso');
  
  const [entrenoBaloncestoDuracion, setEntrenoBaloncestoDuracion] = useState('');
  const [entrenoBaloncestoPosicion, setEntrenoBaloncestoPosicion] = useState<'base' | 'escolta' | 'ala' | 'ala-pivot' | 'pivot'>('ala');
  const [entrenoBaloncestoIntensidad, setEntrenoBaloncestoIntensidad] = useState<'amistoso' | 'competitivo'>('amistoso');
  
  const [entrenoEscaladaRutas, setEntrenoEscaladaRutas] = useState('');
  const [entrenoEscaladaGrado, setEntrenoEscaladaGrado] = useState('');
  const [entrenoEscaladaTipo, setEntrenoEscaladaTipo] = useState<'boulder' | 'deportiva' | 'tradicional'>('deportiva');
  
  const [entrenoYogaTipo, setEntrenoYogaTipo] = useState<'hatha' | 'vinyasa' | 'ashtanga' | 'yin' | 'restaurativo'>('hatha');
  const [entrenoYogaNivel, setEntrenoYogaNivel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  
  const [entrenoPilatesTipo, setEntrenoPilatesTipo] = useState<'mat' | 'reformer' | 'cadillac'>('mat');
  const [entrenoPilatesNivel, setEntrenoPilatesNivel] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  
  const [entrenoCrossfitWod, setEntrenoCrossfitWod] = useState('');
  const [entrenoCrossfitTiempo, setEntrenoCrossfitTiempo] = useState('');
  const [entrenoCrossfitRx, setEntrenoCrossfitRx] = useState(false);
  
  const [entrenoOtroActividad, setEntrenoOtroActividad] = useState('');
  const [entrenoOtroDetalles, setEntrenoOtroDetalles] = useState('');

  // Desktop form states
  const [desktopWeight, setDesktopWeight] = useState('');
  const [desktopWorkout, setDesktopWorkout] = useState('');
  const [desktopCardio, setDesktopCardio] = useState('');

  const todayISO = () => new Date().toISOString().split('T')[0];

  // Obtener datos del día actual del mesociclo (memoizado para evitar recálculos)
  const [currentData, setCurrentData] = useState(() => {
    try {
      return getCurrentMesocicloDay();
    } catch {
      // Fallback en caso de error durante SSR
      return {
        microciclo: { nombre: 'Cargando...', dias: [] },
        dia: { 
          dia: 'Cargando...', 
          entrenamiento: 'Cargando...', 
          ejercicios: [],
          cardio: undefined
        },
        mesociclo: { nombre: 'Cargando...', microciclos: [] },
        semanaActual: 1,
        diaSemana: 0,
        diaMesociclo: 1,
        diasTranscurridos: 0,
        diasEnMicrociclo: 0,
        microcicloCompletado: false
      };
    }
  });

  // Actualizar datos del mesociclo cuando el componente se monta en el cliente
  useEffect(() => {
    try {
      const updatedData = getCurrentMesocicloDay();
      setCurrentData(updatedData);
    } catch {
      console.error('Error al actualizar datos del mesociclo');
    }
  }, []);

  const calculateProgress = () => {
    const today = todayISO();
    const todayAdherence = adherenciaDiaria[today] || {};
    const tasks = ['workout', 'cardio', 'dieta', 'neat'] as const;
    const completed = tasks.filter(task => todayAdherence[task]).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const openModal = (type: string) => {
    setActiveModal(type);
  };

  const toggleSection = (section: 'info' | 'volumen') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleMicrociclo = (microcicloId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      microciclos: {
        ...prev.microciclos,
        [microcicloId]: !prev.microciclos[microcicloId]
      }
    }));
  };

  const closeModal = () => {
    setActiveModal(null);
    // Reset form states
    setWeightInput('');
    setCardioKm('');
    setCardioTime('');
    setDietCalories('');
    setDietProtein('');
    
    // Reset NEAT form states
    setNeatTipo('pasos');
    setNeatPasos('');
    setNeatRitmo('');
    setNeatKm('');
    setNeatRitmoKmH('');
    setNeatInclinacion('');
    setNeatDuracion('');
    
    // Reset seguimiento form states
    setSeguimientoPeso('');
    setSeguimientoCintura('');
    setSeguimientoNotas('');
    
    // Reset entreno no programado form states
    setEntrenoDuracion('');
    setEntrenoEsfuerzo('');
    setEntrenoNotas('');
    setEntrenoTenisSets('');
    setEntrenoTenisDuracionSet('');
    setEntrenoNatacionMetros('');
    setEntrenoAlpinismoRuta('');
    setEntrenoAlpinismoDesnivel('');
    setEntrenoCiclismoKm('');
    setEntrenoCiclismoRitmo('');
    setEntrenoCiclismoDesnivel('');
    setEntrenoRunningKm('');
    setEntrenoRunningRitmo('');
    setEntrenoFutbolDuracion('');
    setEntrenoBaloncestoDuracion('');
    setEntrenoEscaladaRutas('');
    setEntrenoEscaladaGrado('');
    setEntrenoCrossfitWod('');
    setEntrenoCrossfitTiempo('');
    setEntrenoOtroActividad('');
    setEntrenoOtroDetalles('');
    
    // Reset start date config
    setShowStartDateConfig(false);
    setStartDateInput('');
  };

  const handleWorkoutComplete = (exercises: Exercise[]) => {
    const workout: WorkoutEntry = {
      fecha: todayISO(),
      tipo: workoutType,
      ejercicios: exercises,
      completado: true,
      duracion: 60,
      notas: `Entrenamiento ${workoutType} completado`
    };
    
    const newWorkouts = [...workouts, workout];
    setWorkouts(newWorkouts);
    
    const fecha = todayISO();
    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].workout = true;
    
    setAdherenciaDiaria(newAdherencia);
    showToast(`🎯 ¡Entrenamiento ${workoutType} completado!`);
    closeModal();
  };

  const saveWeight = () => {
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) {
      showToast('⚠️ Ingresa un peso válido', 'error');
      return;
    }

    const fecha = todayISO();
    const newEstado = estado.filter(e => e.fecha !== fecha);
    newEstado.push({ fecha, peso: weight, cintura: null });
    newEstado.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    setEstado(newEstado);
    showToast(`✅ Peso guardado: ${weight} kg`);
    closeModal();
  };



  const saveCardio = () => {
    const km = parseFloat(cardioKm);
    const time = parseInt(cardioTime);
    
    if (!km || !time || km <= 0 || time <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    // Obtener cardio del mesociclo para hoy
    const cardioMesociclo = currentData.dia.cardio;

    const fecha = todayISO();
    const newCardio = cardio.filter(c => c.fecha !== fecha);
    newCardio.push({
      fecha,
      microciclo: 1,
      sesionId: 1,
      km,
      tiempo: time,
      ritmo: time / km,
      calorias: Math.round(time * 10),
      tipo: 'mesociclo',
      intensidad: cardioMesociclo?.intensidad || 'Moderado'
    });

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].cardio = true;

    setCardio(newCardio);
    setAdherenciaDiaria(newAdherencia);
    showToast(`✅ Cardio guardado: ${km}km en ${time}min (${cardioMesociclo?.tipo || 'Cardio'})`);
    closeModal();
  };

  const saveDiet = () => {
    const calories = parseInt(dietCalories);
    const protein = parseInt(dietProtein);
    
    if (!calories || !protein || calories <= 0 || protein <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    const fecha = todayISO();
    const newDieta = dieta.filter(d => d.fecha !== fecha);
    newDieta.push({
      fecha,
      calorias: calories,
      proteinas: protein,
      carbos: Math.round((calories - protein * 4) * 0.4 / 4),
      grasas: Math.round((calories - protein * 4) * 0.2 / 9),
      ayuno: false
    });

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].dieta = calories >= 1700 && calories <= 1900 && protein >= 150;

    setDieta(newDieta);
    setAdherenciaDiaria(newAdherencia);
    showToast('✅ Dieta guardada');
    closeModal();
  };

  const saveNeat = () => {
    const fecha = todayISO();
    
    if (neatTipo === 'pasos') {
      const pasos = parseInt(neatPasos);
      const ritmo = neatRitmo;
      
      if (!pasos || !ritmo || pasos <= 0) {
        showToast('⚠️ Ingresa valores válidos', 'error');
        return;
      }

      // Calcular calorías basado en pasos y ritmo
      let caloriasPorPaso = 0.04; // Base
      let duracion = 60; // Base 1 hora
      
      switch (ritmo) {
        case 'ritmo rápido':
          caloriasPorPaso = 0.06;
          duracion = 45;
          break;
        case 'andar normal':
          caloriasPorPaso = 0.04;
          duracion = 60;
          break;
        case 'caminar rápido':
          caloriasPorPaso = 0.05;
          duracion = 50;
          break;
        case 'paseo':
          caloriasPorPaso = 0.03;
          duracion = 75;
          break;
      }

      const calorias = Math.round(pasos * caloriasPorPaso);

      const newNeat = neat.filter(n => n.fecha !== fecha);
      newNeat.push({
        fecha,
        tipo: 'pasos',
        pasos,
        ritmo,
        calorias,
        duracion
      });

      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].neat = true;

      setNeat(newNeat);
      setAdherenciaDiaria(newAdherencia);
      showToast(`✅ NEAT guardado: ${pasos} pasos (${ritmo}) - ${calorias} kcal`);
    } else {
      const km = parseFloat(neatKm);
      const ritmoKmH = parseFloat(neatRitmoKmH);
      const inclinacion = parseFloat(neatInclinacion);
      const duracion = parseInt(neatDuracion);
      
      if (!km || !ritmoKmH || !duracion || km <= 0 || ritmoKmH <= 0 || duracion <= 0) {
        showToast('⚠️ Ingresa valores válidos', 'error');
        return;
      }

      // Calcular calorías basado en MET (Metabolic Equivalent of Task)
      let met = 3.5; // Base caminar
      if (ritmoKmH > 6) met = 8; // Correr
      else if (ritmoKmH > 4) met = 5; // Caminar rápido
      
      // Ajustar por inclinación
      if (inclinacion > 0) met += inclinacion * 0.5;
      
      // Calcular calorías: MET * peso * tiempo / 60
      const pesoActual = estado.length > 0 ? estado[estado.length - 1].peso : 75;
      const calorias = Math.round(met * pesoActual * duracion / 60);

      const newNeat = neat.filter(n => n.fecha !== fecha);
      newNeat.push({
        fecha,
        tipo: 'cinta',
        km,
        ritmoKmH,
        inclinacion,
        calorias,
        duracion
      });

      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].neat = true;

      setNeat(newNeat);
      setAdherenciaDiaria(newAdherencia);
      showToast(`✅ NEAT guardado: ${km}km a ${ritmoKmH}km/h - ${calorias} kcal`);
    }
    
    closeModal();
  };

  const saveSeguimiento = () => {
    const peso = parseFloat(seguimientoPeso);
    const cintura = parseFloat(seguimientoCintura);
    
    if (!peso || !cintura || peso <= 0 || cintura <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    const fecha = todayISO();
    const newSeguimiento = seguimiento.filter(s => s.fecha !== fecha);
    newSeguimiento.push({
      fecha,
      peso,
      cintura,
      notas: seguimientoNotas || undefined
    });

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].seguimiento = true;

    setSeguimiento(newSeguimiento);
    setAdherenciaDiaria(newAdherencia);
    showToast(`✅ Seguimiento guardado: ${peso}kg, cintura ${cintura}cm`);
    closeModal();
  };

  const saveEntrenoNoProgramado = () => {
    if (!entrenoDuracion || !entrenoEsfuerzo) {
      showToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    const duracion = parseInt(entrenoDuracion);
    const esfuerzo = parseInt(entrenoEsfuerzo);
    
    if (duracion <= 0 || esfuerzo < 1 || esfuerzo > 10) {
      showToast('Duración y esfuerzo deben ser válidos', 'error');
      return;
    }

    // Obtener datos específicos según el tipo de actividad
    let datosEspecificos: Record<string, unknown> = {};
    
    switch (entrenoTipo) {
      case 'tenis':
        if (!entrenoTenisSets || !entrenoTenisDuracionSet) {
          showToast('Completa los datos específicos de tenis', 'error');
          return;
        }
        datosEspecificos = {
          sets: parseInt(entrenoTenisSets),
          duracionSet: parseInt(entrenoTenisDuracionSet),
          nivel: entrenoTenisNivel
        };
        break;
        
      case 'natacion':
        if (!entrenoNatacionMetros) {
          showToast('Completa los metros nadados', 'error');
          return;
        }
        datosEspecificos = {
          metros: parseInt(entrenoNatacionMetros),
          estilo: entrenoNatacionEstilo,
          ritmo: entrenoNatacionRitmo
        };
        break;
        
      case 'alpinismo':
        if (!entrenoAlpinismoRuta || !entrenoAlpinismoDesnivel) {
          showToast('Completa los datos de la ruta', 'error');
          return;
        }
        datosEspecificos = {
          ruta: entrenoAlpinismoRuta,
          desnivel: parseInt(entrenoAlpinismoDesnivel),
          dificultad: entrenoAlpinismoDificultad,
          condiciones: entrenoAlpinismoCondiciones
        };
        break;
        
      case 'ciclismo':
        if (!entrenoCiclismoKm || !entrenoCiclismoRitmo) {
          showToast('Completa los datos de ciclismo', 'error');
          return;
        }
        datosEspecificos = {
          km: parseFloat(entrenoCiclismoKm),
          ritmoKmH: parseFloat(entrenoCiclismoRitmo),
          desnivel: entrenoCiclismoDesnivel ? parseInt(entrenoCiclismoDesnivel) : 0,
          tipo: entrenoCiclismoTipo
        };
        break;
        
      case 'running':
        if (!entrenoRunningKm || !entrenoRunningRitmo) {
          showToast('Completa los datos de running', 'error');
          return;
        }
        datosEspecificos = {
          km: parseFloat(entrenoRunningKm),
          ritmoMinKm: parseFloat(entrenoRunningRitmo),
          tipo: entrenoRunningTipo
        };
        break;
        
      case 'futbol':
        if (!entrenoFutbolDuracion) {
          showToast('Completa la duración del partido', 'error');
          return;
        }
        datosEspecificos = {
          duracionPartido: parseInt(entrenoFutbolDuracion),
          posicion: entrenoFutbolPosicion,
          intensidad: entrenoFutbolIntensidad
        };
        break;
        
      case 'baloncesto':
        if (!entrenoBaloncestoDuracion) {
          showToast('Completa la duración del partido', 'error');
          return;
        }
        datosEspecificos = {
          duracionPartido: parseInt(entrenoBaloncestoDuracion),
          posicion: entrenoBaloncestoPosicion,
          intensidad: entrenoBaloncestoIntensidad
        };
        break;
        
      case 'escalada':
        if (!entrenoEscaladaRutas || !entrenoEscaladaGrado) {
          showToast('Completa los datos de escalada', 'error');
          return;
        }
        datosEspecificos = {
          rutas: parseInt(entrenoEscaladaRutas),
          grado: entrenoEscaladaGrado,
          tipo: entrenoEscaladaTipo
        };
        break;
        
      case 'yoga':
        datosEspecificos = {
          tipo: entrenoYogaTipo,
          nivel: entrenoYogaNivel
        };
        break;
        
      case 'pilates':
        datosEspecificos = {
          tipo: entrenoPilatesTipo,
          nivel: entrenoPilatesNivel
        };
        break;
        
      case 'crossfit':
        if (!entrenoCrossfitWod || !entrenoCrossfitTiempo) {
          showToast('Completa los datos del WOD', 'error');
          return;
        }
        datosEspecificos = {
          wod: entrenoCrossfitWod,
          tiempo: parseInt(entrenoCrossfitTiempo),
          rx: entrenoCrossfitRx
        };
        break;
        
      case 'otro':
        if (!entrenoOtroActividad) {
          showToast('Especifica la actividad', 'error');
          return;
        }
        datosEspecificos = {
          actividad: entrenoOtroActividad,
          detalles: entrenoOtroDetalles
        };
        break;
    }

    // Calcular calorías
    const peso = estado.length > 0 ? estado[estado.length - 1].peso : 75;
    const calorias = calcularCaloriasEntrenoNoProgramado(
      entrenoTipo,
      duracion,
      entrenoIntensidad,
      peso,
      datosEspecificos
    );

    const fecha = todayISO();
    const newEntreno: EntrenoNoProgramado = {
      fecha,
      tipo: entrenoTipo,
      duracion,
      intensidad: entrenoIntensidad,
      calorias,
      esfuerzo,
      notas: entrenoNotas || undefined,
      ...datosEspecificos
    };

    const newEntrenos = entrenosNoProgramados.filter(e => e.fecha !== fecha);
    newEntrenos.push(newEntreno);
    setEntrenosNoProgramados(newEntrenos);
    
    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].entrenoNoProgramado = true;
    setAdherenciaDiaria(newAdherencia);

    // Limpiar formulario
    setEntrenoDuracion('');
    setEntrenoEsfuerzo('');
    setEntrenoNotas('');
    setEntrenoTenisSets('');
    setEntrenoTenisDuracionSet('');
    setEntrenoNatacionMetros('');
    setEntrenoAlpinismoRuta('');
    setEntrenoAlpinismoDesnivel('');
    setEntrenoCiclismoKm('');
    setEntrenoCiclismoRitmo('');
    setEntrenoCiclismoDesnivel('');
    setEntrenoRunningKm('');
    setEntrenoRunningRitmo('');
    setEntrenoFutbolDuracion('');
    setEntrenoBaloncestoDuracion('');
    setEntrenoEscaladaRutas('');
    setEntrenoEscaladaGrado('');
    setEntrenoCrossfitWod('');
    setEntrenoCrossfitTiempo('');
    setEntrenoOtroActividad('');
    setEntrenoOtroDetalles('');

    closeModal();
    showToast(`✅ Entreno de ${entrenoTipo} guardado: ${calorias} calorías`, 'success');
  };

  const handleStartDateConfig = () => {
    if (!startDateInput) {
      showToast('⚠️ Ingresa una fecha válida', 'error');
      return;
    }
    
    const startDate = new Date(startDateInput);
    if (isNaN(startDate.getTime())) {
      showToast('⚠️ Fecha inválida', 'error');
      return;
    }
    
    try {
      setMesocicloStartDate(startDate);
      showToast(`✅ Fecha de inicio configurada: ${startDate.toLocaleDateString()}`);
      setShowStartDateConfig(false);
      setStartDateInput('');
      // Forzar re-render sin recarga
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error al configurar fecha:', error);
      showToast('⚠️ Error al configurar fecha', 'error');
    }
  };

  const handleDesktopSave = () => {
    const savedItems = [];

    if (desktopWeight && parseFloat(desktopWeight) > 0) {
      const fecha = todayISO();
      const newEstado = estado.filter(e => e.fecha !== fecha);
      newEstado.push({ fecha, peso: parseFloat(desktopWeight), cintura: null });
      setEstado(newEstado);
      savedItems.push('Peso');
    }

    if (desktopWorkout && desktopWorkout !== 'Descanso') {
      const fecha = todayISO();
      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].pesos = true;
      setAdherenciaDiaria(newAdherencia);
      savedItems.push('Entrenamiento');
    }

    if (desktopCardio && parseFloat(desktopCardio) > 0) {
      const fecha = todayISO();
      const newCardio = cardio.filter(c => c.fecha !== fecha);
      newCardio.push({
        fecha,
        microciclo: 1,
        sesionId: 1,
        km: parseFloat(desktopCardio),
        tiempo: Math.round(parseFloat(desktopCardio) * 7),
        ritmo: Math.round(parseFloat(desktopCardio) * 7) / parseFloat(desktopCardio),
        calorias: Math.round(parseFloat(desktopCardio) * 7 * 10),
        tipo: 'mesociclo',
        intensidad: 'Moderado'
      });
      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].cardio = true;
      setCardio(newCardio);
      setAdherenciaDiaria(newAdherencia);
      savedItems.push('Cardio');
    }

    if (savedItems.length > 0) {
      showToast(`✅ Guardado: ${savedItems.join(', ')}`);
      setDesktopWeight('');
      setDesktopWorkout('');
      setDesktopCardio('');
    } else {
      showToast('⚠️ Introduce al menos un dato', 'warning');
    }
  };

  const getStatus = (type: 'weight' | 'workout' | 'cardio' | 'diet' | 'neat' | 'seguimiento' | 'entrenoNoProgramado') => {
    const today = todayISO();
    const todayAdherence = adherenciaDiaria[today] || {};
    
    switch (type) {
      case 'weight':
        return estado.find(e => e.fecha === today) ? 'Completado' : 'Pendiente';
      case 'workout':
        return todayAdherence.workout ? 'Completado' : 'Pendiente';
      case 'cardio':
        return todayAdherence.cardio ? 'Completado' : 'Pendiente';
      case 'diet':
        return todayAdherence.dieta ? 'Completado' : 'Pendiente';
      case 'neat':
        return todayAdherence.neat ? 'Completado' : 'Pendiente';
      case 'seguimiento':
        return todayAdherence.seguimiento ? 'Completado' : 'Pendiente';
      case 'entrenoNoProgramado':
        return todayAdherence.entrenoNoProgramado ? 'Completado' : 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  const getStatusClass = (type: 'weight' | 'workout' | 'cardio' | 'diet' | 'neat' | 'seguimiento' | 'entrenoNoProgramado') => {
    const status = getStatus(type);
    return `text-sm ${status === 'Completado' ? 'success' : 'pending'}`;
  };

  const progress = calculateProgress();

  // Función para calcular calorías totales del día
  const getCaloriasDelDia = () => {
    const today = todayISO();
    let totalCalorias = 0;
    
    // Calorías del cardio
    const cardioHoy = cardio.find(c => c.fecha === today);
    if (cardioHoy) {
      totalCalorias += cardioHoy.calorias;
    }
    
    // Calorías del NEAT
    const neatHoy = neat.find(n => n.fecha === today);
    if (neatHoy) {
      totalCalorias += neatHoy.calorias;
    }
    
    // Calorías del entrenamiento (estimación)
    const workoutHoy = workouts.find(w => w.fecha === today);
    if (workoutHoy) {
      totalCalorias += 300; // Estimación base para entrenamiento de fuerza
    }
    
    // Calorías de entrenos no programados
    const entrenosHoy = entrenosNoProgramados.filter(e => e.fecha === today);
    entrenosHoy.forEach(entreno => {
      totalCalorias += entreno.calorias;
    });
    
    return totalCalorias;
  };



  const renderTodaySection = () => (
    <div className="min-h-screen pb-32 p-4">
      {/* Header */}
      <div className="glass-card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
                          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent mb-2">
                Mi Entrenamiento
              </h1>
            <p className="text-gray-600 text-lg">
              Hoy es {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => openModal('calendar')}
              className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-all text-white shadow-lg"
            >
              <span className="text-xl">📅</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="glass-card text-center mb-6">
        <div className="flex justify-center mb-4">
          <ProgressCircle progress={progress} />
        </div>
        <p className="text-sm text-gray-600">Progreso del día</p>
      </div>
      
      {/* Today's Tasks */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-6 text-slate-700 text-center">🎯 Hoy toca</h2>
        
                {/* Current Day Info */}
        {(() => {
          let currentData;
          let startDate = null;
          
          // Solo ejecutar en el cliente después de la hidratación
          if (typeof window !== 'undefined' && !isLoading) {
            try {
              currentData = getCurrentMesocicloDay();
              startDate = getMesocicloStartDate();
            } catch (error) {
              console.error('Error loading mesociclo:', error);
              currentData = {
                microciclo: { nombre: 'Error', dias: [] },
                dia: { dia: 'Error', entrenamiento: 'Error', ejercicios: [], cardio: undefined },
                mesociclo: { nombre: 'Error', microciclos: [] },
                semanaActual: 1,
                diaSemana: 0,
                diaMesociclo: 1,
                diasTranscurridos: 0,
                diasEnMicrociclo: 0,
                microcicloCompletado: false
              };
            }
          } else {
            currentData = {
              microciclo: { nombre: 'Cargando...', dias: [] },
              dia: { dia: 'Cargando...', entrenamiento: 'Cargando...', ejercicios: [], cardio: undefined },
              mesociclo: { nombre: 'Cargando...', microciclos: [] },
              semanaActual: 1,
              diaSemana: 0,
              diaMesociclo: 1,
              diasTranscurridos: 0,
              diasEnMicrociclo: 0,
              microcicloCompletado: false
            };
          }
          
          return (
            <div className="glass-card mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {currentData.dia.dia.split(' ')[1]}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{currentData.dia.entrenamiento}</h3>
                  <p className="text-sm text-gray-600">{currentData.microciclo.nombre}</p>
                </div>
              </div>
              {currentData.dia.cardio && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-3 py-2 rounded-full font-medium">
                    🏃 {currentData.dia.cardio.tipo}
                  </span>
                  <span className="text-sm text-gray-600">
                    {currentData.dia.cardio.duracion}min • {currentData.dia.cardio.intensidad}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {currentData.dia.ejercicios.length > 0 ? `${currentData.dia.ejercicios.length} ejercicios` : 'Descanso activo'}
                </span>
                <button 
                  onClick={() => {
                    setSelectedWorkout({
                      dia: currentData.dia.dia,
                      entrenamiento: currentData.dia.entrenamiento,
                      ejercicios: currentData.dia.ejercicios,
                      cardio: currentData.dia.cardio
                    });
                    openModal('workout-details');
                  }}
                  className="btn-modern btn-small"
                >
                  Ver detalles
                </button>
              </div>
              
              {/* Debug Info - Solo visible en desarrollo */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Microciclo: {currentData.semanaActual}</div>
                    <div>Día: {currentData.diaMesociclo}/{currentData.microciclo.dias.length}</div>
                    <div>Días transcurridos: {currentData.diasTranscurridos}</div>
                    <div>Día semana: {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][currentData.diaSemana]}</div>
                  </div>
                  {/* Información detallada de seguimiento */}
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="font-medium mb-1">Seguimiento Detallado:</div>
                    {(() => {
                      const testData = testMesocicloTracking();
                      return (
                        <div className="space-y-1">
                          <div>Fecha inicio: {testData.fechaInicio}</div>
                          <div>Días transcurridos: {testData.diasTranscurridos}</div>
                          <div>Microciclo: {testData.microcicloIndex + 1} - {testData.microcicloNombre}</div>
                          <div>Día en microciclo: {testData.diaEnMicrociclo}/{testData.totalDiasMicrociclo}</div>
                          <div>Entrenamiento: {testData.diaActual.entrenamiento}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Calorías del Día */}
        {(() => {
          let caloriasHoy = 0;
          if (typeof window !== 'undefined' && !isLoading) {
            try {
              caloriasHoy = getCaloriasDelDia();
            } catch (error) {
              console.error('Error calculating calories:', error);
              caloriasHoy = 0;
            }
          }
          return (
            <div className="glass-card mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white text-xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Calorías Quemadas</h3>
                    <p className="text-sm text-gray-600">Total del día</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600">{caloriasHoy}</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Weight Entry */}
        <div className="activity-card cursor-pointer" onClick={() => openModal('weight')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Pesaje Diario</h3>
                <p className="text-sm text-white text-opacity-80">Registra tu peso de hoy</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('weight') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('weight')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Workout Entry */}
        <div className="activity-card success cursor-pointer" onClick={() => openModal('workout')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🏋️</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Entrenamiento</h3>
                <p className="text-sm text-white text-opacity-80">Completa tu rutina de hoy</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('workout') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('workout')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para entrenar</div>
            </div>
          </div>
        </div>
        
        {/* Cardio Entry */}
        <div className="activity-card warning cursor-pointer" onClick={() => openModal('cardio')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🏃</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Cardio</h3>
                <p className="text-sm text-white text-opacity-80">Registra tu actividad cardiovascular</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('cardio') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('cardio')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Diet Entry */}
        <div className="activity-card cursor-pointer" onClick={() => openModal('diet')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🥗</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Dieta</h3>
                <p className="text-sm text-white text-opacity-80">1800 kcal - 150g proteínas</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('diet') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('diet')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* NEAT Entry */}
        <div className="activity-card cursor-pointer" onClick={() => openModal('neat')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🚶</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">NEAT</h3>
                <p className="text-sm text-white text-opacity-80">Actividad física no estructurada</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('neat') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('neat')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Entreno No Programado Entry */}
        <div className="activity-card cursor-pointer" onClick={() => openModal('entreno-no-programado')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Entreno Extra</h3>
                <p className="text-sm text-white text-opacity-80">Tenis, natación, alpinismo, etc.</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-semibold ${getStatus('entrenoNoProgramado') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                {getStatus('entrenoNoProgramado')}
              </div>
              <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Seguimiento Entry - Solo domingos */}
        {new Date().getDay() === 0 && (
          <div className="activity-card cursor-pointer" onClick={() => openModal('seguimiento')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Seguimiento Semanal</h3>
                  <p className="text-sm text-white text-opacity-80">Peso, cintura y medidas</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${getStatus('seguimiento') === 'Completado' ? 'text-green-200' : 'text-yellow-200'}`}>
                  {getStatus('seguimiento')}
                </div>
                <div className="text-xs text-white text-opacity-60">Toca para registrar</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMesocicloSection = () => {
    let startDate = null;
    if (typeof window !== 'undefined' && !isLoading) {
      try {
        startDate = getMesocicloStartDate();
      } catch (error) {
        console.error('Error loading start date:', error);
        startDate = null;
      }
    }
    
    const mesociclo = {
      nombre: "Mesociclo 1 Definitivo - Definición",
      duracion: "6 semanas (Agosto - Mediados Septiembre)",
      objetivo: "Definición muscular con enfoque estético",
      estructura: "5 días entrenamiento en ciclo de 9 días (4 días push/pull, 1 día piernas, 4 descansos flexibles)",
      volumen: {
        espalda: "14-16 series",
        biceps: "10-12 series", 
        pecho: "9 series",
        hombros: "10-12 series",
        triceps: "9 series",
        piernas: "8 series"
      },
      intensidad: "RIR 3 (microciclos 1-2), RIR 2 (microciclo 3), RIR 1-2 (microciclo 4), RIR 1-0 (microciclo 5)",
      cardio: "3-4 sesiones/semana (25-30 min, trote continuo + intervalos intensos)",
      dieta: "~1800 kcal/día, ayuno intermitente 16/8 opcional desde semana 3",
      microciclos: [
        {
          id: 1,
          nombre: "Microciclo 1 - Adaptación (Semana 1)",
          objetivo: "Técnica, reacondicionamiento",
          intensidad: "RIR 3, sin técnicas intensivas",
          cardio: "3 sesiones, trote continuo + intervalos suaves",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12)",
                "Jalón polea alta pecho apoyado unilateral (3x8-10)",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10)",
                "Contractora pectoral máquina inclinada (2x10-12)",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12)",
                "Extensión tríceps katana polea baja (2x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10)",
                "Curl femoral en máquina (2x12-15)",
                "Extensión de rodilla en máquina (2x12-15)",
                "Elevaciones de talones en máquina (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10)",
                "Pullover polea alta rodillas banco 60º (2x8-12)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Ab wheel (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10)",
                "Contractora pectoral en máquina (2x10-12)",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés barra Z 30º (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (3x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 2,
          nombre: "Microciclo 2 - Confianza (Semana 2)",
          objetivo: "Confianza en movimientos",
          intensidad: "RIR 2-3, aumentar pesos ~5-10%",
          cardio: "3 sesiones, intervalos más rápidos",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12)",
                "Jalón polea alta pecho apoyado unilateral (3x8-10)",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 25, intensidad: "6:15-6:45 min/km + intervalos más rápidos" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10)",
                "Contractora pectoral máquina inclinada (2x10-12)",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12)",
                "Extensión tríceps katana polea baja (2x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 25, intensidad: "6:15-6:45 min/km + intervalos más rápidos" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10)",
                "Curl femoral en máquina (2x12-15)",
                "Extensión de rodilla en máquina (2x12-15)",
                "Elevaciones de talones en máquina (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 25, intensidad: "6:15-6:45 min/km + intervalos más rápidos" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10)",
                "Pullover polea alta rodillas banco 60º (2x8-12)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Ab wheel (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 25, intensidad: "6:15-6:45 min/km + intervalos más rápidos" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10)",
                "Contractora pectoral en máquina (2x10-12)",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés barra Z 30º (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (3x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 25, intensidad: "6:15-6:45 min/km + intervalos más rápidos" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 3,
          nombre: "Microciclo 3 - Intensidad (Semana 3)",
          objetivo: "Introducir intensidad",
          intensidad: "RIR 2, rest pause en 1-2 ejercicios/día",
          cardio: "3-4 sesiones, más duración",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12)",
                "Jalón polea alta pecho apoyado unilateral (3x8-10) + REST PAUSE",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12)",
                "Curl bayesian en polea (2x10-12) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos intensos", duracion: 25, intensidad: "6:15-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10)",
                "Contractora pectoral máquina inclinada (2x10-12) + REST PAUSE",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15) + REST PAUSE",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12)",
                "Extensión tríceps katana polea baja (2x8-10) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos intensos", duracion: 25, intensidad: "6:15-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10)",
                "Curl femoral en máquina (2x12-15)",
                "Extensión de rodilla en máquina (2x12-15)",
                "Elevaciones de talones en máquina (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos intensos", duracion: 25, intensidad: "6:15-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10) + REST PAUSE",
                "Pullover polea alta rodillas banco 60º (2x8-12)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (2x10-12) + REST PAUSE",
                "Ab wheel (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos intensos", duracion: 25, intensidad: "6:15-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10)",
                "Contractora pectoral en máquina (2x10-12) + REST PAUSE",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15) + REST PAUSE",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés barra Z 30º (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (3x8-10) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote + intervalos intensos", duracion: 25, intensidad: "6:15-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 4,
          nombre: "Microciclo 4 - Adaptación (Semana 4)",
          objetivo: "Adaptación a intensidad",
          intensidad: "RIR 1-2, rest pause en 2-3 ejercicios/día",
          cardio: "Añadir parciales en elevaciones laterales, más intervalos",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12) + REST PAUSE",
                "Jalón polea alta pecho apoyado unilateral (3x8-10) + REST PAUSE",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12) + REST PAUSE",
                "Curl bayesian en polea (2x10-12) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos + parciales", duracion: 27, intensidad: "6:00-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10) + REST PAUSE",
                "Contractora pectoral máquina inclinada (2x10-12) + REST PAUSE",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15) + REST PAUSE + PARCIALES",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12) + REST PAUSE",
                "Extensión tríceps katana polea baja (2x8-10) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos + parciales", duracion: 27, intensidad: "6:00-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10) + REST PAUSE",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10) + REST PAUSE",
                "Curl femoral en máquina (2x12-15) + REST PAUSE",
                "Extensión de rodilla en máquina (2x12-15) + REST PAUSE",
                "Elevaciones de talones en máquina (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos + parciales", duracion: 27, intensidad: "6:00-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10) + REST PAUSE",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10) + REST PAUSE",
                "Pullover polea alta rodillas banco 60º (2x8-12) + REST PAUSE",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12) + REST PAUSE",
                "Curl bayesian en polea (2x10-12) + REST PAUSE",
                "Ab wheel (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos + parciales", duracion: 27, intensidad: "6:00-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10) + REST PAUSE",
                "Contractora pectoral en máquina (2x10-12) + REST PAUSE",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15) + REST PAUSE + PARCIALES",
                "Elevaciones laterales mancuernas (2x>15) + PARCIALES",
                "Press francés barra Z 30º (1x8-10 + 1x10-12) + REST PAUSE",
                "Extensión tríceps katana polea baja (3x8-10) + REST PAUSE",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos + parciales", duracion: 27, intensidad: "6:00-6:30 min/km + intervalos a 5:00 min/km" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 5,
          nombre: "Microciclo 5 - Pico (Semana 5)",
          objetivo: "Pico de estímulo",
          intensidad: "RIR 1-0, rest pause en 3-4 ejercicios/día, drop sets en 1-2",
          cardio: "Ritmos más rápidos, 4 sesiones si posible",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12) + REST PAUSE",
                "Jalón polea alta pecho apoyado unilateral (3x8-10) + REST PAUSE",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12) + REST PAUSE",
                "Curl bayesian en polea (2x10-12) + DROP SET",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos rápidos", duracion: 30, intensidad: "6:00-6:15 min/km + intervalos a 4:45 min/km" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10) + REST PAUSE",
                "Contractora pectoral máquina inclinada (2x10-12) + DROP SET",
                "Press en máquina (2x8-10) + REST PAUSE",
                "Elevaciones laterales polea con muñequera (2x12-15) + REST PAUSE + PARCIALES",
                "Elevaciones laterales mancuernas (2x>15) + PARCIALES",
                "Press francés mancuernas (1x8-10 + 2x10-12) + REST PAUSE",
                "Extensión tríceps katana polea baja (2x8-10) + DROP SET",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos rápidos", duracion: 30, intensidad: "6:00-6:15 min/km + intervalos a 4:45 min/km" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10) + REST PAUSE",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10) + REST PAUSE",
                "Curl femoral en máquina (2x12-15) + REST PAUSE",
                "Extensión de rodilla en máquina (2x12-15) + REST PAUSE",
                "Elevaciones de talones en máquina (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos rápidos", duracion: 30, intensidad: "6:00-6:15 min/km + intervalos a 4:45 min/km" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10) + REST PAUSE",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10) + REST PAUSE",
                "Pullover polea alta rodillas banco 60º (2x8-12) + REST PAUSE",
                "Face pull polea alta boca arriba (2x12-15) + DROP SET",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12) + REST PAUSE",
                "Curl bayesian en polea (2x10-12) + DROP SET",
                "Ab wheel (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos rápidos", duracion: 30, intensidad: "6:00-6:15 min/km + intervalos a 4:45 min/km" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10) + REST PAUSE",
                "Contractora pectoral en máquina (2x10-12) + DROP SET",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15) + REST PAUSE + PARCIALES",
                "Elevaciones laterales mancuernas (2x10-12) + PARCIALES",
                "Press francés barra Z 30º (1x8-10 + 1x10-12) + REST PAUSE",
                "Extensión tríceps katana polea baja (3x8-10) + DROP SET",
                "Crunch abdominal en polea alta (2x12-15) + REST PAUSE"
              ],
              cardio: { tipo: "Trote + intervalos rápidos", duracion: 30, intensidad: "6:00-6:15 min/km + intervalos a 4:45 min/km" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 6,
          nombre: "Descarga (Semana 6)",
          objetivo: "Recuperación activa",
          intensidad: "RIR 3, 1-2 series/exercicio, pesos ~50%",
          cardio: "2-3 sesiones ligeras",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 1x10-12)",
                "Jalón polea alta pecho apoyado unilateral (2x8-10)",
                "Remo polea pecho apoyado unilateral (1x8-10)",
                "Face pull polea alta boca arriba (1x12-15)",
                "Low cable rear delt row (1x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (1x10-12)",
                "Crunch abdominal en polea alta (1x12-15)"
              ],
              cardio: { tipo: "Trote ligero", duracion: 20, intensidad: "6:30-7:00 min/km" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 1x8-10)",
                "Contractora pectoral máquina inclinada (1x10-12)",
                "Press en máquina (1x8-10)",
                "Elevaciones laterales polea con muñequera (1x12-15)",
                "Elevaciones laterales mancuernas (1x>15)",
                "Press francés mancuernas (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (1x8-10)",
                "Crunch abdominal en polea alta (1x12-15)"
              ],
              cardio: { tipo: "Trote ligero", duracion: 20, intensidad: "6:30-7:00 min/km" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (1x12-15)",
                "Prensa 45º (1x6-8 + 1x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 1x8-10)",
                "Curl femoral en máquina (1x12-15)",
                "Extensión de rodilla en máquina (1x12-15)",
                "Elevaciones de talones en máquina (1x12-15)"
              ],
              cardio: { tipo: "Trote ligero", duracion: 20, intensidad: "6:30-7:00 min/km" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 1x8-10)",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (1x8-10)",
                "Pullover polea alta rodillas banco 60º (1x8-12)",
                "Face pull polea alta boca arriba (1x12-15)",
                "Low cable rear delt row (1x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (1x10-12)",
                "Ab wheel (1x12-15)"
              ],
              cardio: { tipo: "Trote ligero", duracion: 20, intensidad: "6:30-7:00 min/km" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 1x8-10)",
                "Contractora pectoral en máquina (1x10-12)",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (2x12-15)",
                "Elevaciones laterales mancuernas (1x>15)",
                "Press francés barra Z 30º (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (2x8-10)",
                "Crunch abdominal en polea alta (1x12-15)"
              ],
              cardio: { tipo: "Trote ligero", duracion: 20, intensidad: "6:30-7:00 min/km" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        }
      ]
    };

    return (
      <div className="min-h-screen pb-20">
        <div className="nav-clean p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold text-primary">{mesociclo.nombre}</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">{mesociclo.duracion}</p>
        </div>
        
        <div className="p-4 md:p-6">
          {/* Configuración de Fecha de Inicio */}
          <div className="clean-card mb-4 md:mb-6">
            <div className="flex items-center justify-between p-3 md:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm">📅</span>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-left">Configuración de Fecha de Inicio</h2>
                  <p className="text-sm text-gray-600">Establece cuándo comenzaste tu mesociclo</p>
                </div>
              </div>
              <button
                onClick={() => setShowStartDateConfig(true)}
                className="btn-elegant btn-small bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {startDate ? 'Cambiar' : 'Configurar'}
              </button>
            </div>
            {startDate && (
              <div className="px-3 md:px-4 pb-3 md:pb-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Fecha configurada</p>
                  <p className="text-sm md:text-base font-semibold">
                    {new Date(startDate).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Información General */}
          <div className="clean-card mb-4 md:mb-6">
            <button 
              onClick={() => toggleSection('info')}
              className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📊</span>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-left">Información General</h2>
              </div>
              <span className={`text-gray-400 transition-transform duration-200 ${expandedSections.info ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.info && (
              <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-3 md:space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Objetivo</p>
                    <p className="text-sm md:text-base font-semibold">{mesociclo.objetivo}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Estructura</p>
                    <p className="text-sm md:text-base font-semibold">{mesociclo.estructura}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 font-medium">Intensidad</p>
                    <p className="text-sm md:text-base font-semibold">{mesociclo.intensidad}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Cardio</p>
                    <p className="text-sm md:text-base font-semibold">{mesociclo.cardio}</p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-600 font-medium">Dieta</p>
                  <p className="text-sm md:text-base font-semibold">{mesociclo.dieta}</p>
                </div>
              </div>
            )}
          </div>

          {/* Volumen por Grupo Muscular */}
          <div className="clean-card mb-4 md:mb-6">
            <button 
              onClick={() => toggleSection('volumen')}
              className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">💪</span>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-left">Volumen por Grupo Muscular</h2>
              </div>
              <span className={`text-gray-400 transition-transform duration-200 ${expandedSections.volumen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.volumen && (
              <div className="px-3 md:px-4 pb-3 md:pb-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-blue-800">💪 Espalda</span>
                    <span className="text-sm md:text-base text-blue-700 font-bold">{mesociclo.volumen.espalda}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-green-800">💪 Bíceps</span>
                    <span className="text-sm md:text-base text-green-700 font-bold">{mesociclo.volumen.biceps}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-red-800">💪 Pecho</span>
                    <span className="text-sm md:text-base text-red-700 font-bold">{mesociclo.volumen.pecho}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-orange-800">💪 Hombros</span>
                    <span className="text-sm md:text-base text-orange-700 font-bold">{mesociclo.volumen.hombros}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-purple-800">💪 Tríceps</span>
                    <span className="text-sm md:text-base text-purple-700 font-bold">{mesociclo.volumen.triceps}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm">
                    <span className="text-sm md:text-base font-medium text-indigo-800">💪 Piernas</span>
                    <span className="text-sm md:text-base text-indigo-700 font-bold">{mesociclo.volumen.piernas}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

                      <div className="space-y-3 md:space-y-4">
              {mesociclo.microciclos.map((microciclo) => (
                <div key={microciclo.id} className="clean-card border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <button 
                    onClick={() => toggleMicrociclo(microciclo.id)}
                    className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 rounded-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">{microciclo.id}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-base md:text-lg font-semibold">{microciclo.nombre}</h3>
                        <p className="text-xs text-gray-500">{microciclo.objetivo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {microciclo.intensidad.split(' ')[0]}
                        </span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {microciclo.cardio.split(' ')[0]}
                        </span>
                      </div>
                      <span className={`text-gray-400 transition-transform duration-200 ${expandedSections.microciclos[microciclo.id] ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </button>
                  
                  {expandedSections.microciclos[microciclo.id] && (
                    <div className="px-3 md:px-4 pb-3 md:pb-4 animate-fadeIn">
                      {/* Información del microciclo */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-600 font-medium">Objetivo</p>
                          <p className="text-xs md:text-sm">{microciclo.objetivo}</p>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Intensidad</p>
                          <p className="text-xs md:text-sm">{microciclo.intensidad}</p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <p className="text-xs text-orange-600 font-medium">Cardio</p>
                          <p className="text-xs md:text-sm">{microciclo.cardio}</p>
                        </div>
                      </div>
                      
                      {/* Días de entrenamiento */}
                      <div className="space-y-2">
                        {microciclo.dias.map((dia, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-l-3 border-primary"
                            onClick={() => {
                              setSelectedWorkout({
                                dia: dia.dia,
                                entrenamiento: dia.entrenamiento,
                                ejercicios: dia.ejercicios,
                                cardio: dia.cardio
                              });
                              openModal('workout-details');
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate">{dia.dia}</p>
                                  <p className="text-xs text-gray-600 truncate">{dia.entrenamiento}</p>
                                </div>
                              </div>
                              {dia.cardio && (
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                    🏃 {dia.cardio.tipo}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {dia.cardio.duracion}min
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {dia.ejercicios.length > 0 ? `${dia.ejercicios.length} ejercicios` : 'Descanso'}
                                </span>
                                <span className="text-primary text-sm">→</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
        </div>
      </div>
    );
  };

  const renderHistorySection = () => (
    <div className="min-h-screen pb-20 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Historial</h1>
      
      {/* Recent Activities */}
      <div className="space-y-4">
        {Object.keys(adherenciaDiaria)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 10)
          .map(date => {
            const adherence = adherenciaDiaria[date];
            const activities = [];
            if (adherence.pesos) activities.push('🏋️ Entrenamiento');
            if (adherence.cardio) activities.push('🏃 Cardio');
            if (adherence.dieta) activities.push('🥗 Dieta');
            
            return (
              <div key={date} className="mobile-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long' 
                      })}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {activities.map((activity, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">✅</span>
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {Math.round((activities.length / 3) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="min-h-screen pb-20 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Ajustes</h1>
      
      <div className="space-y-4">
        <div className="mobile-card">
          <h3 className="font-semibold mb-4">Datos</h3>
          <div className="space-y-3">
            <button 
              onClick={() => {
                const data = { estado, cardio, dieta, adherenciaDiaria };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gym-data.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('✅ Datos exportados');
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Exportar Datos
            </button>
            <button 
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
                  setEstado([]);
                  setCardio([]);
                  setDieta([]);
                  setAdherenciaDiaria({});
                  showToast('🗑️ Datos borrados');
                }
              }}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Borrar Todos los Datos
            </button>
          </div>
        </div>

        <div className="mobile-card">
          <h3 className="font-semibold mb-4">Información</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>📊 <strong>Total de registros:</strong> {estado.length + cardio.length + dieta.length}</p>
            <p>📅 <strong>Días activos:</strong> {Object.keys(adherenciaDiaria).length}</p>
            <p>🎯 <strong>Objetivo:</strong> 80 kg</p>
            <p>📱 <strong>Versión:</strong> 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Mostrar loading mientras se inicializa
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ToastContainer />
      
      {/* Mobile Dashboard */}
      <div className="block md:hidden">
        {activeSection === 'today' && renderTodaySection()}
        {activeSection === 'mesociclo' && renderMesocicloSection()}
        {activeSection === 'history' && renderHistorySection()}
        {activeSection === 'settings' && renderSettingsSection()}
        
        {/* Modern Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="nav-tabs max-w-md mx-auto">
            <button 
              className={`nav-tab flex-1 ${activeSection === 'today' ? 'active' : ''}`}
              onClick={() => setActiveSection('today')}
            >
              <span className="text-lg">🏠</span>
              <span className="text-xs mt-1 block">Hoy</span>
            </button>
            <button 
              className={`nav-tab flex-1 ${activeSection === 'mesociclo' ? 'active' : ''}`}
              onClick={() => setActiveSection('mesociclo')}
            >
              <span className="text-lg">📋</span>
              <span className="text-xs mt-1 block">Mesociclo</span>
            </button>
            <button 
              className={`nav-tab flex-1 ${activeSection === 'history' ? 'active' : ''}`}
              onClick={() => setActiveSection('history')}
            >
              <span className="text-lg">📊</span>
              <span className="text-xs mt-1 block">Historial</span>
            </button>
            <button 
              className={`nav-tab flex-1 ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <span className="text-lg">⚙️</span>
              <span className="text-xs mt-1 block">Ajustes</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <button 
        className="fab"
        onClick={() => {
          // Quick access to most common action (weight entry)
          openModal('weight');
        }}
        title="Registrar peso"
      >
        ⚖️
      </button>

      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <div className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Mi Entrenamiento
              </h1>
              <p className="text-gray-600 text-lg">Dashboard de seguimiento diario</p>
            </div>
            
            {/* Quick Entry Form */}
            <div className="glass-card mb-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Entrada Rápida de Hoy</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={desktopWeight}
                    onChange={(e) => setDesktopWeight(e.target.value)}
                    step="0.1" 
                    placeholder="85.0" 
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entrenamiento</label>
                  <select 
                    value={desktopWorkout}
                    onChange={(e) => setDesktopWorkout(e.target.value)}
                    className="input-modern"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Pull">🏋️ Pull</option>
                    <option value="Push">💪 Push</option>
                    <option value="Piernas">🦵 Piernas</option>
                    <option value="Cardio">🏃 Cardio</option>
                    <option value="Descanso">😴 Descanso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cardio (km)</label>
                  <input 
                    type="number" 
                    value={desktopCardio}
                    onChange={(e) => setDesktopCardio(e.target.value)}
                    step="0.1" 
                    placeholder="3.5" 
                    className="input-modern"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleDesktopSave}
                    className="btn-modern w-full"
                  >
                    💾 Guardar Todo
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-card">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Progreso General</h3>
                <div className="flex justify-center">
                  <ProgressCircle progress={progress} size={90} />
                </div>
              </div>
              
              <div className="glass-card">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Estado Actual</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peso</span>
                    <span className="font-bold">
                      {estado.length > 0 ? `${estado[estado.length - 1].peso.toFixed(1)} kg` : '85.0 kg'}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.max(0, Math.min(100, ((85 - (estado.length > 0 ? estado[estado.length - 1].peso : 85)) / 5) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="glass-card">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Completado Hoy</h3>
                <div className="space-y-3">
                  {[
                    { id: 'pesos', label: 'Entrenamiento', icon: '🏋️' },
                    { id: 'cardio', label: 'Cardio', icon: '🏃' },
                    { id: 'dieta', label: 'Dieta', icon: '🥗' }
                  ].map(task => {
                    const today = todayISO();
                    const todayAdherence = adherenciaDiaria[today] || {};
                    const completed = todayAdherence[task.id as keyof typeof todayAdherence];
                    
                    return (
                      <div key={task.id} className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="mr-2">{task.icon}</span>
                          <span className="text-sm">{task.label}</span>
                        </span>
                        <span className={`text-sm ${completed ? 'text-green-600' : 'text-gray-500'}`}>
                          {completed ? '✅' : '⏳'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'weight' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="glass-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">⚖️ Pesaje Diario</h3>
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={closeModal}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Peso (kg)</label>
                <input 
                  type="number" 
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  step="0.1" 
                  placeholder="85.0" 
                  className="input-modern"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                  Cancelar
                </button>
                <button onClick={saveWeight} className="btn-modern flex-1">
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'workout' && (
        <WorkoutModal
          isOpen={activeModal === 'workout'}
          onClose={closeModal}
          onComplete={handleWorkoutComplete}
          workoutType={workoutType}
        />
      )}

      {activeModal === 'calendar' && (
        <WeeklyCalendar
          isOpen={activeModal === 'calendar'}
          onClose={closeModal}
        />
      )}

      {activeModal === 'cardio' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="glass-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🏃 Cardio</h3>
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={closeModal}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Distancia (km)</label>
                <input 
                  type="number" 
                  value={cardioKm}
                  onChange={(e) => setCardioKm(e.target.value)}
                  step="0.1" 
                  placeholder="3.5" 
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Tiempo (min)</label>
                <input 
                  type="number" 
                  value={cardioTime}
                  onChange={(e) => setCardioTime(e.target.value)}
                  placeholder="25" 
                  className="input-modern"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                  Cancelar
                </button>
                <button onClick={saveCardio} className="btn-modern flex-1">
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'diet' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="glass-card max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🥗 Dieta</h3>
              <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={closeModal}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Calorías</label>
                <input 
                  type="number" 
                  value={dietCalories}
                  onChange={(e) => setDietCalories(e.target.value)}
                  placeholder="1800" 
                  className="input-modern"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Proteínas (g)</label>
                <input 
                  type="number" 
                  value={dietProtein}
                  onChange={(e) => setDietProtein(e.target.value)}
                  placeholder="150" 
                  className="input-modern"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                  Cancelar
                </button>
                <button onClick={saveDiet} className="btn-modern flex-1">
                  💾 Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'neat' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🚶 NEAT</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de registro</label>
                  <select 
                    value={neatTipo}
                    onChange={(e) => setNeatTipo(e.target.value as 'pasos' | 'cinta')}
                    className="input-compact"
                  >
                    <option value="pasos">Pasos y ritmo</option>
                    <option value="cinta">Cinta (km, ritmo, inclinación)</option>
                  </select>
                </div>

                {neatTipo === 'pasos' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Pasos</label>
                      <input 
                        type="number" 
                        value={neatPasos}
                        onChange={(e) => setNeatPasos(e.target.value)}
                        placeholder="8000" 
                        className="input-compact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Ritmo</label>
                      <select 
                        value={neatRitmo}
                        onChange={(e) => setNeatRitmo(e.target.value)}
                        className="input-compact"
                      >
                        <option value="">Seleccionar ritmo...</option>
                        <option value="ritmo rápido">Ritmo rápido</option>
                        <option value="andar normal">Andar normal</option>
                        <option value="caminar rápido">Caminar rápido</option>
                        <option value="paseo">Paseo</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Kilómetros</label>
                      <input 
                        type="number" 
                        value={neatKm}
                        onChange={(e) => setNeatKm(e.target.value)}
                        placeholder="3.5" 
                        step="0.1"
                        className="input-compact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Ritmo (km/h)</label>
                      <input 
                        type="number" 
                        value={neatRitmoKmH}
                        onChange={(e) => setNeatRitmoKmH(e.target.value)}
                        placeholder="6.0" 
                        step="0.1"
                        className="input-compact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Inclinación (%)</label>
                      <input 
                        type="number" 
                        value={neatInclinacion}
                        onChange={(e) => setNeatInclinacion(e.target.value)}
                        placeholder="0" 
                        step="0.5"
                        className="input-compact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Duración (minutos)</label>
                      <input 
                        type="number" 
                        value={neatDuracion}
                        onChange={(e) => setNeatDuracion(e.target.value)}
                        placeholder="30" 
                        className="input-compact"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveNeat} className="btn-elegant btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Date Config Modal */}
      {showStartDateConfig && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>📅 Configurar Fecha de Inicio</h3>
            </div>
            <div className="modal-body">
              <p className="text-sm text-gray-600 mb-4">
                Establece la fecha en la que comenzaste tu mesociclo para un seguimiento preciso.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio del mesociclo
                  </label>
                  <input
                    type="date"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    className="input-modern w-full"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0 p-4 border-t border-gray-200">
              <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={handleStartDateConfig}
                disabled={!startDateInput}
                className={`btn-elegant flex-1 ${
                  startDateInput 
                    ? 'btn-primary' 
                    : 'btn-secondary opacity-50 cursor-not-allowed'
                }`}
              >
                Guardar Fecha
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'entreno-no-programado' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🎯 Entreno No Programado</h3>
            </div>
            
            <div className="modal-body flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Tipo de actividad */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Tipo de Actividad</label>
                  <select 
                    value={entrenoTipo}
                    onChange={(e) => setEntrenoTipo(e.target.value as 'tenis' | 'natacion' | 'alpinismo' | 'ciclismo' | 'running' | 'futbol' | 'baloncesto' | 'escalada' | 'yoga' | 'pilates' | 'crossfit' | 'otro')}
                    className="input-compact"
                  >
                    <option value="tenis">🎾 Tenis</option>
                    <option value="natacion">🏊 Natación</option>
                    <option value="alpinismo">⛰️ Alpinismo</option>
                    <option value="ciclismo">🚴 Ciclismo</option>
                    <option value="running">🏃 Running</option>
                    <option value="futbol">⚽ Fútbol</option>
                    <option value="baloncesto">🏀 Baloncesto</option>
                    <option value="escalada">🧗 Escalada</option>
                    <option value="yoga">🧘 Yoga</option>
                    <option value="pilates">🤸 Pilates</option>
                    <option value="crossfit">💪 CrossFit</option>
                    <option value="otro">🎯 Otro</option>
                  </select>
                </div>

                {/* Duración y esfuerzo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Duración (min)</label>
                    <input 
                      type="number" 
                      value={entrenoDuracion}
                      onChange={(e) => setEntrenoDuracion(e.target.value)}
                      placeholder="60" 
                      className="input-compact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Esfuerzo (RPE 1-10)</label>
                    <input 
                      type="number" 
                      value={entrenoEsfuerzo}
                      onChange={(e) => setEntrenoEsfuerzo(e.target.value)}
                      placeholder="7" 
                      min="1"
                      max="10"
                      className="input-compact"
                    />
                  </div>
                </div>

                {/* Intensidad */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Intensidad</label>
                  <select 
                    value={entrenoIntensidad}
                    onChange={(e) => setEntrenoIntensidad(e.target.value as 'baja' | 'moderada' | 'alta' | 'muy alta')}
                    className="input-compact"
                  >
                    <option value="baja">Baja</option>
                    <option value="moderada">Moderada</option>
                    <option value="alta">Alta</option>
                    <option value="muy alta">Muy Alta</option>
                  </select>
                </div>

                {/* Campos específicos por actividad */}
                {entrenoTipo === 'tenis' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🎾 Datos de Tenis</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Sets</label>
                        <input 
                          type="number" 
                          value={entrenoTenisSets}
                          onChange={(e) => setEntrenoTenisSets(e.target.value)}
                          placeholder="3" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Duración por set (min)</label>
                        <input 
                          type="number" 
                          value={entrenoTenisDuracionSet}
                          onChange={(e) => setEntrenoTenisDuracionSet(e.target.value)}
                          placeholder="20" 
                          className="input-compact"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Nivel</label>
                      <select 
                        value={entrenoTenisNivel}
                        onChange={(e) => setEntrenoTenisNivel(e.target.value as 'principiante' | 'intermedio' | 'avanzado')}
                        className="input-compact"
                      >
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'natacion' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🏊 Datos de Natación</h4>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Metros</label>
                      <input 
                        type="number" 
                        value={entrenoNatacionMetros}
                        onChange={(e) => setEntrenoNatacionMetros(e.target.value)}
                        placeholder="1000" 
                        className="input-compact"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Estilo</label>
                        <select 
                          value={entrenoNatacionEstilo}
                          onChange={(e) => setEntrenoNatacionEstilo(e.target.value as 'libre' | 'espalda' | 'braza' | 'mariposa' | 'combinado')}
                          className="input-compact"
                        >
                          <option value="libre">Libre</option>
                          <option value="espalda">Espalda</option>
                          <option value="braza">Braza</option>
                          <option value="mariposa">Mariposa</option>
                          <option value="combinado">Combinado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Ritmo</label>
                        <select 
                          value={entrenoNatacionRitmo}
                          onChange={(e) => setEntrenoNatacionRitmo(e.target.value as 'lento' | 'moderado' | 'rápido' | 'competitivo')}
                          className="input-compact"
                        >
                          <option value="lento">Lento</option>
                          <option value="moderado">Moderado</option>
                          <option value="rápido">Rápido</option>
                          <option value="competitivo">Competitivo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'alpinismo' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">⛰️ Datos de Alpinismo</h4>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Ruta</label>
                      <input 
                        type="text" 
                        value={entrenoAlpinismoRuta}
                        onChange={(e) => setEntrenoAlpinismoRuta(e.target.value)}
                        placeholder="Nombre de la ruta" 
                        className="input-compact"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Desnivel (m)</label>
                        <input 
                          type="number" 
                          value={entrenoAlpinismoDesnivel}
                          onChange={(e) => setEntrenoAlpinismoDesnivel(e.target.value)}
                          placeholder="500" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Dificultad</label>
                        <select 
                          value={entrenoAlpinismoDificultad}
                          onChange={(e) => setEntrenoAlpinismoDificultad(e.target.value as 'facil' | 'moderada' | 'dificil' | 'muy dificil')}
                          className="input-compact"
                        >
                          <option value="facil">Fácil</option>
                          <option value="moderada">Moderada</option>
                          <option value="dificil">Difícil</option>
                          <option value="muy dificil">Muy Difícil</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Condiciones</label>
                      <select 
                        value={entrenoAlpinismoCondiciones}
                        onChange={(e) => setEntrenoAlpinismoCondiciones(e.target.value as 'buenas' | 'regulares' | 'malas')}
                        className="input-compact"
                      >
                        <option value="buenas">Buenas</option>
                        <option value="regulares">Regulares</option>
                        <option value="malas">Malas</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'ciclismo' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🚴 Datos de Ciclismo</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Kilómetros</label>
                        <input 
                          type="number" 
                          value={entrenoCiclismoKm}
                          onChange={(e) => setEntrenoCiclismoKm(e.target.value)}
                          placeholder="30" 
                          step="0.1"
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Ritmo (km/h)</label>
                        <input 
                          type="number" 
                          value={entrenoCiclismoRitmo}
                          onChange={(e) => setEntrenoCiclismoRitmo(e.target.value)}
                          placeholder="25" 
                          step="0.1"
                          className="input-compact"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Desnivel (m)</label>
                        <input 
                          type="number" 
                          value={entrenoCiclismoDesnivel}
                          onChange={(e) => setEntrenoCiclismoDesnivel(e.target.value)}
                          placeholder="200" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Tipo</label>
                        <select 
                          value={entrenoCiclismoTipo}
                          onChange={(e) => setEntrenoCiclismoTipo(e.target.value as 'carretera' | 'mtb' | 'urbano')}
                          className="input-compact"
                        >
                          <option value="carretera">Carretera</option>
                          <option value="mtb">MTB</option>
                          <option value="urbano">Urbano</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'running' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🏃 Datos de Running</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Kilómetros</label>
                        <input 
                          type="number" 
                          value={entrenoRunningKm}
                          onChange={(e) => setEntrenoRunningKm(e.target.value)}
                          placeholder="5" 
                          step="0.1"
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Ritmo (min/km)</label>
                        <input 
                          type="number" 
                          value={entrenoRunningRitmo}
                          onChange={(e) => setEntrenoRunningRitmo(e.target.value)}
                          placeholder="5.30" 
                          step="0.1"
                          className="input-compact"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Tipo</label>
                      <select 
                        value={entrenoRunningTipo}
                        onChange={(e) => setEntrenoRunningTipo(e.target.value as 'carrera' | 'trail' | 'intervalos')}
                        className="input-compact"
                      >
                        <option value="carrera">Carrera</option>
                        <option value="trail">Trail</option>
                        <option value="intervalos">Intervalos</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'futbol' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">⚽ Datos de Fútbol</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Duración partido (min)</label>
                        <input 
                          type="number" 
                          value={entrenoFutbolDuracion}
                          onChange={(e) => setEntrenoFutbolDuracion(e.target.value)}
                          placeholder="90" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Posición</label>
                        <select 
                          value={entrenoFutbolPosicion}
                          onChange={(e) => setEntrenoFutbolPosicion(e.target.value as 'portero' | 'defensa' | 'centrocampista' | 'delantero')}
                          className="input-compact"
                        >
                          <option value="portero">Portero</option>
                          <option value="defensa">Defensa</option>
                          <option value="centrocampista">Centrocampista</option>
                          <option value="delantero">Delantero</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Intensidad</label>
                      <select 
                        value={entrenoFutbolIntensidad}
                        onChange={(e) => setEntrenoFutbolIntensidad(e.target.value as 'amistoso' | 'competitivo')}
                        className="input-compact"
                      >
                        <option value="amistoso">Amistoso</option>
                        <option value="competitivo">Competitivo</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'baloncesto' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🏀 Datos de Baloncesto</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Duración partido (min)</label>
                        <input 
                          type="number" 
                          value={entrenoBaloncestoDuracion}
                          onChange={(e) => setEntrenoBaloncestoDuracion(e.target.value)}
                          placeholder="40" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Posición</label>
                        <select 
                          value={entrenoBaloncestoPosicion}
                          onChange={(e) => setEntrenoBaloncestoPosicion(e.target.value as 'base' | 'escolta' | 'ala' | 'ala-pivot' | 'pivot')}
                          className="input-compact"
                        >
                          <option value="base">Base</option>
                          <option value="escolta">Escolta</option>
                          <option value="ala">Ala</option>
                          <option value="ala-pivot">Ala-Pívot</option>
                          <option value="pivot">Pívot</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Intensidad</label>
                      <select 
                        value={entrenoBaloncestoIntensidad}
                        onChange={(e) => setEntrenoBaloncestoIntensidad(e.target.value as 'amistoso' | 'competitivo')}
                        className="input-compact"
                      >
                        <option value="amistoso">Amistoso</option>
                        <option value="competitivo">Competitivo</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'escalada' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🧗 Datos de Escalada</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Número de rutas</label>
                        <input 
                          type="number" 
                          value={entrenoEscaladaRutas}
                          onChange={(e) => setEntrenoEscaladaRutas(e.target.value)}
                          placeholder="5" 
                          className="input-compact"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Grado</label>
                        <input 
                          type="text" 
                          value={entrenoEscaladaGrado}
                          onChange={(e) => setEntrenoEscaladaGrado(e.target.value)}
                          placeholder="6a" 
                          className="input-compact"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Tipo</label>
                      <select 
                        value={entrenoEscaladaTipo}
                        onChange={(e) => setEntrenoEscaladaTipo(e.target.value as 'boulder' | 'deportiva' | 'tradicional')}
                        className="input-compact"
                      >
                        <option value="boulder">Boulder</option>
                        <option value="deportiva">Deportiva</option>
                        <option value="tradicional">Tradicional</option>
                      </select>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'yoga' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🧘 Datos de Yoga</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Tipo</label>
                        <select 
                          value={entrenoYogaTipo}
                          onChange={(e) => setEntrenoYogaTipo(e.target.value as 'hatha' | 'vinyasa' | 'ashtanga' | 'yin' | 'restaurativo')}
                          className="input-compact"
                        >
                          <option value="hatha">Hatha</option>
                          <option value="vinyasa">Vinyasa</option>
                          <option value="ashtanga">Ashtanga</option>
                          <option value="yin">Yin</option>
                          <option value="restaurativo">Restaurativo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Nivel</label>
                        <select 
                          value={entrenoYogaNivel}
                          onChange={(e) => setEntrenoYogaNivel(e.target.value as 'principiante' | 'intermedio' | 'avanzado')}
                          className="input-compact"
                        >
                          <option value="principiante">Principiante</option>
                          <option value="intermedio">Intermedio</option>
                          <option value="avanzado">Avanzado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'pilates' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🤸 Datos de Pilates</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Tipo</label>
                        <select 
                          value={entrenoPilatesTipo}
                          onChange={(e) => setEntrenoPilatesTipo(e.target.value as 'mat' | 'reformer' | 'cadillac')}
                          className="input-compact"
                        >
                          <option value="mat">Mat</option>
                          <option value="reformer">Reformer</option>
                          <option value="cadillac">Cadillac</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Nivel</label>
                        <select 
                          value={entrenoPilatesNivel}
                          onChange={(e) => setEntrenoPilatesNivel(e.target.value as 'principiante' | 'intermedio' | 'avanzado')}
                          className="input-compact"
                        >
                          <option value="principiante">Principiante</option>
                          <option value="intermedio">Intermedio</option>
                          <option value="avanzado">Avanzado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'crossfit' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">💪 Datos de CrossFit</h4>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">WOD</label>
                      <input 
                        type="text" 
                        value={entrenoCrossfitWod}
                        onChange={(e) => setEntrenoCrossfitWod(e.target.value)}
                        placeholder="Descripción del WOD" 
                        className="input-compact"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-700">Tiempo (min)</label>
                        <input 
                          type="number" 
                          value={entrenoCrossfitTiempo}
                          onChange={(e) => setEntrenoCrossfitTiempo(e.target.value)}
                          placeholder="15" 
                          className="input-compact"
                        />
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={entrenoCrossfitRx}
                          onChange={(e) => setEntrenoCrossfitRx(e.target.checked)}
                          className="mr-2"
                        />
                        <label className="text-xs font-medium text-gray-700">RX (como está programado)</label>
                      </div>
                    </div>
                  </div>
                )}

                {entrenoTipo === 'otro' && (
                  <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-800">🎯 Datos de Otra Actividad</h4>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Actividad</label>
                      <input 
                        type="text" 
                        value={entrenoOtroActividad}
                        onChange={(e) => setEntrenoOtroActividad(e.target.value)}
                        placeholder="Nombre de la actividad" 
                        className="input-compact"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">Detalles</label>
                      <textarea 
                        value={entrenoOtroDetalles}
                        onChange={(e) => setEntrenoOtroDetalles(e.target.value)}
                        placeholder="Descripción de la actividad..." 
                        className="input-compact"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Notas (opcional)</label>
                  <textarea 
                    value={entrenoNotas}
                    onChange={(e) => setEntrenoNotas(e.target.value)}
                    placeholder="Observaciones del entrenamiento..." 
                    className="input-compact"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 flex-shrink-0 p-4 border-t border-gray-200">
              <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={saveEntrenoNoProgramado} className="btn-elegant btn-primary flex-1">
                💾 Guardar Entreno
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'seguimiento' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>📊 Seguimiento Semanal</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={seguimientoPeso}
                    onChange={(e) => setSeguimientoPeso(e.target.value)}
                    placeholder="75.5" 
                    step="0.1"
                    className="input-compact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Cintura (cm)</label>
                  <input 
                    type="number" 
                    value={seguimientoCintura}
                    onChange={(e) => setSeguimientoCintura(e.target.value)}
                    placeholder="85" 
                    step="0.1"
                    className="input-compact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Notas (opcional)</label>
                  <textarea 
                    value={seguimientoNotas}
                    onChange={(e) => setSeguimientoNotas(e.target.value)}
                    placeholder="Observaciones del día..." 
                    className="input-compact"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveSeguimiento} className="btn-elegant btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'workout-details' && selectedWorkout && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-h-[90vh] flex flex-col mx-4 md:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3 className="text-base md:text-lg">🏋️ {selectedWorkout.dia} - {selectedWorkout.entrenamiento}</h3>
            </div>
            
            <div className="modal-body flex-1 overflow-y-auto">
              <div className="space-y-4 md:space-y-6">
                {/* Cardio */}
                {selectedWorkout.cardio && (
                  <div className="clean-card">
                    <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm md:text-base">
                        🏃
                      </div>
                      <div>
                        <h4 className="font-semibold text-base md:text-lg">Cardio</h4>
                        <p className="text-xs md:text-sm text-gray-600">{selectedWorkout.cardio.tipo}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Duración</p>
                        <p className="text-sm md:text-base font-semibold">{selectedWorkout.cardio.duracion} minutos</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Intensidad</p>
                        <p className="text-sm md:text-base font-semibold">{selectedWorkout.cardio.intensidad}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ejercicios */}
                <div className="clean-card">
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm md:text-base">
                      💪
                    </div>
                    <div>
                      <h4 className="font-semibold text-base md:text-lg">Ejercicios</h4>
                      <p className="text-xs md:text-sm text-gray-600">{selectedWorkout.ejercicios.length} ejercicios</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-3">
                    {selectedWorkout.ejercicios.map((ejercicio, index) => (
                      <div key={index} className="flex items-start gap-2 md:gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm break-words">{ejercicio}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ejercicio.includes('REST PAUSE') && (
                              <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Rest Pause
                              </span>
                            )}
                            {ejercicio.includes('DROP SET') && (
                              <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                Drop Set
                              </span>
                            )}
                            {ejercicio.includes('PARCIALES') && (
                              <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Parciales
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div className="clean-card">
                  <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">📝 Notas</h4>
                  <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
                    <p>• Descansa 2-3 minutos entre series</p>
                    <p>• Mantén la técnica correcta en todos los ejercicios</p>
                    <p>• Si no puedes completar las repeticiones objetivo, reduce el peso</p>
                    <p>• Los ejercicios con técnicas especiales (Rest Pause, Drop Set) son opcionales si te sientes fatigado</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 flex-shrink-0 p-3 md:p-4 border-t border-gray-200">
              <button onClick={closeModal} className="btn-elegant btn-secondary flex-1 text-sm md:text-base">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  closeModal();
                  openModal('workout');
                }} 
                className="btn-elegant btn-primary flex-1 text-sm md:text-base"
              >
                🎯 Iniciar Entrenamiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
