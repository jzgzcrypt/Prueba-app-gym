'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CardioEntry, NeatEntry, EntrenoNoProgramado } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CalorieBurnChartProps {
  cardio: CardioEntry[];
  neat: NeatEntry[];
  entrenosNoProgramados: EntrenoNoProgramado[];
}

export const CalorieBurnChart: React.FC<CalorieBurnChartProps> = ({ 
  cardio, 
  neat, 
  entrenosNoProgramados 
}) => {
  // Obtener datos de los últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const getCaloriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    const cardioDay = cardio.find(c => c.fecha === dateStr);
    const neatDay = neat.find(n => n.fecha === dateStr);
    const entrenosDay = entrenosNoProgramados.filter(e => e.fecha === dateStr);
    
    const cardioCalories = cardioDay?.calorias || 0;
    const neatCalories = neatDay?.calorias || 0;
    const entrenosCalories = entrenosDay.reduce((sum, e) => sum + e.calorias, 0);
    const workoutCalories = 300; // Estimación base para entrenamiento
    
    return {
      cardio: cardioCalories,
      neat: neatCalories,
      entrenos: entrenosCalories,
      workout: workoutCalories,
      total: cardioCalories + neatCalories + entrenosCalories + workoutCalories
    };
  };

  // Generar datos para los últimos 7 días
  const labels = [];
  const cardioData = [];
  const neatData = [];
  const entrenosData = [];
  const workoutData = [];
  const totalData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    labels.push(date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
    
    const calories = getCaloriesForDate(date);
    cardioData.push(calories.cardio);
    neatData.push(calories.neat);
    entrenosData.push(calories.entrenos);
    workoutData.push(calories.workout);
    totalData.push(calories.total);
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Cardio',
        data: cardioData,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      },
      {
        label: 'NEAT',
        data: neatData,
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1
      },
      {
        label: 'Entrenos Extra',
        data: entrenosData,
        backgroundColor: 'rgba(20, 184, 166, 0.8)',
        borderColor: 'rgb(20, 184, 166)',
        borderWidth: 1
      },
      {
        label: 'Entrenamiento',
        data: workoutData,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Calorías Quemadas - Últimos 7 días'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Día'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Calorías'
        }
      }
    }
  };

  // Calcular estadísticas
  const averageCalories = totalData.reduce((sum, cal) => sum + cal, 0) / totalData.length;
  const maxCalories = Math.max(...totalData);
  const minCalories = Math.min(...totalData);
  const totalWeekCalories = totalData.reduce((sum, cal) => sum + cal, 0);

  return (
    <div className="space-y-4">
      {/* Resumen de calorías */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(averageCalories)}kcal
          </div>
          <div className="text-sm text-gray-600">Promedio diario</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-red-600">
            {maxCalories}kcal
          </div>
          <div className="text-sm text-gray-600">Día máximo</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {minCalories}kcal
          </div>
          <div className="text-sm text-gray-600">Día mínimo</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(totalWeekCalories)}kcal
          </div>
          <div className="text-sm text-gray-600">Total semanal</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="clean-card">
        <Bar data={chartData} options={options} />
      </div>

      {/* Desglose por tipo de actividad */}
      <div className="clean-card">
        <h4 className="font-semibold mb-3">📊 Desglose por Actividad</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-red-50 rounded">
            <span className="font-medium">Cardio</span>
            <span className="font-bold">{cardioData.reduce((sum, cal) => sum + cal, 0)}kcal</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
            <span className="font-medium">NEAT</span>
            <span className="font-bold">{neatData.reduce((sum, cal) => sum + cal, 0)}kcal</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-teal-50 rounded">
            <span className="font-medium">Entrenos Extra</span>
            <span className="font-bold">{entrenosData.reduce((sum, cal) => sum + cal, 0)}kcal</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
            <span className="font-medium">Entrenamiento</span>
            <span className="font-bold">{workoutData.reduce((sum, cal) => sum + cal, 0)}kcal</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded font-bold">
            <span>TOTAL SEMANAL</span>
            <span>{Math.round(totalWeekCalories)}kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
};