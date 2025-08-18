import { Pool } from 'pg';

// Configuración de la conexión a Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para inicializar las tablas
export async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Crear tabla de pesos
    await client.query(`
      CREATE TABLE IF NOT EXISTS weights (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        peso DECIMAL(5,2) NOT NULL,
        cintura DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de cardio
    await client.query(`
      CREATE TABLE IF NOT EXISTS cardio (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        km DECIMAL(5,2) NOT NULL,
        tiempo INTEGER NOT NULL,
        ritmo DECIMAL(5,2) NOT NULL,
        calorias INTEGER NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de dieta
    await client.query(`
      CREATE TABLE IF NOT EXISTS diet (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        calorias INTEGER NOT NULL,
        proteinas INTEGER NOT NULL,
        carbos INTEGER NOT NULL,
        grasas INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de NEAT
    await client.query(`
      CREATE TABLE IF NOT EXISTS neat (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        tipo VARCHAR(20) NOT NULL,
        pasos INTEGER,
        km DECIMAL(5,2),
        duracion INTEGER,
        calorias INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de entrenos no programados
    await client.query(`
      CREATE TABLE IF NOT EXISTS entrenos_no_programados (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        duracion INTEGER NOT NULL,
        intensidad VARCHAR(20) NOT NULL,
        calorias INTEGER NOT NULL,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de seguimiento
    await client.query(`
      CREATE TABLE IF NOT EXISTS seguimiento (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        peso DECIMAL(5,2),
        cintura DECIMAL(5,2),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de workouts
    await client.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        ejercicios JSONB NOT NULL,
        completado BOOLEAN DEFAULT false,
        duracion INTEGER,
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear tabla de adherencia diaria
    await client.query(`
      CREATE TABLE IF NOT EXISTS adherencia_diaria (
        id SERIAL PRIMARY KEY,
        fecha DATE UNIQUE NOT NULL,
        pesos BOOLEAN DEFAULT false,
        cardio BOOLEAN DEFAULT false,
        dieta BOOLEAN DEFAULT false,
        neat BOOLEAN DEFAULT false,
        entreno_no_programado BOOLEAN DEFAULT false,
        workout BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    client.release();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    throw error;
  }
}

export { pool };