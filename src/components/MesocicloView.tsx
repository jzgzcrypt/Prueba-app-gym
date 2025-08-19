'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface MesocicloWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  phase: 'introduccion' | 'acumulacion' | 'intensificacion' | 'realizacion' | 'transicion';
  intensity: 'baja' | 'moderada' | 'alta' | 'muy_alta';
  focus: string;
  volume: number;
  exercises: string[];
}

interface MesocicloViewProps {
  onBack: () => void;
}

const PHASE_COLORS = {
  introduccion: 'bg-blue-100 border-blue-300 text-blue-800',
  acumulacion: 'bg-green-100 border-green-300 text-green-800',
  intensificacion: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  realizacion: 'bg-red-100 border-red-300 text-red-800',
  transicion: 'bg-purple-100 border-purple-300 text-purple-800',
};

const INTENSITY_COLORS = {
  baja: 'bg-gray-100',
  moderada: 'bg-blue-100',
  alta: 'bg-orange-100',
  muy_alta: 'bg-red-100',
};

const PHASE_LABELS = {
  introduccion: 'Introducción',
  acumulacion: 'Acumulación',
  intensificacion: 'Intensificación',
  realizacion: 'Realización',
  transicion: 'Transición',
};

const INTENSITY_LABELS = {
  baja: 'Baja',
  moderada: 'Moderada',
  alta: 'Alta',
  muy_alta: 'Muy Alta',
};

export function MesocicloView({ onBack }: MesocicloViewProps) {
  const { showToast } = useToast();
  const [currentMesociclo, setCurrentMesociclo] = useState<MesocicloWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<MesocicloWeek | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);

  // Generar mesociclo de ejemplo (en producción vendría de la base de datos)
  useEffect(() => {
    const generateMesociclo = () => {
      const weeks: MesocicloWeek[] = [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (startDate.getDay() - 1)); // Lunes

      const phases: Array<MesocicloWeek['phase']> = ['introduccion', 'acumulacion', 'intensificacion', 'realizacion', 'transicion'];
      const intensities: Array<MesocicloWeek['intensity']> = ['baja', 'moderada', 'alta', 'muy_alta'];
      
      const focuses = [
        'Fuerza máxima',
        'Hipertrofia',
        'Resistencia muscular',
        'Potencia',
        'Recuperación activa'
      ];

      const exercises = [
        'Sentadilla', 'Press banca', 'Peso muerto', 'Press militar',
        'Remo', 'Dominadas', 'Zancadas', 'Plancha'
      ];

      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const phase = phases[Math.floor(i / 3) % phases.length];
        const intensity = intensities[Math.floor(i / 4) % intensities.length];

        weeks.push({
          weekNumber: i + 1,
          startDate: weekStart,
          endDate: weekEnd,
          phase,
          intensity,
          focus: focuses[Math.floor(Math.random() * focuses.length)],
          volume: Math.floor(Math.random() * 20) + 10,
          exercises: exercises.slice(0, Math.floor(Math.random() * 4) + 3),
        });
      }

      return weeks;
    };

    setCurrentMesociclo(generateMesociclo());
    setLoading(false);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const getWeekProgress = (week: MesocicloWeek) => {
    const today = new Date();
    const weekStart = new Date(week.startDate);
    const weekEnd = new Date(week.endDate);
    
    if (today < weekStart) return 0;
    if (today > weekEnd) return 100;
    
    const totalDays = 7;
    const daysPassed = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  };

  const handleWeekClick = (week: MesocicloWeek) => {
    setSelectedWeek(week);
  };

  const closeWeekDetail = () => {
    setSelectedWeek(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Mesociclo</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Lista
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Leyenda</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Fases</h4>
                <div className="space-y-1">
                  {Object.entries(PHASE_COLORS).map(([phase, colors]) => (
                    <div key={phase} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors.split(' ')[0]}`}></div>
                      <span className="text-xs text-gray-600">{PHASE_LABELS[phase as keyof typeof PHASE_LABELS]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Intensidad</h4>
                <div className="space-y-1">
                  {Object.entries(INTENSITY_COLORS).map(([intensity, colors]) => (
                    <div key={intensity} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${colors}`}></div>
                      <span className="text-xs text-gray-600">{INTENSITY_LABELS[intensity as keyof typeof INTENSITY_LABELS]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mesociclo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentMesociclo.map((week) => {
            const progress = getWeekProgress(week);
            const isCurrentWeek = progress > 0 && progress < 100;
            const isPastWeek = progress === 100;
            const isFutureWeek = progress === 0;

            return (
              <div
                key={week.weekNumber}
                onClick={() => handleWeekClick(week)}
                className={`bg-white rounded-lg p-4 shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  isCurrentWeek
                    ? 'border-blue-400 bg-blue-50'
                    : isPastWeek
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Week Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Semana {week.weekNumber}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${PHASE_COLORS[week.phase]}`}>
                    {PHASE_LABELS[week.phase]}
                  </div>
                </div>

                {/* Date Range */}
                <p className="text-sm text-gray-600 mb-3">
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </p>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isCurrentWeek
                          ? 'bg-blue-500'
                          : isPastWeek
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Intensity */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Intensidad:</span>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${INTENSITY_COLORS[week.intensity]}`}>
                    {INTENSITY_LABELS[week.intensity]}
                  </div>
                </div>

                {/* Focus */}
                <div className="mb-2">
                  <span className="text-xs text-gray-600">Enfoque:</span>
                  <p className="text-xs font-medium text-gray-900">{week.focus}</p>
                </div>

                {/* Volume */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Volumen:</span>
                  <span className="text-xs font-medium text-gray-900">{week.volume} series</span>
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex justify-center">
                  {isCurrentWeek && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">En curso</span>
                    </div>
                  )}
                  {isPastWeek && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-xs font-medium">Completada</span>
                    </div>
                  )}
                  {isFutureWeek && (
                    <div className="flex items-center space-x-1 text-gray-400">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium">Pendiente</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Detail Modal */}
        {selectedWeek && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Semana {selectedWeek.weekNumber} - {PHASE_LABELS[selectedWeek.phase]}
                  </h2>
                  <button
                    onClick={closeWeekDetail}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Período</h3>
                    <p className="text-gray-900">
                      {selectedWeek.startDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} - {selectedWeek.endDate.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  {/* Phase and Intensity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Fase</h3>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${PHASE_COLORS[selectedWeek.phase]}`}>
                        {PHASE_LABELS[selectedWeek.phase]}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Intensidad</h3>
                      <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${INTENSITY_COLORS[selectedWeek.intensity]}`}>
                        {INTENSITY_LABELS[selectedWeek.intensity]}
                      </div>
                    </div>
                  </div>

                  {/* Focus */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Enfoque del Entrenamiento</h3>
                    <p className="text-gray-900">{selectedWeek.focus}</p>
                  </div>

                  {/* Volume */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Volumen Total</h3>
                    <p className="text-gray-900">{selectedWeek.volume} series por semana</p>
                  </div>

                  {/* Exercises */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Ejercicios Principales</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedWeek.exercises.map((exercise, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {exercise}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Progreso de la Semana</h3>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${getWeekProgress(selectedWeek)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.round(getWeekProgress(selectedWeek))}% completado
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={closeWeekDetail}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      showToast('Funcionalidad de edición en desarrollo', 'warning');
                      closeWeekDetail();
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Editar Semana
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}