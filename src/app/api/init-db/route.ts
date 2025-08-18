import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function POST() {
  try {
    await initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente' 
    });
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error inicializando la base de datos' 
    }, { status: 500 });
  }
}