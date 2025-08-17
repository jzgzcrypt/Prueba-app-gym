'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { WorkoutModal } from '@/components/WorkoutModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { getCurrentMesocicloDay } from '@/utils/mesocicloUtils';
import { 
  addWeightAction, 
  addCardioAction, 
  addNeatAction,
  addWorkoutAction,
  updateAdherenciaAction
} from '@/app/actions';

interface DashboardClientProps {
  initialData?: {
    weights?: Array<Record<string, unknown>>;
    cardio?: Array<Record<string, unknown>>;
    neat?: Array<Record<string, unknown>>;
    workouts?: Array<Record<string, unknown>>;
    seguimiento?: Array<Record<string, unknown>>;
    entrenosNoProgramados?: Array<Record<string, unknown>>;
    adherencia?: Array<Record<string, unknown>>;
    mesocicloConfig?: Record<string, unknown> | null;
  };
}

export default function DashboardClient({ initialData = {} }: DashboardClientProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'mesociclo' | 'history'>('today');
  
  // Estados del mesociclo
  const [currentData, setCurrentData] = useState(() => {
    try {
      return getCurrentMesocicloDay();
    } catch {
      return {
        microciclo: { nombre: 'Cargando...', dias: [] },
        dia: { 
          dia: 'Cargando...', 
          entrenamiento: 'Cargando...', 
          ejercicios: [],
          cardio: undefined
        },
        mesociclo: { nombre: 'Cargando...', microciclos: [] },
        semanaActual: 1,
        diaSemana: 0,
        diaMesociclo: 1,
        diasTranscurridos: 0,
        diasEnMicrociclo: 0,
        microcicloCompletado: false
      };
    }
  });

  // Actualizar datos del mesociclo cuando el componente se monta
  useEffect(() => {
    try {
      const updatedData = getCurrentMesocicloDay();
      setCurrentData(updatedData);
    } catch (error) {
      console.error('Error al actualizar datos del mesociclo:', error);
    }
  }, []);

  const todayISO = () => new Date().toISOString().split('T')[0];

  const calculateProgress = () => {
    // Calcular progreso basado en los datos del servidor
    const today = todayISO();
    const todayAdherence = initialData.adherencia?.find(a => 
      (a as { fecha?: string }).fecha === today
    );
    
    if (!todayAdherence) return 0;
    
    const tasks = ['workout', 'cardio', 'neat'] as const;
    const completed = tasks.filter(task => 
      (todayAdherence as Record<string, unknown>)[task]
    ).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const openModal = (type: string) => {
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Handlers para los formularios
  const handleAddWeight = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addWeightAction(formData);
      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error al guardar peso', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCardio = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addCardioAction(formData);
      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        // Actualizar adherencia
        const adherenciaForm = new FormData();
        adherenciaForm.append('fecha', todayISO());
        adherenciaForm.append('cardio', 'true');
        await updateAdherenciaAction(adherenciaForm);
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error al guardar cardio', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNeat = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addNeatAction(formData);
      if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        // Actualizar adherencia
        const adherenciaForm = new FormData();
        adherenciaForm.append('fecha', todayISO());
        adherenciaForm.append('neat', 'true');
        await updateAdherenciaAction(adherenciaForm);
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error al guardar NEAT', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteWorkout = async (exercises: Array<Record<string, unknown>>) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('fecha', todayISO());
      formData.append('entrenamiento', currentData.dia.entrenamiento);
      formData.append('ejercicios', JSON.stringify(exercises));
      
      const result = await addWorkoutAction(formData);
      if (result.success) {
        showToast('Entrenamiento completado', 'success');
        closeModal();
        // Actualizar adherencia
        const adherenciaForm = new FormData();
        adherenciaForm.append('fecha', todayISO());
        adherenciaForm.append('workout', 'true');
        await updateAdherenciaAction(adherenciaForm);
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error al guardar entrenamiento', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer />
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Mi Entrenamiento
            </h1>
            <div className="flex items-center gap-4">
              <ProgressCircle progress={calculateProgress()} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('today')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'today'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setActiveSection('mesociclo')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'mesociclo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Mesociclo
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'today' && (
          <div className="space-y-6">
            {/* Today's Workout Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                Entrenamiento de Hoy
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {currentData.dia.dia}
                  </p>
                  <p className="text-xl font-bold">
                    {currentData.dia.entrenamiento}
                  </p>
                </div>
                {currentData.dia.entrenamiento !== 'Descanso activo' && (
                  <button
                    onClick={() => openModal('workout')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    Iniciar Entrenamiento
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => openModal('weight')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <span className="text-2xl">⚖️</span>
                <p className="mt-2 text-sm">Peso</p>
              </button>
              <button
                onClick={() => openModal('cardio')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <span className="text-2xl">🏃</span>
                <p className="mt-2 text-sm">Cardio</p>
              </button>
              <button
                onClick={() => openModal('neat')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <span className="text-2xl">🚶</span>
                <p className="mt-2 text-sm">NEAT</p>
              </button>
              <button
                onClick={() => openModal('seguimiento')}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
              >
                <span className="text-2xl">📊</span>
                <p className="mt-2 text-sm">Seguimiento</p>
              </button>
            </div>
          </div>
        )}

        {activeSection === 'mesociclo' && (
          <div className="space-y-6">
            <WeeklyCalendar />
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {currentData.mesociclo.nombre}
              </h2>
              <div className="space-y-2 text-sm">
                <p>Semana: {currentData.semanaActual}</p>
                <p>Microciclo: {currentData.microciclo.nombre}</p>
                <p>Día del mesociclo: {currentData.diaMesociclo}</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Historial</h2>
            <p className="text-gray-600">
              Aquí se mostrará el historial de entrenamientos
            </p>
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'workout' && (
        <WorkoutModal
          isOpen={true}
          onClose={closeModal}
          onComplete={handleCompleteWorkout}
          workoutType={currentData.dia.entrenamiento}
        />
      )}

      {/* Weight Modal */}
      {activeModal === 'weight' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Registrar Peso</h3>
              <form action={handleAddWeight}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      name="peso"
                      step="0.1"
                      required
                      className="w-full p-2 border rounded-lg"
                      placeholder="75.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Cintura (cm)
                    </label>
                    <input
                      type="number"
                      name="cintura"
                      step="0.1"
                      className="w-full p-2 border rounded-lg"
                      placeholder="85.0"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Similar modals for cardio, neat, seguimiento... */}
    </div>
  );
}