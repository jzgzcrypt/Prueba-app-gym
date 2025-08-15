'use client';

import { useState } from 'react';
import { Exercise, Set, WorkoutEntry } from '@/types';

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
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);

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
      duracion: 60, // Default duration
      notas: `Entrenamiento ${workoutType} completado`
    };
    onComplete(workout);
  };

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>🏋️ {workoutType}</h3>
        </div>
        
        <div className="modal-body">
          <div className="space-y-6">
            {exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {exercise.nombre}
                  </h4>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    exercise.completado 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300'
                  }`}>
                    {exercise.completado && '✓'}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {exercise.series.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-8">
                        {setIndex + 1}
                      </span>
                      
                      <input
                        type="number"
                        placeholder="Peso"
                        value={set.peso || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'peso', Number(e.target.value))}
                        className="modal-input flex-1"
                        min="0"
                      />
                      
                      <span className="text-gray-400">×</span>
                      
                      <input
                        type="number"
                        placeholder="Reps"
                        value={set.repeticiones || ''}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'repeticiones', Number(e.target.value))}
                        className="modal-input flex-1"
                        min="0"
                      />
                      
                      <button
                        onClick={() => completeSet(exerciseIndex, setIndex)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          set.completado
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
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
                  className={`mt-4 w-full modal-button ${
                    exercise.completado
                      ? 'modal-button-primary'
                      : 'modal-button-secondary'
                  }`}
                >
                  {exercise.completado ? '✅ Ejercicio Completado' : 'Completar Ejercicio'}
                </button>
              </div>
            ))}
            
            <div className="modal-actions">
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
      </div>
    </div>
  );
}