'use server';

import { db } from '@/lib/database';

// Server Action para agregar peso
export async function addWeightAction(formData: FormData) {
  try {
    const peso = parseFloat(formData.get('peso') as string);
    const cintura = formData.get('cintura') ? parseFloat(formData.get('cintura') as string) : undefined;
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    if (!peso || isNaN(peso)) {
      throw new Error('Peso inválido');
    }

    await db.addWeight(1, fecha, peso, cintura);
    
    return { success: true, message: 'Peso guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar peso:', error);
    return { success: false, message: 'Error al guardar peso' };
  }
}

// Server Action para agregar cardio
export async function addCardioAction(formData: FormData) {
  try {
    const tipo = formData.get('tipo') as string;
    const duracion = parseInt(formData.get('duracion') as string);
    const intensidad = formData.get('intensidad') as string;
    const calorias = parseInt(formData.get('calorias') as string);
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    if (!tipo || !duracion || !intensidad || !calorias) {
      throw new Error('Datos incompletos');
    }

    await db.addCardio(1, fecha, tipo, duracion, intensidad, calorias);
    
    return { success: true, message: 'Cardio guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar cardio:', error);
    return { success: false, message: 'Error al guardar cardio' };
  }
}

// Server Action para agregar NEAT
export async function addNeatAction(formData: FormData) {
  try {
    const tipo = formData.get('tipo') as string;
    const duracion = parseInt(formData.get('duracion') as string);
    const calorias = parseInt(formData.get('calorias') as string);
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    // Campos opcionales según el tipo
    const pasos = formData.get('pasos') ? parseInt(formData.get('pasos') as string) : undefined;
    const ritmo = formData.get('ritmo') as string || undefined;
    const km = formData.get('km') ? parseFloat(formData.get('km') as string) : undefined;
    const ritmoKmH = formData.get('ritmoKmH') ? parseFloat(formData.get('ritmoKmH') as string) : undefined;
    const inclinacion = formData.get('inclinacion') ? parseInt(formData.get('inclinacion') as string) : undefined;
    
    if (!tipo || !duracion || !calorias) {
      throw new Error('Datos incompletos');
    }

    await db.addNeat(1, fecha, tipo, duracion, calorias, pasos, ritmo, km, ritmoKmH, inclinacion);
    
    return { success: true, message: 'NEAT guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar NEAT:', error);
    return { success: false, message: 'Error al guardar NEAT' };
  }
}

// Server Action para agregar seguimiento
export async function addSeguimientoAction(formData: FormData) {
  try {
    const peso = parseFloat(formData.get('peso') as string);
    const cintura = parseFloat(formData.get('cintura') as string);
    const porcentajeGraso = formData.get('porcentajeGraso') ? parseFloat(formData.get('porcentajeGraso') as string) : undefined;
    const notas = formData.get('notas') as string || undefined;
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    if (!peso || !cintura || isNaN(peso) || isNaN(cintura)) {
      throw new Error('Datos inválidos');
    }

    await db.addSeguimiento(1, fecha, peso, cintura, porcentajeGraso, notas);
    
    return { success: true, message: 'Seguimiento guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar seguimiento:', error);
    return { success: false, message: 'Error al guardar seguimiento' };
  }
}

// Server Action para agregar entreno no programado
export async function addEntrenoNoProgramadoAction(formData: FormData) {
  try {
    const tipo = formData.get('tipo') as string;
    const duracion = parseInt(formData.get('duracion') as string);
    const intensidad = formData.get('intensidad') as string;
    const calorias = parseInt(formData.get('calorias') as string);
    const esfuerzo = parseInt(formData.get('esfuerzo') as string);
    const notas = formData.get('notas') as string || undefined;
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    // Datos específicos según el tipo de actividad
    const datosEspecificos: Record<string, unknown> = {};
    if (tipo === 'tenis') {
      datosEspecificos.tenis = {
        sets: parseInt(formData.get('tenisSets') as string),
        duracionSet: parseInt(formData.get('tenisDuracionSet') as string),
        nivel: formData.get('tenisNivel') as string
      };
    } else if (tipo === 'natacion') {
      datosEspecificos.natacion = {
        metros: parseInt(formData.get('natacionMetros') as string),
        estilo: formData.get('natacionEstilo') as string,
        ritmo: formData.get('natacionRitmo') as string
      };
    }
    // Agregar más tipos según sea necesario
    
    if (!tipo || !duracion || !intensidad || !calorias || !esfuerzo) {
      throw new Error('Datos incompletos');
    }

    await db.addEntrenoNoProgramado(1, fecha, tipo, duracion, intensidad, calorias, esfuerzo, notas, datosEspecificos);
    
    return { success: true, message: 'Entreno no programado guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar entreno no programado:', error);
    return { success: false, message: 'Error al guardar entreno no programado' };
  }
}

