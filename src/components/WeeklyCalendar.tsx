'use client';

import { WeeklyPlan } from '@/types';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getWeeklyPlan = (): WeeklyPlan => {
  // Usar los datos del mesociclo actual
  const mesociclo = {
    microciclos: [
      {
        id: 1,
        nombre: "Microciclo 1 - Adaptación (Semana 1)",
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
            ],
            cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
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
            ],
            cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
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
            ],
            cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
          },
          { 
            dia: "Día 4", 
            entrenamiento: "Pull (Espalda, Bíceps, Core)", 
            ejercicios: [
              "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
              "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
              "Máquina remo espalda alta (2x8-10)",
              "Pullover polea alta rodillas banco 60º (2x8-12)",
              "Face pull polea alta boca arriba (2x12-15)",
              "Low cable rear delt row (2x12-15)",
              "Curl barra Z (1x6-8 + 1x10-12)",
              "Curl bayesian en polea (2x10-12)",
              "Ab wheel (2x12-15)"
            ],
            cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
          },
          { 
            dia: "Día 5", 
            entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
            ejercicios: [
              "Press inclinado multipower 30º (1x6-8 + 2x8-10)",
              "Contractora pectoral en máquina (2x10-12)",
              "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
              "Elevaciones laterales polea con muñequera (3x12-15)",
              "Elevaciones laterales mancuernas (2x>15)",
              "Press francés barra Z 30º (1x8-10 + 1x10-12)",
              "Extensión tríceps katana polea baja (3x8-10)",
              "Crunch abdominal en polea alta (2x12-15)"
            ],
            cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
          },
          { 
            dia: "Descanso", 
            entrenamiento: "Descanso activo", 
            ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
            cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
          }
        ]
      }
    ]
  };

  // Convertir los días del mesociclo a formato de plan semanal
  const currentMicrociclo = mesociclo.microciclos[0];
  const plan: WeeklyPlan = {};
  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  currentMicrociclo.dias.forEach((dia, index) => {
    if (index < 7) {
      plan[diasSemana[index]] = {
        entrenamiento: dia.entrenamiento,
        ejercicios: dia.ejercicios,
        cardio: dia.cardio,
        descanso: dia.entrenamiento === 'Descanso activo'
      };
    }
  });

  return plan;
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
  const weeklyPlan = getWeeklyPlan();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long' });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-shrink-0">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>📅 Plan Semanal</h3>
        </div>
        
        <div className="modal-body flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(weeklyPlan).map(([day, plan]) => (
              <div 
                key={day} 
                className={`clean-card ${day === today ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
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