import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

interface SyncRequest {
  action: 'save' | 'load' | 'sync';
  data?: Record<string, unknown> | Record<string, unknown>[];
  table: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, data, table }: SyncRequest = await request.json();
    
    switch (action) {
      case 'save':
        if (!data || Array.isArray(data)) {
          return NextResponse.json({ error: 'Datos requeridos para guardar' }, { status: 400 });
        }
        return await saveData(table, data);
      case 'load':
        return await loadData(table);
      case 'sync':
        if (!data || !Array.isArray(data)) {
          return NextResponse.json({ error: 'Datos requeridos para sincronizar' }, { status: 400 });
        }
        return await syncData(table, data);
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en sync API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

async function saveData(table: string, data: Record<string, unknown>) {
  const client = await pool.connect();
  
  try {
    switch (table) {
      case 'weights':
        await client.query(
          'INSERT INTO weights (fecha, peso, cintura) VALUES ($1, $2, $3) ON CONFLICT (fecha) DO UPDATE SET peso = $2, cintura = $3, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.peso, data.cintura]
        );
        break;
        
      case 'cardio':
        await client.query(
          'INSERT INTO cardio (fecha, km, tiempo, ritmo, calorias, tipo) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (fecha) DO UPDATE SET km = $2, tiempo = $3, ritmo = $4, calorias = $5, tipo = $6, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.km, data.tiempo, data.ritmo, data.calorias, data.tipo]
        );
        break;
        
      case 'diet':
        await client.query(
          'INSERT INTO diet (fecha, calorias, proteinas, carbos, grasas) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (fecha) DO UPDATE SET calorias = $2, proteinas = $3, carbos = $4, grasas = $5, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.calorias, data.proteinas, data.carbos, data.grasas]
        );
        break;
        
      case 'neat':
        await client.query(
          'INSERT INTO neat (fecha, tipo, pasos, km, duracion, calorias) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (fecha) DO UPDATE SET tipo = $2, pasos = $3, km = $4, duracion = $5, calorias = $6, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.tipo, data.pasos, data.km, data.duracion, data.calorias]
        );
        break;
        
      case 'entrenos_no_programados':
        await client.query(
          'INSERT INTO entrenos_no_programados (fecha, tipo, duracion, intensidad, calorias, notas) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (fecha) DO UPDATE SET tipo = $2, duracion = $3, intensidad = $4, calorias = $5, notas = $6, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.tipo, data.duracion, data.intensidad, data.calorias, data.notas]
        );
        break;
        
      case 'adherencia_diaria':
        await client.query(
          'INSERT INTO adherencia_diaria (fecha, pesos, cardio, dieta, neat, entreno_no_programado, workout) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (fecha) DO UPDATE SET pesos = $2, cardio = $3, dieta = $4, neat = $5, entreno_no_programado = $6, workout = $7, updated_at = CURRENT_TIMESTAMP',
          [data.fecha, data.pesos, data.cardio, data.dieta, data.neat, data.entrenoNoProgramado, data.workout]
        );
        break;
        
      default:
        throw new Error(`Tabla no válida: ${table}`);
    }
    
    return NextResponse.json({ success: true, message: 'Datos guardados correctamente' });
  } finally {
    client.release();
  }
}

async function loadData(table: string) {
  const client = await pool.connect();
  
  try {
    let result;
    
    switch (table) {
      case 'weights':
        result = await client.query('SELECT * FROM weights ORDER BY fecha DESC');
        break;
        
      case 'cardio':
        result = await client.query('SELECT * FROM cardio ORDER BY fecha DESC');
        break;
        
      case 'diet':
        result = await client.query('SELECT * FROM diet ORDER BY fecha DESC');
        break;
        
      case 'neat':
        result = await client.query('SELECT * FROM neat ORDER BY fecha DESC');
        break;
        
      case 'entrenos_no_programados':
        result = await client.query('SELECT * FROM entrenos_no_programados ORDER BY fecha DESC');
        break;
        
      case 'adherencia_diaria':
        result = await client.query('SELECT * FROM adherencia_diaria ORDER BY fecha DESC');
        break;
        
      default:
        throw new Error(`Tabla no válida: ${table}`);
    }
    
    return NextResponse.json({ success: true, data: result.rows });
  } finally {
    client.release();
  }
}

async function syncData(table: string, localData: Record<string, unknown>[]) {
  const client = await pool.connect();
  
  try {
    // Obtener datos de la base de datos
    const dbResult = await loadData(table);
    const dbData = await dbResult.json();
    
    // Comparar y sincronizar
    const mergedData = mergeData(localData, dbData.data);
    
    // Guardar datos sincronizados
    for (const item of mergedData) {
      await saveData(table, item);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Datos sincronizados correctamente',
      data: mergedData
    });
  } finally {
    client.release();
  }
}

function mergeData(localData: Record<string, unknown>[], dbData: Record<string, unknown>[]) {
  const merged = new Map();

  // Agregar datos locales
  localData.forEach(item => {
    merged.set(item.fecha, item);
  });

  // Agregar datos de la base de datos (sobrescribir si son más recientes)
  dbData.forEach(item => {
    const existing = merged.get(item.fecha);
    const itemUpdatedAt = typeof item.updated_at === 'string' ? item.updated_at : '0';
    const existingUpdatedAt = existing && typeof existing.updated_at === 'string' ? existing.updated_at : '0';
    
    if (!existing || new Date(itemUpdatedAt) > new Date(existingUpdatedAt)) {
      merged.set(item.fecha, item);
    }
  });

  return Array.from(merged.values());
}