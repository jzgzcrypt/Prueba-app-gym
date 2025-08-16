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
}

export interface Set {
  peso: number;
  repeticiones: number;
  completado: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
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