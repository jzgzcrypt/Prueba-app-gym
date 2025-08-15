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

const getActivityColor = (type: string, intensidad?: string): string => {
  if (type === 'Descanso') return 'from-gray-400 to-gray-500';
  
  switch (type) {
    case 'Push': return 'from-blue-500 to-blue-600';
    case 'Pull': return 'from-green-500 to-green-600';
    case 'Piernas': return 'from-purple-500 to-purple-600';
    default: return 'from-blue-500 to-blue-600';
  }
};

const getCardioColor = (intensidad: string): string => {
  switch (intensidad) {
    case 'Baja': return 'from-yellow-400 to-yellow-500';
    case 'Media': return 'from-orange-400 to-orange-500';
    case 'Alta': return 'from-red-400 to-red-500';
    default: return 'from-yellow-400 to-yellow-500';
  }
};

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'Push': return '💪';
    case 'Pull': return '🏋️';
    case 'Piernas': return '🦵';
    case 'Descanso': return '😴';
    default: return '🏃';
  }
};

export function WeeklyCalendar({ isOpen, onClose }: WeeklyCalendarProps) {
  const weeklyPlan = getWeeklyPlan();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>📅 Plan Semanal</h3>
        </div>
        
        <div className="modal-body">
          <div className="calendar-grid">
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div 
                key={day} 
                className={`modern-card ${day === today ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className={`text-xl font-bold ${day === today ? 'text-blue-600' : 'text-gray-800'}`}>
                    {day}
                  </h4>
                  {day === today && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                
                {/* Activity Blocks */}
                <div className="space-y-4">
                  {/* Main Workout Block */}
                  <div className={`activity-block ${plan.descanso ? 'success' : ''}`} 
                       style={{ background: `linear-gradient(135deg, ${plan.descanso ? '#22c55e' : '#0ea5e9'} 0%, ${plan.descanso ? '#16a34a' : '#0284c7'} 100%)` }}>
                    <div className="flex items-center">
                      <span className="text-3xl mr-4">{getActivityIcon(plan.entrenamiento)}</span>
                      <div className="flex-1">
                        <div className="font-bold text-xl mb-1">{plan.entrenamiento}</div>
                        {!plan.descanso && (
                          <div className="text-sm opacity-90">
                            {plan.ejercicios.length} ejercicios
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Cardio Block */}
                  {plan.cardio && (
                    <div className="activity-block warning" 
                         style={{ background: `linear-gradient(135deg, ${getCardioColor(plan.cardio.intensidad).includes('yellow') ? '#fbbf24' : getCardioColor(plan.cardio.intensidad).includes('orange') ? '#fb923c' : '#f87171'} 0%, ${getCardioColor(plan.cardio.intensidad).includes('yellow') ? '#f59e0b' : getCardioColor(plan.cardio.intensidad).includes('orange') ? '#ea580c' : '#dc2626'} 100%)` }}>
                      <div className="flex items-center">
                        <span className="text-2xl mr-4">🏃</span>
                        <div className="flex-1">
                          <div className="font-bold text-lg mb-1">{plan.cardio.tipo}</div>
                          <div className="text-sm opacity-90">
                            {plan.cardio.duracion} min • {plan.cardio.intensidad}
                          </div>
                        </div>
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