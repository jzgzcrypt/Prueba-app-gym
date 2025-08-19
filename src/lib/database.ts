import { neon } from '@neondatabase/serverless';

// Verificar que estamos en el servidor y que existe DATABASE_URL
const getDatabaseConnection = () => {
  if (typeof window !== 'undefined') {
    // Estamos en el cliente, no podemos conectar directamente
    throw new Error('La conexión a la base de datos solo está disponible en el servidor');
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('⚠️ DATABASE_URL no está configurada');
    console.error('Por favor, configura la variable de entorno DATABASE_URL en .env.local');
    console.error('Ejemplo: DATABASE_URL=postgresql://usuario:contraseña@host/database?sslmode=require');
    
    // Retornar una función mock para evitar errores en desarrollo
    return (strings: TemplateStringsArray, ...values: any[]) => {
      console.warn('Base de datos no configurada - retornando datos vacíos');
      return Promise.resolve([]);
    };
  }
  
  try {
    return neon(process.env.DATABASE_URL);
  } catch (error) {
    console.error('Error al conectar con Neon:', error);
    // Retornar función mock en caso de error
    return (strings: TemplateStringsArray, ...values: any[]) => {
      console.warn('Error de conexión - retornando datos vacíos');
      return Promise.resolve([]);
    };
  }
};

