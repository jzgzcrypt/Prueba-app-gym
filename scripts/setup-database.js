const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  try {
    console.log('🗄️ Configurando base de datos...');
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Leer el archivo de esquema
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📖 Ejecutando esquema SQL...');
    
    // Dividir el esquema en comandos individuales
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await sql.unsafe(command);
          console.log('✅ Comando ejecutado:', command.substring(0, 50) + '...');
        } catch (error) {
          console.log('⚠️ Comando ya existe o error:', error.message);
        }
      }
    }
    
    console.log('✅ Esquema de base de datos configurado correctamente!');
    
    // Verificar tablas creadas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📊 Tablas disponibles:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
  }
}

setupDatabase();