'use client';

import { useState } from 'react';
import { SeguimientoEntry } from '@/types';

interface SeguimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (peso: number, cintura: number, porcentajeGraso?: number, notas?: string) => void;
  currentSeguimiento?: SeguimientoEntry | null;
}

export function SeguimientoModal({ isOpen, onClose, onSave, currentSeguimiento }: SeguimientoModalProps) {
  const [peso, setPeso] = useState(currentSeguimiento?.peso?.toString() || '');
  const [cintura, setCintura] = useState(currentSeguimiento?.cintura?.toString() || '');
  const [porcentajeGraso, setPorcentajeGraso] = useState(currentSeguimiento?.porcentajeGraso?.toString() || '');
  const [notas, setNotas] = useState(currentSeguimiento?.notas || '');
  const [errors, setErrors] = useState<{ peso?: string; cintura?: string; porcentajeGraso?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación
    const newErrors: { peso?: string; cintura?: string; porcentajeGraso?: string } = {};
    
    if (!peso || parseFloat(peso) <= 0) {
      newErrors.peso = 'Ingresa un peso válido';
    }
    
    if (!cintura || parseFloat(cintura) <= 0) {
      newErrors.cintura = 'Ingresa una medida de cintura válida';
    }
    
    if (porcentajeGraso && (parseFloat(porcentajeGraso) < 0 || parseFloat(porcentajeGraso) > 100)) {
      newErrors.porcentajeGraso = 'El porcentaje debe estar entre 0 y 100';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(
      parseFloat(peso),
      parseFloat(cintura),
      porcentajeGraso ? parseFloat(porcentajeGraso) : undefined,
      notas || undefined
    );
  };

  const clearErrors = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof errors];
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
            <h2 className="text-xl font-semibold text-gray-800">📏 Medidas Corporales</h2>
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
                value={peso}
                onChange={(e) => {
                  setPeso(e.target.value);
                  clearErrors('peso');
                }}
                step="0.1"
                placeholder="75.5"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.peso ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.peso && (
                <p className="text-red-500 text-sm mt-1">{errors.peso}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cintura (cm) *
              </label>
              <input
                type="number"
                value={cintura}
                onChange={(e) => {
                  setCintura(e.target.value);
                  clearErrors('cintura');
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje de Graso (%) - Opcional
              </label>
              <input
                type="number"
                value={porcentajeGraso}
                onChange={(e) => {
                  setPorcentajeGraso(e.target.value);
                  clearErrors('porcentajeGraso');
                }}
                step="0.1"
                placeholder="15.0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.porcentajeGraso ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.porcentajeGraso && (
                <p className="text-red-500 text-sm mt-1">{errors.porcentajeGraso}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas - Opcional
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del día..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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