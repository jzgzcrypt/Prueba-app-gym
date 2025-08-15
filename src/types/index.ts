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
}

export interface Set {
  peso: number;
  repeticiones: number;
  completado: boolean;
  rpe?: number; // Rate of Perceived Exertion (1-10)
}

export interface CardioEntry {
  fecha: string;
  microciclo: number;
  sesionId: number;
  km: number;
  tiempo: number;
  ritmo: number;
  calorias: number;
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
}