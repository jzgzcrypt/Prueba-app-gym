const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function createTables() {
  try {
    console.log('🗄️ Creando tablas...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Crear tabla users
    console.log('📝 Creando tabla users...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Crear tabla weights
    console.log('📝 Creando tabla weights...');
    await sql`
      CREATE TABLE IF NOT EXISTS weights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        peso DECIMAL(5,2) NOT NULL,
        cintura DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, fecha)
      )
    `;
    
    // Crear tabla workouts
    console.log('📝 Creando tabla workouts...');
    await sql`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        entrenamiento VARCHAR(255) NOT NULL,
        ejercicios JSONB NOT NULL,
        completado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Crear tabla cardio
    console.log('📝 Creando tabla cardio...');
    await sql`
      CREATE TABLE IF NOT EXISTS cardio (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        duracion INTEGER NOT NULL,
        intensidad VARCHAR(50) NOT NULL,
        calorias INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Crear tabla neat
    console.log('📝 Creando tabla neat...');
    await sql`
      CREATE TABLE IF NOT EXISTS neat (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        pasos INTEGER,
        ritmo VARCHAR(50),
        km DECIMAL(5,2),
        ritmo_km_h DECIMAL(4,2),
        inclinacion INTEGER,
        duracion INTEGER NOT NULL,
        calorias INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Crear tabla seguimiento
    console.log('📝 Creando tabla seguimiento...');
    await sql`
      CREATE TABLE IF NOT EXISTS seguimiento (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        peso DECIMAL(5,2) NOT NULL,
        cintura DECIMAL(5,2) NOT NULL,
        porcentaje_graso DECIMAL(4,2),
        notas TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, fecha)
      )
    `;
    
    // Crear tabla entrenos_no_programados
    console.log('📝 Creando tabla entrenos_no_programados...');
    await sql`
      CREATE TABLE IF NOT EXISTS entrenos_no_programados (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        duracion INTEGER NOT NULL,
        intensidad VARCHAR(50) NOT NULL,
        calorias INTEGER NOT NULL,
        esfuerzo INTEGER NOT NULL,
        notas TEXT,
        datos_especificos JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Crear tabla adherencia_diaria
    console.log('📝 Creando tabla adherencia_diaria...');
    await sql`
      CREATE TABLE IF NOT EXISTS adherencia_diaria (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        workout BOOLEAN DEFAULT false,
        cardio BOOLEAN DEFAULT false,
        neat BOOLEAN DEFAULT false,
        seguimiento BOOLEAN DEFAULT false,
        entreno_no_programado BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, fecha)
      )
    `;
    
    // Crear tabla mesociclo_config
    console.log('📝 Creando tabla mesociclo_config...');
    await sql`
      CREATE TABLE IF NOT EXISTS mesociclo_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha_inicio DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `;
    
    // Crear tabla insights
    console.log('📝 Creando tabla insights...');
    await sql`
      CREATE TABLE IF NOT EXISTS insights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) DEFAULT 1,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        accion TEXT,
        prioridad VARCHAR(20) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        leido BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Insertar usuario por defecto
    console.log('👤 Insertando usuario por defecto...');
    await sql`
      INSERT INTO users (id, email, name) 
      VALUES (1, 'default@user.com', 'Usuario Principal') 
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log('✅ Todas las tablas creadas correctamente!');
    
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
  }
}

createTables();