'use client';

import { useState } from 'react';
import { WorkoutEntry, Exercise } from '@/types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (workout: WorkoutEntry) => void;
}

export function WorkoutModal({ isOpen, onClose, onComplete }: WorkoutModalProps) {
  const [tipo, setTipo] = useState('Pull');
  const [ejercicios, setEjercicios] = useState<Exercise[]>([]);
  const [notas, setNotas] = useState('');

  const workoutTypes = [
    { value: 'Pull', label: '🏋️ Pull (Espalda, Bíceps)' },
    { value: 'Push', label: '💪 Push (Pecho, Hombros, Tríceps)' },
    { value: 'Piernas', label: '🦵 Piernas' },
    { value: 'Full Body', label: '🔥 Full Body' },
    { value: 'Cardio', label: '🏃 Cardio' },
  ];

  const defaultExercises = {
    Pull: [
      'Bent over rows con mancuernas',
      'Jalón polea alta',
      'Remo polea',
      'Face pull',
      'Curl alterno con mancuernas',
    ],
    Push: [
      'Press inclinado multipower',
      'Contractora pectoral',
      'Press en máquina',
      'Elevaciones laterales',
      'Press francés',
    ],
    Piernas: [
      'Prensa 45º',
      'Sentadilla búlgara',
      'Curl femoral',
      'Extensión de rodilla',
      'Elevaciones de talones',
    ],
    'Full Body': [
      'Sentadillas',
      'Press de pecho',
      'Remo',
      'Press militar',
      'Plancha',
    ],
    Cardio: [
      'Trote continuo',
      'Intervalos',
      'Caminata rápida',
      'Bicicleta',
      'Elíptica',
    ],
  };

  const handleTipoChange = (newTipo: string) => {
    setTipo(newTipo);
    // Cargar ejercicios por defecto
    const defaultExercisesForType = defaultExercises[newTipo as keyof typeof defaultExercises] || [];
    setEjercicios(defaultExercisesForType.map(nombre => ({
      nombre,
      series: [],
      completado: false,
    })));
  };

  const handleComplete = () => {
    const workout: WorkoutEntry = {
      fecha: new Date().toISOString().split('T')[0],
      tipo,
      ejercicios,
      completado: true,
      duracion: 60,
      notas: notas || undefined,
    };
    
    onComplete(workout);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🏋️ Entrenamiento</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Entrenamiento
              </label>
              <select
                value={tipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {workoutTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Ejercicios</h3>
              <div className="space-y-2">
                {ejercicios.map((ejercicio, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-gray-700">{ejercicio.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas - Opcional
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del entrenamiento..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                ✅ Completar Entrenamiento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}