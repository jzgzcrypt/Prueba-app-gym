'use client';

import React, { useState, useMemo } from 'react';
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
import { WorkoutEntry } from '@/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ExerciseProgressChartProps {
  workouts: WorkoutEntry[];
}

export const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({ workouts }) => {
  // Obtener lista única de ejercicios
  const allExercises = useMemo(() => {
    const exercises = new Set<string>();
    workouts.forEach(workout => {
      workout.ejercicios.forEach(exercise => {
        exercises.add(exercise.nombre);
      });
    });
    return Array.from(exercises).sort();
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState<string>(allExercises[0] || '');

  // Obtener datos del ejercicio seleccionado
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return [];

    const data: Array<{
      fecha: string;
      peso: number;
      repeticiones: number;
      rpe: number;
    }> = [];

    workouts.forEach(workout => {
      workout.ejercicios.forEach(exercise => {
        if (exercise.nombre === selectedExercise) {
          exercise.series.forEach(set => {
            if (set.completado && set.peso > 0) {
              data.push({
                fecha: workout.fecha,
                peso: set.peso,
                repeticiones: set.repeticiones,
                rpe: set.rpe || 0
              });
            }
          });
        }
      });
    });

    return data.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [workouts, selectedExercise]);

  // Crear datasets para el gráfico
  const weightData = exerciseData.map(d => ({
    x: d.fecha,
    y: d.peso
  }));

  const repsData = exerciseData.map(d => ({
    x: d.fecha,
    y: d.repeticiones
  }));

  const rpeData = exerciseData.map(d => ({
    x: d.fecha,
    y: d.rpe
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
        label: 'Repeticiones',
        data: repsData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      },
      {
        label: 'RPE',
        data: rpeData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        yAxisID: 'y2'
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
        text: `Progreso: ${selectedExercise}`
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
          text: 'Repeticiones'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear' as const,
        display: false,
        min: 1,
        max: 10,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  // Calcular estadísticas
  const maxWeight = exerciseData.length > 0 ? Math.max(...exerciseData.map(d => d.peso)) : 0;
  const maxReps = exerciseData.length > 0 ? Math.max(...exerciseData.map(d => d.repeticiones)) : 0;
  const avgRPE = exerciseData.length > 0 
    ? exerciseData.reduce((sum, d) => sum + d.rpe, 0) / exerciseData.length 
    : 0;
  const totalSessions = new Set(exerciseData.map(d => d.fecha)).size;

  // Identificar PRs (Personal Records)
  const prs = useMemo(() => {
    if (exerciseData.length === 0) return { weight: 0, reps: 0 };

    let maxWeightPR = 0;
    let maxRepsPR = 0;

    exerciseData.forEach(d => {
      if (d.peso > maxWeightPR) maxWeightPR = d.peso;
      if (d.repeticiones > maxRepsPR) maxRepsPR = d.repeticiones;
    });

    return { weight: maxWeightPR, reps: maxRepsPR };
  }, [exerciseData]);

  return (
    <div className="space-y-4">
      {/* Filtro de ejercicio */}
      <div className="clean-card">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Seleccionar Ejercicio
        </label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="input-compact w-full"
        >
          {allExercises.map(exercise => (
            <option key={exercise} value={exercise}>
              {exercise}
            </option>
          ))}
        </select>
      </div>

      {/* Resumen de progreso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-blue-600">
            {maxWeight}kg
          </div>
          <div className="text-sm text-gray-600">Peso máximo</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-green-600">
            {maxReps}
          </div>
          <div className="text-sm text-gray-600">Reps máximo</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-red-600">
            {avgRPE.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">RPE promedio</div>
        </div>
        <div className="clean-card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalSessions}
          </div>
          <div className="text-sm text-gray-600">Sesiones</div>
        </div>
      </div>

      {/* Gráfico */}
      {exerciseData.length > 0 ? (
        <div className="clean-card">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <div className="clean-card text-center py-8">
          <div className="text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-medium">No hay datos para este ejercicio</div>
            <div className="text-sm">Completa entrenamientos para ver el progreso</div>
          </div>
        </div>
      )}

      {/* Personal Records */}
      {exerciseData.length > 0 && (
        <div className="clean-card">
          <h4 className="font-semibold mb-3">🏆 Personal Records</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Peso máximo</div>
              <div className="text-xl font-bold text-blue-800">{prs.weight}kg</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Repeticiones máximas</div>
              <div className="text-xl font-bold text-green-800">{prs.reps}</div>
            </div>
          </div>
        </div>
      )}

      {/* Historial reciente */}
      {exerciseData.length > 0 && (
        <div className="clean-card">
          <h4 className="font-semibold mb-3">📝 Historial Reciente</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {exerciseData.slice(-5).reverse().map((session, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">
                  {new Date(session.fecha).toLocaleDateString('es-ES')}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="font-medium">{session.peso}kg</span>
                  <span className="font-medium">{session.repeticiones} reps</span>
                  <span className="font-medium">RPE {session.rpe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};