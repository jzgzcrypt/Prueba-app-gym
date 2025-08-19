'use client';

import { useState } from 'react';
import { CardioEntry } from '@/types';

interface CardioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tipo: string, duracion: number, intensidad: string, calorias: number) => void;
  currentCardio?: CardioEntry | null;
}

export function CardioModal({ isOpen, onClose, onSave, currentCardio }: CardioModalProps) {
  const [tipo, setTipo] = useState<string>(currentCardio?.tipo || 'cinta');
  const [duracion, setDuracion] = useState(currentCardio?.tiempo?.toString() || '');
  const [intensidad, setIntensidad] = useState(currentCardio?.intensidad || 'moderada');
  const [calorias, setCalorias] = useState(currentCardio?.calorias?.toString() || '');
  const [errors, setErrors] = useState<{ duracion?: string; calorias?: string }>({});

  const intensidadOptions = [
    { value: 'baja', label: 'Baja' },
    { value: 'moderada', label: 'Moderada' },
    { value: 'alta', label: 'Alta' },
    { value: 'muy alta', label: 'Muy Alta' },
  ];

  const tipoOptions = [
    { value: 'cinta', label: '🏃 Cinta de correr' },
    { value: 'bicicleta', label: '🚴 Bicicleta' },
    { value: 'eliptica', label: '🔄 Elíptica' },
    { value: 'natacion', label: '🏊 Natación' },
    { value: 'caminata', label: '🚶 Caminata' },
    { value: 'otro', label: '🎯 Otro' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: { duracion?: string; calorias?: string } = {};
    
    if (!duracion || parseInt(duracion) <= 0) {
      newErrors.duracion = 'Ingresa una duración válida';
    }
    
    if (!calorias || parseInt(calorias) <= 0) {
      newErrors.calorias = 'Ingresa calorías válidas';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(tipo, parseInt(duracion), intensidad, parseInt(calorias));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🏃 Seguimiento de Cardio</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cardio *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as string)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (minutos) *
              </label>
              <input
                type="number"
                value={duracion}
                onChange={(e) => {
                  setDuracion(e.target.value);
                  if (errors.duracion) setErrors(prev => ({ ...prev, duracion: undefined }));
                }}
                placeholder="30"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duracion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.duracion && (
                <p className="text-red-500 text-sm mt-1">{errors.duracion}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intensidad *
              </label>
              <select
                value={intensidad}
                onChange={(e) => setIntensidad(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {intensidadOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calorías Quemadas *
              </label>
              <input
                type="number"
                value={calorias}
                onChange={(e) => {
                  setCalorias(e.target.value);
                  if (errors.calorias) setErrors(prev => ({ ...prev, calorias: undefined }));
                }}
                placeholder="250"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.calorias ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.calorias && (
                <p className="text-red-500 text-sm mt-1">{errors.calorias}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                💾 Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}