const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('🔍 Probando conexión con Neon PostgreSQL...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada');
      console.log('📝 Configura la variable DATABASE_URL en .env.local');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Probar conexión simple
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Conexión exitosa!');
    console.log('🕐 Hora del servidor:', result[0].current_time);
    
    // Verificar si las tablas existen
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Verifica:');
    console.log('  1. DATABASE_URL está configurada correctamente');
    console.log('  2. El esquema SQL se ha ejecutado');
    console.log('  3. La base de datos está activa');
  }
}

testConnection();