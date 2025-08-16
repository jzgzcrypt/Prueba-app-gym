'use client';

import React, { useMemo } from 'react';
import { WeightEntry, SeguimientoEntry, CardioEntry, NeatEntry, EntrenoNoProgramado, WorkoutEntry, DailyAdherence } from '@/types';

interface InsightsEngineProps {
  weights: WeightEntry[];
  seguimiento: SeguimientoEntry[];
  cardio: CardioEntry[];
  neat: NeatEntry[];
  entrenosNoProgramados: EntrenoNoProgramado[];
  workouts: WorkoutEntry[];
  adherenciaDiaria: DailyAdherence;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'weight' | 'calories' | 'workout' | 'adherence' | 'general';
}

export const InsightsEngine: React.FC<InsightsEngineProps> = ({
  weights,
  seguimiento,
  cardio,
  neat,
  entrenosNoProgramados,
  workouts,
  adherenciaDiaria
}) => {
  const insights = useMemo(() => {
    const insightsList: Insight[] = [];
    
    // Obtener datos de los últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentWeights = weights
      .filter(w => new Date(w.fecha) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    const recentSeguimiento = seguimiento
      .filter(s => new Date(s.fecha) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // INSIGHT 1: Progreso de peso
    if (recentWeights.length >= 2) {
      const weightChange = recentWeights[recentWeights.length - 1].peso - recentWeights[0].peso;
      
      if (weightChange < -3) {
        insightsList.push({
          id: 'weight-loss-fast',
          type: 'warning',
          title: '⚠️ Pérdida de peso rápida',
          description: `Has perdido ${Math.abs(weightChange).toFixed(1)}kg en 30 días. Considera ralentizar para preservar masa muscular.`,
          action: 'Revisa tu déficit calórico y asegúrate de mantener proteína alta.',
          priority: 'high',
          category: 'weight'
        });
      } else if (weightChange > 2) {
        insightsList.push({
          id: 'weight-gain',
          type: 'warning',
          title: '📈 Ganancia de peso',
          description: `Has ganado ${weightChange.toFixed(1)}kg en 30 días. Verifica si es masa muscular o grasa.`,
          action: 'Revisa tu ingesta calórica y la progresión de pesos en entrenamiento.',
          priority: 'medium',
          category: 'weight'
        });
      } else if (weightChange < -1 && weightChange > -3) {
        insightsList.push({
          id: 'weight-loss-optimal',
          type: 'success',
          title: '🎯 Pérdida de peso óptima',
          description: `Excelente progreso: ${Math.abs(weightChange).toFixed(1)}kg en 30 días. Mantén este ritmo.`,
          action: 'Continúa con tu plan actual.',
          priority: 'low',
          category: 'weight'
        });
      }
    }

    // INSIGHT 2: Progreso de cintura
    if (recentSeguimiento.length >= 2) {
      const cinturaChange = recentSeguimiento[recentSeguimiento.length - 1].cintura - recentSeguimiento[0].cintura;
      
      if (cinturaChange < -2) {
        insightsList.push({
          id: 'cintura-excellent',
          type: 'success',
          title: '🏆 Excelente definición',
          description: `Tu cintura se ha reducido ${Math.abs(cinturaChange).toFixed(1)}cm. ¡Gran trabajo en la definición!`,
          action: 'Mantén la consistencia en entrenamiento y dieta.',
          priority: 'low',
          category: 'weight'
        });
      } else if (cinturaChange > 1) {
        insightsList.push({
          id: 'cintura-increase',
          type: 'warning',
          title: '⚠️ Aumento de cintura',
          description: `Tu cintura ha aumentado ${cinturaChange.toFixed(1)}cm. Revisa tu dieta y cardio.`,
          action: 'Aumenta el cardio y revisa tu ingesta calórica.',
          priority: 'high',
          category: 'weight'
        });
      }
    }

    // INSIGHT 3: Consistencia de entrenamiento
    const recentWorkouts = workouts
      .filter(w => new Date(w.fecha) >= thirtyDaysAgo);
    
    const workoutFrequency = recentWorkouts.length / 4; // Sesiones por semana
    
    if (workoutFrequency < 2) {
      insightsList.push({
        id: 'low-workout-frequency',
        type: 'danger',
        title: '🚨 Frecuencia de entrenamiento baja',
        description: `Solo ${recentWorkouts.length} sesiones en 30 días (${workoutFrequency.toFixed(1)}/semana).`,
        action: 'Intenta entrenar al menos 3 veces por semana para ver resultados.',
        priority: 'high',
        category: 'workout'
      });
    } else if (workoutFrequency >= 4) {
      insightsList.push({
        id: 'high-workout-frequency',
        type: 'success',
        title: '💪 Excelente consistencia',
        description: `${recentWorkouts.length} sesiones en 30 días (${workoutFrequency.toFixed(1)}/semana). ¡Mantén este ritmo!`,
        action: 'Continúa con tu plan actual.',
        priority: 'low',
        category: 'workout'
      });
    }

    // INSIGHT 4: Progresión de ejercicios
    const exerciseProgress = analyzeExerciseProgress(workouts);
    exerciseProgress.forEach(progress => {
      if (progress.stagnant) {
        insightsList.push({
          id: `stagnant-${progress.exercise}`,
          type: 'warning',
          title: `📊 ${progress.exercise} estancado`,
          description: `No hay progreso en ${progress.exercise} en las últimas sesiones.`,
          action: 'Considera ajustar la carga, volumen o técnica del ejercicio.',
          priority: 'medium',
          category: 'workout'
        });
      } else if (progress.improving) {
        insightsList.push({
          id: `improving-${progress.exercise}`,
          type: 'success',
          title: `🚀 ${progress.exercise} mejorando`,
          description: `Excelente progresión en ${progress.exercise}. ¡Sigue así!`,
          action: 'Mantén la progresión gradual.',
          priority: 'low',
          category: 'workout'
        });
      }
    });

    // INSIGHT 5: Adherencia al plan
    const adherenceStats = calculateAdherenceStats(adherenciaDiaria);
    
    if (adherenceStats.weeklyAverage < 0.6) {
      insightsList.push({
        id: 'low-adherence',
        type: 'danger',
        title: '📉 Adherencia baja',
        description: `Solo ${(adherenceStats.weeklyAverage * 100).toFixed(0)}% de adherencia semanal.`,
        action: 'Simplifica tu plan o ajusta tu horario para mejorar la consistencia.',
        priority: 'high',
        category: 'adherence'
      });
    } else if (adherenceStats.weeklyAverage > 0.8) {
      insightsList.push({
        id: 'high-adherence',
        type: 'success',
        title: '🎯 Excelente adherencia',
        description: `${(adherenceStats.weeklyAverage * 100).toFixed(0)}% de adherencia semanal. ¡Perfecto!`,
        action: 'Considera aumentar la intensidad o complejidad del plan.',
        priority: 'low',
        category: 'adherence'
      });
    }

    // INSIGHT 6: Calorías y balance energético
    const calorieStats = calculateCalorieStats(cardio, neat, entrenosNoProgramados);
    
    if (calorieStats.averageDaily < 300) {
      insightsList.push({
        id: 'low-calories',
        type: 'warning',
        title: '🔥 Actividad física baja',
        description: `Solo ${calorieStats.averageDaily.toFixed(0)} calorías promedio por día.`,
        action: 'Aumenta el NEAT o agrega más cardio para mejorar el déficit.',
        priority: 'medium',
        category: 'calories'
      });
    } else if (calorieStats.averageDaily > 600) {
      insightsList.push({
        id: 'high-calories',
        type: 'info',
        title: '🏃 Actividad física alta',
        description: `${calorieStats.averageDaily.toFixed(0)} calorías promedio por día. ¡Excelente!`,
        action: 'Asegúrate de mantener una recuperación adecuada.',
        priority: 'low',
        category: 'calories'
      });
    }

    // INSIGHT 7: Patrones semanales
    const weeklyPatterns = analyzeWeeklyPatterns(adherenciaDiaria);
    weeklyPatterns.forEach(pattern => {
      if (pattern.weakDay) {
        insightsList.push({
          id: `weak-${pattern.day}`,
          type: 'info',
          title: `📅 ${pattern.dayName} es tu día débil`,
          description: `Solo ${(pattern.adherence * 100).toFixed(0)}% de adherencia los ${pattern.dayName}s.`,
          action: 'Considera entrenamientos más simples o ajusta tu horario.',
          priority: 'medium',
          category: 'adherence'
        });
      }
    });

    return insightsList.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [weights, seguimiento, cardio, neat, entrenosNoProgramados, workouts, adherenciaDiaria]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'danger': return '🚨';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="clean-card">
        <h3 className="text-lg font-semibold mb-4">🤖 Insights Automáticos</h3>
        
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-medium">No hay suficientes datos</div>
            <div className="text-sm">Continúa registrando actividades para recibir insights personalizados</div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 6).map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        💡 {insight.action}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.priority === 'high' ? 'Alta' :
                     insight.priority === 'medium' ? 'Media' : 'Baja'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Funciones auxiliares para análisis
function analyzeExerciseProgress(workouts: WorkoutEntry[]) {
  const exerciseData: { [key: string]: number[] } = {};
  
  // Agrupar pesos por ejercicio
  workouts.forEach(workout => {
    workout.ejercicios.forEach(exercise => {
      if (!exerciseData[exercise.nombre]) {
        exerciseData[exercise.nombre] = [];
      }
      exercise.series.forEach(set => {
        if (set.completado && set.peso > 0) {
          exerciseData[exercise.nombre].push(set.peso);
        }
      });
    });
  });

  return Object.entries(exerciseData).map(([exercise, weights]) => {
    const recentWeights = weights.slice(-3); // Últimas 3 sesiones
    const previousWeights = weights.slice(-6, -3); // 3 sesiones anteriores
    
    const recentAvg = recentWeights.length > 0 ? 
      recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length : 0;
    const previousAvg = previousWeights.length > 0 ? 
      previousWeights.reduce((sum, w) => sum + w, 0) / previousWeights.length : 0;
    
    return {
      exercise,
      stagnant: recentAvg <= previousAvg && recentWeights.length >= 2,
      improving: recentAvg > previousAvg && recentWeights.length >= 2
    };
  });
}

function calculateAdherenceStats(adherenciaDiaria: DailyAdherence) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let totalDays = 0;
  let activeDays = 0;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    totalDays++;
    const dayAdherence = adherenciaDiaria[dateStr];
    if (dayAdherence && Object.values(dayAdherence).some(v => v)) {
      activeDays++;
    }
  }
  
  return {
    weeklyAverage: activeDays / totalDays
  };
}

function calculateCalorieStats(cardio: CardioEntry[], neat: NeatEntry[], entrenosNoProgramados: EntrenoNoProgramado[]) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCardio = cardio.filter(c => new Date(c.fecha) >= sevenDaysAgo);
  const recentNeat = neat.filter(n => new Date(n.fecha) >= sevenDaysAgo);
  const recentEntrenos = entrenosNoProgramados.filter(e => new Date(e.fecha) >= sevenDaysAgo);
  
  const totalCalories = 
    recentCardio.reduce((sum, c) => sum + c.calorias, 0) +
    recentNeat.reduce((sum, n) => sum + n.calorias, 0) +
    recentEntrenos.reduce((sum, e) => sum + e.calorias, 0) +
    (recentCardio.length > 0 ? 300 : 0); // Estimación de entrenamiento
  
  return {
    averageDaily: totalCalories / 7
  };
}

function analyzeWeeklyPatterns(adherenciaDiaria: DailyAdherence) {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const patterns = [];
  
  for (let day = 0; day < 7; day++) {
    let totalDays = 0;
    let activeDays = 0;
    
    // Analizar las últimas 4 semanas
    for (let week = 0; week < 4; week++) {
      const date = new Date();
      date.setDate(date.getDate() - (week * 7) - day);
      const dateStr = date.toISOString().split('T')[0];
      
      totalDays++;
      const dayAdherence = adherenciaDiaria[dateStr];
      if (dayAdherence && Object.values(dayAdherence).some(v => v)) {
        activeDays++;
      }
    }
    
    const adherence = activeDays / totalDays;
    patterns.push({
      day,
      dayName: dayNames[day],
      adherence,
      weakDay: adherence < 0.5 && totalDays >= 2
    });
  }
  
  return patterns.filter(p => p.weakDay);
}