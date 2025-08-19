require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testDatabaseOperations() {
  console.log('🧪 Probando operaciones de base de datos...\n');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // 1. Probar inserción de peso
    console.log('📝 Insertando peso de prueba...');
    const fecha = new Date().toISOString().split('T')[0];
    await sql`
      INSERT INTO weights (user_id, fecha, peso, cintura) 
      VALUES (1, ${fecha}, 75.5, 85.0)
      ON CONFLICT (user_id, fecha) 
      DO UPDATE SET peso = 75.5, cintura = 85.0
    `;
    console.log('✅ Peso insertado correctamente');
    
    // 2. Leer pesos
    console.log('\n📊 Leyendo pesos...');
    const weights = await sql`
      SELECT * FROM weights 
      WHERE user_id = 1 
      ORDER BY fecha DESC 
      LIMIT 5
    `;
    console.log(`✅ Encontrados ${weights.length} registros de peso`);
    if (weights.length > 0) {
      console.log('   Último peso:', weights[0].peso, 'kg');
    }
    
    // 3. Probar inserción de cardio
    console.log('\n🏃 Insertando cardio de prueba...');
    await sql`
      INSERT INTO cardio (user_id, fecha, tipo, duracion, intensidad, calorias) 
      VALUES (1, ${fecha}, 'Trote', 30, 'Moderada', 250)
    `;
    console.log('✅ Cardio insertado correctamente');
    
    // 4. Leer cardio
    console.log('\n📊 Leyendo sesiones de cardio...');
    const cardioSessions = await sql`
      SELECT * FROM cardio 
      WHERE user_id = 1 
      ORDER BY fecha DESC 
      LIMIT 5
    `;
    console.log(`✅ Encontradas ${cardioSessions.length} sesiones de cardio`);
    
    // 5. Probar adherencia diaria
    console.log('\n📅 Actualizando adherencia diaria...');
    await sql`
      INSERT INTO adherencia_diaria (user_id, fecha, workout, cardio, neat, seguimiento, entreno_no_programado) 
      VALUES (1, ${fecha}, true, true, false, false, false)
      ON CONFLICT (user_id, fecha) 
      DO UPDATE SET 
        workout = true,
        cardio = true
    `;
    console.log('✅ Adherencia actualizada correctamente');
    
    // 6. Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📈 RESUMEN DE LA BASE DE DATOS:');
    console.log('='.repeat(50));
    
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM weights WHERE user_id = 1) as total_pesos,
        (SELECT COUNT(*) FROM cardio WHERE user_id = 1) as total_cardio,
        (SELECT COUNT(*) FROM workouts WHERE user_id = 1) as total_workouts,
        (SELECT COUNT(*) FROM neat WHERE user_id = 1) as total_neat,
        (SELECT COUNT(*) FROM adherencia_diaria WHERE user_id = 1) as dias_registrados
    `;
    
    console.log('📊 Estadísticas:');
    console.log(`  - Registros de peso: ${stats[0].total_pesos}`);
    console.log(`  - Sesiones de cardio: ${stats[0].total_cardio}`);
    console.log(`  - Entrenamientos: ${stats[0].total_workouts}`);
    console.log(`  - Registros NEAT: ${stats[0].total_neat}`);
    console.log(`  - Días con adherencia: ${stats[0].dias_registrados}`);
    
    console.log('\n✅ ¡Todas las operaciones de base de datos funcionan correctamente!');
    console.log('🎉 La conexión con Neon está completamente operativa.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  }
}

testDatabaseOperations();