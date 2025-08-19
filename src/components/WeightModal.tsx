'use client';

import { useState } from 'react';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weight: number, cintura?: number) => void;
  currentWeight?: number;
}

export function WeightModal({ isOpen, onClose, onSave, currentWeight }: WeightModalProps) {
  const [weight, setWeight] = useState(currentWeight?.toString() || '');
  const [cintura, setCintura] = useState('');
  const [errors, setErrors] = useState<{ weight?: string; cintura?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: { weight?: string; cintura?: string } = {};
    
    if (!weight || parseFloat(weight) <= 0) {
      newErrors.weight = 'Ingresa un peso válido';
    }
    
    if (cintura && parseFloat(cintura) <= 0) {
      newErrors.cintura = 'Ingresa una medida válida';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(parseFloat(weight), cintura ? parseFloat(cintura) : undefined);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">⚖️ Registro de Peso</h2>
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
                Peso (kg) *
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined }));
                }}
                step="0.1"
                placeholder="75.5"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cintura (cm) - Opcional
              </label>
              <input
                type="number"
                value={cintura}
                onChange={(e) => {
                  setCintura(e.target.value);
                  if (errors.cintura) setErrors(prev => ({ ...prev, cintura: undefined }));
                }}
                step="0.1"
                placeholder="85.0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cintura ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cintura && (
                <p className="text-red-500 text-sm mt-1">{errors.cintura}</p>
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