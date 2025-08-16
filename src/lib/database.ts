import { neon } from '@neondatabase/serverless';

// Conexión a la base de datos Neon
const sql = neon(process.env.DATABASE_URL!);

export { sql };

// Tipos para la base de datos
export interface DatabaseWeight {
  id: number;
  user_id: number;
  fecha: string;
  peso: number;
  cintura: number | null;
  created_at: string;
}

export interface DatabaseWorkout {
  id: number;
  user_id: number;
  fecha: string;
  entrenamiento: string;
  ejercicios: Record<string, unknown>; // JSONB
  completado: boolean;
  created_at: string;
}

export interface DatabaseCardio {
  id: number;
  user_id: number;
  fecha: string;
  tipo: string;
  duracion: number;
  intensidad: string;
  calorias: number;
  created_at: string;
}

export interface DatabaseNeat {
  id: number;
  user_id: number;
  fecha: string;
  tipo: string;
  pasos: number | null;
  ritmo: string | null;
  km: number | null;
  ritmo_km_h: number | null;
  inclinacion: number | null;
  duracion: number;
  calorias: number;
  created_at: string;
}

export interface DatabaseSeguimiento {
  id: number;
  user_id: number;
  fecha: string;
  peso: number;
  cintura: number;
  porcentaje_graso: number | null;
  notas: string | null;
  created_at: string;
}

export interface DatabaseEntrenoNoProgramado {
  id: number;
  user_id: number;
  fecha: string;
  tipo: string;
  duracion: number;
  intensidad: string;
  calorias: number;
  esfuerzo: number;
  notas: string | null;
  datos_especificos: Record<string, unknown>; // JSONB
  created_at: string;
}

export interface DatabaseAdherenciaDiaria {
  id: number;
  user_id: number;
  fecha: string;
  workout: boolean;
  cardio: boolean;
  neat: boolean;
  seguimiento: boolean;
  entreno_no_programado: boolean;
  created_at: string;
}

export interface DatabaseInsight {
  id: number;
  user_id: number;
  fecha: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  accion: string | null;
  prioridad: string;
  categoria: string;
  leido: boolean;
  created_at: string;
}

