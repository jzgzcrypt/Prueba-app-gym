'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeightEntry, SeguimientoEntry } from '@/types';

interface WeightProgressChartProps {
  weights: WeightEntry[];
  seguimiento: SeguimientoEntry[];
}

export const WeightProgressChart: React.FC<WeightProgressChartProps> = ({ weights, seguimiento }) => {
  // Registrar Chart.js solo una vez en el cliente
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
      );
    }
  }, []);
  // Obtener datos de los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentWeights = weights
    .filter(w => new Date(w.fecha) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const recentSeguimiento = seguimiento
    .filter(s => new Date(s.fecha) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // Crear datasets para el gráfico
  const weightData = recentWeights.map(w => ({
    x: w.fecha,
    y: w.peso
  }));

  const cinturaData = recentSeguimiento.map(s => ({
    x: s.fecha,
    y: s.cintura
  }));

  const chartData = {
    datasets: [
      {
        label: 'Peso (kg)',
        data: weightData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: 'Cintura (cm)',
        data: cinturaData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Progreso Físico - Últimos 30 días'
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        },
        title: {
          display: true,
          text: 'Fecha'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Peso (kg)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cintura (cm)'
        },
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  // Calcular tendencias
  const weightTrend = recentWeights.length >= 2 
    ? recentWeights[recentWeights.length - 1].peso - recentWeights[0].peso
    : 0;

  const cinturaTrend = recentSeguimiento.length >= 2
    ? recentSeguimiento[recentSeguimiento.length - 1].cintura - recentSeguimiento[0].cintura
    : 0;

  return (
    <div className="space-y-4">
      {/* Resumen de tendencias */}
      <div className="grid grid-cols-2 gap-4">
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)}kg
          </div>
          <div className="text-sm text-gray-600">Cambio de peso (30d)</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-green-600">
            {cinturaTrend > 0 ? '+' : ''}{cinturaTrend.toFixed(1)}cm
          </div>
          <div className="text-sm text-gray-600">Cambio de cintura (30d)</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="clean-card">
        <Line data={chartData} options={options} />
      </div>

      {/* Estadísticas adicionales */}
      {recentWeights.length > 0 && (
        <div className="clean-card">
          <h4 className="font-semibold mb-3">📊 Estadísticas</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Peso actual</div>
              <div className="text-lg font-bold">{recentWeights[recentWeights.length - 1].peso}kg</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Peso inicial</div>
              <div className="text-lg font-bold">{recentWeights[0].peso}kg</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Registros</div>
              <div className="text-lg font-bold">{recentWeights.length}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Frecuencia</div>
              <div className="text-lg font-bold">{Math.round(recentWeights.length / 30 * 100)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};