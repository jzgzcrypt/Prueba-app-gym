'use client';

import { WeeklyPlan } from '@/types';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWeeklyPlan = (): WeeklyPlan => {
  const plan: WeeklyPlan = {
    'Lunes': {
      entrenamiento: 'Push',
      ejercicios: ['Press de Banca', 'Press Militar', 'Fondos', 'Extensiones Tríceps'],
      cardio: {
        tipo: 'Ligero',
        duracion: 20,
        intensidad: 'Baja'
      }
    },
    'Martes': {
      entrenamiento: 'Pull',
      ejercicios: ['Dominadas', 'Remo con Barra', 'Curl Bíceps', 'Face Pulls'],
      cardio: {
        tipo: 'Moderado',
        duracion: 25,
        intensidad: 'Media'
      }
    },
    'Miércoles': {
      entrenamiento: 'Piernas',
      ejercicios: ['Sentadillas', 'Peso Muerto', 'Extensiones Cuádriceps', 'Curl Femoral'],
      cardio: {
        tipo: 'Intenso',
        duracion: 30,
        intensidad: 'Alta'
      }
    },
    'Jueves': {
      entrenamiento: 'Push',
      ejercicios: ['Press de Banca', 'Press Militar', 'Fondos', 'Extensiones Tríceps'],
      cardio: {
        tipo: 'Ligero',
        duracion: 20,
        intensidad: 'Baja'
      }
    },
    'Viernes': {
      entrenamiento: 'Pull',
      ejercicios: ['Dominadas', 'Remo con Barra', 'Curl Bíceps', 'Face Pulls'],
      cardio: {
        tipo: 'Moderado',
        duracion: 25,
        intensidad: 'Media'
      }
    },
    'Sábado': {
      entrenamiento: 'Piernas',
      ejercicios: ['Sentadillas', 'Peso Muerto', 'Extensiones Cuádriceps', 'Curl Femoral'],
      cardio: {
        tipo: 'Intenso',
        duracion: 30,
        intensidad: 'Alta'
      }
    },
    'Domingo': {
      entrenamiento: 'Descanso',
      ejercicios: [],
      descanso: true
    }
  };

  return plan;
};

const getWorkoutIcon = (type: string): string => {
  switch (type) {
    case 'Push': return '💪';
    case 'Pull': return '🏋️';
    case 'Piernas': return '🦵';
    case 'Descanso': return '😴';
    default: return '🏃';
  }
};

const getWorkoutColor = (type: string): string => {
  switch (type) {
    case 'Push': return 'from-blue-400 to-blue-600';
    case 'Pull': return 'from-green-400 to-green-600';
    case 'Piernas': return 'from-purple-400 to-purple-600';
    case 'Descanso': return 'from-gray-300 to-gray-400';
    default: return 'from-blue-400 to-blue-600';
  }
};

const getCardioColor = (intensidad: string): string => {
  switch (intensidad) {
    case 'Baja': return 'from-yellow-300 to-yellow-500';
    case 'Media': return 'from-orange-400 to-orange-600';
    case 'Alta': return 'from-red-400 to-red-600';
    default: return 'from-yellow-300 to-yellow-500';
  }
};

export function WeeklyCalendar({ isOpen, onClose }: WeeklyCalendarProps) {
  const weeklyPlan = getWeeklyPlan();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>📅 Plan Semanal</h3>
        </div>
        
        <div className="modal-body">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div 
                key={day} 
                className={`relative p-6 rounded-3xl border-2 transition-all ${
                  day === today 
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-bold ${
                    day === today ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    {day}
                    {day === today && (
                      <span className="ml-3 text-sm bg-blue-500 text-white px-3 py-1 rounded-full">
                        Hoy
                      </span>
                    )}
                  </h4>
                </div>
                
                {/* Activity Blocks */}
                <div className="space-y-3">
                  {/* Workout Block */}
                  <div className={`flex items-center p-4 rounded-2xl bg-gradient-to-r ${getWorkoutColor(plan.entrenamiento)} text-white shadow-md`}>
                    <span className="text-2xl mr-4">{getWorkoutIcon(plan.entrenamiento)}</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{plan.entrenamiento}</div>
                      {!plan.descanso && (
                        <div className="text-sm opacity-90">
                          {plan.ejercicios.slice(0, 2).join(', ')}
                          {plan.ejercicios.length > 2 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Cardio Block */}
                  {plan.cardio && (
                    <div className={`flex items-center p-4 rounded-2xl bg-gradient-to-r ${getCardioColor(plan.cardio.intensidad)} text-white shadow-md`}>
                      <span className="text-xl mr-4">🏃</span>
                      <div className="flex-1">
                        <div className="font-bold">{plan.cardio.tipo}</div>
                        <div className="text-sm opacity-90">
                          {plan.cardio.duracion} min • {plan.cardio.intensidad}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Rest Day */}
                  {plan.descanso && (
                    <div className="flex items-center p-4 rounded-2xl bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-md">
                      <span className="text-2xl mr-4">😴</span>
                      <div className="flex-1">
                        <div className="font-bold text-lg">Descanso</div>
                        <div className="text-sm opacity-90">Recuperación activa</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}