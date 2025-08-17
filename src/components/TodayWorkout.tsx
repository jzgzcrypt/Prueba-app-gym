'use client';

import { useState, useEffect } from 'react';
import { getCurrentMesocicloDay } from '@/utils/mesocicloUtils';
import { updateAdherenciaAction, setMesocicloConfigAction } from '@/app/actions';

interface TodayWorkoutProps {
  onStartWorkout: () => void;
  mesocicloConfig?: { fecha_inicio: string } | null;
}

export function TodayWorkout({ onStartWorkout, mesocicloConfig }: TodayWorkoutProps) {
  const [currentData, setCurrentData] = useState(() => getCurrentMesocicloDay());
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState<'enfermedad' | 'viaje' | 'trabajo' | 'otro'>('otro');
  const [adjustmentMode, setAdjustmentMode] = useState<'postpone' | 'skip' | 'adapt'>('adapt');
  
  // Actualizar cuando cambia la configuración del mesociclo
  useEffect(() => {
    if (mesocicloConfig?.fecha_inicio) {
      // Actualizar la fecha de inicio en el sistema
      setCurrentData(getCurrentMesocicloDay());
    }
  }, [mesocicloConfig]);

  // Actualizar cada día a medianoche
  useEffect(() => {
    const checkNewDay = () => {
      const now = new Date();
      const msUntilMidnight = 
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
      
      setTimeout(() => {
        setCurrentData(getCurrentMesocicloDay());
        checkNewDay(); // Programar para el siguiente día
      }, msUntilMidnight);
    };
    
    checkNewDay();
    
    return () => {
      // Cleanup si es necesario
    };
  }, []);

  const handleSkipWorkout = async () => {
    // Registrar que no se hizo el entrenamiento
    const formData = new FormData();
    formData.append('fecha', new Date().toISOString().split('T')[0]);
    formData.append('workout', 'false');
    
    await updateAdherenciaAction(formData);
    
    // Aplicar ajuste según el modo seleccionado
    if (adjustmentMode === 'postpone') {
      // Recalcular el mesociclo retrasando un día
      const newStartDate = new Date(mesocicloConfig?.fecha_inicio || new Date());
      newStartDate.setDate(newStartDate.getDate() - 1);
      
      const configForm = new FormData();
      configForm.append('fechaInicio', newStartDate.toISOString().split('T')[0]);
      await setMesocicloConfigAction(configForm);
    }
    
    setShowSkipModal(false);
    // Actualizar la vista
    setCurrentData(getCurrentMesocicloDay());
  };

  const isRestDay = currentData.dia.entrenamiento === 'Descanso activo';
  const isCardioDay = currentData.dia.cardio !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header con información del mesociclo */}
      <div className="border-b pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentData.dia.dia}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Semana {currentData.semanaActual} • {currentData.microciclo.nombre}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Día {currentData.diaMesociclo} del mesociclo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentData.diasEnMicrociclo} días en microciclo actual
            </p>
          </div>
        </div>
      </div>

      {/* Contenido principal del entrenamiento */}
      <div className="space-y-4">
        {isRestDay ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              🌿 Día de Descanso Activo
            </h3>
            <p className="text-sm text-green-700">
              Hoy es día de recuperación. Puedes hacer actividades suaves como caminar, 
              estiramientos o yoga ligero.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-green-800">Actividades recomendadas:</p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Caminata de 20-30 minutos</li>
                <li>• Estiramientos dinámicos</li>
                <li>• Movilidad articular</li>
                <li>• Respiración y meditación</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                💪 {currentData.dia.entrenamiento}
              </h3>
              
              {/* Lista de ejercicios */}
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-blue-800">
                  Ejercicios ({currentData.dia.ejercicios.length}):
                </p>
                <div className="space-y-1">
                  {currentData.dia.ejercicios.slice(0, 3).map((ejercicio, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <p className="text-sm text-blue-700">{ejercicio}</p>
                    </div>
                  ))}
                  {currentData.dia.ejercicios.length > 3 && (
                    <p className="text-xs text-blue-600 italic ml-7">
                      +{currentData.dia.ejercicios.length - 3} ejercicios más...
                    </p>
                  )}
                </div>
              </div>

              {/* Cardio si aplica */}
              {isCardioDay && currentData.dia.cardio && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-3">
                  <p className="text-sm font-medium text-orange-800">
                    🏃 Cardio: {currentData.dia.cardio.tipo}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    {currentData.dia.cardio.duracion} min • {currentData.dia.cardio.intensidad}
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={onStartWorkout}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                🎯 Iniciar Entrenamiento
              </button>
              <button
                onClick={() => setShowSkipModal(true)}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                title="No puedo entrenar hoy"
              >
                ⏭️
              </button>
            </div>
          </>
        )}

        {/* Información adicional del microciclo */}
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Objetivo del microciclo:</span> {currentData.microciclo.objetivo}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            <span className="font-medium">Intensidad:</span> {currentData.microciclo.intensidad}
          </p>
        </div>
      </div>

      {/* Modal para saltar entrenamiento */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowSkipModal(false)}></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                ¿No puedes entrenar hoy?
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Motivo:
                  </label>
                  <select
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value as typeof skipReason)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="enfermedad">Enfermedad/Lesión</option>
                    <option value="viaje">Viaje</option>
                    <option value="trabajo">Trabajo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ¿Cómo ajustar el plan?
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        value="adapt"
                        checked={adjustmentMode === 'adapt'}
                        onChange={(e) => setAdjustmentMode(e.target.value as typeof adjustmentMode)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">Adaptar automáticamente</p>
                        <p className="text-xs text-gray-600">
                          El sistema reorganizará los entrenamientos
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        value="postpone"
                        checked={adjustmentMode === 'postpone'}
                        onChange={(e) => setAdjustmentMode(e.target.value as typeof adjustmentMode)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">Posponer todo un día</p>
                        <p className="text-xs text-gray-600">
                          Retrasar el mesociclo completo
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="radio"
                        value="skip"
                        checked={adjustmentMode === 'skip'}
                        onChange={(e) => setAdjustmentMode(e.target.value as typeof adjustmentMode)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium">Saltar este día</p>
                        <p className="text-xs text-gray-600">
                          Continuar con el siguiente entrenamiento mañana
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkipModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSkipWorkout}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Confirmar
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