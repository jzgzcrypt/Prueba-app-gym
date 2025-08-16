'use client';

import React, { useMemo } from 'react';
import { WeightEntry, SeguimientoEntry, CardioEntry, NeatEntry, EntrenoNoProgramado, WorkoutEntry, DailyAdherence } from '@/types';

interface SmartAlertsProps {
  weights: WeightEntry[];
  seguimiento: SeguimientoEntry[];
  cardio: CardioEntry[];
  neat: NeatEntry[];
  entrenosNoProgramados: EntrenoNoProgramado[];
  workouts: WorkoutEntry[];
  adherenciaDiaria: DailyAdherence;
}

interface Alert {
  id: string;
  type: 'critical' | 'important' | 'suggestion';
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  category: 'weight' | 'performance' | 'recovery' | 'nutrition' | 'planning';
}

export const SmartAlerts: React.FC<SmartAlertsProps> = ({
  weights,
  seguimiento,
  cardio,
  neat,
  entrenosNoProgramados,
  workouts,
  adherenciaDiaria
}) => {
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];
    
    // Obtener datos de los últimos 14 días para análisis más preciso
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const recentWeights = weights
      .filter(w => new Date(w.fecha) >= fourteenDaysAgo)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    const recentWorkouts = workouts.filter(w => new Date(w.fecha) >= fourteenDaysAgo);
    const recentCardio = cardio.filter(c => new Date(c.fecha) >= fourteenDaysAgo);

    // ALERTA 1: Pérdida de peso muy rápida (crítica)
    if (recentWeights.length >= 3) {
      const weightChange = recentWeights[recentWeights.length - 1].peso - recentWeights[0].peso;
      const dailyRate = weightChange / (recentWeights.length - 1);
      
      if (dailyRate < -0.3) { // Más de 300g por día
        alertsList.push({
          id: 'rapid-weight-loss',
          type: 'critical',
          title: '🚨 Pérdida de peso muy rápida',
          description: `Estás perdiendo ${Math.abs(dailyRate * 7).toFixed(1)}kg por semana. Riesgo de pérdida de masa muscular.`,
          action: 'Aumenta la ingesta de proteína y reduce el déficit calórico. Considera un día de mantenimiento.',
          impact: 'high',
          category: 'weight'
        });
      }
    }

    // ALERTA 2: Estancamiento prolongado en ejercicios clave
    const stagnationAnalysis = analyzeStagnation(recentWorkouts);
    stagnationAnalysis.forEach(exercise => {
      if (exercise && exercise.daysStagnant >= 7) {
        alertsList.push({
          id: `stagnation-${exercise.name}`,
          type: 'important',
          title: `📊 ${exercise.name} estancado`,
          description: `Sin progreso en ${exercise.name} durante ${exercise.daysStagnant} días.`,
          action: 'Considera cambiar la técnica, aumentar el volumen o cambiar el ejercicio.',
          impact: 'medium',
          category: 'performance'
        });
      }
    });

    // ALERTA 3: Sobrentrenamiento detectado
    const overtrainingAnalysis = analyzeOvertraining(recentWorkouts, recentCardio);
    if (overtrainingAnalysis.risk === 'high') {
      alertsList.push({
        id: 'overtraining-risk',
        type: 'critical',
        title: '⚠️ Riesgo de sobrentrenamiento',
        description: overtrainingAnalysis.reason,
        action: 'Toma 1-2 días de descanso completo. Reduce la intensidad del próximo entrenamiento.',
        impact: 'high',
        category: 'recovery'
      });
    }

    // ALERTA 4: Patrón de recuperación inadecuada
    const recoveryPattern = analyzeRecoveryPattern(recentWorkouts);
    if (recoveryPattern.poor) {
      alertsList.push({
        id: 'poor-recovery',
        type: 'important',
        title: '😴 Recuperación inadecuada',
        description: recoveryPattern.reason,
        action: 'Aumenta el tiempo de descanso entre series y considera días de descanso activo.',
        impact: 'medium',
        category: 'recovery'
      });
    }

    // ALERTA 5: Desequilibrio en el entrenamiento
    const trainingBalance = analyzeTrainingBalance(recentWorkouts);
    if (trainingBalance.imbalanced) {
      alertsList.push({
        id: 'training-imbalance',
        type: 'suggestion',
        title: '⚖️ Desequilibrio en entrenamiento',
        description: trainingBalance.reason,
        action: trainingBalance.suggestion,
        impact: 'medium',
        category: 'planning'
      });
    }

    // ALERTA 6: Patrón de adherencia problemático
    const adherencePattern = analyzeAdherencePattern(adherenciaDiaria);
    if (adherencePattern.problematic) {
      alertsList.push({
        id: 'adherence-pattern',
        type: 'important',
        title: '📅 Patrón de adherencia problemático',
        description: adherencePattern.reason,
        action: adherencePattern.suggestion,
        impact: 'high',
        category: 'planning'
      });
    }

    // ALERTA 7: Progresión de peso inadecuada
    const weightProgression = analyzeWeightProgression(recentWeights, seguimiento);
    if (weightProgression.issue) {
      alertsList.push({
        id: 'weight-progression',
        type: 'important',
        title: '📈 Progresión de peso inadecuada',
        description: weightProgression.reason,
        action: weightProgression.suggestion,
        impact: 'medium',
        category: 'weight'
      });
    }

    // ALERTA 8: Nutrición y calorías
    const nutritionAnalysis = analyzeNutrition(cardio, neat, entrenosNoProgramados);
    if (nutritionAnalysis.issue) {
      alertsList.push({
        id: 'nutrition-issue',
        type: 'suggestion',
        title: '🍎 Consideración nutricional',
        description: nutritionAnalysis.reason,
        action: nutritionAnalysis.suggestion,
        impact: 'low',
        category: 'nutrition'
      });
    }

    return alertsList.sort((a, b) => {
      const typeOrder = { critical: 3, important: 2, suggestion: 1 };
      const impactOrder = { high: 3, medium: 2, low: 1 };
      
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[b.type] - typeOrder[a.type];
      }
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }, [weights, seguimiento, cardio, neat, entrenosNoProgramados, workouts, adherenciaDiaria]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'important': return '⚠️';
      case 'suggestion': return '💡';
      default: return '📊';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'important': return 'border-orange-300 bg-orange-50';
      case 'suggestion': return 'border-blue-300 bg-blue-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="clean-card">
        <h3 className="text-lg font-semibold mb-4">🚨 Alertas Inteligentes</h3>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-medium">Todo está en orden</div>
            <div className="text-sm">No se han detectado alertas importantes</div>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {alert.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${getImpactColor(alert.impact)}`}>
                        {alert.impact === 'high' ? 'Alto' :
                         alert.impact === 'medium' ? 'Medio' : 'Bajo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.description}
                    </p>
                    <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded border">
                      <span className="font-medium">💡 Acción recomendada:</span> {alert.action}
                    </div>
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

// Funciones de análisis inteligente
function analyzeStagnation(workouts: WorkoutEntry[]) {
  const exerciseData: { [key: string]: { weights: number[], dates: string[] } } = {};
  
  workouts.forEach(workout => {
    workout.ejercicios.forEach(exercise => {
      if (!exerciseData[exercise.nombre]) {
        exerciseData[exercise.nombre] = { weights: [], dates: [] };
      }
      exercise.series.forEach(set => {
        if (set.completado && set.peso > 0) {
          exerciseData[exercise.nombre].weights.push(set.peso);
          exerciseData[exercise.nombre].dates.push(workout.fecha);
        }
      });
    });
  });

  return Object.entries(exerciseData).map(([name, data]) => {
    if (data.weights.length < 3) return null;
    
    const recentWeights = data.weights.slice(-3);
    const previousWeights = data.weights.slice(-6, -3);
    
    const recentAvg = recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length;
    const previousAvg = previousWeights.length > 0 ? 
      previousWeights.reduce((sum, w) => sum + w, 0) / previousWeights.length : recentAvg;
    
    const isStagnant = recentAvg <= previousAvg;
    const lastDate = new Date(data.dates[data.dates.length - 1]);
    const firstDate = new Date(data.dates[0]);
    const daysStagnant = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return isStagnant ? { name, daysStagnant } : null;
  }).filter(Boolean);
}

function analyzeOvertraining(workouts: WorkoutEntry[], cardio: CardioEntry[]) {
  const totalWorkouts = workouts.length;
  const totalCardio = cardio.length;
  const totalSessions = totalWorkouts + totalCardio;
  
  // Más de 10 sesiones en 14 días es alto riesgo
  if (totalSessions > 10) {
    return {
      risk: 'high' as const,
      reason: `${totalSessions} sesiones en 14 días. Riesgo de sobrentrenamiento alto.`
    };
  }
  
  // Más de 8 sesiones es riesgo medio
  if (totalSessions > 8) {
    return {
      risk: 'medium' as const,
      reason: `${totalSessions} sesiones en 14 días. Considera más descanso.`
    };
  }
  
  return { risk: 'low' as const, reason: '' };
}

function analyzeRecoveryPattern(workouts: WorkoutEntry[]) {
  if (workouts.length < 3) return { poor: false, reason: '' };
  
  // Verificar si hay entrenamientos consecutivos sin descanso
  const sortedWorkouts = workouts.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  let consecutiveDays = 0;
  
  for (let i = 1; i < sortedWorkouts.length; i++) {
    const currentDate = new Date(sortedWorkouts[i].fecha);
    const previousDate = new Date(sortedWorkouts[i-1].fecha);
    const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      consecutiveDays++;
    } else {
      consecutiveDays = 0;
    }
    
    if (consecutiveDays >= 3) {
      return {
        poor: true,
        reason: '3 o más días consecutivos de entrenamiento sin descanso adecuado.'
      };
    }
  }
  
  return { poor: false, reason: '' };
}

function analyzeTrainingBalance(workouts: WorkoutEntry[]) {
  const muscleGroups: { [key: string]: number } = {};
  
  workouts.forEach(workout => {
    workout.ejercicios.forEach(exercise => {
      const name = exercise.nombre.toLowerCase();
      if (name.includes('press') || name.includes('push') || name.includes('pecho') || name.includes('hombro')) {
        muscleGroups.push = (muscleGroups.push || 0) + 1;
      } else if (name.includes('pull') || name.includes('remo') || name.includes('espalda')) {
        muscleGroups.pull = (muscleGroups.pull || 0) + 1;
      } else if (name.includes('pierna') || name.includes('squat') || name.includes('sentadilla')) {
        muscleGroups.legs = (muscleGroups.legs || 0) + 1;
      }
    });
  });
  
  const total = Object.values(muscleGroups).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { imbalanced: false, reason: '', suggestion: '' };
  
  const pushRatio = (muscleGroups.push || 0) / total;
  const pullRatio = (muscleGroups.pull || 0) / total;
  const legsRatio = (muscleGroups.legs || 0) / total;
  
  if (Math.abs(pushRatio - pullRatio) > 0.3) {
    return {
      imbalanced: true,
      reason: `Desequilibrio entre push (${(pushRatio * 100).toFixed(0)}%) y pull (${(pullRatio * 100).toFixed(0)}%).`,
      suggestion: pushRatio > pullRatio ? 'Aumenta ejercicios de tracción.' : 'Aumenta ejercicios de empuje.'
    };
  }
  
  if (legsRatio < 0.2) {
    return {
      imbalanced: true,
      reason: `Pocos ejercicios de piernas (${(legsRatio * 100).toFixed(0)}%).`,
      suggestion: 'Incluye más ejercicios de piernas en tu rutina.'
    };
  }
  
  return { imbalanced: false, reason: '', suggestion: '' };
}

function analyzeAdherencePattern(adherenciaDiaria: DailyAdherence) {
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
    if (adherence < 0.3 && totalDays >= 2) {
      patterns.push({
        day: dayNames[day],
        adherence: adherence * 100
      });
    }
  }
  
  if (patterns.length > 0) {
    return {
      problematic: true,
      reason: `Días problemáticos: ${patterns.map(p => `${p.day} (${p.adherence.toFixed(0)}%)`).join(', ')}.`,
      suggestion: 'Considera entrenamientos más simples en estos días o ajusta tu horario.'
    };
  }
  
  return { problematic: false, reason: '', suggestion: '' };
}

function analyzeWeightProgression(weights: WeightEntry[], seguimiento: SeguimientoEntry[]) {
  if (weights.length < 2 || seguimiento.length < 2) {
    return { issue: false, reason: '', suggestion: '' };
  }
  
  const weightChange = weights[weights.length - 1].peso - weights[0].peso;
  const cinturaChange = seguimiento[seguimiento.length - 1].cintura - seguimiento[0].cintura;
  
  // Si el peso baja pero la cintura no cambia o aumenta
  if (weightChange < -1 && cinturaChange >= 0) {
    return {
      issue: true,
      reason: 'Pérdida de peso sin reducción de cintura. Posible pérdida de masa muscular.',
      suggestion: 'Aumenta la ingesta de proteína y reduce el déficit calórico.'
    };
  }
  
  // Si el peso aumenta pero la cintura también aumenta mucho
  if (weightChange > 1 && cinturaChange > 2) {
    return {
      issue: true,
      reason: 'Ganancia de peso con aumento significativo de cintura. Posible ganancia de grasa.',
      suggestion: 'Revisa tu ingesta calórica y aumenta el cardio.'
    };
  }
  
  return { issue: false, reason: '', suggestion: '' };
}

function analyzeNutrition(cardio: CardioEntry[], neat: NeatEntry[], entrenosNoProgramados: EntrenoNoProgramado[]) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCardio = cardio.filter(c => new Date(c.fecha) >= sevenDaysAgo);
  const recentNeat = neat.filter(n => new Date(n.fecha) >= sevenDaysAgo);
  const recentEntrenos = entrenosNoProgramados.filter(e => new Date(e.fecha) >= sevenDaysAgo);
  
  const totalCalories = 
    recentCardio.reduce((sum, c) => sum + c.calorias, 0) +
    recentNeat.reduce((sum, n) => sum + n.calorias, 0) +
    recentEntrenos.reduce((sum, e) => sum + e.calorias, 0);
  
  const averageDaily = totalCalories / 7;
  
  if (averageDaily < 200) {
    return {
      issue: true,
      reason: `Solo ${averageDaily.toFixed(0)} calorías promedio por día. Actividad física muy baja.`,
      suggestion: 'Aumenta el NEAT o agrega más cardio para mejorar el déficit calórico.'
    };
  }
  
  if (averageDaily > 800) {
    return {
      issue: true,
      reason: `${averageDaily.toFixed(0)} calorías promedio por día. Asegúrate de mantener una recuperación adecuada.`,
      suggestion: 'Considera días de descanso activo y asegúrate de dormir bien.'
    };
  }
  
  return { issue: false, reason: '', suggestion: '' };
}