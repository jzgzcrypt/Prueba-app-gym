import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Probando conexión con la base de datos...');
    
    // Solo importar la base de datos en runtime, no en build time
    const { db } = await import('@/lib/database');
    
    // Probar conexión simple
    const weights = await db.getWeights(1);
    
    // Obtener estadísticas
    const cardioCount = await db.getCardio(1);
    const neatCount = await db.getNeat(1);
    
    return NextResponse.json({
      success: true,
      message: '✅ Conexión exitosa con Neon PostgreSQL',
      data: {
        weightsCount: weights.length,
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