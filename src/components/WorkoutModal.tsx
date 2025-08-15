'use client';

import { useState } from 'react';
import { Exercise, Set, Mesociclo, Progresion } from '@/types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (exercises: Exercise[]) => void;
  workoutType: string;
}

const getCurrentMesociclo = (): Mesociclo => {
  // Simular mesociclo actual - en una app real esto vendría de la base de datos
  return {
    semana: 1,
    objetivo: "Hipertrofia",
    volumen: "Alto",
    intensidad: "Media",
    pesos: {
      'Press de Banca': 80,
      'Press Militar': 50,
      'Fondos': 0, // Peso corporal
      'Extensiones Tríceps': 25,
      'Dominadas': 0, // Peso corporal
      'Remo con Barra': 70,
      'Curl Bíceps': 20,
      'Face Pulls': 15,
      'Sentadillas': 100,
      'Peso Muerto': 120,
      'Extensiones Cuádriceps': 60,
      'Curl Femoral': 40
    },
    repeticionesObjetivo: {
      'Press de Banca': 10,
      'Press Militar': 10,
      'Fondos': 12,
      'Extensiones Tríceps': 12,
      'Dominadas': 8,
      'Remo con Barra': 10,
      'Curl Bíceps': 12,
      'Face Pulls': 15,
      'Sentadillas': 8,
      'Peso Muerto': 6,
      'Extensiones Cuádriceps': 12,
      'Curl Femoral': 12
    }
  };
};

// Algoritmo de progresión automática
const calcularProgresion = (ejercicio: string, series: Set[], pesoActual: number, repeticionesObjetivo: number): Progresion => {
  const repeticionesPromedio = series.reduce((sum, set) => sum + set.repeticiones, 0) / series.length;
  const pesoPromedio = series.reduce((sum, set) => sum + set.peso, 0) / series.length;
  
  let proximoAjuste: 'peso' | 'repeticiones' | 'mantener' = 'mantener';
  let nuevoPeso = pesoActual;
  let nuevasRepeticiones = repeticionesObjetivo;

  // Si todas las series están completadas
  if (series.every(set => set.completado)) {
    // Si hice más repeticiones de las objetivo en todas las series
    if (repeticionesPromedio > repeticionesObjetivo + 2) {
      proximoAjuste = 'peso';
      nuevoPeso = pesoActual + 2.5; // Subir 2.5kg
    }
    // Si hice las repeticiones objetivo pero con RPE bajo
    else if (repeticionesPromedio >= repeticionesObjetivo && series.every(set => (set.rpe || 0) < 8)) {
      proximoAjuste = 'peso';
      nuevoPeso = pesoActual + 2.5;
    }
    // Si hice menos repeticiones de las objetivo
    else if (repeticionesPromedio < repeticionesObjetivo - 2) {
      proximoAjuste = 'repeticiones';
      nuevasRepeticiones = Math.max(repeticionesObjetivo - 2, 6);
    }
    // Si hice las repeticiones objetivo con RPE alto
    else if (repeticionesPromedio >= repeticionesObjetivo && series.every(set => (set.rpe || 0) >= 8)) {
      proximoAjuste = 'mantener';
    }
  }

  return {
    ejercicio,
    historial: [{
      fecha: new Date().toISOString().split('T')[0],
      peso: pesoPromedio,
      repeticiones: repeticionesPromedio,
      rpe: series.reduce((sum, set) => sum + (set.rpe || 0), 0) / series.length
    }],
    pesoActual: nuevoPeso,
    repeticionesObjetivo: nuevasRepeticiones,
    proximoAjuste
  };
};

const getWorkoutExercises = (type: string): Exercise[] => {
  const mesociclo = getCurrentMesociclo();
  
  // Obtener ejercicios del día actual del mesociclo
  const getCurrentDayExercises = (): string[] => {
    const currentData = {
      microciclos: [
        {
          id: 1,
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12)",
                "Jalón polea alta pecho apoyado unilateral (3x8-10)",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Crunch abdominal en polea alta (2x12-15)"
              ]
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10)",
                "Contractora pectoral máquina inclinada (2x10-12)",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12)",
                "Extensión tríceps katana polea baja (2x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ]
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10)",
                "Curl femoral en máquina (2x12-15)",
                "Extensión de rodilla en máquina (2x12-15)",
                "Elevaciones de talones en máquina (2x12-15)"
              ]
            }
          ]
        }
      ]
    };
    
    // Por ahora usar el día 1, se puede hacer dinámico
    return currentData.microciclos[0].dias[0].ejercicios;
  };
  
  // Convertir ejercicios del mesociclo al formato requerido
  const ejerciciosMesociclo = getCurrentDayExercises();
  
  const exercises = ejerciciosMesociclo.map(ejercicio => {
    // Extraer nombre del ejercicio (antes del paréntesis)
    const nombre = ejercicio.split('(')[0].trim();
    // Extraer series y repeticiones del paréntesis
    const seriesMatch = ejercicio.match(/\(([^)]+)\)/);
    const seriesInfo = seriesMatch ? seriesMatch[1] : '3x10';
    
    // Determinar número de series basado en la información
    let numSeries = 3;
    if (seriesInfo.includes('1x') && seriesInfo.includes('2x')) {
      numSeries = 3; // Top set + 2 rest sets
    } else if (seriesInfo.includes('3x')) {
      numSeries = 3;
    } else if (seriesInfo.includes('2x')) {
      numSeries = 2;
    }
    
    return {
      nombre,
      series: Array(numSeries).fill(null).map(() => ({ 
        peso: mesociclo.pesos[nombre] || 0, 
        repeticiones: 0, 
        completado: false 
      })),
      completado: false,
      pesoSugerido: mesociclo.pesos[nombre] || 0,
      repeticionesObjetivo: mesociclo.repeticionesObjetivo[nombre] || 10
    };
  });
  
  return exercises;
};

