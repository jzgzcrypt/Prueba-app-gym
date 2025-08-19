'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';

interface UserSettings {
  // Personal Info
  name: string;
  email: string;
  age: number;
  height: number;
  gender: 'male' | 'female' | 'other';
  
  // Goals
  weightGoal: number;
  waistGoal: number;
  cardioGoal: number; // minutes per week
  neatGoal: number; // steps per day
  
  // Units
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
  distanceUnit: 'km' | 'mi';
  
  // Notifications
  weightReminder: boolean;
  cardioReminder: boolean;
  workoutReminder: boolean;
  measurementReminder: boolean;
  reminderTime: string;
  
  // Preferences
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  autoBackup: boolean;
  dataSharing: boolean;
}

interface SettingsViewProps {
  onBack: () => void;
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Usuario',
    email: 'usuario@ejemplo.com',
    age: 30,
    height: 175,
    gender: 'male',
    weightGoal: 70,
    waistGoal: 80,
    cardioGoal: 150,
    neatGoal: 8000,
    weightUnit: 'kg',
    heightUnit: 'cm',
    distanceUnit: 'km',
    weightReminder: true,
    cardioReminder: true,
    workoutReminder: true,
    measurementReminder: false,
    reminderTime: '20:00',
    theme: 'light',
    language: 'es',
    autoBackup: true,
    dataSharing: false,
  });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'units' | 'notifications' | 'preferences'>('profile');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Simular carga de configuración
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    };
    
    loadSettings();
  }, []);

  const handleSettingChange = (key: keyof UserSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasChanges(false);
      showToast('Configuración guardada exitosamente', 'success');
    } catch {
      showToast('Error al guardar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración?')) {
      setSettings({
        name: 'Usuario',
        email: 'usuario@ejemplo.com',
        age: 30,
        height: 175,
        gender: 'male',
        weightGoal: 70,
        waistGoal: 80,
        cardioGoal: 150,
        neatGoal: 8000,
        weightUnit: 'kg',
        heightUnit: 'cm',
        distanceUnit: 'km',
        weightReminder: true,
        cardioReminder: true,
        workoutReminder: true,
        measurementReminder: false,
        reminderTime: '20:00',
        theme: 'light',
        language: 'es',
        autoBackup: true,
        dataSharing: false,
      });
      setHasChanges(false);
      showToast('Configuración restablecida', 'success');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'goals', label: 'Objetivos', icon: '🎯' },
    { id: 'units', label: 'Unidades', icon: '📏' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'preferences', label: 'Preferencias', icon: '⚙️' },
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
            <div className="flex space-x-2">
              {hasChanges && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : '💾 Guardar'}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => handleSettingChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edad
                      </label>
                      <input
                        type="number"
                        value={settings.age}
                        onChange={(e) => handleSettingChange('age', parseInt(e.target.value))}
                        min="1"
                        max="120"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Altura ({settings.heightUnit})
                      </label>
                      <input
                        type="number"
                        value={settings.height}
                        onChange={(e) => handleSettingChange('height', parseInt(e.target.value))}
                        min="50"
                        max="300"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género
                      </label>
                      <select
                        value={settings.gender}
                        onChange={(e) => handleSettingChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="male">Masculino</option>
                        <option value="female">Femenino</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals Tab */}
              {activeTab === 'goals' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Objetivos de Entrenamiento</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Peso objetivo ({settings.weightUnit})
                      </label>
                      <input
                        type="number"
                        value={settings.weightGoal}
                        onChange={(e) => handleSettingChange('weightGoal', parseFloat(e.target.value))}
                        step="0.1"
                        min="30"
                        max="200"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cintura objetivo (cm)
                      </label>
                      <input
                        type="number"
                        value={settings.waistGoal}
                        onChange={(e) => handleSettingChange('waistGoal', parseInt(e.target.value))}
                        min="50"
                        max="150"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardio semanal (minutos)
                      </label>
                      <input
                        type="number"
                        value={settings.cardioGoal}
                        onChange={(e) => handleSettingChange('cardioGoal', parseInt(e.target.value))}
                        min="30"
                        max="600"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pasos diarios objetivo
                      </label>
                      <input
                        type="number"
                        value={settings.neatGoal}
                        onChange={(e) => handleSettingChange('neatGoal', parseInt(e.target.value))}
                        min="1000"
                        max="20000"
                        step="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Units Tab */}
              {activeTab === 'units' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Unidades de Medida</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de peso
                      </label>
                      <select
                        value={settings.weightUnit}
                        onChange={(e) => handleSettingChange('weightUnit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">Kilogramos (kg)</option>
                        <option value="lbs">Libras (lbs)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de altura
                      </label>
                      <select
                        value={settings.heightUnit}
                        onChange={(e) => handleSettingChange('heightUnit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cm">Centímetros (cm)</option>
                        <option value="ft">Pies (ft)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de distancia
                      </label>
                      <select
                        value={settings.distanceUnit}
                        onChange={(e) => handleSettingChange('distanceUnit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="km">Kilómetros (km)</option>
                        <option value="mi">Millas (mi)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones y Recordatorios</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Recordatorio de peso</h3>
                        <p className="text-sm text-gray-600">Recordatorio diario para registrar tu peso</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.weightReminder}
                          onChange={(e) => handleSettingChange('weightReminder', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Recordatorio de cardio</h3>
                        <p className="text-sm text-gray-600">Recordatorio para realizar cardio</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.cardioReminder}
                          onChange={(e) => handleSettingChange('cardioReminder', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Recordatorio de entrenamiento</h3>
                        <p className="text-sm text-gray-600">Recordatorio para completar entrenamientos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.workoutReminder}
                          onChange={(e) => handleSettingChange('workoutReminder', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Recordatorio de medidas</h3>
                        <p className="text-sm text-gray-600">Recordatorio semanal para medidas corporales</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.measurementReminder}
                          onChange={(e) => handleSettingChange('measurementReminder', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora de recordatorios
                      </label>
                      <input
                        type="time"
                        value={settings.reminderTime}
                        onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de la Aplicación</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tema
                      </label>
                      <select
                        value={settings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Oscuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Respaldo automático</h3>
                        <p className="text-sm text-gray-600">Respaldar datos automáticamente en la nube</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Compartir datos</h3>
                        <p className="text-sm text-gray-600">Permitir análisis anónimo de datos para mejorar la app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.dataSharing}
                          onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      🔄 Restablecer Configuración
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}