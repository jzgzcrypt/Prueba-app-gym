'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { ProgressCircle } from '@/components/ProgressCircle';
import { WeightEntry, CardioEntry, DietEntry, DailyAdherence } from '@/types';

export default function Dashboard() {
  const { showToast } = useToast();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Local storage hooks
  const [estado, setEstado] = useLocalStorage<WeightEntry[]>('estado', []);
  const [cardio, setCardio] = useLocalStorage<CardioEntry[]>('cardio', []);
  const [dieta, setDieta] = useLocalStorage<DietEntry[]>('dieta', []);
  const [adherenciaDiaria, setAdherenciaDiaria] = useLocalStorage<DailyAdherence>('adherenciaDiaria', {});

  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [workoutType, setWorkoutType] = useState('Pull');
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

  const saveWorkout = (completed: boolean) => {
    const fecha = todayISO();
    const newAdherencia = { ...adherenciaDiaria };
    if (!newAdherencia[fecha]) newAdherencia[fecha] = {};
    newAdherencia[fecha].pesos = completed;
    
    setAdherenciaDiaria(newAdherencia);
    showToast(completed ? '✅ Entrenamiento completado' : '❌ Entrenamiento cancelado');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer />
      
      {/* Mobile Dashboard */}
      <div className="mobile-only">
        <div className="min-h-screen pb-20">
          {/* Header */}
          <div className="bg-white shadow-sm p-6">
            <h1 className="text-2xl font-bold text-center">Mi Entrenamiento</h1>
            <p className="text-center text-gray-600 mt-2">
              Hoy es {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          {/* Progress Overview */}
          <div className="p-6">
            <div className="mobile-card text-center">
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
            <div className="mobile-card" onClick={() => openModal('weight')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
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
            <div className="mobile-card" onClick={() => openModal('workout')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl">🏋️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Entrenamiento</h3>
                    <p className="text-sm text-gray-600">Pull - Espalda y Bíceps</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={getStatusClass('workout')}>{getStatus('workout')}</div>
                  <div className="text-xs text-gray-500">Toca para registrar</div>
                </div>
              </div>
            </div>
            
            {/* Cardio Entry */}
            <div className="mobile-card" onClick={() => openModal('cardio')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
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
            <div className="mobile-card" onClick={() => openModal('diet')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
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
        
        {/* Mobile Navigation */}
        <div className="mobile-nav">
          <div className="grid grid-cols-4 gap-2 px-4">
            <div className="mobile-nav-item active">
              <span className="text-2xl">📊</span>
              <span className="text-xs mt-1">Hoy</span>
            </div>
            <div className="mobile-nav-item">
              <span className="text-2xl">📈</span>
              <span className="text-xs mt-1">Progreso</span>
            </div>
            <div className="mobile-nav-item">
              <span className="text-2xl">📋</span>
              <span className="text-xs mt-1">Historial</span>
            </div>
            <div className="mobile-nav-item">
              <span className="text-2xl">⚙️</span>
              <span className="text-xs mt-1">Ajustes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="desktop-only">
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
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Pesaje Diario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                <input 
                  type="number" 
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  step="0.1" 
                  placeholder="85.0" 
                  className="w-full p-4 border rounded-lg text-lg"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 px-4 bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button onClick={saveWeight} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'workout' && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Entrenamiento</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select 
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="w-full p-4 border rounded-lg text-lg"
                >
                  <option value="Pull">🏋️ Pull - Espalda y Bíceps</option>
                  <option value="Push">💪 Push - Pecho y Tríceps</option>
                  <option value="Piernas">🦵 Piernas</option>
                  <option value="Descanso">😴 Descanso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">¿Completado?</label>
                <div className="flex gap-3">
                  <button onClick={() => saveWorkout(true)} className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg">
                    ✅ Sí
                  </button>
                  <button onClick={() => saveWorkout(false)} className="flex-1 py-3 px-4 bg-gray-200 rounded-lg">
                    ❌ No
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'cardio' && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Cardio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Distancia (km)</label>
                <input 
                  type="number" 
                  value={cardioKm}
                  onChange={(e) => setCardioKm(e.target.value)}
                  step="0.1" 
                  placeholder="3.5" 
                  className="w-full p-4 border rounded-lg text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tiempo (min)</label>
                <input 
                  type="number" 
                  value={cardioTime}
                  onChange={(e) => setCardioTime(e.target.value)}
                  placeholder="25" 
                  className="w-full p-4 border rounded-lg text-lg"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 px-4 bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button onClick={saveCardio} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'diet' && (
        <div className="modal active" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6 text-center">Dieta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Calorías</label>
                <input 
                  type="number" 
                  value={dietCalories}
                  onChange={(e) => setDietCalories(e.target.value)}
                  placeholder="1800" 
                  className="w-full p-4 border rounded-lg text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Proteínas (g)</label>
                <input 
                  type="number" 
                  value={dietProtein}
                  onChange={(e) => setDietProtein(e.target.value)}
                  placeholder="150" 
                  className="w-full p-4 border rounded-lg text-lg"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 px-4 bg-gray-200 rounded-lg">
                  Cancelar
                </button>
                <button onClick={saveDiet} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
