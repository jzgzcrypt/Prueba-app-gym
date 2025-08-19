'use client';

import { useState, useEffect } from 'react';
import { WeightEntry, CardioEntry, NeatEntry, SeguimientoEntry, WorkoutEntry } from '@/types';
import { addWeightAction, addCardioAction, addNeatAction, addSeguimientoAction } from '@/app/actions';
import { WeightModal } from './WeightModal';
import { CardioModal } from './CardioModal';
import { NeatModal } from './NeatModal';
import { SeguimientoModal } from './SeguimientoModal';
import { WorkoutModal } from './WorkoutModal';

interface DashboardProps {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export function Dashboard({ showToast }: DashboardProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [todayData, setTodayData] = useState({
    weight: null as WeightEntry | null,
    cardio: null as CardioEntry | null,
    neat: null as NeatEntry | null,
    seguimiento: null as SeguimientoEntry | null,
    workout: null as WorkoutEntry | null,
  });

  const today = new Date().toISOString().split('T')[0];

  // Cargar datos del día actual
  useEffect(() => {
    // TODO: Implementar carga desde la base de datos
    // Por ahora usamos datos de ejemplo
  }, []);

  const openModal = (modalType: string) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleWeightSave = async (weight: number, cintura?: number) => {
    try {
      const formData = new FormData();
      formData.append('peso', weight.toString());
      if (cintura) formData.append('cintura', cintura.toString());
      formData.append('fecha', today);

      const result = await addWeightAction(formData);
      
      if (result.success) {
        setTodayData(prev => ({
          ...prev,
          weight: { fecha: today, peso: weight, cintura: cintura || null }
        }));
        showToast('✅ Peso guardado correctamente');
        closeModal();
      } else {
        showToast('❌ Error al guardar peso', 'error');
      }
    } catch {
      showToast('❌ Error al guardar peso', 'error');
    }
  };

  const handleCardioSave = async (tipo: string, duracion: number, intensidad: string, calorias: number) => {
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('duracion', duracion.toString());
      formData.append('intensidad', intensidad);
      formData.append('calorias', calorias.toString());
      formData.append('fecha', today);

      const result = await addCardioAction(formData);
      
      if (result.success) {
        setTodayData(prev => ({
          ...prev,
          cardio: { fecha: today, microciclo: 1, sesionId: 1, km: 0, tiempo: duracion, ritmo: 0, calorias, tipo: 'mesociclo' as const, intensidad }
        }));
        showToast('✅ Cardio guardado correctamente');
        closeModal();
      } else {
        showToast('❌ Error al guardar cardio', 'error');
      }
    } catch {
      showToast('❌ Error al guardar cardio', 'error');
    }
  };