export function WorkoutModal({ isOpen, onClose, onComplete, workoutType }: WorkoutModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>(getWorkoutExercises(workoutType));

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].series[setIndex] = {
      ...newExercises[exerciseIndex].series[setIndex],
      [field]: value
    };
    setExercises(newExercises);
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].series[setIndex].completado = true;
    setExercises(newExercises);
  };

  const completeExercise = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].completado = true;
    
    // Calcular progresión automática
    const ejercicio = newExercises[exerciseIndex];
    const progresion = calcularProgresion(
      ejercicio.nombre,
      ejercicio.series,
      ejercicio.pesoSugerido || 0,
      ejercicio.repeticionesObjetivo || 10
    );
    
    newExercises[exerciseIndex].progresion = progresion;
    setExercises(newExercises);
  };

  const isWorkoutComplete = () => {
    return exercises.every(exercise => 
      exercise.completado && exercise.series.every(set => set.completado)
    );
  };

  const handleComplete = () => {
    onComplete(exercises);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-shrink-0">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>🏋️ {workoutType} - Entrenamiento</h3>
        </div>
        
        <div className="modal-body flex-1 overflow-y-auto">
          <div className="space-y-6">
            {exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="clean-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{exercise.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      Objetivo: {exercise.repeticionesObjetivo} repeticiones
                    </p>
                    {exercise.progresion && (
                      <p className="text-xs text-blue-600">
                        Próximo: {exercise.progresion.proximoAjuste === 'peso' ? `Subir a ${exercise.progresion.pesoActual}kg` : 
                                  exercise.progresion.proximoAjuste === 'repeticiones' ? `Bajar a ${exercise.progresion.repeticionesObjetivo} reps` : 
                                  'Mantener'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => completeExercise(exerciseIndex)}
                    disabled={exercise.completado}
                    className={`btn-elegant btn-small ${
                      exercise.completado 
                        ? 'btn-success' 
                        : 'btn-secondary'
                    }`}
                  >
                    {exercise.completado ? '✅ Completado' : 'Completar'}
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="table-compact">
                    <thead>
                      <tr>
                        <th>Serie</th>
                        <th>Peso (kg)</th>
                        <th>Reps</th>
                        <th>RPE</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.series.map((set, setIndex) => (
                        <tr key={setIndex}>
                          <td className="font-medium">{setIndex + 1}</td>
                          <td>
                            <input
                              type="number"
                              value={set.peso || ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'peso', Number(e.target.value))}
                              placeholder={exercise.pesoSugerido ? exercise.pesoSugerido.toString() : "0"}
                              className="input-compact w-20"
                              disabled={set.completado}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={set.repeticiones || ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'repeticiones', Number(e.target.value))}
                              placeholder={exercise.repeticionesObjetivo?.toString() || "0"}
                              className="input-compact w-20"
                              disabled={set.completado}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={set.rpe || ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', Number(e.target.value))}
                              placeholder="0"
                              min="1"
                              max="10"
                              className="input-compact w-16"
                              disabled={set.completado}
                            />
                          </td>
                          <td>
                            <button
                              onClick={() => completeSet(exerciseIndex, setIndex)}
                              disabled={set.completado || !set.peso || !set.repeticiones}
                              className={`btn-elegant btn-small ${
                                set.completado 
                                  ? 'btn-success' 
                                  : (!set.peso || !set.repeticiones)
                                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                                    : 'btn-primary'
                              }`}
                            >
                              {set.completado ? '✅' : 'Completar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 flex-shrink-0 p-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-elegant btn-secondary flex-1">
            Cancelar
          </button>
          <button
            onClick={handleComplete}
            disabled={!isWorkoutComplete()}
            className={`btn-elegant flex-1 ${
              isWorkoutComplete() 
                ? 'btn-primary' 
                : 'btn-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            🎯 Completar Entrenamiento
          </button>
        </div>
      </div>
    </div>
  );
}