// Funciones de utilidad para la base de datos
export const db = {
  // Pesos
  async getWeights(userId: number = 1): Promise<DatabaseWeight[]> {
    const result = await sql`SELECT * FROM weights WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseWeight[];
  },

  async addWeight(userId: number, fecha: string, peso: number, cintura?: number): Promise<void> {
    await sql`
      INSERT INTO weights (user_id, fecha, peso, cintura) 
      VALUES (${userId}, ${fecha}, ${peso}, ${cintura})
      ON CONFLICT (user_id, fecha) 
      DO UPDATE SET peso = ${peso}, cintura = ${cintura}
    `;
  },

  // Entrenamientos
  async getWorkouts(userId: number = 1): Promise<DatabaseWorkout[]> {
    const result = await sql`SELECT * FROM workouts WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseWorkout[];
  },

  async addWorkout(userId: number, fecha: string, entrenamiento: string, ejercicios: Record<string, unknown>): Promise<void> {
    await sql`
      INSERT INTO workouts (user_id, fecha, entrenamiento, ejercicios) 
      VALUES (${userId}, ${fecha}, ${entrenamiento}, ${ejercicios})
    `;
  },

  // Cardio
  async getCardio(userId: number = 1): Promise<DatabaseCardio[]> {
    const result = await sql`SELECT * FROM cardio WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseCardio[];
  },

  async addCardio(userId: number, fecha: string, tipo: string, duracion: number, intensidad: string, calorias: number): Promise<void> {
    await sql`
      INSERT INTO cardio (user_id, fecha, tipo, duracion, intensidad, calorias) 
      VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${intensidad}, ${calorias})
    `;
  },

  // NEAT
  async getNeat(userId: number = 1): Promise<DatabaseNeat[]> {
    const result = await sql`SELECT * FROM neat WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseNeat[];
  },

  async addNeat(userId: number, fecha: string, tipo: string, duracion: number, calorias: number, 
                pasos?: number, ritmo?: string, km?: number, ritmoKmH?: number, inclinacion?: number): Promise<void> {
    await sql`
      INSERT INTO neat (user_id, fecha, tipo, duracion, calorias, pasos, ritmo, km, ritmo_km_h, inclinacion) 
      VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${calorias}, ${pasos}, ${ritmo}, ${km}, ${ritmoKmH}, ${inclinacion})
    `;
  },

  // Seguimiento
  async getSeguimiento(userId: number = 1): Promise<DatabaseSeguimiento[]> {
    const result = await sql`SELECT * FROM seguimiento WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseSeguimiento[];
  },

  async addSeguimiento(userId: number, fecha: string, peso: number, cintura: number, porcentajeGraso?: number, notas?: string): Promise<void> {
    await sql`
      INSERT INTO seguimiento (user_id, fecha, peso, cintura, porcentaje_graso, notas) 
      VALUES (${userId}, ${fecha}, ${peso}, ${cintura}, ${porcentajeGraso}, ${notas})
      ON CONFLICT (user_id, fecha) 
      DO UPDATE SET peso = ${peso}, cintura = ${cintura}, porcentaje_graso = ${porcentajeGraso}, notas = ${notas}
    `;
  },

  // Entrenos no programados
  async getEntrenosNoProgramados(userId: number = 1): Promise<DatabaseEntrenoNoProgramado[]> {
    const result = await sql`SELECT * FROM entrenos_no_programados WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseEntrenoNoProgramado[];
  },

  async addEntrenoNoProgramado(userId: number, fecha: string, tipo: string, duracion: number, 
                               intensidad: string, calorias: number, esfuerzo: number, 
                               notas?: string, datosEspecificos?: Record<string, unknown>): Promise<void> {
    await sql`
      INSERT INTO entrenos_no_programados (user_id, fecha, tipo, duracion, intensidad, calorias, esfuerzo, notas, datos_especificos) 
      VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${intensidad}, ${calorias}, ${esfuerzo}, ${notas}, ${datosEspecificos})
    `;
  },

  // Adherencia diaria
  async getAdherenciaDiaria(userId: number = 1): Promise<DatabaseAdherenciaDiaria[]> {
    const result = await sql`SELECT * FROM adherencia_diaria WHERE user_id = ${userId} ORDER BY fecha DESC`;
    return result as DatabaseAdherenciaDiaria[];
  },

  async updateAdherenciaDiaria(userId: number, fecha: string, updates: {
    workout?: boolean;
    cardio?: boolean;
    neat?: boolean;
    seguimiento?: boolean;
    entreno_no_programado?: boolean;
  }): Promise<void> {
    const { workout, cardio, neat, seguimiento, entreno_no_programado } = updates;
    
    await sql`
      INSERT INTO adherencia_diaria (user_id, fecha, workout, cardio, neat, seguimiento, entreno_no_programado) 
      VALUES (${userId}, ${fecha}, ${workout}, ${cardio}, ${neat}, ${seguimiento}, ${entreno_no_programado})
      ON CONFLICT (user_id, fecha) 
      DO UPDATE SET 
        workout = COALESCE(${workout}, adherencia_diaria.workout),
        cardio = COALESCE(${cardio}, adherencia_diaria.cardio),
        neat = COALESCE(${neat}, adherencia_diaria.neat),
        seguimiento = COALESCE(${seguimiento}, adherencia_diaria.seguimiento),
        entreno_no_programado = COALESCE(${entreno_no_programado}, adherencia_diaria.entreno_no_programado)
    `;
  },

  // Insights
  async getInsights(userId: number = 1, limit: number = 50): Promise<DatabaseInsight[]> {
    const result = await sql`SELECT * FROM insights WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`;
    return result as DatabaseInsight[];
  },

  async addInsight(userId: number, fecha: string, tipo: string, titulo: string, 
                   descripcion: string, accion?: string, prioridad: string = 'media', 
                   categoria: string = 'general'): Promise<void> {
    await sql`
      INSERT INTO insights (user_id, fecha, tipo, titulo, descripcion, accion, prioridad, categoria) 
      VALUES (${userId}, ${fecha}, ${tipo}, ${titulo}, ${descripcion}, ${accion}, ${prioridad}, ${categoria})
    `;
  },

  async markInsightAsRead(insightId: number): Promise<void> {
    await sql`UPDATE insights SET leido = true WHERE id = ${insightId}`;
  },

  // Configuración del mesociclo
  async getMesocicloConfig(userId: number = 1): Promise<{ fecha_inicio: string } | null> {
    const result = await sql`SELECT fecha_inicio FROM mesociclo_config WHERE user_id = ${userId}`;
    return (result as { fecha_inicio: string }[])[0] || null;
  },

  async setMesocicloConfig(userId: number, fechaInicio: string): Promise<void> {
    await sql`
      INSERT INTO mesociclo_config (user_id, fecha_inicio) 
      VALUES (${userId}, ${fechaInicio})
      ON CONFLICT (user_id) 
      DO UPDATE SET fecha_inicio = ${fechaInicio}
    `;
  }
};