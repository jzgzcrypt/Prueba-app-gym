'use client';

import { useState } from 'react';
import { getWeeklyPlan } from '@/utils/mesocicloUtils';

export function WeeklyCalendar() {
  const [weeklyPlan] = useState(() => getWeeklyPlan());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const today = new Date();
  const todayName = today.toLocaleDateString('es-ES', { weekday: 'long' });
  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

  const getActivityColor = (type: string): string => {
    if (type.includes('Push')) return 'bg-blue-100 border-blue-300 text-blue-900';
    if (type.includes('Pull')) return 'bg-green-100 border-green-300 text-green-900';
    if (type.includes('Piernas')) return 'bg-orange-100 border-orange-300 text-orange-900';
    if (type.includes('Descanso')) return 'bg-gray-100 border-gray-300 text-gray-700';
    return 'bg-purple-100 border-purple-300 text-purple-900';
  };

  const getActivityIcon = (type: string): string => {
    if (type.includes('Push')) return '💪';
    if (type.includes('Pull')) return '🏋️';
    if (type.includes('Piernas')) return '🦵';
    if (type.includes('Descanso')) return '🌿';
    return '🏃';
  };

  const handleDayClick = (day: string) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4">📅 Plan Semanal</h2>
      
      {/* Vista móvil - Lista vertical */}
      <div className="block sm:hidden space-y-3">
        {days.map((day) => {
          const plan = weeklyPlan[day];
          const isToday = day === todayName;
          const isSelected = selectedDay === day;
          
          return (
            <div key={day}>
              <button
                onClick={() => handleDayClick(day)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  isToday 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getActivityIcon(plan?.entrenamiento || '')}</span>
                    <div>
                      <p className="font-semibold capitalize text-sm">
                        {day}
                        {isToday && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                            HOY
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {plan?.entrenamiento || 'Sin plan'}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {/* Detalles expandibles */}
              {isSelected && plan && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  {!plan.descanso && (
                    <>
                      <p className="font-medium mb-2">Ejercicios:</p>
                      <ul className="space-y-1 mb-3">
                        {plan.ejercicios.slice(0, 3).map((ejercicio, idx) => (
                          <li key={idx} className="text-xs text-gray-700">
                            • {ejercicio}
                          </li>
                        ))}
                        {plan.ejercicios.length > 3 && (
                          <li className="text-xs text-gray-500 italic">
                            +{plan.ejercicios.length - 3} más...
                          </li>
                        )}
                      </ul>
                    </>
                  )}
                  {plan.cardio && (
                    <div className="bg-orange-50 p-2 rounded">
                      <p className="text-xs font-medium text-orange-800">
                        🏃 Cardio: {plan.cardio.tipo}
                      </p>
                      <p className="text-xs text-orange-700">
                        {plan.cardio.duracion} min • {plan.cardio.intensidad}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vista desktop - Grid */}
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const plan = weeklyPlan[day];
          const isToday = day === todayName;
          
          return (
            <div
              key={day}
              className={`p-3 rounded-lg border-2 transition-all ${
                isToday 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${plan ? getActivityColor(plan.entrenamiento) : 'bg-gray-50'}`}
            >
              {/* Header del día */}
              <div className="mb-2">
                <p className="font-bold capitalize text-sm">
                  {day.slice(0, 3)}
                </p>
                {isToday && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    HOY
                  </span>
                )}
              </div>
              
              {/* Contenido */}
              {plan ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{getActivityIcon(plan.entrenamiento)}</span>
                    <p className="text-xs font-medium line-clamp-2">
                      {plan.entrenamiento}
                    </p>
                  </div>
                  
                  {!plan.descanso && (
                    <p className="text-xs opacity-75">
                      {plan.ejercicios.length} ejerc.
                    </p>
                  )}
                  
                  {plan.cardio && (
                    <div className="bg-white bg-opacity-60 p-1 rounded text-xs">
                      <p className="font-medium">🏃 {plan.cardio.duracion}min</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Sin plan</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-200 rounded"></span>
            <span>Push</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 rounded"></span>
            <span>Pull</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-200 rounded"></span>
            <span>Piernas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-200 rounded"></span>
            <span>Descanso</span>
          </div>
        </div>
      </div>
    </div>
  );
}