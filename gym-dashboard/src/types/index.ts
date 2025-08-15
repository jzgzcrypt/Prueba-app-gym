export interface WeightEntry {
  fecha: string;
  peso: number;
  cintura: number | null;
}

export interface WorkoutEntry {
  dia: string;
  ejercicio: string;
  microciclo: number | string;
  tipo: string;
  setIndex: number;
  peso: number;
  reps: number;
  rango: string;
  fecha: string;
}

export interface CardioEntry {
  fecha: string;
  microciclo: number | string;
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
  [date: string]: {
    pesos?: boolean;
    cardio?: boolean;
    dieta?: boolean;
    ayuno?: boolean;
    pesaje?: boolean;
  };
}

export interface WeeklyPlan {
  dia: string;
  tareas: string[];
}

export interface Mesociclo {
  [key: string]: Array<{
    ejercicio: string;
    sets: Array<{
      tipo: string;
      peso: number;
      reps: string;
      count?: number;
    }>;
    microciclo: Array<number | string>;
  }>;
}