// Server Action para agregar entrenamiento
export async function addWorkoutAction(formData: FormData) {
  try {
    const entrenamiento = formData.get('entrenamiento') as string;
    const ejercicios = JSON.parse(formData.get('ejercicios') as string);
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    if (!entrenamiento || !ejercicios) {
      throw new Error('Datos incompletos');
    }

    await db.addWorkout(1, fecha, entrenamiento, ejercicios);
    
    return { success: true, message: 'Entrenamiento guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar entrenamiento:', error);
    return { success: false, message: 'Error al guardar entrenamiento' };
  }
}

// Server Action para actualizar adherencia diaria
export async function updateAdherenciaAction(formData: FormData) {
  try {
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    const workout = formData.get('workout') === 'true';
    const cardio = formData.get('cardio') === 'true';
    const neat = formData.get('neat') === 'true';
    const seguimiento = formData.get('seguimiento') === 'true';
    const entrenoNoProgramado = formData.get('entrenoNoProgramado') === 'true';

    await db.updateAdherenciaDiaria(1, fecha, {
      workout,
      cardio,
      neat,
      seguimiento,
      entreno_no_programado: entrenoNoProgramado
    });
    
    return { success: true, message: 'Adherencia actualizada correctamente' };
  } catch (error) {
    console.error('Error al actualizar adherencia:', error);
    return { success: false, message: 'Error al actualizar adherencia' };
  }
}

// Server Action para configurar mesociclo
export async function setMesocicloConfigAction(formData: FormData) {
  try {
    const fechaInicio = formData.get('fechaInicio') as string;
    
    if (!fechaInicio) {
      throw new Error('Fecha de inicio requerida');
    }

    await db.setMesocicloConfig(1, fechaInicio);
    
    return { success: true, message: 'Configuración del mesociclo guardada correctamente' };
  } catch (error) {
    console.error('Error al guardar configuración del mesociclo:', error);
    return { success: false, message: 'Error al guardar configuración del mesociclo' };
  }
}

// Server Action para agregar insight
export async function addInsightAction(formData: FormData) {
  try {
    const tipo = formData.get('tipo') as string;
    const titulo = formData.get('titulo') as string;
    const descripcion = formData.get('descripcion') as string;
    const accion = formData.get('accion') as string || undefined;
    const prioridad = formData.get('prioridad') as string || 'media';
    const categoria = formData.get('categoria') as string || 'general';
    const fecha = formData.get('fecha') as string || new Date().toISOString().split('T')[0];
    
    if (!tipo || !titulo || !descripcion) {
      throw new Error('Datos incompletos');
    }

    await db.addInsight(1, fecha, tipo, titulo, descripcion, accion, prioridad, categoria);
    
    return { success: true, message: 'Insight guardado correctamente' };
  } catch (error) {
    console.error('Error al guardar insight:', error);
    return { success: false, message: 'Error al guardar insight' };
  }
}

// Server Action para marcar insight como leído
export async function markInsightAsReadAction(insightId: number) {
  try {
    await db.markInsightAsRead(insightId);
    return { success: true, message: 'Insight marcado como leído' };
  } catch (error) {
    console.error('Error al marcar insight como leído:', error);
    return { success: false, message: 'Error al marcar insight como leído' };
  }
}