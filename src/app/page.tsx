'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { WorkoutModal } from '@/components/WorkoutModal';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { WeightEntry, CardioEntry, DietEntry, DailyAdherence, WorkoutEntry } from '@/types';

export default function Dashboard() {
  const { showToast } = useToast();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'today' | 'progress' | 'history' | 'settings'>('today');
  const [workoutType] = useState('Pull');
  
  // Local storage hooks
  const [estado, setEstado] = useLocalStorage<WeightEntry[]>('estado', []);
  const [cardio, setCardio] = useLocalStorage<CardioEntry[]>('cardio', []);
  const [dieta, setDieta] = useLocalStorage<DietEntry[]>('dieta', []);
  const [workouts, setWorkouts] = useLocalStorage<WorkoutEntry[]>('workouts', []);
  const [adherenciaDiaria, setAdherenciaDiaria] = useLocalStorage<DailyAdherence>('adherenciaDiaria', {});

  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [cardioKm, setCardioKm] = useState('');
  const [cardioTime, setCardioTime] = useState('');
  const [dietCalories, setDietCalories] = useState('');
  const [dietProtein, setDietProtein] = useState('');

  // Desktop form states
  const [desktopWeight, setDesktopWeight] = useState('');
  const [desktopWorkout, setDesktopWorkout] = useState('');
  const [desktopCardio, setDesktopCardio] = useState('');

  const todayISO = () => new Date().toISOString().split('T')[0];

  const calculateProgress = () => {
    const today = todayISO();
    const todayAdherence = adherenciaDiaria[today] || {};
    const tasks = ['pesos', 'cardio', 'dieta'] as const;
    const completed = tasks.filter(task => todayAdherence[task]).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const openModal = (type: string) => {
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    // Reset form states
    setWeightInput('');
    setCardioKm('');
    setCardioTime('');
    setDietCalories('');
    setDietProtein('');
  };

  const handleWorkoutComplete = (workout: WorkoutEntry) => {
    const newWorkouts = [...workouts, workout];
    setWorkouts(newWorkouts);
    
    const fecha = todayISO();
    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].pesos = true;
    
    setAdherenciaDiaria(newAdherencia);
    showToast(`🎯 ¡Entrenamiento ${workout.tipo} completado!`);
    closeModal();
  };

  const saveWeight = () => {
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) {
      showToast('⚠️ Ingresa un peso válido', 'error');
      return;
    }

    const fecha = todayISO();
    const newEstado = estado.filter(e => e.fecha !== fecha);
    newEstado.push({ fecha, peso: weight, cintura: null });
    newEstado.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    
    setEstado(newEstado);
    showToast(`✅ Peso guardado: ${weight} kg`);
    closeModal();
  };



  const saveCardio = () => {
    const km = parseFloat(cardioKm);
    const time = parseInt(cardioTime);
    
    if (!km || !time || km <= 0 || time <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    const fecha = todayISO();
    const newCardio = cardio.filter(c => c.fecha !== fecha);
    newCardio.push({
      fecha,
      microciclo: 1,
      sesionId: 1,
      km,
      tiempo: time,
      ritmo: time / km,
      calorias: Math.round(time * 10)
    });

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].cardio = true;

    setCardio(newCardio);
    setAdherenciaDiaria(newAdherencia);
    showToast(`✅ Cardio guardado: ${km}km en ${time}min`);
    closeModal();
  };

  const saveDiet = () => {
    const calories = parseInt(dietCalories);
    const protein = parseInt(dietProtein);
    
    if (!calories || !protein || calories <= 0 || protein <= 0) {
      showToast('⚠️ Ingresa valores válidos', 'error');
      return;
    }

    const fecha = todayISO();
    const newDieta = dieta.filter(d => d.fecha !== fecha);
    newDieta.push({
      fecha,
      calorias: calories,
      proteinas: protein,
      carbos: Math.round((calories - protein * 4) * 0.4 / 4),
      grasas: Math.round((calories - protein * 4) * 0.2 / 9),
      ayuno: false
    });

    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].dieta = calories >= 1700 && calories <= 1900 && protein >= 150;

    setDieta(newDieta);
    setAdherenciaDiaria(newAdherencia);
    showToast('✅ Dieta guardada');
    closeModal();
  };

  const handleDesktopSave = () => {
    const savedItems = [];

    if (desktopWeight && parseFloat(desktopWeight) > 0) {
      const fecha = todayISO();
      const newEstado = estado.filter(e => e.fecha !== fecha);
      newEstado.push({ fecha, peso: parseFloat(desktopWeight), cintura: null });
      setEstado(newEstado);
      savedItems.push('Peso');
    }

    if (desktopWorkout && desktopWorkout !== 'Descanso') {
      const fecha = todayISO();
      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].pesos = true;
      setAdherenciaDiaria(newAdherencia);
      savedItems.push('Entrenamiento');
    }

    if (desktopCardio && parseFloat(desktopCardio) > 0) {
      const fecha = todayISO();
      const newCardio = cardio.filter(c => c.fecha !== fecha);
      newCardio.push({
        fecha,
        microciclo: 1,
        sesionId: 1,
        km: parseFloat(desktopCardio),
        tiempo: Math.round(parseFloat(desktopCardio) * 7),
        ritmo: Math.round(parseFloat(desktopCardio) * 7) / parseFloat(desktopCardio),
        calorias: Math.round(parseFloat(desktopCardio) * 7 * 10)
      });
      const newAdherencia = { ...adherenciaDiaria };
      if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
      newAdherencia[fecha].cardio = true;
      setCardio(newCardio);
      setAdherenciaDiaria(newAdherencia);
      savedItems.push('Cardio');
    }

    if (savedItems.length > 0) {
      showToast(`✅ Guardado: ${savedItems.join(', ')}`);
      setDesktopWeight('');
      setDesktopWorkout('');
      setDesktopCardio('');
    } else {
      showToast('⚠️ Introduce al menos un dato', 'warning');
    }
  };

  const getStatus = (type: 'weight' | 'workout' | 'cardio' | 'diet') => {
    const today = todayISO();
    const todayAdherence = adherenciaDiaria[today] || {};
    
    switch (type) {
      case 'weight':
        return estado.find(e => e.fecha === today) ? 'Completado' : 'Pendiente';
      case 'workout':
        return todayAdherence.pesos ? 'Completado' : 'Pendiente';
      case 'cardio':
        return todayAdherence.cardio ? 'Completado' : 'Pendiente';
      case 'diet':
        return todayAdherence.dieta ? 'Completado' : 'Pendiente';
      default:
        return 'Pendiente';
    }
  };

  const getStatusClass = (type: 'weight' | 'workout' | 'cardio' | 'diet') => {
    const status = getStatus(type);
    return `text-sm ${status === 'Completado' ? 'success' : 'pending'}`;
  };

  const progress = calculateProgress();

  const getWorkoutDescription = (type: string): string => {
    switch (type) {
      case 'Pull': return 'Espalda y Bíceps';
      case 'Push': return 'Pecho y Tríceps';
      case 'Piernas': return 'Piernas y Glúteos';
      default: return 'Entrenamiento';
    }
  };

  const renderTodaySection = () => (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="nav-modern p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gradient">Mi Entrenamiento</h1>
            <p className="text-gray-600 mt-2">
              Hoy es {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => openModal('calendar')}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:scale-110 transition-all"
            >
              <span className="text-xl">📅</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Overview */}
      <div className="p-6">
        <div className="modern-card text-center">
          <div className="flex justify-center mb-4">
            <ProgressCircle progress={progress} />
          </div>
          <p className="text-sm text-gray-600">Progreso del día</p>
        </div>
      </div>
      
      {/* Today's Tasks */}
      <div className="px-6">
        <h2 className="text-xl font-semibold mb-4">Hoy toca:</h2>
        
        {/* Weight Entry */}
        <div className="modern-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('weight')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">⚖️</span>
              </div>
              <div>
                <h3 className="font-semibold">Pesaje Diario</h3>
                <p className="text-sm text-gray-600">Registra tu peso de hoy</p>
              </div>
            </div>
            <div className="text-right">
              <div className={getStatusClass('weight')}>{getStatus('weight')}</div>
              <div className="text-xs text-gray-500">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Workout Entry */}
        <div className="modern-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('workout')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🏋️</span>
              </div>
              <div>
                <h3 className="font-semibold">Entrenamiento</h3>
                <p className="text-sm text-gray-600">{workoutType} - {getWorkoutDescription(workoutType)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={getStatusClass('workout')}>{getStatus('workout')}</div>
              <div className="text-xs text-gray-500">Toca para entrenar</div>
            </div>
          </div>
        </div>
        
        {/* Cardio Entry */}
        <div className="modern-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('cardio')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🏃</span>
              </div>
              <div>
                <h3 className="font-semibold">Cardio</h3>
                <p className="text-sm text-gray-600">25 min - 3.5 km</p>
              </div>
            </div>
            <div className="text-right">
              <div className={getStatusClass('cardio')}>{getStatus('cardio')}</div>
              <div className="text-xs text-gray-500">Toca para registrar</div>
            </div>
          </div>
        </div>
        
        {/* Diet Entry */}
        <div className="modern-card cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => openModal('diet')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🥗</span>
              </div>
              <div>
                <h3 className="font-semibold">Dieta</h3>
                <p className="text-sm text-gray-600">1800 kcal - 150g proteínas</p>
              </div>
            </div>
            <div className="text-right">
              <div className={getStatusClass('diet')}>{getStatus('diet')}</div>
              <div className="text-xs text-gray-500">Toca para registrar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgressSection = () => (
    <div className="min-h-screen pb-20 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Progreso</h1>
      
      {/* Weekly Stats */}
      <div className="mobile-card">
        <h3 className="font-semibold mb-4">Esta Semana</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.keys(adherenciaDiaria).filter(date => {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const checkDate = new Date(date);
                return checkDate >= weekStart && checkDate <= weekEnd && adherenciaDiaria[date].pesos;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Entrenamientos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(adherenciaDiaria).filter(date => {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                const checkDate = new Date(date);
                return checkDate >= weekStart && checkDate <= weekEnd && adherenciaDiaria[date].cardio;
              }).length}
            </div>
            <div className="text-sm text-gray-600">Sesiones Cardio</div>
          </div>
        </div>
      </div>

      {/* Weight Progress */}
      {estado.length > 0 && (
        <div className="mobile-card mt-4">
          <h3 className="font-semibold mb-4">Evolución del Peso</h3>
          <div className="space-y-3">
            {estado.slice(-7).map((entry, index) => (
              <div key={entry.fecha} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {new Date(entry.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                </span>
                <span className="font-semibold">{entry.peso.toFixed(1)} kg</span>
                {index > 0 && (
                  <span className={`text-xs ${entry.peso < estado[index - 1].peso ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.peso < estado[index - 1].peso ? '↓' : '↑'} {Math.abs(entry.peso - estado[index - 1].peso).toFixed(1)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderHistorySection = () => (
    <div className="min-h-screen pb-20 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Historial</h1>
      
      {/* Recent Activities */}
      <div className="space-y-4">
        {Object.keys(adherenciaDiaria)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 10)
          .map(date => {
            const adherence = adherenciaDiaria[date];
            const activities = [];
            if (adherence.pesos) activities.push('🏋️ Entrenamiento');
            if (adherence.cardio) activities.push('🏃 Cardio');
            if (adherence.dieta) activities.push('🥗 Dieta');
            
            return (
              <div key={date} className="mobile-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {new Date(date).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: '2-digit', 
                        month: 'long' 
                      })}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {activities.map((activity, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">✅</span>
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {Math.round((activities.length / 3) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="min-h-screen pb-20 p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Ajustes</h1>
      
      <div className="space-y-4">
        <div className="mobile-card">
          <h3 className="font-semibold mb-4">Datos</h3>
          <div className="space-y-3">
            <button 
              onClick={() => {
                const data = { estado, cardio, dieta, adherenciaDiaria };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gym-data.json';
                a.click();
                URL.revokeObjectURL(url);
                showToast('✅ Datos exportados');
              }}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Exportar Datos
            </button>
            <button 
              onClick={() => {
                if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
                  setEstado([]);
                  setCardio([]);
                  setDieta([]);
                  setAdherenciaDiaria({});
                  showToast('🗑️ Datos borrados');
                }
              }}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              🗑️ Borrar Todos los Datos
            </button>
          </div>
        </div>

        <div className="mobile-card">
          <h3 className="font-semibold mb-4">Información</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>📊 <strong>Total de registros:</strong> {estado.length + cardio.length + dieta.length}</p>
            <p>📅 <strong>Días activos:</strong> {Object.keys(adherenciaDiaria).length}</p>
            <p>🎯 <strong>Objetivo:</strong> 80 kg</p>
            <p>📱 <strong>Versión:</strong> 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <ToastContainer />
      
      {/* Mobile Dashboard */}
      <div className="block md:hidden">
        {activeSection === 'today' && renderTodaySection()}
        {activeSection === 'progress' && renderProgressSection()}
        {activeSection === 'history' && renderHistorySection()}
        {activeSection === 'settings' && renderSettingsSection()}
        
        {/* Mobile Navigation */}
        <div className="bottom-nav">
          <div className="grid grid-cols-4 gap-2 px-4">
            <div 
              className={`bottom-nav-item cursor-pointer ${activeSection === 'today' ? 'active' : ''}`}
              onClick={() => setActiveSection('today')}
            >
              <span className="text-2xl">📊</span>
              <span className="text-xs mt-1">Hoy</span>
            </div>
            <div 
              className={`bottom-nav-item cursor-pointer ${activeSection === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveSection('progress')}
            >
              <span className="text-2xl">📈</span>
              <span className="text-xs mt-1">Progreso</span>
            </div>
            <div 
              className={`bottom-nav-item cursor-pointer ${activeSection === 'history' ? 'active' : ''}`}
              onClick={() => setActiveSection('history')}
            >
              <span className="text-2xl">📋</span>
              <span className="text-xs mt-1">Historial</span>
            </div>
            <div 
              className={`bottom-nav-item cursor-pointer ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveSection('settings')}
            >
              <span className="text-2xl">⚙️</span>
              <span className="text-xs mt-1">Ajustes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="hidden md:block">
        <div className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Mi Entrenamiento</h1>
            
            {/* Quick Entry Form */}
            <div className="quick-entry">
              <h2 className="text-xl font-bold mb-6 text-center">Entrada Rápida de Hoy</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={desktopWeight}
                    onChange={(e) => setDesktopWeight(e.target.value)}
                    step="0.1" 
                    placeholder="85.0" 
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Entrenamiento</label>
                  <select 
                    value={desktopWorkout}
                    onChange={(e) => setDesktopWorkout(e.target.value)}
                    className="w-full"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Pull">🏋️ Pull</option>
                    <option value="Push">💪 Push</option>
                    <option value="Piernas">🦵 Piernas</option>
                    <option value="Cardio">🏃 Cardio</option>
                    <option value="Descanso">😴 Descanso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cardio (km)</label>
                  <input 
                    type="number" 
                    value={desktopCardio}
                    onChange={(e) => setDesktopCardio(e.target.value)}
                    step="0.1" 
                    placeholder="3.5" 
                    className="w-full"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleDesktopSave}
                    className="w-full bg-white text-purple-600 py-4 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    💾 Guardar Todo
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Progreso General</h3>
                <div className="flex justify-center">
                  <ProgressCircle progress={progress} size={90} />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Estado Actual</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peso</span>
                    <span className="font-bold">
                      {estado.length > 0 ? `${estado[estado.length - 1].peso.toFixed(1)} kg` : '85.0 kg'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(0, Math.min(100, ((85 - (estado.length > 0 ? estado[estado.length - 1].peso : 85)) / 5) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4">Completado Hoy</h3>
                <div className="space-y-3">
                  {[
                    { id: 'pesos', label: 'Entrenamiento', icon: '🏋️' },
                    { id: 'cardio', label: 'Cardio', icon: '🏃' },
                    { id: 'dieta', label: 'Dieta', icon: '🥗' }
                  ].map(task => {
                    const today = todayISO();
                    const todayAdherence = adherenciaDiaria[today] || {};
                    const completed = todayAdherence[task.id as keyof typeof todayAdherence];
                    
                    return (
                      <div key={task.id} className="flex items-center justify-between">
                        <span className="flex items-center">
                          <span className="mr-2">{task.icon}</span>
                          <span className="text-sm">{task.label}</span>
                        </span>
                        <span className={`text-sm ${completed ? 'text-green-600' : 'text-gray-500'}`}>
                          {completed ? '✅' : '⏳'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'weight' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>⚖️ Pesaje Diario</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Peso (kg)</label>
                  <input 
                    type="number" 
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    step="0.1" 
                    placeholder="85.0" 
                    className="input-modern"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveWeight} className="btn-modern btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'workout' && (
        <WorkoutModal
          isOpen={activeModal === 'workout'}
          onClose={closeModal}
          onComplete={handleWorkoutComplete}
          workoutType={workoutType}
        />
      )}

      {activeModal === 'calendar' && (
        <WeeklyCalendar
          isOpen={activeModal === 'calendar'}
          onClose={closeModal}
        />
      )}

      {activeModal === 'cardio' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🏃 Cardio</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Distancia (km)</label>
                  <input 
                    type="number" 
                    value={cardioKm}
                    onChange={(e) => setCardioKm(e.target.value)}
                    step="0.1" 
                    placeholder="3.5" 
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Tiempo (min)</label>
                  <input 
                    type="number" 
                    value={cardioTime}
                    onChange={(e) => setCardioTime(e.target.value)}
                    placeholder="25" 
                    className="input-modern"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveCardio} className="btn-modern btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'diet' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h3>🥗 Dieta</h3>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Calorías</label>
                  <input 
                    type="number" 
                    value={dietCalories}
                    onChange={(e) => setDietCalories(e.target.value)}
                    placeholder="1800" 
                    className="input-modern"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Proteínas (g)</label>
                  <input 
                    type="number" 
                    value={dietProtein}
                    onChange={(e) => setDietProtein(e.target.value)}
                    placeholder="150" 
                    className="input-modern"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="btn-modern btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button onClick={saveDiet} className="btn-modern btn-primary flex-1">
                    💾 Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