  const handleNeatSave = async (tipo: 'pasos' | 'cinta', duracion: number, calorias: number, pasos?: number, ritmo?: string, km?: number, ritmoKmH?: number, inclinacion?: number) => {
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('duracion', duracion.toString());
      formData.append('calorias', calorias.toString());
      formData.append('fecha', today);
      
      if (pasos) formData.append('pasos', pasos.toString());
      if (ritmo) formData.append('ritmo', ritmo);
      if (km) formData.append('km', km.toString());
      if (ritmoKmH) formData.append('ritmoKmH', ritmoKmH.toString());
      if (inclinacion) formData.append('inclinacion', inclinacion.toString());

      const result = await addNeatAction(formData);
      
      if (result.success) {
        setTodayData(prev => ({
          ...prev,
          neat: { fecha: today, tipo, duracion, calorias, pasos, ritmo, km, ritmoKmH, inclinacion }
        }));
        showToast('✅ NEAT guardado correctamente');
        closeModal();
      } else {
        showToast('❌ Error al guardar NEAT', 'error');
      }
    } catch {
      showToast('❌ Error al guardar NEAT', 'error');
    }
  };

  const handleSeguimientoSave = async (peso: number, cintura: number, porcentajeGraso?: number, notas?: string) => {
    try {
      const formData = new FormData();
      formData.append('peso', peso.toString());
      formData.append('cintura', cintura.toString());
      formData.append('fecha', today);
      if (porcentajeGraso) formData.append('porcentajeGraso', porcentajeGraso.toString());
      if (notas) formData.append('notas', notas);

      const result = await addSeguimientoAction(formData);
      
      if (result.success) {
        setTodayData(prev => ({
          ...prev,
          seguimiento: { fecha: today, peso, cintura, porcentajeGraso, notas }
        }));
        showToast('✅ Seguimiento guardado correctamente');
        closeModal();
      } else {
        showToast('❌ Error al guardar seguimiento', 'error');
      }
    } catch {
      showToast('❌ Error al guardar seguimiento', 'error');
    }
  };

  const handleWorkoutComplete = (workout: WorkoutEntry) => {
    setTodayData(prev => ({
      ...prev,
      workout
    }));
    showToast('✅ Entrenamiento completado');
    closeModal();
  };

  const getStatus = (type: keyof typeof todayData) => {
    return todayData[type] ? 'Completado' : 'Pendiente';
  };

  const getStatusClass = (type: keyof typeof todayData) => {
    const status = getStatus(type);
    return status === 'Completado' ? 'text-green-600' : 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Dashboard Principal
        </h2>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Progreso del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'weight', label: 'Peso', icon: '⚖️' },
            { key: 'cardio', label: 'Cardio', icon: '🏃' },
            { key: 'neat', label: 'NEAT', icon: '🚶' },
            { key: 'workout', label: 'Entreno', icon: '🏋️' },
            { key: 'seguimiento', label: 'Medidas', icon: '📏' },
          ].map((item) => (
            <div key={item.key} className="text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-gray-600">{item.label}</div>
              <div className={`text-sm font-semibold ${getStatusClass(item.key as keyof typeof todayData)}`}>
                {getStatus(item.key as keyof typeof todayData)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Weight Entry */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openModal('weight')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
            <span className={`text-sm font-medium ${getStatusClass('weight')}`}>
              {getStatus('weight')}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Registro de Peso</h3>
          <p className="text-gray-600 text-sm">Registra tu peso diario para seguimiento</p>
          {todayData.weight && (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <span className="font-medium">Hoy: {todayData.weight.peso} kg</span>
            </div>
          )}
        </div>

        {/* Cardio Entry */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openModal('cardio')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏃</span>
            </div>
            <span className={`text-sm font-medium ${getStatusClass('cardio')}`}>
              {getStatus('cardio')}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Seguimiento de Cardio</h3>
          <p className="text-gray-600 text-sm">Registra tus sesiones de cardio</p>
          {todayData.cardio && (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <span className="font-medium">{todayData.cardio.tiempo} min - {todayData.cardio.intensidad}</span>
            </div>
          )}
        </div>

        {/* NEAT Entry */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openModal('neat')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚶</span>
            </div>
            <span className={`text-sm font-medium ${getStatusClass('neat')}`}>
              {getStatus('neat')}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Registro de NEAT</h3>
          <p className="text-gray-600 text-sm">Actividad física no estructurada</p>
          {todayData.neat && (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <span className="font-medium">{todayData.neat.calorias} kcal</span>
            </div>
          )}
        </div>

        {/* Workout Entry */}
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openModal('workout')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏋️</span>
            </div>
            <span className={`text-sm font-medium ${getStatusClass('workout')}`}>
              {getStatus('workout')}
            </span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Entrenamiento</h3>
          <p className="text-gray-600 text-sm">Completa tu rutina de hoy</p>
          {todayData.workout && (
            <div className="mt-3 p-2 bg-green-50 rounded text-sm">
              <span className="font-medium">{todayData.workout.tipo}</span>
            </div>
          )}
        </div>

        {/* Seguimiento Entry - Solo domingos */}
        {new Date().getDay() === 0 && (
          <div 
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => openModal('seguimiento')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📏</span>
              </div>
              <span className={`text-sm font-medium ${getStatusClass('seguimiento')}`}>
                {getStatus('seguimiento')}
              </span>
            </div>
            <h3 className="font-semibold text-lg mb-2">Medidas Corporales</h3>
            <p className="text-gray-600 text-sm">Seguimiento semanal</p>
            {todayData.seguimiento && (
              <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                <span className="font-medium">Cintura: {todayData.seguimiento.cintura} cm</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'weight' && (
        <WeightModal 
          isOpen={true} 
          onClose={closeModal} 
          onSave={handleWeightSave}
          currentWeight={todayData.weight?.peso}
        />
      )}

      {activeModal === 'cardio' && (
        <CardioModal 
          isOpen={true} 
          onClose={closeModal} 
          onSave={handleCardioSave}
          currentCardio={todayData.cardio}
        />
      )}

      {activeModal === 'neat' && (
        <NeatModal 
          isOpen={true} 
          onClose={closeModal} 
          onSave={handleNeatSave}
          currentNeat={todayData.neat}
        />
      )}

      {activeModal === 'seguimiento' && (
        <SeguimientoModal 
          isOpen={true} 
          onClose={closeModal} 
          onSave={handleSeguimientoSave}
          currentSeguimiento={todayData.seguimiento}
        />
      )}

      {activeModal === 'workout' && (
        <WorkoutModal 
          isOpen={true} 
          onClose={closeModal} 
          onComplete={handleWorkoutComplete}
        />
      )}
    </div>
  );
}