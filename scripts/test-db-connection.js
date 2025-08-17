const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Probando conexión a la base de datos...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Probar una consulta simple
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Conexión exitosa!');
    console.log('🕐 Hora del servidor:', result[0].current_time);
    console.log('📊 Versión de PostgreSQL:', result[0].pg_version);
    
    // Verificar las tablas
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('\n📋 Tablas encontradas:');
    tables.forEach(table => {
      console.log('   -', table.tablename);
    });
    
    // Verificar el usuario por defecto
    const users = await sql`SELECT * FROM users WHERE id = 1`;
    if (users.length > 0) {
      console.log('\n👤 Usuario por defecto encontrado:', users[0].name);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
  }
}

testConnection();