'use client';

import { useState } from 'react';
import { Exercise, Set, Mesociclo, Progresion } from '@/types';
import { getCurrentMesocicloDay, calcularProgresionDinamica, parseEjercicioMesociclo } from '@/utils/mesocicloUtils';

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

// Usar el algoritmo de progresión dinámico
const calcularProgresion = (ejercicio: string, series: Set[], pesoActual: number, repeticionesObjetivo: number): Progresion => {
  const currentData = getCurrentMesocicloDay();
  return calcularProgresionDinamica(ejercicio, series, pesoActual, repeticionesObjetivo, currentData.semanaActual);
};

const getWorkoutExercises = (): Exercise[] => {
  const mesociclo = getCurrentMesociclo();
  
  // Obtener ejercicios del día actual del mesociclo dinámicamente
  const currentData = getCurrentMesocicloDay();
  const ejerciciosMesociclo = currentData.dia.ejercicios;
  
  const exercises = ejerciciosMesociclo.map(ejercicio => {
    // Usar el parser para extraer información detallada
    const ejercicioPlan = parseEjercicioMesociclo(ejercicio);
    
    return {
      nombre: ejercicioPlan.nombre,
      series: ejercicioPlan.series.map(seriePlan => ({ 
        peso: mesociclo.pesos[ejercicioPlan.nombre] || 0, 
        repeticiones: 0, 
        completado: false,
        repeticionesObjetivo: seriePlan.repeticionesObjetivo,
        rpeObjetivo: seriePlan.rpeObjetivo,
        tipo: seriePlan.tipo
      })),
      completado: false,
      pesoSugerido: mesociclo.pesos[ejercicioPlan.nombre] || 0,
      repeticionesObjetivo: mesociclo.repeticionesObjetivo[ejercicioPlan.nombre] || 10,
      descripcion: ejercicioPlan.descripcion
    };
  });
  
  return exercises;
};

export function WorkoutModal({ isOpen, onClose, onComplete, workoutType }: WorkoutModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>(getWorkoutExercises());

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
                    <p className="text-sm text-gray-600 mb-2">
                      {exercise.descripcion}
                    </p>
                    {exercise.progresion && (
                      <div className="space-y-1">
                        <p className="text-xs text-blue-600">
                          Próximo: {exercise.progresion.proximoAjuste === 'peso' ? `Subir a ${exercise.progresion.pesoActual}kg` : 
                                    exercise.progresion.proximoAjuste === 'repeticiones' ? `Bajar a ${exercise.progresion.repeticionesObjetivo} reps` : 
                                    'Mantener'}
                        </p>
                        <div className="flex gap-2 text-xs">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {exercise.progresion.fase}
                          </span>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            {exercise.progresion.intensidad}
                          </span>
                          {exercise.progresion.incrementoPeso && exercise.progresion.incrementoPeso > 0 && (
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              +{exercise.progresion.incrementoPeso}kg
                            </span>
                          )}
                        </div>
                      </div>
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
                        <th>Tipo</th>
                        <th>Peso (kg)</th>
                        <th>Reps</th>
                        <th>Objetivo</th>
                        <th>RPE</th>
                        <th>Objetivo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.series.map((set, setIndex) => (
                        <tr key={setIndex} className={set.tipo === 'top' ? 'bg-yellow-50' : ''}>
                          <td className="font-medium">{setIndex + 1}</td>
                          <td>
                            {set.tipo === 'top' && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">TOP</span>}
                            {set.tipo === 'rest' && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">REST</span>}
                            {set.tipo === 'normal' && <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">NORM</span>}
                          </td>
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
                              placeholder="0"
                              className="input-compact w-20"
                              disabled={set.completado}
                            />
                          </td>
                          <td className="text-xs text-gray-600 font-medium">
                            {set.repeticionesObjetivo}
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
                          <td className="text-xs text-gray-600 font-medium">
                            {set.rpeObjetivo}
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