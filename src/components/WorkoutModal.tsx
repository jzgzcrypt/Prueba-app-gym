'use client';

import { useState } from 'react';
import { Exercise, WorkoutEntry } from '@/types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (workout: WorkoutEntry) => void;
  workoutType: string;
}

const getWorkoutExercises = (type: string): Exercise[] => {
  const exercises: { [key: string]: Exercise[] } = {
    'Pull': [
      {
        nombre: 'Dominadas',
        series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Remo con Barra',
        series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Curl de Bíceps',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Face Pulls',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      }
    ],
    'Push': [
      {
        nombre: 'Press de Banca',
        series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Press Militar',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Fondos en Paralelas',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Extensiones de Tríceps',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      }
    ],
    'Piernas': [
      {
        nombre: 'Sentadillas',
        series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Peso Muerto',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Extensiones de Cuádriceps',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      },
      {
        nombre: 'Curl de Femoral',
        series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })),
        completado: false
      }
    ]
  };

  return exercises[type] || [];
};

export function WorkoutModal({ isOpen, onClose, onComplete, workoutType }: WorkoutModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>(getWorkoutExercises(workoutType));

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'peso' | 'repeticiones', value: number) => {
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
    setExercises(newExercises);
  };

  const isWorkoutComplete = () => {
    return exercises.every(exercise => 
      exercise.completado && 
      exercise.series.every(set => set.completado && set.peso > 0 && set.repeticiones > 0)
    );
  };

  const handleComplete = () => {
    const workout: WorkoutEntry = {
      fecha: new Date().toISOString().split('T')[0],
      tipo: workoutType,
      ejercicios: exercises,
      completado: true,
      duracion: 60,
      notas: `Entrenamiento ${workoutType} completado`
    };
    onComplete(workout);
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-shrink-0">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>🏋️ {workoutType}</h3>
        </div>
        
        <div className="modal-body flex-1 overflow-y-auto">
          <div className="space-y-6">
            {exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-bold text-gray-800">
                    {exercise.nombre}
                  </h4>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    exercise.completado 
                      ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-500 text-white shadow-lg' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {exercise.completado && '✓'}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {exercise.series.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-sm font-semibold text-gray-500 w-6 text-center">
                        {setIndex + 1}
                      </span>
                      
                      <div className="flex-1 flex gap-3">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Peso"
                            value={set.peso || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'peso', Number(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-medium text-gray-800 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                            min="0"
                          />
                        </div>
                        
                        <div className="flex items-center text-gray-400 font-bold text-lg">
                          ×
                        </div>
                        
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Reps"
                            value={set.repeticiones || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'repeticiones', Number(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-medium text-gray-800 transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={() => completeSet(exerciseIndex, setIndex)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          set.completado
                            ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-500 text-white shadow-lg'
                            : 'border-gray-300 bg-white hover:border-green-400 hover:shadow-md'
                        }`}
                      >
                        {set.completado && '✓'}
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => completeExercise(exerciseIndex)}
                  disabled={!exercise.series.every(set => set.completado && set.peso > 0 && set.repeticiones > 0)}
                  className={`mt-6 w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all ${
                    exercise.completado
                      ? 'bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {exercise.completado ? '✅ Ejercicio Completado' : 'Completar Ejercicio'}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-actions flex-shrink-0">
          <button onClick={onClose} className="modal-button modal-button-secondary">
            Cancelar
          </button>
          <button
            onClick={handleComplete}
            disabled={!isWorkoutComplete()}
            className={`modal-button ${
              isWorkoutComplete() 
                ? 'modal-button-primary' 
                : 'modal-button-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            🎯 Completar Entrenamiento
          </button>
        </div>
      </div>
    </div>
  );
}