import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Probando conexión con la base de datos...');
    
    // Obtener estadísticas
    const tables = await db.getWeights(1);
    const cardioCount = await db.getCardio(1);
    const neatCount = await db.getNeat(1);
    
    return NextResponse.json({
      success: true,
      message: '✅ Conexión exitosa con Neon PostgreSQL',
      data: {
        weightsCount: tables.length,
        cardioCount: cardioCount.length,
        neatCount: neatCount.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return NextResponse.json({
      success: false,
      message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}