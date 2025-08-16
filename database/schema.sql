-- Esquema de base de datos para aplicación de entrenamiento
-- Ejecutar en Neon SQL Editor

-- Tabla de usuarios (para futuras expansiones)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pesos corporales
CREATE TABLE IF NOT EXISTS weights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha DATE NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    cintura DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fecha)
);

-- Tabla de entrenamientos
CREATE TABLE IF NOT EXISTS workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha DATE NOT NULL,
    entrenamiento VARCHAR(255) NOT NULL,
    ejercicios JSONB NOT NULL,
    completado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cardio
CREATE TABLE IF NOT EXISTS cardio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha DATE NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    duracion INTEGER NOT NULL,
    intensidad VARCHAR(50) NOT NULL,
    calorias INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de NEAT (Non-Exercise Activity Thermogenesis)
CREATE TABLE IF NOT EXISTS neat (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'pasos' o 'cinta'
    pasos INTEGER,
    ritmo VARCHAR(50),
    km DECIMAL(5,2),
    ritmo_km_h DECIMAL(4,2),
    inclinacion INTEGER,
    duracion INTEGER NOT NULL,
    calorias INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de seguimiento semanal
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
);

-- Tabla de entrenos no programados
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
);

-- Tabla de adherencia diaria
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
);

-- Tabla de configuración del mesociclo
CREATE TABLE IF NOT EXISTS mesociclo_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha_inicio DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabla de insights y alertas
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) DEFAULT 1,
    fecha DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'insight', 'alerta', 'notificacion'
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    accion TEXT,
    prioridad VARCHAR(20) NOT NULL, -- 'alta', 'media', 'baja'
    categoria VARCHAR(50) NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_weights_user_fecha ON weights(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_workouts_user_fecha ON workouts(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_cardio_user_fecha ON cardio(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_neat_user_fecha ON neat(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_seguimiento_user_fecha ON seguimiento(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_entrenos_no_programados_user_fecha ON entrenos_no_programados(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_adherencia_diaria_user_fecha ON adherencia_diaria(user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_insights_user_fecha ON insights(user_id, fecha);

-- Insertar usuario por defecto
INSERT INTO users (id, email, name) VALUES (1, 'default@user.com', 'Usuario Principal') ON CONFLICT (id) DO NOTHING;