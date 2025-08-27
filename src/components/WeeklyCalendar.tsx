'use client';

import { WeeklyPlan } from '@/types';
import { getWeeklyPlan } from '@/utils/mesocicloUtils';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWeeklyPlanLocal = (): WeeklyPlan => {
  return getWeeklyPlan();
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'Push': return 'var(--primary-500)';
    case 'Pull': return 'var(--success-500)';
    case 'Piernas': return 'var(--warning-500)';
    case 'Descanso': return 'var(--gray-500)';
    default: return 'var(--primary-500)';
  }
};

const getCardioColor = (intensidad: string): string => {
  switch (intensidad) {
    case 'Baja': return 'var(--warning-400)';
    case 'Media': return 'var(--warning-500)';
    case 'Alta': return 'var(--danger-500)';
    default: return 'var(--warning-400)';
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
  const weeklyPlan = getWeeklyPlanLocal();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="glass-card max-w-2xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-2xl font-bold text-gray-800">📅 Plan Semanal</h3>
          <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" onClick={onClose}>×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div 
                key={day} 
                className={`glass-card ${day === today ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-semibold ${day === today ? 'text-blue-600' : 'text-gray-800'}`}>
                    {day}
                  </h4>
                  {day === today && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                      Hoy
                    </span>
                  )}
                </div>
                
                {/* Activity Blocks */}
                <div className="space-y-3">
                  {/* Main Workout Block */}
                  <div 
                    className="activity-block" 
                    style={{ background: getActivityColor(plan.entrenamiento) }}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getActivityIcon(plan.entrenamiento)}</span>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{plan.entrenamiento}</div>
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
                    <div 
                      className="activity-block" 
                      style={{ background: getCardioColor(plan.cardio.intensidad) }}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3">🏃</span>
                        <div className="flex-1">
                          <div className="font-bold">{plan.cardio.tipo}</div>
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