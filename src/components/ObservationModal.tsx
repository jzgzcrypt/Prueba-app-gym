'use client';

import { useState } from 'react';
import { Observation, Task, ObservationModalProps } from '@/types/observations';
import { useToast } from '@/hooks/useToast';

export function ObservationModal({
  isOpen,
  onClose,
  observations,
  onResolveObservation,
  onAssignTask,
  onCompleteTask
}: ObservationModalProps) {
  const { showToast } = useToast();
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [resolution, setResolution] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Filtrar solo observaciones que requieren acción
  const actionableObservations = observations.filter(obs => obs.requiresAction);

  const handleResolveObservation = () => {
    if (!selectedObservation || !resolution.trim()) {
      showToast('Por favor ingresa una resolución', 'error');
      return;
    }

    onResolveObservation(selectedObservation.id);
    setSelectedObservation(null);
    setResolution('');
    showToast('Observación resuelta exitosamente', 'success');
  };

  const handleAssignTask = (task: Task) => {
    if (!assignedTo.trim()) {
      showToast('Por favor selecciona una persona para asignar', 'error');
      return;
    }

    onAssignTask(task.id, assignedTo);
    setAssignedTo('');
    showToast(`Tarea asignada a ${assignedTo}`, 'success');
  };

  const handleCompleteTask = (task: Task) => {
    onCompleteTask(task.id);
    showToast('Tarea marcada como completada', 'success');
  };

  const getObservationIcon = (type: Observation['type']) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            📋 Observaciones Pendientes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {actionableObservations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg">
              ✅ No hay observaciones pendientes de acción
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continuar con la Programación
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {actionableObservations.map((observation) => (
              <div
                key={observation.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {getObservationIcon(observation.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {observation.message}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(observation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {observation.field && (
                      <p className="text-sm text-gray-600 mb-2">
                        Campo: <span className="font-medium">{observation.field}</span>
                      </p>
                    )}

                    {observation.task && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <h4 className="font-medium text-gray-800 mb-2">
                          📝 Tarea Asociada: {observation.task.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {observation.task.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-1 rounded-full ${getPriorityColor(observation.task.priority)}`}>
                            {observation.task.priority.toUpperCase()}
                          </span>
                          <span className="text-gray-600">
                            Estado: {observation.task.status === 'pending' ? 'Pendiente' : 
                                   observation.task.status === 'in_progress' ? 'En Progreso' : 'Completada'}
                          </span>
                        </div>

                        {observation.task.status === 'pending' && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="Asignar a..."
                              value={assignedTo}
                              onChange={(e) => setAssignedTo(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                              onClick={() => handleAssignTask(observation.task!)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              Asignar
                            </button>
                          </div>
                        )}

                        {observation.task.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteTask(observation.task!)}
                            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            ✅ Marcar como Completada
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setSelectedObservation(observation)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        🔧 Resolver Observación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Modal para resolver observación */}
            {selectedObservation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">
                    Resolver Observación
                  </h3>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe cómo resolviste esta observación..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleResolveObservation}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => {
                        setSelectedObservation(null);
                        setResolution('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {actionableObservations.length > 0 && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ✅ Continuar con Programación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}