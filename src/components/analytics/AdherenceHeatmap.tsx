'use client';

import React, { useState, useMemo } from 'react';
import { DailyAdherence } from '@/types';

interface AdherenceHeatmapProps {
  adherenciaDiaria: DailyAdherence;
}

type ActivityType = 'todas' | 'workout' | 'cardio' | 'neat' | 'entrenoNoProgramado';

export const AdherenceHeatmap: React.FC<AdherenceHeatmapProps> = ({ adherenciaDiaria }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('todas');

  // Generar datos para los últimos 90 días
  const heatmapData = useMemo(() => {
    const data: Array<{
      date: string;
      adherence: number;
      activities: string[];
    }> = [];

    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAdherence = adherenciaDiaria[dateStr] || {};
      const activities = Object.keys(dayAdherence).filter(key => dayAdherence[key as keyof typeof dayAdherence]);
      
      let adherence = 0;
      if (selectedActivity === 'todas') {
        adherence = activities.length;
      } else if (dayAdherence[selectedActivity]) {
        adherence = 1;
      }

      data.push({
        date: dateStr,
        adherence,
        activities
      });
    }

    return data;
  }, [adherenciaDiaria, selectedActivity]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalDays = heatmapData.length;
    const activeDays = heatmapData.filter(d => d.adherence > 0).length;
    const maxAdherence = Math.max(...heatmapData.map(d => d.adherence));
    const avgAdherence = heatmapData.reduce((sum, d) => sum + d.adherence, 0) / totalDays;

    return {
      totalDays,
      activeDays,
      maxAdherence,
      avgAdherence,
      adherenceRate: (activeDays / totalDays) * 100
    };
  }, [heatmapData]);

  // Función para obtener el color basado en la adherencia
  const getColor = (adherence: number) => {
    if (adherence === 0) return 'bg-gray-100';
    if (adherence === 1) return 'bg-green-200';
    if (adherence === 2) return 'bg-green-300';
    if (adherence === 3) return 'bg-green-400';
    return 'bg-green-500';
  };

  // Función para obtener el tooltip
  const getTooltip = (data: { date: string; adherence: number; activities: string[] }) => {
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (data.adherence === 0) {
      return `${formattedDate}: Sin actividades`;
    }
    
    const activityNames = {
      workout: 'Entrenamiento',
      cardio: 'Cardio',
      neat: 'NEAT',
      entrenoNoProgramado: 'Entreno Extra',
      diet: 'Dieta',
      seguimiento: 'Seguimiento'
    };
    
    const activities = data.activities.map(act => activityNames[act as keyof typeof activityNames] || act);
    
    return `${formattedDate}: ${data.adherence} actividad${data.adherence > 1 ? 'es' : ''} (${activities.join(', ')})`;
  };

  // Agrupar datos por semanas
  const weeklyData = useMemo(() => {
    const weeks: Array<Array<{ date: string; adherence: number; activities: string[] }>> = [];
    let currentWeek: Array<{ date: string; adherence: number; activities: string[] }> = [];
    
    heatmapData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Nueva semana cada 7 días o al final
      if ((index + 1) % 7 === 0 || index === heatmapData.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  }, [heatmapData]);

  return (
    <div className="space-y-4">
      {/* Filtros y estadísticas */}
      <div className="clean-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Filtrar por Actividad
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value as ActivityType)}
              className="input-compact"
            >
              <option value="todas">Todas las actividades</option>
              <option value="workout">Entrenamiento</option>
              <option value="cardio">Cardio</option>
              <option value="neat">NEAT</option>
              <option value="entrenoNoProgramado">Entrenos Extra</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeDays}</div>
              <div className="text-gray-600">Días activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.adherenceRate.toFixed(1)}%</div>
              <div className="text-gray-600">Tasa de adherencia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="clean-card">
        <h4 className="font-semibold mb-4">📅 Adherencia - Últimos 90 días</h4>
        
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {weeklyData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm cursor-pointer transition-colors ${getColor(day.adherence)}`}
                    title={getTooltip(day)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <span className="text-gray-500">Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          </div>
          <span className="text-gray-500">Más</span>
        </div>
      </div>

      {/* Estadísticas detalladas */}
      <div className="clean-card">
        <h4 className="font-semibold mb-3">📊 Estadísticas Detalladas</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.totalDays}</div>
            <div className="text-gray-600">Días totales</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.activeDays}</div>
            <div className="text-gray-600">Días activos</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{stats.maxAdherence}</div>
            <div className="text-gray-600">Máx actividades/día</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{stats.avgAdherence.toFixed(1)}</div>
            <div className="text-gray-600">Promedio/día</div>
          </div>
        </div>
      </div>

      {/* Tendencias semanales */}
      <div className="clean-card">
        <h4 className="font-semibold mb-3">📈 Tendencias Semanales</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {weeklyData.slice(-8).reverse().map((week, weekIndex) => {
            const weekAdherence = week.reduce((sum, day) => sum + day.adherence, 0);
            const weekActiveDays = week.filter(day => day.adherence > 0).length;
            const weekStart = new Date(week[0].date);
            
            return (
              <div key={weekIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">
                  Semana del {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="font-medium">{weekActiveDays}/7 días activos</span>
                  <span className="font-medium">{weekAdherence} actividades total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};