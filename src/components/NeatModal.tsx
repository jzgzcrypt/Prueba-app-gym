'use client';

import { useState } from 'react';
import { NeatEntry } from '@/types';

interface NeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tipo: 'pasos' | 'cinta', duracion: number, calorias: number, pasos?: number, ritmo?: string, km?: number, ritmoKmH?: number, inclinacion?: number) => void;
  currentNeat?: NeatEntry | null;
}

export function NeatModal({ isOpen, onClose, onSave, currentNeat }: NeatModalProps) {
  const [tipo, setTipo] = useState<'pasos' | 'cinta'>(currentNeat?.tipo || 'pasos');
  const [duracion, setDuracion] = useState(currentNeat?.duracion?.toString() || '');
  const [calorias, setCalorias] = useState(currentNeat?.calorias?.toString() || '');
  
  // Campos para pasos
  const [pasos, setPasos] = useState(currentNeat?.pasos?.toString() || '');
  const [ritmo, setRitmo] = useState(currentNeat?.ritmo || 'andar normal');
  
  // Campos para cinta
  const [km, setKm] = useState(currentNeat?.km?.toString() || '');
  const [ritmoKmH, setRitmoKmH] = useState(currentNeat?.ritmoKmH?.toString() || '');
  const [inclinacion, setInclinacion] = useState(currentNeat?.inclinacion?.toString() || '');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const ritmoOptions = [
    { value: 'ritmo rápido', label: 'Ritmo rápido' },
    { value: 'andar normal', label: 'Andar normal' },
    { value: 'caminar rápido', label: 'Caminar rápido' },
    { value: 'paseo', label: 'Paseo' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: { [key: string]: string } = {};
    
    if (!duracion || parseInt(duracion) <= 0) {
      newErrors.duracion = 'Ingresa una duración válida';
    }
    
    if (!calorias || parseInt(calorias) <= 0) {
      newErrors.calorias = 'Ingresa calorías válidas';
    }
    
    if (tipo === 'pasos') {
      if (!pasos || parseInt(pasos) <= 0) {
        newErrors.pasos = 'Ingresa un número de pasos válido';
      }
      if (!ritmo) {
        newErrors.ritmo = 'Selecciona un ritmo';
      }
    } else {
      if (!km || parseFloat(km) <= 0) {
        newErrors.km = 'Ingresa kilómetros válidos';
      }
      if (!ritmoKmH || parseFloat(ritmoKmH) <= 0) {
        newErrors.ritmoKmH = 'Ingresa un ritmo válido';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(
      tipo,
      parseInt(duracion),
      parseInt(calorias),
      tipo === 'pasos' ? parseInt(pasos) : undefined,
      tipo === 'pasos' ? ritmo : undefined,
      tipo === 'cinta' ? parseFloat(km) : undefined,
      tipo === 'cinta' ? parseFloat(ritmoKmH) : undefined,
      tipo === 'cinta' ? parseFloat(inclinacion) : undefined
    );
  };

  const clearErrors = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">🚶 Registro de NEAT</h2>
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
                Tipo de Registro *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'pasos' | 'cinta')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pasos">Pasos y ritmo</option>
                <option value="cinta">Cinta (km, ritmo, inclinación)</option>
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
                  clearErrors('duracion');
                }}
                placeholder="60"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duracion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.duracion && (
                <p className="text-red-500 text-sm mt-1">{errors.duracion}</p>
              )}
            </div>

            {tipo === 'pasos' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Pasos *
                  </label>
                  <input
                    type="number"
                    value={pasos}
                    onChange={(e) => {
                      setPasos(e.target.value);
                      clearErrors('pasos');
                    }}
                    placeholder="8000"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.pasos ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.pasos && (
                    <p className="text-red-500 text-sm mt-1">{errors.pasos}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ritmo *
                  </label>
                  <select
                    value={ritmo}
                    onChange={(e) => {
                      setRitmo(e.target.value);
                      clearErrors('ritmo');
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ritmo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {ritmoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.ritmo && (
                    <p className="text-red-500 text-sm mt-1">{errors.ritmo}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kilómetros *
                  </label>
                  <input
                    type="number"
                    value={km}
                    onChange={(e) => {
                      setKm(e.target.value);
                      clearErrors('km');
                    }}
                    step="0.1"
                    placeholder="3.5"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.km ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.km && (
                    <p className="text-red-500 text-sm mt-1">{errors.km}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ritmo (km/h) *
                  </label>
                  <input
                    type="number"
                    value={ritmoKmH}
                    onChange={(e) => {
                      setRitmoKmH(e.target.value);
                      clearErrors('ritmoKmH');
                    }}
                    step="0.1"
                    placeholder="6.0"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ritmoKmH ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ritmoKmH && (
                    <p className="text-red-500 text-sm mt-1">{errors.ritmoKmH}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inclinación (%) - Opcional
                  </label>
                  <input
                    type="number"
                    value={inclinacion}
                    onChange={(e) => setInclinacion(e.target.value)}
                    step="0.5"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calorías Quemadas *
              </label>
              <input
                type="number"
                value={calorias}
                onChange={(e) => {
                  setCalorias(e.target.value);
                  clearErrors('calorias');
                }}
                placeholder="200"
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