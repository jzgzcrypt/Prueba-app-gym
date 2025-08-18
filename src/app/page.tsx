'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { useSync } from '@/hooks/useSync';
import { ToastContainer } from '@/components/ToastContainer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { WorkoutModal } from '@/components/WorkoutModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { DesktopCharts } from '@/components/DesktopCharts';
import { WeightEntry, CardioEntry, DietEntry, DailyAdherence, WorkoutEntry, Exercise, NeatEntry, SeguimientoEntry, EntrenoNoProgramado } from '@/types';
import { LoadingFallback } from '@/components/LoadingFallback';
import { getCurrentMesocicloDay, setMesocicloStartDate, testMesocicloTracking, calcularCaloriasEntrenoNoProgramado, getMesocicloData } from '@/utils/mesocicloUtils';

export default function Dashboard() {
  const { showToast } = useToast();
  const { syncStatus, syncData, saveData, loadData } = useSync();
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'mesociclo' | 'history' | 'settings' | 'stats'>('stats');
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
    notas: { [key: number]: boolean };
  }>({
    info: false,
    volumen: false,
    microciclos: {},
    notas: {}
  });

  const [historyFilter, setHistoryFilter] = useState<'all' | 'pesos' | 'cardio' | 'dieta' | 'neat' | 'entrenos'>('all');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{
    type: string;
    fecha: string;
    icon: string;
    title: string;
    status: string;
    statusClass: string;
    details: string;
    data: WeightEntry | CardioEntry | DietEntry | NeatEntry | EntrenoNoProgramado;
  } | null>(null);
  
  // Estados para versión PC
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'weight' | 'cardio' | 'diet' | 'neat' | 'entreno' | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Estado para forzar re-render cuando cambia la fecha
  const [, setForceUpdate] = useState(0);
  
  // Local storage hooks
  const [estado, setEstado] = useLocalStorage<WeightEntry[]>('estado', []);
  const [cardio, setCardio] = useLocalStorage<CardioEntry[]>('cardio', []);
  const [dieta, setDieta] = useLocalStorage<DietEntry[]>('dieta', []);
  const [workouts, setWorkouts] = useLocalStorage<WorkoutEntry[]>('workouts', []);
  const [neat, setNeat] = useLocalStorage<NeatEntry[]>('neat', []);
  const [seguimiento, setSeguimiento] = useLocalStorage<SeguimientoEntry[]>('seguimiento', []);
  const [entrenosNoProgramados, setEntrenosNoProgramados] = useLocalStorage<EntrenoNoProgramado[]>('entrenosNoProgramados', []);
  const [adherenciaDiaria, setAdherenciaDiaria] = useLocalStorage<DailyAdherence>('adherenciaDiaria', {});

  // Helpers seguros para mapear datos desde la nube
  const toDateISO = (value: unknown): string => {
    if (typeof value === 'string') return value.includes('T') ? value.split('T')[0] : value;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    if (typeof value === 'number') return new Date(value).toISOString().split('T')[0];
    const s = String(value);
    return s.includes('T') ? s.split('T')[0] : s;
  };

  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const n = Number(typeof value === 'string' ? value : String(value));
    return Number.isFinite(n) ? n : 0;
  };

  // Effect para manejar la carga inicial
  useEffect(() => {
    const initializeApp = async () => {
      // Asegurar que localStorage esté disponible
      if (typeof window !== 'undefined') {
        try {
          // Test localStorage access
          localStorage.getItem('test');
          
          // Inicializar base de datos
          try {
            await fetch('/api/init-db', { method: 'POST' });
            console.log('✅ Base de datos inicializada');
          } catch (error) {
            console.error('❌ Error inicializando base de datos:', error);
          }
          
          // Cargar datos desde Neon si hay conexión
          if (syncStatus.isOnline) {
            try {
              const weights = await loadData('weights');
              if (Array.isArray(weights)) {
                const mapped = weights.map((w: Record<string, unknown>) => ({
                  fecha: toDateISO(w.fecha),
                  peso: toNumber(w.peso),
                  cintura: w.cintura !== null && w.cintura !== undefined ? toNumber(w.cintura) : null
                })) as WeightEntry[];
                setEstado(mapped);
              }

              const cardioRows = await loadData('cardio');
              if (Array.isArray(cardioRows)) {
                const mapped = cardioRows.map((c: Record<string, unknown>) => ({
                  fecha: toDateISO(c.fecha),
                  microciclo: 1,
                  sesionId: 1,
                  km: toNumber(c.km),
                  tiempo: toNumber(c.tiempo),
                  ritmo: toNumber(c.ritmo),
                  calorias: toNumber(c.calorias),
                  tipo: (c.tipo === 'pasos' || c.tipo === 'cinta' || c.tipo === 'mesociclo') ? (c.tipo as 'pasos'|'cinta'|'mesociclo') : 'mesociclo',
                  intensidad: typeof c['intensidad'] === 'string' ? (c['intensidad'] as string) : 'Moderado'
                })) as CardioEntry[];
                setCardio(mapped);
              }

              const dietRows = await loadData('diet');
              if (Array.isArray(dietRows)) {
                const mapped = dietRows.map((d: Record<string, unknown>) => ({
                  fecha: toDateISO(d.fecha),
                  calorias: toNumber(d.calorias),
                  proteinas: toNumber(d.proteinas),
                  carbos: toNumber(d.carbos),
                  grasas: toNumber(d.grasas),
                  ayuno: false
                })) as DietEntry[];
                setDieta(mapped);
              }

              const neatRows = await loadData('neat');
              if (Array.isArray(neatRows)) {
                const mapped = neatRows.map((n: Record<string, unknown>) => ({
                  fecha: toDateISO(n.fecha),
                  tipo: (n.tipo === 'pasos' || n.tipo === 'cinta') ? (n.tipo as 'pasos'|'cinta') : 'pasos',
                  pasos: n.pasos !== undefined ? toNumber(n.pasos) : undefined,
                  km: n.km !== undefined ? toNumber(n.km) : undefined,
                  ritmoKmH: n['ritmo_kmh'] !== undefined ? toNumber(n['ritmo_kmh']) : undefined,
                  inclinacion: n.inclinacion !== undefined ? toNumber(n.inclinacion) : undefined,
                  calorias: toNumber(n.calorias),
                  duracion: toNumber(n.duracion)
                })) as NeatEntry[];
                setNeat(mapped);
              }

              const entrenosRows = await loadData('entrenos_no_programados');
              if (Array.isArray(entrenosRows)) {
                const allowedTipos = ['tenis','natacion','alpinismo','ciclismo','running','futbol','baloncesto','escalada','yoga','pilates','crossfit','otro'];
                const mapped = entrenosRows.map((e: Record<string, unknown>) => ({
                  fecha: toDateISO(e.fecha),
                  tipo: allowedTipos.includes(e.tipo as string) ? e.tipo as EntrenoNoProgramado['tipo'] : 'otro',
                  duracion: toNumber(e.duracion),
                  intensidad: (e.intensidad === 'baja' || e.intensidad === 'moderada' || e.intensidad === 'alta' || e.intensidad === 'muy alta') ? e.intensidad as EntrenoNoProgramado['intensidad'] : 'moderada',
                  calorias: toNumber(e.calorias),
                  esfuerzo: e['esfuerzo'] !== undefined ? toNumber(e['esfuerzo']) : 5,
                  notas: typeof e['notas'] === 'string' ? (e['notas'] as string) : undefined
                })) as EntrenoNoProgramado[];
                setEntrenosNoProgramados(mapped);
              }

              showToast('☁️ Datos cargados desde la nube', 'success');
            } catch (e) {
              console.error('Error cargando datos en inicio:', e);
            }
          }
          
          // Marcar como cargado
          setIsLoading(false);
        } catch (error) {
          console.error('localStorage not available:', error);
          setIsLoading(false);
        }
      }
    };

    initializeApp();
  }, []); // Solo se ejecuta una vez al montar el componente

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

  const toggleNotas = (microcicloId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      notas: {
        ...prev.notas,
        [microcicloId]: !prev.notas[microcicloId]
      }
    }));
  };

  // Funciones para el historial
  const getFilteredHistory = () => {
    const allItems: {
      type: string;
      fecha: string;
      icon: string;
      title: string;
      status: string;
      statusClass: string;
      details: string;
      data: WeightEntry | CardioEntry | DietEntry | NeatEntry | EntrenoNoProgramado;
    }[] = [];
    
    // Agregar pesos
    estado.forEach(item => {
      allItems.push({
        type: 'pesos',
        fecha: item.fecha,
        icon: '⚖️',
        title: 'Pesaje Diario',
        status: 'Completado',
        statusClass: 'bg-green-100 text-green-700',
        details: `${item.peso} kg${item.cintura ? ` • Cintura: ${item.cintura} cm` : ''}`,
        data: item
      });
    });

    // Agregar cardio
    cardio.forEach(item => {
      allItems.push({
        type: 'cardio',
        fecha: item.fecha,
        icon: '🏃',
        title: 'Cardio',
        status: 'Completado',
        statusClass: 'bg-green-100 text-green-700',
        details: `${item.km} km en ${item.tiempo} min • ${item.tipo}`,
        data: item
      });
    });

    // Agregar dieta
    dieta.forEach(item => {
      allItems.push({
        type: 'dieta',
        fecha: item.fecha,
        icon: '🥗',
        title: 'Dieta',
        status: 'Completado',
        statusClass: 'bg-green-100 text-green-700',
        details: `${item.calorias} kcal • ${item.proteinas}g proteínas`,
        data: item
      });
    });

    // Agregar NEAT
    neat.forEach(item => {
      allItems.push({
        type: 'neat',
        fecha: item.fecha,
        icon: '🚶',
        title: 'NEAT',
        status: 'Completado',
        statusClass: 'bg-green-100 text-green-700',
        details: item.tipo === 'pasos' ? `${item.pasos} pasos` : `${item.km} km en cinta`,
        data: item
      });
    });

    // Agregar entrenos extra
    entrenosNoProgramados.forEach(item => {
      allItems.push({
        type: 'entrenos',
        fecha: item.fecha,
        icon: '🎯',
        title: 'Entreno Extra',
        status: 'Completado',
        statusClass: 'bg-green-100 text-green-700',
        details: `${item.tipo} • ${item.duracion} min • ${item.intensidad}`,
        data: item
      });
    });

    // Ordenar por fecha (más reciente primero)
    allItems.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Filtrar según el filtro seleccionado
    if (historyFilter === 'all') {
      return allItems;
    } else {
      return allItems.filter(item => item.type === historyFilter);
    }
  };

  const getFilterName = (filter: string) => {
    const names = {
      'all': 'todas las actividades',
      'pesos': 'pesajes',
      'cardio': 'cardio',
      'dieta': 'dieta',
      'neat': 'NEAT',
      'entrenos': 'entrenos extra'
    };
    return names[filter as keyof typeof names] || 'actividades';
  };

  const viewHistoryItem = (item: {
    type: string;
    fecha: string;
    icon: string;
    title: string;
    status: string;
    statusClass: string;
    details: string;
    data: WeightEntry | CardioEntry | DietEntry | NeatEntry | EntrenoNoProgramado;
  }) => {
    setSelectedHistoryItem(item);
    openModal('history-details');
  };

  // Desktop Layout Functions - ELEGANT CARDS & SIDEBAR DESIGN
  const renderDesktopLayout = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-blue-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">🏋️</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-900">GymTracker</h1>
                  <p className="text-xs text-blue-600">Fitness Platform</p>
                </div>
              </div>
              
              {/* Sync Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                <div className={`w-2 h-2 rounded-full ${
                  syncStatus.isOnline 
                    ? syncStatus.isSyncing 
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-green-500' 
                    : 'bg-red-500'
                }`} />
                <span className="text-xs font-medium text-blue-700">
                  {syncStatus.isOnline 
                    ? syncStatus.isSyncing 
                      ? 'Sincronizando...' 
                      : 'Conectado' 
                    : 'Sin conexión'
                  }
                </span>
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
              </button>
              <button
                onClick={() => openModal('weekly-calendar')}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver plan semanal"
              >
                <span className="text-lg">📅</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-64 bg-white/90 backdrop-blur-sm border-r border-blue-200/50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {renderDesktopSidebar()}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            {renderDesktopMainContent()}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
    </div>
  );

  // ===== NEW DESKTOP COMPONENTS =====
  
  const renderDesktopSidebar = () => (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900">Menú Principal</h2>
        <p className="text-xs text-blue-600 mt-1">Navegación rápida</p>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4 space-y-2">
        {[
          { 
            id: 'today', 
            label: 'Dashboard', 
            icon: '🏠', 
            description: 'Vista general del día',
            color: 'blue'
          },
          { 
            id: 'mesociclo', 
            label: 'Mesociclo', 
            icon: '📋', 
            description: 'Plan de entrenamiento',
            color: 'blue'
          },
          { 
            id: 'history', 
            label: 'Historial', 
            icon: '📊', 
            description: 'Registros anteriores',
            color: 'blue'
          },
          { 
            id: 'stats', 
            label: 'Estadísticas', 
            icon: '📈', 
            description: 'Análisis y gráficos',
            color: 'blue'
          },
          { 
            id: 'settings', 
            label: 'Configuración', 
            icon: '⚙️', 
            description: 'Ajustes del sistema',
            color: 'blue'
          }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as 'today' | 'mesociclo' | 'history' | 'stats' | 'settings')}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              activeSection === item.id
                ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-sm'
                : 'text-blue-700 hover:bg-blue-50 hover:text-blue-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeSection === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <span className="text-sm">{item.icon}</span>
              </div>
              <div>
                <div className="font-medium text-sm">{item.label}</div>
                <div className="text-xs text-blue-600">{item.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-blue-200 bg-blue-50/50">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📊 Resumen Rápido</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-blue-200">
            <span className="text-blue-700">Peso:</span>
            <span className="font-semibold text-blue-900">
              {estado.length > 0 ? `${estado[estado.length - 1].peso} kg` : '--'}
            </span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-blue-200">
            <span className="text-blue-700">Calorías:</span>
            <span className="font-semibold text-blue-900">{getCaloriasDelDia()} kcal</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-blue-200">
            <span className="text-blue-700">Progreso:</span>
            <span className="font-semibold text-blue-900">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopMainContent = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">
            {activeSection === 'today' && '🏠 Dashboard'}
            {activeSection === 'mesociclo' && '📋 Mesociclo'}
            {activeSection === 'history' && '📊 Historial'}
            {activeSection === 'stats' && '📈 Estadísticas'}
            {activeSection === 'settings' && '⚙️ Configuración'}
          </h1>
          <p className="text-blue-600 mt-1">
            {activeSection === 'today' && 'Vista general del día'}
            {activeSection === 'mesociclo' && 'Plan de entrenamiento'}
            {activeSection === 'history' && 'Registros anteriores'}
            {activeSection === 'stats' && 'Análisis y gráficos'}
            {activeSection === 'settings' && 'Ajustes del sistema'}
          </p>
        </div>
        <div className="text-sm text-blue-600">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Function Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { 
            icon: '⚖️', 
            title: 'Registrar Peso', 
            description: 'Añadir peso y medidas',
            color: 'blue',
            action: () => setActiveForm('weight')
          },
          { 
            icon: '🏃', 
            title: 'Añadir Cardio', 
            description: 'Registrar actividad cardiovascular',
            color: 'blue',
            action: () => setActiveForm('cardio')
          },
          { 
            icon: '🥗', 
            title: 'Registrar Dieta', 
            description: 'Añadir calorías y macronutrientes',
            color: 'blue',
            action: () => setActiveForm('diet')
          },
          { 
            icon: '🚶', 
            title: 'Añadir NEAT', 
            description: 'Actividad física no estructurada',
            color: 'blue',
            action: () => setActiveForm('neat')
          },
          { 
            icon: '🎯', 
            title: 'Entreno Extra', 
            description: 'Entrenamiento no programado',
            color: 'blue',
            action: () => setActiveForm('entreno')
          },
          { 
            icon: '📊', 
            title: 'Ver Estadísticas', 
            description: 'Análisis y progreso',
            color: 'blue',
            action: () => setActiveSection('stats')
          }
        ].map((card, index) => (
          <div 
            key={index}
            onClick={card.action}
            className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">{card.title}</h3>
                <p className="text-sm text-blue-600">{card.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-500 font-medium">Hacer clic para abrir</span>
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-blue-600 text-xs">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Horizontal Tabs */}
      {activeForm && (
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg border border-blue-200">
            {/* Tab Headers */}
            <div className="flex border-b border-blue-200">
              {[
                { id: 'weight', label: '⚖️ Peso', icon: '⚖️' },
                { id: 'cardio', label: '🏃 Cardio', icon: '🏃' },
                { id: 'diet', label: '🥗 Dieta', icon: '🥗' },
                { id: 'neat', label: '🚶 NEAT', icon: '🚶' },
                { id: 'entreno', label: '🎯 Entreno', icon: '🎯' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveForm(tab.id as 'weight' | 'cardio' | 'diet' | 'neat' | 'entreno')}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeForm === tab.id
                      ? 'text-blue-900 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeForm === 'weight' && renderDesktopWeightForm()}
              {activeForm === 'cardio' && renderDesktopCardioForm()}
              {activeForm === 'diet' && renderDesktopDietForm()}
              {activeForm === 'neat' && renderDesktopNeatForm()}
              {activeForm === 'entreno' && renderDesktopEntrenoForm()}
            </div>
          </div>
        </div>
      )}

      {/* Section Content */}
      {!activeForm && (
        <div className="mt-8">
          {activeSection === 'today' && renderDesktopDashboard()}
          {activeSection === 'mesociclo' && renderDesktopMesociclo()}
          {activeSection === 'history' && renderDesktopHistory()}
          {activeSection === 'stats' && renderDesktopAnalytics()}
          {activeSection === 'settings' && renderDesktopSettings()}
        </div>
      )}
    </div>
  );

  const renderDesktopMesociclo = () => (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📋 Plan de Entrenamiento</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getMesocicloData().microciclos.map((microciclo, index) => (
            <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{microciclo.nombre}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{microciclo.objetivo}</p>
              
              <div className="space-y-3">
                {microciclo.dias.map((dia, diaIndex) => (
                  <div key={diaIndex} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{dia.dia}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{dia.entrenamiento}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{dia.ejercicios.length} ejercicios</span>
                      <button 
                        onClick={() => {
                          setSelectedWorkout({
                            dia: dia.dia,
                            entrenamiento: dia.entrenamiento,
                            ejercicios: dia.ejercicios,
                            cardio: dia.cardio
                          });
                          openModal('workout-details');
                        }}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDesktopHistory = () => (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📊 Historial de Actividades</h2>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'Todo', icon: '📋' },
            { id: 'pesos', label: 'Peso', icon: '⚖️' },
            { id: 'cardio', label: 'Cardio', icon: '🏃' },
            { id: 'dieta', label: 'Dieta', icon: '🥗' },
            { id: 'neat', label: 'NEAT', icon: '🚶' },
            { id: 'entrenos', label: 'Entrenos', icon: '💪' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setHistoryFilter(filter.id as 'all' | 'pesos' | 'cardio' | 'dieta' | 'neat' | 'entrenos')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                historyFilter === filter.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="space-y-4">
          {getFilteredHistory().slice(0, 10).map((item, index) => (
            <div
              key={index}
              onClick={() => viewHistoryItem(item)}
              className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 cursor-pointer hover:bg-white dark:hover:bg-gray-600 transition-all duration-300 border border-white/20 dark:border-gray-600/20"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.fecha}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${item.statusClass}`}>
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDesktopAnalytics = () => (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📈 Analytics Avanzados</h2>
        <DesktopCharts 
          estado={estado}
          cardio={cardio}
          dieta={dieta}
          neat={neat}
        />
      </div>
    </div>
  );

  const renderDesktopSettings = () => (
    <div className="space-y-8">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⚙️ Configuración</h2>
        
        <div className="space-y-6">
          {/* Sync Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔄 Sincronización</h3>
            <button
              onClick={async () => {
                await syncData('weights', estado);
                await syncData('cardio', cardio);
                await syncData('diet', dieta);
                await syncData('neat', neat);
                await syncData('entrenos_no_programados', entrenosNoProgramados);
              }}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}
            </button>
          </div>

          {/* Mesociclo Config */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Configuración del Mesociclo</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Mesociclo Actual:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Mesociclo 1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">Día Actual:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Día 1</span>
              </div>
              <button
                onClick={() => setShowStartDateConfig(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Configurar Fecha de Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopInsights = () => (
    <div className="space-y-6">
      {/* Weekly Progress */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📊 Progreso Semanal</h3>
        <div className="space-y-4">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
            <div key={day} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{day}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.random() * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{Math.round(Math.random() * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/20">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🕒 Actividad Reciente</h3>
        <div className="space-y-3">
          {estado.length > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-xl">⚖️</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Último peso</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{estado[estado.length - 1].peso} kg</p>
              </div>
            </div>
          )}
          {cardio.length > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-xl">🏃</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Último cardio</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{cardio[cardio.length - 1].km} km</p>
              </div>
            </div>
          )}
          {dieta.length > 0 && (
            <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-xl">🥗</span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Última dieta</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{dieta[dieta.length - 1].calorias} kcal</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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

  // Desktop Form Functions
  const renderDesktopWeightForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso (kg)</label>
        <input
          type="number"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          step="0.1"
          placeholder="85.0"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cintura (cm) - Opcional</label>
        <input
          type="number"
          value={seguimientoCintura}
          onChange={(e) => setSeguimientoCintura(e.target.value)}
          step="0.1"
          placeholder="80.0"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <button
        onClick={saveWeight}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Guardar Peso
      </button>
    </div>
  );

  const renderDesktopCardioForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distancia (km)</label>
        <input
          type="number"
          value={cardioKm}
          onChange={(e) => setCardioKm(e.target.value)}
          step="0.1"
          placeholder="5.0"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiempo (minutos)</label>
        <input
          type="number"
          value={cardioTime}
          onChange={(e) => setCardioTime(e.target.value)}
          placeholder="30"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <button
        onClick={saveCardio}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Guardar Cardio
      </button>
    </div>
  );

  const renderDesktopDietForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Calorías</label>
        <input
          type="number"
          value={dietCalories}
          onChange={(e) => setDietCalories(e.target.value)}
          placeholder="2000"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proteínas (g)</label>
        <input
          type="number"
          value={dietProtein}
          onChange={(e) => setDietProtein(e.target.value)}
          placeholder="150"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      <button
        onClick={saveDiet}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Guardar Dieta
      </button>
    </div>
  );

  const renderDesktopNeatForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
        <select
          value={neatTipo}
          onChange={(e) => setNeatTipo(e.target.value as 'pasos' | 'cinta')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="pasos">Pasos</option>
          <option value="cinta">Cinta</option>
        </select>
      </div>
      
      {neatTipo === 'pasos' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pasos</label>
          <input
            type="number"
            value={neatPasos}
            onChange={(e) => setNeatPasos(e.target.value)}
            placeholder="8000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distancia (km)</label>
            <input
              type="number"
              value={neatKm}
              onChange={(e) => setNeatKm(e.target.value)}
              step="0.1"
              placeholder="2.0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (min)</label>
            <input
              type="number"
              value={neatDuracion}
              onChange={(e) => setNeatDuracion(e.target.value)}
              placeholder="20"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}
      
      <button
        onClick={saveNeat}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Guardar NEAT
      </button>
    </div>
  );

  const renderDesktopEntrenoForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actividad</label>
        <select
          value={entrenoTipo}
          onChange={(e) => setEntrenoTipo(e.target.value as 'tenis' | 'natacion' | 'alpinismo' | 'ciclismo' | 'running' | 'futbol' | 'baloncesto' | 'escalada' | 'yoga' | 'pilates' | 'crossfit' | 'otro')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="tenis">🎾 Tenis</option>
          <option value="natacion">🏊 Natación</option>
          <option value="alpinismo">🏔️ Alpinismo</option>
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
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (minutos)</label>
        <input
          type="number"
          value={entrenoDuracion}
          onChange={(e) => setEntrenoDuracion(e.target.value)}
          placeholder="60"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intensidad</label>
        <select
          value={entrenoIntensidad}
          onChange={(e) => setEntrenoIntensidad(e.target.value as 'baja' | 'moderada' | 'alta' | 'muy alta')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="baja">Baja</option>
          <option value="moderada">Moderada</option>
          <option value="alta">Alta</option>
          <option value="muy alta">Muy Alta</option>
        </select>
      </div>
      
      <button
        onClick={saveEntrenoNoProgramado}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Guardar Entreno
      </button>
    </div>
  );

  const saveWeight = async () => {
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) {
      showToast('⚠️ Ingresa un peso válido', 'error');
      return;
    }

    const fecha = todayISO();
    const newEstado = estado.filter(e => e.fecha !== fecha);
    const newWeight = { fecha, peso: weight, cintura: null };
    newEstado.push(newWeight);
    newEstado.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    setEstado(newEstado);
    
    // Sincronizar con Neon
    await saveData('weights', newWeight);
    
    showToast(`✅ Peso guardado: ${weight} kg`);
    closeModal();
  };



  const saveCardio = async () => {
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
    const newCardioEntry: CardioEntry = {
      fecha,
      microciclo: 1,
      sesionId: 1,
      km,
      tiempo: time,
      ritmo: time / km,
      calorias: Math.round(time * 10),
      tipo: 'mesociclo',
      intensidad: cardioMesociclo?.intensidad || 'Moderado'
    };
    newCardio.push(newCardioEntry);

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].cardio = true;

    setCardio(newCardio);
    setAdherenciaDiaria(newAdherencia);
    
    // Sincronizar con Neon
    await saveData('cardio', newCardioEntry);
    
    showToast(`✅ Cardio guardado: ${km}km en ${time}min (${cardioMesociclo?.tipo || 'Cardio'})`);
    closeModal();
  };

  const saveDiet = async () => {
    const calories = parseInt(dietCalories);
    const protein = parseInt(dietProtein);
    
    if (!calories || !protein || calories <= 0 || protein <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    const fecha = todayISO();
    const newDieta = dieta.filter(d => d.fecha !== fecha);
    const newDietEntry = {
      fecha,
      calorias: calories,
      proteinas: protein,
      carbos: Math.round((calories - protein * 4) * 0.4 / 4),
      grasas: Math.round((calories - protein * 4) * 0.2 / 9),
      ayuno: false
    };
    newDieta.push(newDietEntry);

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].dieta = calories >= 1700 && calories <= 1900 && protein >= 150;

    setDieta(newDieta);
    setAdherenciaDiaria(newAdherencia);
    
    // Sincronizar con Neon
    await saveData('diet', newDietEntry);
    
    showToast('✅ Dieta guardada');
    closeModal();
  };

  const saveNeat = async () => {
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
      const newNeatEntry: NeatEntry = {
        fecha,
        tipo: 'pasos',
        pasos,
        ritmo,
        calorias,
        duracion
      };
      newNeat.push(newNeatEntry);

      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].neat = true;

      setNeat(newNeat);
      setAdherenciaDiaria(newAdherencia);
      
      // Sincronizar con Neon
      await saveData('neat', newNeatEntry);
      
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
      const newNeatEntry: NeatEntry = {
        fecha,
        tipo: 'cinta',
        km,
        ritmoKmH,
        inclinacion,
        calorias,
        duracion
      };
      newNeat.push(newNeatEntry);

      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].neat = true;

      setNeat(newNeat);
      setAdherenciaDiaria(newAdherencia);
      
      // Sincronizar con Neon
      await saveData('neat', newNeatEntry);
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

  const saveEntrenoNoProgramado = async () => {
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

    // Sincronizar con Neon
    await saveData('entrenos_no_programados', newEntreno);
    
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



  // Desktop Section Functions
  const renderDesktopTodaySection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏠 Hoy</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: '2-digit', 
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progreso del Día</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {Math.round(calculateProgress() * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {Object.keys(adherenciaDiaria[todayISO()] || {}).length} de 5 actividades
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Peso Actual</h3>
            <span className="text-2xl">⚖️</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {estado.length > 0 ? `${estado[estado.length - 1].peso} kg` : '--'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Último registro
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calorías Hoy</h3>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {dieta.length > 0 ? `${dieta[dieta.length - 1].calorias}` : '--'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              kcal consumidas
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entrenamiento</h3>
            <span className="text-2xl">💪</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {currentData.dia.entrenamiento}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentData.dia.dia}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actividades Completadas</h3>
          <div className="space-y-3">
            {adherenciaDiaria[todayISO()]?.pesos && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span className="text-gray-900 dark:text-white">Peso registrado</span>
              </div>
            )}
            {adherenciaDiaria[todayISO()]?.cardio && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <span className="text-red-600 dark:text-red-400">✅</span>
                <span className="text-gray-900 dark:text-white">Cardio completado</span>
              </div>
            )}
            {adherenciaDiaria[todayISO()]?.dieta && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-yellow-600 dark:text-yellow-400">✅</span>
                <span className="text-gray-900 dark:text-white">Dieta registrada</span>
              </div>
            )}
            {adherenciaDiaria[todayISO()]?.neat && (
              <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-purple-600 dark:text-purple-400">✅</span>
                <span className="text-gray-900 dark:text-white">NEAT registrado</span>
              </div>
            )}
            {adherenciaDiaria[todayISO()]?.entrenoNoProgramado && (
              <div className="flex items-center space-x-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <span className="text-teal-600 dark:text-teal-400">✅</span>
                <span className="text-gray-900 dark:text-white">Entreno extra</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Próximas Actividades</h3>
          <div className="space-y-3">
            {!adherenciaDiaria[todayISO()]?.pesos && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-400">⏳</span>
                <span className="text-gray-900 dark:text-white">Registrar peso</span>
              </div>
            )}
            {!adherenciaDiaria[todayISO()]?.cardio && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-400">⏳</span>
                <span className="text-gray-900 dark:text-white">Hacer cardio</span>
              </div>
            )}
            {!adherenciaDiaria[todayISO()]?.dieta && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-400">⏳</span>
                <span className="text-gray-900 dark:text-white">Registrar dieta</span>
              </div>
            )}
            {!adherenciaDiaria[todayISO()]?.neat && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-400">⏳</span>
                <span className="text-gray-900 dark:text-white">Actividad NEAT</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopRightSidebar = () => (
    <div className="h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Estadísticas</h2>
      </div>

      {/* Statistics */}
      <div className="flex-1 p-4 space-y-6">
        {/* Weekly Progress */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📈 Progreso Semanal</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Días activos</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {Object.keys(adherenciaDiaria).filter(date => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(date) >= weekAgo;
                }).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Promedio diario</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {Math.round(calculateProgress() * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Weight Trend */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">⚖️ Tendencia de Peso</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Actual</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {estado.length > 0 ? `${estado[estado.length - 1].peso} kg` : '--'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Cambio semanal</span>
              <span className="font-medium text-green-900 dark:text-green-100">
                {estado.length > 1 ? `${(estado[estado.length - 1].peso - estado[estado.length - 8]?.peso || estado[estado.length - 1].peso).toFixed(1)} kg` : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">⚡ Acciones Rápidas</h3>
          <div className="space-y-2">
            <button
              onClick={() => openModal('weekly-calendar')}
              className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              📅 Ver calendario semanal
            </button>
            <button
              onClick={() => setActiveSection('stats')}
              className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              📈 Ver estadísticas
            </button>
            <button
              onClick={() => setShowAdvancedSettings(true)}
              className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              ⚙️ Configuración avanzada
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🕒 Actividad Reciente</h3>
          <div className="space-y-2">
            {estado.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Último peso:</span> {estado[estado.length - 1].peso} kg
              </div>
            )}
            {cardio.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Último cardio:</span> {cardio[cardio.length - 1].km} km
              </div>
            )}
            {dieta.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Última dieta:</span> {dieta[dieta.length - 1].calorias} kcal
              </div>
            )}
            {neat.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Último NEAT:</span> {neat[neat.length - 1].tipo}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopMesocicloSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📋 Mesociclo</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {currentData.mesociclo.nombre}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {currentData.mesociclo.microciclos.map((microciclo, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-blue-700 text-lg font-bold">MC</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{microciclo.nombre}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{microciclo.objetivo}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                  Objetivo: {microciclo.objetivo}
                </span>
                <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
                  Intensidad: {microciclo.intensidad}
                </span>
                <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-medium">
                  Cardio: {microciclo.cardio}
                </span>
              </div>

              <div className="space-y-2">
                {microciclo.dias.map((dia, diaIndex) => (
                  <div key={diaIndex} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 dark:text-blue-300 text-sm font-bold">{diaIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{dia.dia}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{dia.entrenamiento}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWorkout(dia);
                        openModal('workout-details');
                      }}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Ver →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDesktopHistorySection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Historial</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setHistoryFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'all' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setHistoryFilter('pesos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'pesos' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ⚖️ Pesos
          </button>
          <button
            onClick={() => setHistoryFilter('cardio')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'cardio' 
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🏃 Cardio
          </button>
          <button
            onClick={() => setHistoryFilter('dieta')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'dieta' 
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🥗 Dieta
          </button>
          <button
            onClick={() => setHistoryFilter('neat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'neat' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🚶 NEAT
          </button>
          <button
            onClick={() => setHistoryFilter('entrenos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              historyFilter === 'entrenos' 
                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            🎯 Entrenos
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredHistory().map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(item.fecha).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {item.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewHistoryItem(item)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDesktopStatsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📈 Estadísticas</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Análisis completo de tu progreso
        </div>
      </div>

      <DesktopCharts 
        estado={estado}
        cardio={cardio}
        dieta={dieta}
        neat={neat}
      />
    </div>
  );

  const renderDesktopSettingsSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">⚙️ Ajustes</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuración General</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Modo oscuro</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Configuración avanzada</span>
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Configurar
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Sincronización</span>
              <button
                onClick={async () => {
                  await syncData('weights', estado);
                  await syncData('cardio', cardio);
                  await syncData('diet', dieta);
                  await syncData('neat', neat);
                  await syncData('entrenos_no_programados', entrenosNoProgramados);
                }}
                disabled={!syncStatus.isOnline || syncStatus.isSyncing}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  syncStatus.isOnline && !syncStatus.isSyncing
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mesociclo</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Mesociclo actual: <span className="font-medium text-gray-900 dark:text-white">{currentData.mesociclo.nombre}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Día actual: <span className="font-medium text-gray-900 dark:text-white">{currentData.diaMesociclo}</span>
              </p>
            </div>
            
            <button
              onClick={() => setShowStartDateConfig(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Configurar fecha de inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTodaySection = () => (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="nav-clean p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-primary">Mi Entrenamiento</h1>
            <p className="text-gray-600 mt-2">
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
              className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center hover:scale-110 transition-all text-blue-700 shadow-sm hover:shadow-md"
              title="Ver plan semanal"
            >
              <span className="text-xl">📅</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="px-6 pb-6">
        <div className="clean-card text-center">
          <div className="flex justify-center mb-4">
            <ProgressCircle progress={progress} />
          </div>
          <p className="text-sm text-gray-600">Progreso del día</p>
        </div>
      </div>
      
      {/* Today's Tasks */}
      <div className="px-6">
        <h2 className="text-xl font-semibold mb-4">🎯 Hoy toca (Actualizado):</h2>
        
                {/* Current Day Info */}
        {(() => {
          let currentData;
          
          // Solo ejecutar en el cliente después de la hidratación
          if (typeof window !== 'undefined' && !isLoading) {
            try {
              currentData = getCurrentMesocicloDay();
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
            <div className="clean-card mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {currentData.dia.dia.split(' ')[1]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight mb-1">{currentData.dia.entrenamiento}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{currentData.microciclo.nombre}</p>
                </div>
              </div>
              {currentData.dia.cardio && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                    🏃 {currentData.dia.cardio.tipo}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {currentData.dia.cardio.duracion}min • {currentData.dia.cardio.intensidad}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
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
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-all"
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
            <div className="clean-card mb-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-lg">🔥</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight mb-1">Calorías Quemadas</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Total del día</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-orange-600">{caloriasHoy}</div>
                  <div className="text-xs text-gray-500">kcal</div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Weight Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('weight')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">Pesaje Diario</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Registra tu peso de hoy</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('weight')}>{getStatus('weight')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Workout Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('workout')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🏋️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">Entrenamiento</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Completa tu rutina de hoy</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('workout')}>{getStatus('workout')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para entrenar</div>
            </div>
          </div>
        </div>
        
        {/* Cardio Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('cardio')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🏃</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">Cardio</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Registra tu actividad cardiovascular</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('cardio')}>{getStatus('cardio')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Diet Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('diet')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🥗</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">Dieta</h3>
                <p className="text-sm text-gray-600 leading-relaxed">1800 kcal - 150g proteínas</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('diet')}>{getStatus('diet')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* NEAT Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('neat')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🚶</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">NEAT</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Actividad física no estructurada</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('neat')}>{getStatus('neat')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Entreno No Programado Entry */}
        <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('entreno-no-programado')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight mb-1">Entreno Extra</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Tenis, natación, alpinismo, etc.</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={getStatusClass('entrenoNoProgramado')}>{getStatus('entrenoNoProgramado')}</div>
              <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Seguimiento Entry - Solo domingos */}
        {new Date().getDay() === 0 && (
          <div className="clean-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('seguimiento')}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base leading-tight mb-1">Seguimiento Semanal</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Peso, cintura y medidas</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={getStatusClass('seguimiento')}>{getStatus('seguimiento')}</div>
                <div className="text-xs text-gray-500 mt-1">Toca para registrar</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMesocicloSection = () => {
    
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
                Configurar
              </button>
            </div>

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
                    <p className="text-xs text-blue-600 font-medium mb-2">Objetivo</p>
                    <p className="text-sm md:text-base font-semibold leading-relaxed">{mesociclo.objetivo}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 font-medium mb-2">Estructura</p>
                    <p className="text-sm md:text-base font-semibold leading-relaxed">{mesociclo.estructura}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-orange-600 font-medium mb-2">Intensidad</p>
                    <p className="text-sm md:text-base font-semibold leading-relaxed">{mesociclo.intensidad}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium mb-2">Cardio</p>
                    <p className="text-sm md:text-base font-semibold leading-relaxed">{mesociclo.cardio}</p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-yellow-600 font-medium mb-2">Dieta</p>
                  <p className="text-sm md:text-base font-semibold leading-relaxed">{mesociclo.dieta}</p>
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
                    className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-50 to-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-blue-700 text-sm font-bold">MC</span>
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
                      {/* Información del microciclo - Formato Compacto */}
                      <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                          Objetivo: {microciclo.objetivo}
                        </span>
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">
                          Intensidad: {microciclo.intensidad}
                        </span>
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full font-medium">
                          Cardio: {microciclo.cardio}
                        </span>
                      </div>
                      
                      {/* Días de entrenamiento */}
                      <div className="space-y-2">
                        {microciclo.dias.map((dia, index) => (
                          <div 
                            key={index} 
                            className="flex items-start justify-between p-3 md:p-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
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
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm leading-tight mb-1">{dia.dia}</p>
                                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{dia.entrenamiento}</p>
                                  {dia.cardio && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                                        🏃 {dia.cardio.tipo}
                                      </span>
                                      <span className="text-xs text-gray-500 font-medium">
                                        {dia.cardio.duracion}min
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-medium text-gray-700 bg-blue-50 px-2 py-1 rounded-full">
                                  {dia.ejercicios.length > 0 ? `${dia.ejercicios.length} ejercicios` : 'Descanso'}
                                </span>
                                <span className="text-gray-500 text-lg font-bold">→</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Notas del Microciclo - Desplegable */}
                      <div className="mt-4">
                        <button 
                          onClick={() => toggleNotas(microciclo.id)}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">📝 Notas del Microciclo</span>
                          </div>
                          <span className={`text-gray-400 transition-transform duration-200 ${expandedSections.notas[microciclo.id] ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>
                        
                        {expandedSections.notas[microciclo.id] && (
                          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 animate-fadeIn">
                            <div className="text-sm text-gray-700 space-y-2">
                              <p><strong>💡 Consejos:</strong></p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Mantén la técnica correcta en todos los ejercicios</li>
                                <li>Respeta los tiempos de descanso entre series</li>
                                <li>Progresivamente aumenta la intensidad</li>
                                <li>Escucha a tu cuerpo y ajusta según sea necesario</li>
                              </ul>
                              <p className="mt-3"><strong>⚠️ Precauciones:</strong></p>
                              <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Calienta adecuadamente antes de cada sesión</li>
                                <li>Si sientes dolor, detén el ejercicio</li>
                                <li>Mantén una hidratación constante</li>
                              </ul>
                            </div>
                          </div>
                        )}
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
      
      {/* Filtros */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setHistoryFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'all' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button 
            onClick={() => setHistoryFilter('pesos')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'pesos' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚖️ Pesos
          </button>
          <button 
            onClick={() => setHistoryFilter('cardio')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'cardio' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏃 Cardio
          </button>
          <button 
            onClick={() => setHistoryFilter('dieta')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'dieta' 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🥗 Dieta
          </button>
          <button 
            onClick={() => setHistoryFilter('neat')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'neat' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🚶 NEAT
          </button>
          <button 
            onClick={() => setHistoryFilter('entrenos')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              historyFilter === 'entrenos' 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎯 Entrenos Extra
          </button>
        </div>
      </div>
      
      {/* Lista de Actividades */}
      <div className="space-y-4">
        {getFilteredHistory().map((item, index) => (
          <div key={index} className="mobile-card cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => viewHistoryItem(item)}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{item.icon}</span>
                  <h3 className="font-semibold text-base">{item.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.statusClass}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {new Date(item.fecha).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <div className="text-sm text-gray-500">
                  {item.details}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">Ver detalles</span>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredHistory().length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay registros</h3>
          <p className="text-sm text-gray-500">
            {historyFilter === 'all' 
              ? 'Aún no has registrado ninguna actividad'
              : `No hay registros de ${getFilterName(historyFilter)}`
            }
          </p>
        </div>
      )}
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

  // ===== DESKTOP FUNCTIONS =====
  
  const renderDesktopDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta! 👋</h2>
            <p className="text-blue-100 text-lg">
              Hoy es {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-2">{Math.round(progress)}%</div>
            <div className="text-blue-100 text-lg">Progreso del día</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            icon: '📊', 
            label: 'Progreso del Día', 
            value: `${Math.round(calculateProgress() * 100)}%`,
            subtitle: `${Object.keys(adherenciaDiaria[todayISO()] || {}).length} de 5 actividades`,
            color: 'blue'
          },
          { 
            icon: '⚖️', 
            label: 'Peso Actual', 
            value: estado.length > 0 ? `${estado[estado.length - 1].peso} kg` : '--',
            subtitle: 'Último registro',
            color: 'green'
          },
          { 
            icon: '🔥', 
            label: 'Calorías Hoy', 
            value: `${getCaloriasDelDia()}`,
            subtitle: 'kcal consumidas',
            color: 'orange'
          },
          { 
            icon: '💪', 
            label: 'Entrenamiento', 
            value: (() => {
              const currentData = getCurrentMesocicloDay();
              return currentData ? currentData.dia.entrenamiento : 'Descanso';
            })(),
            subtitle: (() => {
              const currentData = getCurrentMesocicloDay();
              return currentData ? currentData.dia.dia : 'Hoy';
            })(),
            color: 'purple'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">{stat.label}</h3>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-blue-600">
                {stat.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-900">Actividades Completadas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adherenciaDiaria[todayISO()]?.pesos && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚖️</span>
                  </div>
                  <span className="font-medium text-blue-900">Peso registrado</span>
                </div>
              )}
              {adherenciaDiaria[todayISO()]?.cardio && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🏃</span>
                  </div>
                  <span className="font-medium text-blue-900">Cardio completado</span>
                </div>
              )}
              {adherenciaDiaria[todayISO()]?.dieta && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🥗</span>
                  </div>
                  <span className="font-medium text-blue-900">Dieta registrada</span>
                </div>
              )}
              {adherenciaDiaria[todayISO()]?.neat && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🚶</span>
                  </div>
                  <span className="font-medium text-blue-900">NEAT registrado</span>
                </div>
              )}
              {adherenciaDiaria[todayISO()]?.entrenoNoProgramado && (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <span className="font-medium text-blue-900">Entreno extra</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-amber-600 text-xl">⏳</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-900">Próximas Actividades</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!adherenciaDiaria[todayISO()]?.pesos && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">⚖️</span>
                  </div>
                  <span className="font-medium text-blue-700">Registrar peso</span>
                </div>
              )}
              {!adherenciaDiaria[todayISO()]?.cardio && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🏃</span>
                  </div>
                  <span className="font-medium text-blue-700">Hacer cardio</span>
                </div>
              )}
              {!adherenciaDiaria[todayISO()]?.dieta && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🥗</span>
                  </div>
                  <span className="font-medium text-blue-700">Registrar dieta</span>
                </div>
              )}
              {!adherenciaDiaria[todayISO()]?.neat && (
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🚶</span>
                  </div>
                  <span className="font-medium text-blue-700">Actividad NEAT</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">⚡ Acciones Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => setActiveForm('weight')}
                className="w-full flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">⚖️</span>
                </div>
                <span className="font-medium text-blue-900">Registrar Peso</span>
              </button>
              <button
                onClick={() => setActiveForm('cardio')}
                className="w-full flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏃</span>
                </div>
                <span className="font-medium text-blue-900">Añadir Cardio</span>
              </button>
              <button
                onClick={() => setActiveForm('diet')}
                className="w-full flex items-center space-x-3 p-4 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🥗</span>
                </div>
                <span className="font-medium text-blue-900">Registrar Dieta</span>
              </button>
              <button
                onClick={() => setActiveForm('neat')}
                className="w-full flex items-center space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🚶</span>
                </div>
                <span className="font-medium text-blue-900">Añadir NEAT</span>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Actividad Reciente</h3>
            <div className="space-y-3">
              {estado.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Último peso</p>
                    <p className="text-xs text-blue-600">{estado[estado.length - 1].peso} kg</p>
                  </div>
                </div>
              )}
              {cardio.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-xl">🏃</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Último cardio</p>
                    <p className="text-xs text-blue-600">{cardio[cardio.length - 1].km} km</p>
                  </div>
                </div>
              )}
              {dieta.length > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-xl">🥗</span>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Última dieta</p>
                    <p className="text-xs text-blue-600">{dieta[dieta.length - 1].calorias} kcal</p>
                  </div>
                </div>
              )}
            </div>
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
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <ToastContainer />
      
      {/* Selector de Modo */}
      <div className="fixed top-4 left-4 z-50">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'mobile' | 'desktop')}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <option value="mobile">📱 Móvil</option>
          <option value="desktop">🖥️ PC</option>
        </select>
      </div>
      
      {/* Mobile Dashboard */}
      {viewMode === 'mobile' && (
        <div className="block">
          {activeSection === 'today' && renderTodaySection()}
          {activeSection === 'mesociclo' && renderMesocicloSection()}
          {activeSection === 'history' && renderHistorySection()}
          {activeSection === 'settings' && renderSettingsSection()}
          
          {/* Mobile Navigation */}
          <div className="bottom-nav">
            <div className="grid grid-cols-4 gap-1 px-2">
              <div 
                className={`bottom-nav-item cursor-pointer ${activeSection === 'today' ? 'active' : ''}`}
                onClick={() => setActiveSection('today')}
              >
                <span className="text-xl">🏠</span>
                <span className="text-xs mt-1">Hoy</span>
              </div>
              <div 
                className={`bottom-nav-item cursor-pointer ${activeSection === 'mesociclo' ? 'active' : ''}`}
                onClick={() => setActiveSection('mesociclo')}
              >
                <span className="text-xl">📋</span>
                <span className="text-xs mt-1">Mesociclo</span>
              </div>
              <div 
                className={`bottom-nav-item cursor-pointer ${activeSection === 'history' ? 'active' : ''}`}
                onClick={() => setActiveSection('history')}
              >
                <span className="text-xl">📊</span>
                <span className="text-xs mt-1">Historial</span>
              </div>
              <div 
                className={`bottom-nav-item cursor-pointer ${activeSection === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveSection('settings')}
              >
                <span className="text-xl">⚙️</span>
                <span className="text-xs mt-1">Ajustes</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Dashboard */}
      {viewMode === 'desktop' && (
        <div className="block">
          {renderDesktopLayout()}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'weight' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>⚖️ Pesaje Diario</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    step="0.1" 
                    placeholder="85.0" 
                    className="input-compact"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveWeight} className="btn-elegant btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🏃 Cardio</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Distancia (km)</label>
                  <input 
                    type="number" 
                    value={cardioKm}
                    onChange={(e) => setCardioKm(e.target.value)}
                    step="0.1" 
                    placeholder="3.5" 
                    className="input-compact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Tiempo (min)</label>
                  <input 
                    type="number" 
                    value={cardioTime}
                    onChange={(e) => setCardioTime(e.target.value)}
                    placeholder="25" 
                    className="input-compact"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveCardio} className="btn-elegant btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'diet' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🥗 Dieta</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Calorías</label>
                  <input 
                    type="number" 
                    value={dietCalories}
                    onChange={(e) => setDietCalories(e.target.value)}
                    placeholder="1800" 
                    className="input-compact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Proteínas (g)</label>
                  <input 
                    type="number" 
                    value={dietProtein}
                    onChange={(e) => setDietProtein(e.target.value)}
                    placeholder="150" 
                    className="input-compact"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-elegant btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveDiet} className="btn-elegant btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
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
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
            </div>
          </div>
        </div>
      )}

      {activeModal === 'history-details' && selectedHistoryItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-h-[90vh] flex flex-col mx-4 md:mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex-shrink-0">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3 className="text-base md:text-lg">{selectedHistoryItem.icon} {selectedHistoryItem.title}</h3>
            </div>
            
            <div className="modal-body flex-1 overflow-y-auto">
              <div className="space-y-4 md:space-y-6">
                {/* Fecha */}
                <div className="clean-card">
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-sm md:text-base">
                      📅
                    </div>
                    <div>
                      <h4 className="font-semibold text-base md:text-lg">Fecha</h4>
                      <p className="text-xs md:text-sm text-gray-600">
                        {new Date(selectedHistoryItem.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: '2-digit', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detalles específicos según el tipo */}
                {selectedHistoryItem.type === 'pesos' && (
                  <div className="clean-card">
                    <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">📊 Datos del Pesaje</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Peso</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as WeightEntry).peso} kg</p>
                      </div>
                      {(selectedHistoryItem.data as WeightEntry).cintura && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Cintura</p>
                          <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as WeightEntry).cintura} cm</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedHistoryItem.type === 'cardio' && (
                  <div className="clean-card">
                    <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">🏃 Detalles del Cardio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Distancia</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as CardioEntry).km} km</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Tiempo</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as CardioEntry).tiempo} min</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">Ritmo</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as CardioEntry).ritmo.toFixed(2)} min/km</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Calorías</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as CardioEntry).calorias} kcal</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedHistoryItem.type === 'dieta' && (
                  <div className="clean-card">
                    <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">🥗 Detalles de la Dieta</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Calorías</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as DietEntry).calorias} kcal</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Proteínas</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as DietEntry).proteinas}g</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">Carbohidratos</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as DietEntry).carbos}g</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Grasas</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as DietEntry).grasas}g</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedHistoryItem.type === 'neat' && (
                  <div className="clean-card">
                    <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">🚶 Detalles del NEAT</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Tipo</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as NeatEntry).tipo === 'pasos' ? 'Pasos' : 'Cinta'}</p>
                      </div>
                      {(selectedHistoryItem.data as NeatEntry).tipo === 'pasos' ? (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Pasos</p>
                          <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as NeatEntry).pasos}</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-600 font-medium">Distancia</p>
                          <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as NeatEntry).km} km</p>
                        </div>
                      )}
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">Calorías</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as NeatEntry).calorias} kcal</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedHistoryItem.type === 'entrenos' && (
                  <div className="clean-card">
                    <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">🎯 Detalles del Entreno Extra</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">Actividad</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as EntrenoNoProgramado).tipo}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">Duración</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as EntrenoNoProgramado).duracion} min</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-orange-600 font-medium">Intensidad</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as EntrenoNoProgramado).intensidad}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-purple-600 font-medium">Calorías</p>
                        <p className="text-sm md:text-base font-semibold">{(selectedHistoryItem.data as EntrenoNoProgramado).calorias} kcal</p>
                      </div>
                    </div>
                    {(selectedHistoryItem.data as EntrenoNoProgramado).notas && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-1">Notas</p>
                        <p className="text-sm text-gray-700">{(selectedHistoryItem.data as EntrenoNoProgramado).notas}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-3 flex-shrink-0 p-3 md:p-4 border-t border-gray-200">
              <button onClick={closeModal} className="btn-elegant btn-secondary flex-1 text-sm md:text-base">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}