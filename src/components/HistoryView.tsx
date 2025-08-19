'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface HistoryData {
  date: string;
  weight?: number;
  waist?: number;
  cardio?: {
    duration: number;
    calories: number;
    type: string;
  };
  neat?: {
    steps?: number;
    treadmill?: number;
  };
  workout?: {
    completed: boolean;
    type: string;
  };
}

type MetricValue = number | {
  duration: number;
  calories: number;
  type: string;
} | {
  steps?: number;
  treadmill?: number;
} | {
  completed: boolean;
  type: string;
} | undefined;

interface HistoryViewProps {
  onBack: () => void;
}

const METRIC_TYPES = {
  weight: 'Peso',
  waist: 'Cintura',
  cardio: 'Cardio',
  neat: 'NEAT',
  workout: 'Entrenamientos',
} as const;

type MetricType = keyof typeof METRIC_TYPES;

export function HistoryView({ onBack }: HistoryViewProps) {
  const { showToast } = useToast();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Generar datos de ejemplo (en producción vendría de la base de datos)
  useEffect(() => {
    const generateHistoryData = () => {
      const data: HistoryData[] = [];
      const today = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const baseWeight = 75;
        const weightVariation = Math.sin(i * 0.1) * 2 + Math.random() * 1;
        const baseWaist = 85;
        const waistVariation = Math.sin(i * 0.05) * 3 + Math.random() * 2;

        data.push({
          date: date.toISOString().split('T')[0],
          weight: Math.round((baseWeight + weightVariation) * 10) / 10,
          waist: Math.round(baseWaist + waistVariation),
          cardio: Math.random() > 0.3 ? {
            duration: Math.floor(Math.random() * 45) + 15,
            calories: Math.floor(Math.random() * 300) + 100,
            type: ['cinta', 'bici', 'eliptica', 'natacion'][Math.floor(Math.random() * 4)],
          } : undefined,
          neat: Math.random() > 0.2 ? {
            steps: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) + 3000 : undefined,
            treadmill: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : undefined,
          } : undefined,
          workout: Math.random() > 0.4 ? {
            completed: Math.random() > 0.2,
            type: ['fuerza', 'cardio', 'flexibilidad', 'hiit'][Math.floor(Math.random() * 4)],
          } : undefined,
        });
      }

      return data;
    };

    setHistoryData(generateHistoryData());
    setLoading(false);
  }, [dateRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getMetricData = (metric: MetricType) => {
    return historyData
      .filter(item => item[metric] !== undefined)
      .map(item => ({
        date: formatDate(item.date),
        value: item[metric],
        rawDate: item.date,
      }));
  };

  const extractMetricValue = (value: MetricValue, metric: MetricType): number => {
    if (metric === 'weight' || metric === 'waist') {
      return value as number;
    } else if (metric === 'cardio') {
      return (value as { duration: number })?.duration || 0;
    } else if (metric === 'neat') {
      const neatValue = value as { steps?: number; treadmill?: number };
      return neatValue?.steps || neatValue?.treadmill || 0;
    } else if (metric === 'workout') {
      return (value as { completed: boolean })?.completed ? 1 : 0;
    }
    return 0;
  };

  const getMetricStats = (metric: MetricType) => {
    const data = getMetricData(metric);
    if (data.length === 0) return null;

    const values = data.map(d => extractMetricValue(d.value, metric));

    const current = values[values.length - 1];
    const previous = values[values.length - 2] || current;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercent,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    };
  };

  const renderSimpleChart = (metric: MetricType) => {
    const data = getMetricData(metric);
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles para este período
        </div>
      );
    }

    const values = data.map(d => extractMetricValue(d.value, metric));

    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    return (
      <div className="h-64 flex items-end justify-between space-x-1 p-4">
        {data.map((item, index) => {
          const value = values[index];
          const height = maxValue > minValue 
            ? ((value - minValue) / (maxValue - minValue)) * 100 
            : 50;
          
          return (
            <div key={item.rawDate} className="flex-1 flex flex-col items-center">
              <div className="text-xs text-gray-600 mb-1">{item.date}</div>
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%` }}
                title={`${item.date}: ${value}`}
              ></div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = (metric: MetricType) => {
    const data = getMetricData(metric);
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No hay datos disponibles para este período
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              {metric === 'cardio' && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calorías
                  </th>
                </>
              )}
              {metric === 'workout' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const value = item.value;
              let displayValue = '';
              let additionalInfo = null;

              if (metric === 'weight') {
                displayValue = `${value} kg`;
              } else if (metric === 'waist') {
                displayValue = `${value} cm`;
              } else if (metric === 'cardio') {
                const cardioValue = value as { duration: number; type: string; calories: number };
                displayValue = `${cardioValue.duration} min`;
                additionalInfo = (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {cardioValue.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cardioValue.calories} cal
                    </td>
                  </>
                );
              } else if (metric === 'neat') {
                const neatValue = value as { steps?: number; treadmill?: number };
                if (neatValue.steps) {
                  displayValue = `${neatValue.steps} pasos`;
                } else if (neatValue.treadmill) {
                  displayValue = `${neatValue.treadmill} min cinta`;
                }
              } else if (metric === 'workout') {
                const workoutValue = value as { completed: boolean; type: string };
                displayValue = workoutValue.type;
                additionalInfo = (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      workoutValue.completed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workoutValue.completed ? 'Completado' : 'Pendiente'}
                    </span>
                  </td>
                );
              }

              return (
                <tr key={item.rawDate} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {displayValue}
                  </td>
                  {additionalInfo}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getMetricStats(selectedMetric);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>←</span>
              <span>Volver</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Progresos</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 Gráfica
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Tabla
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Metric Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Métrica
                </label>
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(METRIC_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="90d">Últimos 90 días</option>
                  <option value="1y">Último año</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Valor Actual</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedMetric === 'weight' || selectedMetric === 'waist' 
                    ? stats.current 
                    : selectedMetric === 'cardio' 
                    ? `${stats.current} min`
                    : selectedMetric === 'neat'
                    ? stats.current
                    : stats.current === 1 ? 'Completado' : 'Pendiente'
                  }
                  {selectedMetric === 'weight' && ' kg'}
                  {selectedMetric === 'waist' && ' cm'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Cambio</h3>
                <div className="flex items-center">
                  <span className={`text-2xl font-bold ${
                    stats.trend === 'up' ? 'text-green-600' : 
                    stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stats.trend === 'up' ? '+' : ''}{stats.change.toFixed(1)}
                  </span>
                  <span className={`ml-2 text-sm ${
                    stats.trend === 'up' ? 'text-green-600' : 
                    stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    ({stats.changePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Promedio</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.avg.toFixed(1)}
                  {selectedMetric === 'weight' && ' kg'}
                  {selectedMetric === 'waist' && ' cm'}
                  {selectedMetric === 'cardio' && ' min'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Rango</h3>
                <p className="text-lg font-bold text-gray-900">
                  {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
                  {selectedMetric === 'weight' && ' kg'}
                  {selectedMetric === 'waist' && ' cm'}
                  {selectedMetric === 'cardio' && ' min'}
                </p>
              </div>
            </div>
          )}

          {/* Chart/Table View */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {METRIC_TYPES[selectedMetric]} - {dateRange === '7d' ? 'Últimos 7 días' : 
                dateRange === '30d' ? 'Últimos 30 días' : 
                dateRange === '90d' ? 'Últimos 90 días' : 'Último año'}
              </h2>
            </div>
            <div className="p-4">
              {viewMode === 'chart' ? renderSimpleChart(selectedMetric) : renderTable(selectedMetric)}
            </div>
          </div>

          {/* Export Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => showToast('Funcionalidad de exportación en desarrollo', 'warning')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              📊 Exportar Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}