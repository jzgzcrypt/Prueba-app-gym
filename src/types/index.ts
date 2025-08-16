export interface WeightEntry {
  fecha: string;
  peso: number;
  cintura: number | null;
}

export interface WorkoutEntry {
  fecha: string;
  tipo: string;
  ejercicios: Exercise[];
  completado: boolean;
  duracion?: number;
  notas?: string;
}

export interface Exercise {
  nombre: string;
  series: Set[];
  completado: boolean;
  pesoSugerido?: number; // Peso sugerido del mesociclo
  repeticionesObjetivo?: number; // Repeticiones objetivo (ej: 10-12)
  progresion?: Progresion; // Historial de progresión
  descripcion?: string; // Descripción original del ejercicio del mesociclo
}

export interface Set {
  peso: number;
  repeticiones: number;
  completado: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  repeticionesObjetivo?: string; // "5-7", "8-10", etc.
  rpeObjetivo?: number; // RPE objetivo para esta serie
  tipo?: 'top' | 'rest' | 'normal'; // Tipo de serie
}

export interface Progresion {
  ejercicio: string;
  historial: {
    fecha: string;
    peso: number;
    repeticiones: number;
    rpe?: number;
  }[];
  pesoActual: number;
  repeticionesObjetivo: number;
  proximoAjuste?: 'peso' | 'repeticiones' | 'mantener';
  microciclo: number;
  fase: string;
  intensidad: string;
  incrementoPeso?: number;
  ajusteRepeticiones?: number;
}

export interface CardioEntry {
  fecha: string;
  microciclo: number;
  sesionId: number;
  km: number;
  tiempo: number;
  ritmo: number;
  calorias: number;
  tipo: 'cinta' | 'pasos' | 'mesociclo';
  intensidad?: string; // Para pasos: 'ritmo rápido', 'andar normal', etc.
  inclinacion?: number; // Para cinta
  pasos?: number; // Para registro de pasos
}

export interface NeatEntry {
  fecha: string;
  tipo: 'pasos' | 'cinta';
  pasos?: number;
  ritmo?: string; // 'ritmo rápido', 'andar normal', 'caminar rápido', 'paseo'
  km?: number;
  ritmoKmH?: number;
  inclinacion?: number;
  calorias: number;
  duracion: number; // en minutos
}

export interface EntrenoNoProgramado {
  fecha: string;
  tipo: 'tenis' | 'natacion' | 'alpinismo' | 'ciclismo' | 'running' | 'futbol' | 'baloncesto' | 'escalada' | 'yoga' | 'pilates' | 'crossfit' | 'otro';
  duracion: number; // en minutos
  intensidad: 'baja' | 'moderada' | 'alta' | 'muy alta';
  calorias: number;
  esfuerzo: number; // RPE 1-10
  notas?: string;
  
  // Campos específicos por actividad
  tenis?: {
    sets: number;
    duracionSet: number;
    nivel: 'principiante' | 'intermedio' | 'avanzado';
  };
  
  natacion?: {
    metros: number;
    estilo: 'libre' | 'espalda' | 'braza' | 'mariposa' | 'combinado';
    ritmo: 'lento' | 'moderado' | 'rápido' | 'competitivo';
  };
  
  alpinismo?: {
    ruta: string;
    desnivel: number; // metros
    dificultad: 'facil' | 'moderada' | 'dificil' | 'muy dificil';
    condiciones: 'buenas' | 'regulares' | 'malas';
  };
  
  ciclismo?: {
    km: number;
    ritmoKmH: number;
    desnivel: number;
    tipo: 'carretera' | 'mtb' | 'urbano';
  };
  
  running?: {
    km: number;
    ritmoMinKm: number;
    tipo: 'carrera' | 'trail' | 'intervalos';
  };
  
  futbol?: {
    duracionPartido: number;
    posicion: 'portero' | 'defensa' | 'centrocampista' | 'delantero';
    intensidad: 'amistoso' | 'competitivo';
  };
  
  baloncesto?: {
    duracionPartido: number;
    posicion: 'base' | 'escolta' | 'ala' | 'ala-pivot' | 'pivot';
    intensidad: 'amistoso' | 'competitivo';
  };
  
  escalada?: {
    rutas: number;
    grado: string; // 5a, 6b, etc.
    tipo: 'boulder' | 'deportiva' | 'tradicional';
  };
  
  yoga?: {
    tipo: 'hatha' | 'vinyasa' | 'ashtanga' | 'yin' | 'restaurativo';
    nivel: 'principiante' | 'intermedio' | 'avanzado';
  };
  
  pilates?: {
    tipo: 'mat' | 'reformer' | 'cadillac';
    nivel: 'principiante' | 'intermedio' | 'avanzado';
  };
  
  crossfit?: {
    wod: string;
    tiempo: number;
    rx: boolean; // si se hizo como está programado
  };
  
  otro?: {
    actividad: string;
    detalles: string;
  };
}

export interface SeguimientoEntry {
  fecha: string;
  peso: number;
  cintura: number;
  porcentajeGraso?: number;
  notas?: string;
}

export interface DietEntry {
  fecha: string;
  calorias: number;
  proteinas: number;
  carbos: number;
  grasas: number;
  ayuno: boolean;
}

export interface DailyAdherence {
  [fecha: string]: {
    pesos?: boolean;
    cardio?: boolean;
    dieta?: boolean;
    workout?: boolean;
    neat?: boolean;
    seguimiento?: boolean;
    entrenoNoProgramado?: boolean;
  };
}

export interface WeeklyPlan {
  [dia: string]: {
    entrenamiento: string;
    ejercicios: string[];
    cardio?: {
      tipo: string;
      duracion: number;
      intensidad: string;
    };
    descanso?: boolean;
  };
}

export interface Mesociclo {
  semana: number;
  objetivo: string;
  volumen: string;
  intensidad: string;
  pesos: {
    [ejercicio: string]: number;
  };
  repeticionesObjetivo: {
    [ejercicio: string]: number;
  };
}