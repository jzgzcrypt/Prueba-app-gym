'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { WeightEntry, CardioEntry, WorkoutEntry, DailyAdherence } from '@/types';

interface NotificationSystemProps {
  weights: WeightEntry[];
  cardio: CardioEntry[];
  workouts: WorkoutEntry[];
  adherenciaDiaria: DailyAdherence;
  onShowNotification: (message: string, type: 'success' | 'warning' | 'error') => void;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  weights,
  cardio,
  workouts,
  adherenciaDiaria,
  onShowNotification
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkForInsights = useCallback(() => {
    const newNotifications: Notification[] = [];
    
    // Verificar si es la primera vez que se registra peso
    if (weights.length === 1) {
      newNotifications.push({
        id: 'first-weight',
        type: 'success',
        title: '🎯 ¡Primer registro!',
        message: 'Has registrado tu primer peso. ¡Comienza tu viaje de transformación!',
        timestamp: new Date(),
        read: false
      });
    }

    // Verificar si se ha completado una semana completa
    const weekCompletions = checkWeekCompletion();
    if (weekCompletions > 0) {
      newNotifications.push({
        id: 'week-completion',
        type: 'success',
        title: '📅 Semana completada',
        message: `¡Excelente! Has completado ${weekCompletions} semana${weekCompletions > 1 ? 's' : ''} de entrenamiento.`,
        timestamp: new Date(),
        read: false
      });
    }

    // Verificar si hay un nuevo PR
    const newPRs = checkForNewPRs();
    if (newPRs.length > 0) {
      newNotifications.push({
        id: 'new-prs',
        type: 'success',
        title: '🏆 ¡Nuevos PRs!',
        message: `¡Felicidades! Nuevos récords personales en: ${newPRs.join(', ')}`,
        timestamp: new Date(),
        read: false
      });
    }

    // Verificar si hay estancamiento
    const stagnantExercises = checkForStagnation();
    if (stagnantExercises.length > 0) {
      newNotifications.push({
        id: 'stagnation-warning',
        type: 'warning',
        title: '⚠️ Ejercicios estancados',
        message: `Considera ajustar: ${stagnantExercises.join(', ')}`,
        timestamp: new Date(),
        read: false
      });
    }

    // Verificar si hay baja adherencia
    const adherenceStatus = checkAdherenceStatus();
    if (adherenceStatus.low) {
      newNotifications.push({
        id: 'low-adherence',
        type: 'error',
        title: '📉 Adherencia baja',
        message: 'Tu adherencia semanal está por debajo del 60%. Considera simplificar tu plan.',
        timestamp: new Date(),
        read: false
      });
    }

    // Agregar nuevas notificaciones
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      
      // Mostrar la notificación más importante
      const mostImportant = newNotifications.sort((a, b) => {
        const priority = { error: 3, warning: 2, success: 1 };
        return priority[b.type] - priority[a.type];
      })[0];
      
      onShowNotification(mostImportant.message, mostImportant.type);
    }
  }, [weights, workouts, adherenciaDiaria, onShowNotification]);

  useEffect(() => {
    // Verificar insights cada 24 horas
    const checkInterval = setInterval(() => {
      const now = new Date();
      const hoursSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastCheck >= 24) {
        checkForInsights();
        setLastCheck(now);
      }
    }, 1000 * 60 * 60); // Verificar cada hora

    return () => clearInterval(checkInterval);
  }, [lastCheck, checkForInsights]);

  const checkWeekCompletion = useCallback((): number => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentWorkouts = workouts.filter(w => new Date(w.fecha) >= sevenDaysAgo);
    const recentCardio = cardio.filter(c => new Date(c.fecha) >= sevenDaysAgo);
    
    // Considerar una semana completada si hay al menos 3 entrenamientos o 2 cardio
    if (recentWorkouts.length >= 3 || recentCardio.length >= 2) {
      return 1;
    }
    
    return 0;
  }, []);

  const checkForNewPRs = useCallback((): string[] => {
    const newPRs: string[] = [];
    
    // Analizar cada ejercicio
    const exerciseData: { [key: string]: number[] } = {};
    
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

    Object.entries(exerciseData).forEach(([exercise, weights]) => {
      if (weights.length >= 2) {
        const lastWeight = weights[weights.length - 1];
        const previousMax = Math.max(...weights.slice(0, -1));
        
        if (lastWeight > previousMax) {
          newPRs.push(exercise);
        }
      }
    });

    return newPRs;
  }, [workouts]);

  const checkForStagnation = useCallback((): string[] => {
    const stagnantExercises: string[] = [];
    
    const exerciseData: { [key: string]: number[] } = {};
    
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

    Object.entries(exerciseData).forEach(([exercise, weights]) => {
      if (weights.length >= 4) {
        const recentWeights = weights.slice(-2);
        const previousWeights = weights.slice(-4, -2);
        
        const recentAvg = recentWeights.reduce((sum, w) => sum + w, 0) / recentWeights.length;
        const previousAvg = previousWeights.reduce((sum, w) => sum + w, 0) / previousWeights.length;
        
        if (recentAvg <= previousAvg) {
          stagnantExercises.push(exercise);
        }
      }
    });

    return stagnantExercises;
  }, []);

  const checkAdherenceStatus = useCallback(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let totalDays = 0;
    let activeDays = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      totalDays++;
      const dayAdherence = adherenciaDiaria[dateStr];
      if (dayAdherence && Object.values(dayAdherence).some(v => v)) {
        activeDays++;
      }
    }
    
    const adherenceRate = activeDays / totalDays;
    
    return {
      low: adherenceRate < 0.6,
      rate: adherenceRate
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        className="relative bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {notifications.length > 0 && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Notificaciones</h3>
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpiar todo
              </button>
            </div>
          </div>
          
          <div className="p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  notification.read ? 'bg-gray-50' : 'bg-blue-50'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="text-lg">
                    {notification.type === 'success' ? '✅' :
                     notification.type === 'warning' ? '⚠️' : '🚨'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-800">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.timestamp.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};