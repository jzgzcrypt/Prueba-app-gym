import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeightEntry, CardioEntry, DietEntry, NeatEntry } from '@/types';

interface DesktopChartsProps {
  estado: WeightEntry[];
  cardio: CardioEntry[];
  dieta: DietEntry[];
  neat: NeatEntry[];
}



export const DesktopCharts: React.FC<DesktopChartsProps> = ({ estado, cardio, dieta, neat }) => {
  // Preparar datos para gráfico de peso con mejor formato
  const weightData = estado.slice(-30).map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: item.peso,
    cintura: item.cintura,
    fechaCompleta: new Date(item.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  }));

  // Preparar datos para gráfico de calorías con mejor formato
  const caloriesData = dieta.slice(-7).map(item => ({
    fecha: new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    calorias: item.calorias,
    proteinas: item.proteinas,
    carbos: item.carbos,
    grasas: item.grasas,
    fechaCompleta: new Date(item.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
  }));

  // Preparar datos para gráfico de actividades con iconos
  const activityData = [
    { name: '⚖️ Peso', value: estado.length, color: '#3B82F6' },
    { name: '🏃 Cardio', value: cardio.length, color: '#10B981' },
    { name: '🥗 Dieta', value: dieta.length, color: '#F59E0B' },
    { name: '🚶 NEAT', value: neat.length, color: '#8B5CF6' }
  ];

  // Calcular estadísticas mejoradas
  const stats = {
    pesoActual: estado.length > 0 ? estado[estado.length - 1].peso : 0,
    pesoInicial: estado.length > 0 ? estado[0].peso : 0,
    cambioPeso: estado.length > 0 ? (estado[estado.length - 1].peso - estado[0].peso).toFixed(1) : 0,
    cambioPorcentaje: estado.length > 0 ? ((estado[estado.length - 1].peso - estado[0].peso) / estado[0].peso * 100).toFixed(1) : 0,
    caloriasPromedio: dieta.length > 0 ? Math.round(dieta.reduce((sum, item) => sum + item.calorias, 0) / dieta.length) : 0,
    proteinasPromedio: dieta.length > 0 ? Math.round(dieta.reduce((sum, item) => sum + item.proteinas, 0) / dieta.length) : 0,
    cardioTotal: cardio.reduce((sum, item) => sum + item.km, 0),
    cardioSesiones: cardio.length,
    neatTotal: neat.reduce((sum, item) => sum + (item.calorias || 0), 0),
    diasRegistrados: new Set([...estado, ...cardio, ...dieta, ...neat].map(item => item.fecha)).size
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas mejoradas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚖️</span>
            <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
              parseFloat(String(stats.cambioPeso)) < 0 
                ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {parseFloat(String(stats.cambioPeso)) >= 0 ? '+' : ''}{stats.cambioPeso} kg
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Peso Actual</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pesoActual} kg</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {parseFloat(String(stats.cambioPorcentaje)) >= 0 ? '+' : ''}{stats.cambioPorcentaje}% desde inicio
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-5 rounded-2xl shadow-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🔥</span>
            <span className="px-2 py-1 text-xs bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full font-semibold">
              Promedio
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Calorías Diarias</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.caloriasPromedio}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.proteinasPromedio}g proteínas/día
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-2xl shadow-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🏃</span>
            <span className="px-2 py-1 text-xs bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full font-semibold">
              {stats.cardioSesiones} sesiones
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Cardio Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cardioTotal.toFixed(1)} km</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {stats.cardioSesiones > 0 ? `${(stats.cardioTotal / stats.cardioSesiones).toFixed(1)} km/sesión` : 'Sin sesiones'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🚶</span>
            <span className="px-2 py-1 text-xs bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full font-semibold">
              NEAT
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Actividad Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.neatTotal}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            kcal quemadas
          </div>
        </div>
      </div>

      {/* Gráficos mejorados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de peso mejorado */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span className="text-2xl">📈</span>
              <span>Evolución del Peso</span>
            </h3>
            <select className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <option>Últimos 30 días</option>
              <option>Últimos 60 días</option>
              <option>Últimos 90 días</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={weightData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCintura" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="fecha" 
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                itemStyle={{ color: '#6B7280' }}
                formatter={(value: any, name: string) => [
                  `${value} ${name === 'peso' ? 'kg' : 'cm'}`,
                  name === 'peso' ? 'Peso' : 'Cintura'
                ]}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="peso" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7 }}
                fill="url(#colorPeso)"
                name="Peso"
              />
              {estado.some(item => item.cintura) && (
                <Line 
                  type="monotone" 
                  dataKey="cintura" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 0, r: 5 }}
                  activeDot={{ r: 7 }}
                  fill="url(#colorCintura)"
                  name="Cintura"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de calorías mejorado */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span className="text-2xl">🔥</span>
              <span>Calorías Semanales</span>
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Objetivo:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">1800 kcal/día</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={caloriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#FCD34D" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="fecha" 
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                itemStyle={{ color: '#6B7280' }}
                formatter={(value: any) => [`${value} kcal`, 'Calorías']}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                iconType="circle"
              />
              <Bar 
                dataKey="calorias" 
                fill="url(#colorCalories)"
                radius={[8, 8, 0, 0]}
                name="Calorías"
              />
              {/* Línea de objetivo */}
              <ReferenceLine 
                y={1800} 
                stroke="#EF4444" 
                strokeDasharray="5 5" 
                label={{ value: "Objetivo", position: "right", fill: '#EF4444', fontSize: 11 }}
              />
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
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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