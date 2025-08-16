'use client';

import React, { useState } from 'react';
import { TabNavigation, AnalyticsTab } from './TabNavigation';
import { WeightProgressChart } from './WeightProgressChart';
import { CalorieBurnChart } from './CalorieBurnChart';
import { ExerciseProgressChart } from './ExerciseProgressChart';
import { AdherenceHeatmap } from './AdherenceHeatmap';
import { InsightsEngine } from './InsightsEngine';
import { SmartAlerts } from './SmartAlerts';
import { WeightEntry, SeguimientoEntry, CardioEntry, NeatEntry, EntrenoNoProgramado, WorkoutEntry, DailyAdherence } from '@/types';

interface AnalyticsSectionProps {
  weights: WeightEntry[];
  seguimiento: SeguimientoEntry[];
  cardio: CardioEntry[];
  neat: NeatEntry[];
  entrenosNoProgramados: EntrenoNoProgramado[];
  workouts: WorkoutEntry[];
  adherenciaDiaria: DailyAdherence;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  weights,
  seguimiento,
  cardio,
  neat,
  entrenosNoProgramados,
  workouts,
  adherenciaDiaria
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('fisico');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'fisico':
        return (
          <WeightProgressChart 
            weights={weights} 
            seguimiento={seguimiento} 
          />
        );
      
      case 'actividad':
        return (
          <CalorieBurnChart 
            cardio={cardio}
            neat={neat}
            entrenosNoProgramados={entrenosNoProgramados}
          />
        );
      
      case 'entreno':
        return (
          <ExerciseProgressChart 
            workouts={workouts}
          />
        );
      
      case 'adherencia':
        return (
          <AdherenceHeatmap 
            adherenciaDiaria={adherenciaDiaria}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="nav-clean p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-primary">📊 Análisis de Progreso</h1>
            <p className="text-gray-600 mt-2">
              Visualiza tu progreso y tendencias
            </p>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6">
        {/* Insights Automáticos - Siempre visible */}
        <InsightsEngine
          weights={weights}
          seguimiento={seguimiento}
          cardio={cardio}
          neat={neat}
          entrenosNoProgramados={entrenosNoProgramados}
          workouts={workouts}
          adherenciaDiaria={adherenciaDiaria}
        />

        {/* Alertas Inteligentes */}
        <SmartAlerts
          weights={weights}
          seguimiento={seguimiento}
          cardio={cardio}
          neat={neat}
          entrenosNoProgramados={entrenosNoProgramados}
          workouts={workouts}
          adherenciaDiaria={adherenciaDiaria}
        />

        {/* Navegación por tabs */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Contenido del tab activo */}
        <div className="animate-fadeIn">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};