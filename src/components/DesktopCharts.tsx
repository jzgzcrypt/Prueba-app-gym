import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeightEntry, CardioEntry, DietEntry, NeatEntry } from '@/types';

interface DesktopChartsProps {
  estado: WeightEntry[];
  cardio: CardioEntry[];
  dieta: DietEntry[];
  neat: NeatEntry[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const DesktopCharts: React.FC<DesktopChartsProps> = ({ estado, cardio, dieta, neat }) => {
  // Preparar datos para gráfico de peso
  const weightData = estado.slice(-30).map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    peso: item.peso,
    cintura: item.cintura
  }));

  // Preparar datos para gráfico de calorías
  const caloriesData = dieta.slice(-7).map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
    calorias: item.calorias,
    proteinas: item.proteinas,
    carbos: item.carbos,
    grasas: item.grasas
  }));

  // Preparar datos para gráfico de actividades
  const activityData = [
    { name: 'Peso', value: estado.length, color: '#0088FE' },
    { name: 'Cardio', value: cardio.length, color: '#00C49F' },
    { name: 'Dieta', value: dieta.length, color: '#FFBB28' },
    { name: 'NEAT', value: neat.length, color: '#FF8042' }
  ];

  // Calcular estadísticas
  const stats = {
    pesoActual: estado.length > 0 ? estado[estado.length - 1].peso : 0,
    pesoInicial: estado.length > 0 ? estado[0].peso : 0,
    cambioPeso: estado.length > 0 ? (estado[estado.length - 1].peso - estado[0].peso).toFixed(1) : 0,
    caloriasPromedio: dieta.length > 0 ? Math.round(dieta.reduce((sum, item) => sum + item.calorias, 0) / dieta.length) : 0,
    proteinasPromedio: dieta.length > 0 ? Math.round(dieta.reduce((sum, item) => sum + item.proteinas, 0) / dieta.length) : 0,
    cardioTotal: cardio.reduce((sum, item) => sum + item.km, 0),
    neatTotal: neat.reduce((sum, item) => sum + (item.calorias || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Peso Actual</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pesoActual} kg</div>
          <div className={`text-xs ${parseFloat(stats.cambioPeso) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(stats.cambioPeso) >= 0 ? '+' : ''}{stats.cambioPeso} kg
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Calorías Promedio</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.caloriasPromedio}</div>
          <div className="text-xs text-gray-500">kcal/día</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Cardio Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cardioTotal.toFixed(1)}</div>
          <div className="text-xs text-gray-500">km</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">NEAT Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.neatTotal}</div>
          <div className="text-xs text-gray-500">kcal</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de peso */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📈 Evolución del Peso</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="fecha" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
              />
              {estado.some(item => item.cintura) && (
                <Line 
                  type="monotone" 
                  dataKey="cintura" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  dot={{ fill: '#00C49F', strokeWidth: 2, r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de calorías */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔥 Calorías de la Semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caloriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="fecha" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="calorias" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de actividades */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Distribución de Actividades</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de macronutrientes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🥗 Macronutrientes Promedio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ 
              name: 'Macronutrientes',
              proteinas: stats.proteinasPromedio,
              carbos: stats.caloriasPromedio * 0.4 / 4,
              grasas: stats.caloriasPromedio * 0.2 / 9
            }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="proteinas" fill="#FF6B6B" name="Proteínas (g)" />
              <Bar dataKey="carbos" fill="#4ECDC4" name="Carbos (g)" />
              <Bar dataKey="grasas" fill="#45B7D1" name="Grasas (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};