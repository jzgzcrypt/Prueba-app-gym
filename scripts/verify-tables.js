const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function verifyTables() {
  try {
    console.log('🔍 Verificando tablas de la base de datos...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Obtener todas las tablas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tablas encontradas:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`);
    });
    
    // Verificar tablas específicas que necesitamos
    const requiredTables = [
      'users',
      'weights', 
      'workouts',
      'cardio',
      'neat',
      'seguimiento',
      'entrenos_no_programados',
      'adherencia_diaria',
      'mesociclo_config',
      'insights'
    ];
    
    console.log('\n🔍 Verificando tablas requeridas:');
    const foundTables = tables.map(t => t.table_name);
    
    for (const requiredTable of requiredTables) {
      if (foundTables.includes(requiredTable)) {
        console.log(`  ✅ ${requiredTable}`);
      } else {
        console.log(`  ❌ ${requiredTable} - FALTANTE`);
      }
    }
    
    // Probar inserción de datos de prueba
    console.log('\n🧪 Probando inserción de datos...');
    
    try {
      // Insertar usuario de prueba
      await sql`INSERT INTO users (id, email, name) VALUES (1, 'test@user.com', 'Usuario Test') ON CONFLICT (id) DO NOTHING`;
      console.log('  ✅ Usuario de prueba creado');
      
      // Insertar peso de prueba
      await sql`INSERT INTO weights (user_id, fecha, peso, cintura) VALUES (1, '2024-08-16', 75.5, 85.0) ON CONFLICT (user_id, fecha) DO NOTHING`;
      console.log('  ✅ Peso de prueba creado');
      
      // Verificar datos insertados
      const weights = await sql`SELECT * FROM weights WHERE user_id = 1`;
      console.log(`  📊 Pesos en base de datos: ${weights.length}`);
      
    } catch (error) {
      console.log('  ⚠️ Error en prueba de datos:', error.message);
    }
    
    console.log('\n✅ Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
  }
}

verifyTables();