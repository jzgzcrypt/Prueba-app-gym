'use client';

import { WeeklyPlan } from '@/types';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWeeklyPlan = (): WeeklyPlan => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
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

const getCardioIcon = (intensidad: string): string => {
  switch (intensidad) {
    case 'Baja': return '🚶';
    case 'Media': return '🏃';
    case 'Alta': return '🏃‍♂️';
    default: return '🏃';
  }
};

export function WeeklyCalendar({ isOpen, onClose }: WeeklyCalendarProps) {
  const weeklyPlan = getWeeklyPlan();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (!isOpen) return null;

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>📅 Plan Semanal</h3>
        </div>
        
        <div className="modal-body">
          <div className="space-y-4">
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div 
                key={day} 
                className={`bg-gray-50 rounded-2xl p-6 border-2 transition-all ${
                  day === today 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-semibold ${
                    day === today ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    {day}
                    {day === today && <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-1 rounded-full">Hoy</span>}
                  </h4>
                  <div className="text-2xl">
                    {getWorkoutIcon(plan.entrenamiento)}
                  </div>
                </div>
                
                {plan.descanso ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">😴</div>
                    <p className="text-gray-600 font-medium">Día de Descanso</p>
                    <p className="text-sm text-gray-500 mt-1">Recuperación activa recomendada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4">
                      <h5 className="font-semibold text-gray-800 mb-2">
                        {plan.entrenamiento}
                      </h5>
                      <div className="space-y-2">
                        {plan.ejercicios.map((ejercicio, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                            {ejercicio}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {plan.cardio && (
                      <div className="bg-white rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-800">Cardio</h5>
                          <span className="text-xl">{getCardioIcon(plan.cardio.intensidad)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold text-gray-800">{plan.cardio.tipo}</div>
                            <div className="text-gray-500">Tipo</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-800">{plan.cardio.duracion} min</div>
                            <div className="text-gray-500">Duración</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-gray-800">{plan.cardio.intensidad}</div>
                            <div className="text-gray-500">Intensidad</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">💡 Tips de la Semana</h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li>• Mantén la consistencia en tus entrenamientos</li>
                <li>• Respeta los días de descanso para la recuperación</li>
                <li>• Hidrátate bien antes, durante y después del ejercicio</li>
                <li>• Escucha a tu cuerpo y ajusta la intensidad según sea necesario</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}