'use client';

import { useState } from 'react';
import { Exercise, Set } from '@/types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (exercises: Exercise[]) => void;
  workoutType: string;
}

const getWorkoutExercises = (type: string): Exercise[] => {
  const exercises = {
    'Push': [
      { nombre: 'Press de Banca', series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Press Militar', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Fondos', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Extensiones Tríceps', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) }
    ],
    'Pull': [
      { nombre: 'Dominadas', series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Remo con Barra', series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Curl Bíceps', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Face Pulls', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) }
    ],
    'Piernas': [
      { nombre: 'Sentadillas', series: Array(4).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Peso Muerto', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Extensiones Cuádriceps', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) },
      { nombre: 'Curl Femoral', series: Array(3).fill(null).map(() => ({ peso: 0, repeticiones: 0, completado: false })) }
    ]
  };
  
  return exercises[type as keyof typeof exercises] || exercises['Push'];
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
                  <h4 className="font-semibold text-lg">{exercise.nombre}</h4>
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
                              placeholder="0"
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