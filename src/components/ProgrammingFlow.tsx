'use client';

import { useState } from 'react';
import { ProgrammingRequest, Observation } from '@/types/observations';
import { ObservationModal } from './ObservationModal';
import { useToast } from '@/hooks/useToast';

interface ProgrammingFlowProps {
  onComplete: (request: ProgrammingRequest) => void;
}

export function ProgrammingFlow({ onComplete }: ProgrammingFlowProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<'input' | 'review' | 'observations' | 'assignment' | 'complete'>('input');
  const [programmingRequest, setProgrammingRequest] = useState<ProgrammingRequest>({
    id: '',
    title: '',
    description: '',
    requester: '',
    status: 'draft',
    observations: [],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [showObservationsModal, setShowObservationsModal] = useState(false);
  const [availablePeople] = useState<string[]>([
    'Juan Pérez',
    'María García',
    'Carlos López',
    'Ana Rodríguez',
    'Luis Martínez'
  ]);

  // Generar observaciones de ejemplo basadas en el contenido
  const generateObservations = (request: ProgrammingRequest): Observation[] => {
    const observations: Observation[] = [];
    
    if (!request.title.trim()) {
      observations.push({
        id: 'obs-1',
        type: 'error',
        message: 'El título es obligatorio',
        field: 'title',
        requiresAction: true,
        createdAt: new Date()
      });
    }

    if (request.description.length < 50) {
      observations.push({
        id: 'obs-2',
        type: 'warning',
        message: 'La descripción es muy corta. Se recomienda al menos 50 caracteres.',
        field: 'description',
        requiresAction: true,
        task: {
          id: 'task-1',
          title: 'Ampliar descripción',
          description: 'Completar la descripción con más detalles sobre la programación requerida',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date()
        },
        createdAt: new Date()
      });
    }

    if (!request.requester.trim()) {
      observations.push({
        id: 'obs-3',
        type: 'error',
        message: 'Debe especificar quién solicita la programación',
        field: 'requester',
        requiresAction: true,
        createdAt: new Date()
      });
    }

    // Agregar algunas observaciones informativas
    if (request.description.includes('urgente')) {
      observations.push({
        id: 'obs-4',
        type: 'info',
        message: 'Se detectó palabra "urgente" en la descripción. Considerar prioridad alta.',
        requiresAction: false,
        createdAt: new Date()
      });
    }

    return observations;
  };

  const handleSubmitRequest = () => {
    if (!programmingRequest.title.trim() || !programmingRequest.requester.trim()) {
      showToast('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    const observations = generateObservations(programmingRequest);
    const updatedRequest = {
      ...programmingRequest,
      observations,
      tasks: observations.filter(obs => obs.task).map(obs => obs.task!),
      status: 'review' as const,
      updatedAt: new Date()
    };

    setProgrammingRequest(updatedRequest);
    setCurrentStep('review');
  };

  const handleReviewComplete = () => {
    const actionableObservations = programmingRequest.observations.filter(obs => obs.requiresAction);
    
    if (actionableObservations.length > 0) {
      setShowObservationsModal(true);
      setCurrentStep('observations');
    } else {
      setCurrentStep('assignment');
    }
  };

  const handleObservationsResolved = () => {
    setShowObservationsModal(false);
    setCurrentStep('assignment');
  };

  const handleResolveObservation = (observationId: string) => {
    const updatedObservations = programmingRequest.observations.map(obs => 
      obs.id === observationId 
        ? { ...obs, resolvedAt: new Date() }
        : obs
    );

    setProgrammingRequest({
      ...programmingRequest,
      observations: updatedObservations
    });
  };

  const handleAssignTask = (taskId: string, assignedTo: string) => {
    const updatedTasks = programmingRequest.tasks.map(task =>
      task.id === taskId
        ? { ...task, assignedTo, status: 'in_progress' as const }
        : task
    );

    setProgrammingRequest({
      ...programmingRequest,
      tasks: updatedTasks
    });
  };

  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = programmingRequest.tasks.map(task =>
      task.id === taskId
        ? { ...task, status: 'completed' as const, completedAt: new Date() }
        : task
    );

    setProgrammingRequest({
      ...programmingRequest,
      tasks: updatedTasks
    });
  };

  const handleAssignPerson = (assignedTo: string) => {
    const updatedRequest = {
      ...programmingRequest,
      assignedTo,
      status: 'approved' as const,
      updatedAt: new Date()
    };

    setProgrammingRequest(updatedRequest);
    setCurrentStep('complete');
    showToast(`Programación asignada a ${assignedTo}`, 'success');
  };

  const handleCompleteProgramming = () => {
    const finalRequest = {
      ...programmingRequest,
      status: 'completed' as const,
      completedAt: new Date()
    };

    onComplete(finalRequest);
    showToast('Programación completada exitosamente', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header con progreso */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          📋 Flujo de Programación
        </h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            {['input', 'review', 'observations', 'assignment', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step 
                    ? 'bg-blue-600 text-white' 
                    : index < ['input', 'review', 'observations', 'assignment', 'complete'].indexOf(currentStep)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    index < ['input', 'review', 'observations', 'assignment', 'complete'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-600">
            Paso {['input', 'review', 'observations', 'assignment', 'complete'].indexOf(currentStep) + 1} de 5
          </div>
        </div>
      </div>

      {/* Paso 1: Input */}
      {currentStep === 'input' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Información de la Programación</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Título * <span className="text-red-500">(Obligatorio)</span>
              </label>
              <input
                id="title"
                type="text"
                value={programmingRequest.title}
                onChange={(e) => setProgrammingRequest({
                  ...programmingRequest,
                  title: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Programación de mantenimiento semanal"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción * <span className="text-red-500">(Obligatorio)</span>
              </label>
              <textarea
                id="description"
                value={programmingRequest.description}
                onChange={(e) => setProgrammingRequest({
                  ...programmingRequest,
                  description: e.target.value
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe detalladamente la programación requerida..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {programmingRequest.description.length}/500 caracteres
              </p>
            </div>

            <div>
              <label htmlFor="requester" className="block text-sm font-medium text-gray-700 mb-2">
                Solicitante * <span className="text-red-500">(Obligatorio)</span>
              </label>
              <input
                id="requester"
                type="text"
                value={programmingRequest.requester}
                onChange={(e) => setProgrammingRequest({
                  ...programmingRequest,
                  requester: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del solicitante"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitRequest}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Review */}
      {currentStep === 'review' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">👀 Revisión de la Solicitud</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Título</h3>
              <p className="text-gray-600">{programmingRequest.title}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Descripción</h3>
              <p className="text-gray-600">{programmingRequest.description}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Solicitante</h3>
              <p className="text-gray-600">{programmingRequest.requester}</p>
            </div>

            {programmingRequest.observations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Observaciones Encontradas ({programmingRequest.observations.length})
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {programmingRequest.observations.map(obs => (
                    <li key={obs.id}>• {obs.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep('input')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ← Volver
            </button>
            <button
              onClick={handleReviewComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Assignment */}
      {currentStep === 'assignment' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">👤 Asignación de Persona</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Selecciona la persona responsable de ejecutar esta programación:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePeople.map(person => (
                <button
                  key={person}
                  onClick={() => handleAssignPerson(person)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-gray-800">{person}</div>
                  <div className="text-sm text-gray-600">Disponible</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep('review')}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Complete */}
      {currentStep === 'complete' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">✅ Programación Completada</h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-medium text-green-800">
                  Programación Asignada Exitosamente
                </h3>
                <p className="text-green-700">
                  La programación ha sido asignada a <strong>{programmingRequest.assignedTo}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Título:</strong> {programmingRequest.title}</div>
                <div><strong>Asignado a:</strong> {programmingRequest.assignedTo}</div>
                <div><strong>Estado:</strong> {programmingRequest.status}</div>
                <div><strong>Fecha de creación:</strong> {programmingRequest.createdAt.toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCompleteProgramming}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Finalizar Programación
            </button>
          </div>
        </div>
      )}

      {/* Modal de Observaciones */}
      <ObservationModal
        isOpen={showObservationsModal}
        onClose={handleObservationsResolved}
        observations={programmingRequest.observations}
        onResolveObservation={handleResolveObservation}
        onAssignTask={handleAssignTask}
        onCompleteTask={handleCompleteTask}
      />
    </div>
  );
}