// Conexión a la base de datos Neon
const sql = getDatabaseConnection();

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
    try {
      const result = await sql`SELECT * FROM weights WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseWeight[];
    } catch (error) {
      console.error('Error al obtener pesos:', error);
      return [];
    }
  },

  async addWeight(userId: number, fecha: string, peso: number, cintura?: number): Promise<void> {
    try {
      await sql`
        INSERT INTO weights (user_id, fecha, peso, cintura) 
        VALUES (${userId}, ${fecha}, ${peso}, ${cintura})
        ON CONFLICT (user_id, fecha) 
        DO UPDATE SET peso = ${peso}, cintura = ${cintura}
      `;
    } catch (error) {
      console.error('Error al agregar peso:', error);
      throw error;
    }
  },

  // Entrenamientos
  async getWorkouts(userId: number = 1): Promise<DatabaseWorkout[]> {
    try {
      const result = await sql`SELECT * FROM workouts WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseWorkout[];
    } catch (error) {
      console.error('Error al obtener entrenamientos:', error);
      return [];
    }
  },

  async addWorkout(userId: number, fecha: string, entrenamiento: string, ejercicios: Record<string, unknown>): Promise<void> {
    try {
      await sql`
        INSERT INTO workouts (user_id, fecha, entrenamiento, ejercicios) 
        VALUES (${userId}, ${fecha}, ${entrenamiento}, ${ejercicios})
      `;
    } catch (error) {
      console.error('Error al agregar entrenamiento:', error);
      throw error;
    }
  },

  // Cardio
  async getCardio(userId: number = 1): Promise<DatabaseCardio[]> {
    try {
      const result = await sql`SELECT * FROM cardio WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseCardio[];
    } catch (error) {
      console.error('Error al obtener cardio:', error);
      return [];
    }
  },

  async addCardio(userId: number, fecha: string, tipo: string, duracion: number, intensidad: string, calorias: number): Promise<void> {
    try {
      await sql`
        INSERT INTO cardio (user_id, fecha, tipo, duracion, intensidad, calorias) 
        VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${intensidad}, ${calorias})
      `;
    } catch (error) {
      console.error('Error al agregar cardio:', error);
      throw error;
    }
  },

  // NEAT
  async getNeat(userId: number = 1): Promise<DatabaseNeat[]> {
    try {
      const result = await sql`SELECT * FROM neat WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseNeat[];
    } catch (error) {
      console.error('Error al obtener NEAT:', error);
      return [];
    }
  },

  async addNeat(userId: number, fecha: string, tipo: string, duracion: number, calorias: number, 
                pasos?: number, ritmo?: string, km?: number, ritmoKmH?: number, inclinacion?: number): Promise<void> {
    try {
      await sql`
        INSERT INTO neat (user_id, fecha, tipo, duracion, calorias, pasos, ritmo, km, ritmo_km_h, inclinacion) 
        VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${calorias}, ${pasos}, ${ritmo}, ${km}, ${ritmoKmH}, ${inclinacion})
      `;
    } catch (error) {
      console.error('Error al agregar NEAT:', error);
      throw error;
    }
  },

  // Seguimiento
  async getSeguimiento(userId: number = 1): Promise<DatabaseSeguimiento[]> {
    try {
      const result = await sql`SELECT * FROM seguimiento WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseSeguimiento[];
    } catch (error) {
      console.error('Error al obtener seguimiento:', error);
      return [];
    }
  },

  async addSeguimiento(userId: number, fecha: string, peso: number, cintura: number, porcentajeGraso?: number, notas?: string): Promise<void> {
    try {
      await sql`
        INSERT INTO seguimiento (user_id, fecha, peso, cintura, porcentaje_graso, notas) 
        VALUES (${userId}, ${fecha}, ${peso}, ${cintura}, ${porcentajeGraso}, ${notas})
        ON CONFLICT (user_id, fecha) 
        DO UPDATE SET peso = ${peso}, cintura = ${cintura}, porcentaje_graso = ${porcentajeGraso}, notas = ${notas}
      `;
    } catch (error) {
      console.error('Error al agregar seguimiento:', error);
      throw error;
    }
  },

  // Entrenos no programados
  async getEntrenosNoProgramados(userId: number = 1): Promise<DatabaseEntrenoNoProgramado[]> {
    try {
      const result = await sql`SELECT * FROM entrenos_no_programados WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseEntrenoNoProgramado[];
    } catch (error) {
      console.error('Error al obtener entrenos no programados:', error);
      return [];
    }
  },

  async addEntrenoNoProgramado(userId: number, fecha: string, tipo: string, duracion: number, 
                               intensidad: string, calorias: number, esfuerzo: number, 
                               notas?: string, datosEspecificos?: Record<string, unknown>): Promise<void> {
    try {
      await sql`
        INSERT INTO entrenos_no_programados (user_id, fecha, tipo, duracion, intensidad, calorias, esfuerzo, notas, datos_especificos) 
        VALUES (${userId}, ${fecha}, ${tipo}, ${duracion}, ${intensidad}, ${calorias}, ${esfuerzo}, ${notas}, ${datosEspecificos})
      `;
    } catch (error) {
      console.error('Error al agregar entreno no programado:', error);
      throw error;
    }
  },

  // Adherencia diaria
  async getAdherenciaDiaria(userId: number = 1): Promise<DatabaseAdherenciaDiaria[]> {
    try {
      const result = await sql`SELECT * FROM adherencia_diaria WHERE user_id = ${userId} ORDER BY fecha DESC`;
      return result as DatabaseAdherenciaDiaria[];
    } catch (error) {
      console.error('Error al obtener adherencia diaria:', error);
      return [];
    }
  },

  async updateAdherenciaDiaria(userId: number, fecha: string, updates: {
    workout?: boolean;
    cardio?: boolean;
    neat?: boolean;
    seguimiento?: boolean;
    entreno_no_programado?: boolean;
  }): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error al actualizar adherencia diaria:', error);
      throw error;
    }
  },

  // Insights
  async getInsights(userId: number = 1, limit: number = 50): Promise<DatabaseInsight[]> {
    try {
      const result = await sql`SELECT * FROM insights WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}`;
      return result as DatabaseInsight[];
    } catch (error) {
      console.error('Error al obtener insights:', error);
      return [];
    }
  },

  async addInsight(userId: number, fecha: string, tipo: string, titulo: string, 
                   descripcion: string, accion?: string, prioridad: string = 'media', 
                   categoria: string = 'general'): Promise<void> {
    try {
      await sql`
        INSERT INTO insights (user_id, fecha, tipo, titulo, descripcion, accion, prioridad, categoria) 
        VALUES (${userId}, ${fecha}, ${tipo}, ${titulo}, ${descripcion}, ${accion}, ${prioridad}, ${categoria})
      `;
    } catch (error) {
      console.error('Error al agregar insight:', error);
      throw error;
    }
  },

  async markInsightAsRead(insightId: number): Promise<void> {
    try {
      await sql`UPDATE insights SET leido = true WHERE id = ${insightId}`;
    } catch (error) {
      console.error('Error al marcar insight como leído:', error);
      throw error;
    }
  },

  // Configuración del mesociclo
  async getMesocicloConfig(userId: number = 1): Promise<{ fecha_inicio: string } | null> {
    try {
      const result = await sql`SELECT fecha_inicio FROM mesociclo_config WHERE user_id = ${userId}`;
      return (result as { fecha_inicio: string }[])[0] || null;
    } catch (error) {
      console.error('Error al obtener configuración del mesociclo:', error);
      return null;
    }
  },

  async setMesocicloConfig(userId: number, fechaInicio: string): Promise<void> {
    try {
      await sql`
        INSERT INTO mesociclo_config (user_id, fecha_inicio) 
        VALUES (${userId}, ${fechaInicio})
        ON CONFLICT (user_id) 
        DO UPDATE SET fecha_inicio = ${fechaInicio}
      `;
    } catch (error) {
      console.error('Error al configurar mesociclo:', error);
      throw error;
    }
  }
};