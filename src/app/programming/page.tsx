'use client';

import { useState } from 'react';
import { ProgrammingFlow } from '@/components/ProgrammingFlow';
import { ProgrammingRequest } from '@/types/observations';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function ProgrammingPage() {
  const { showToast } = useToast();
  const [completedRequests, setCompletedRequests] = useState<ProgrammingRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleComplete = (request: ProgrammingRequest) => {
    setCompletedRequests(prev => [request, ...prev]);
    showToast('Programación completada y guardada', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                ← Volver al Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Sistema de Programación
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                {showHistory ? 'Nueva Programación' : `Historial (${completedRequests.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!showHistory ? (
          <ProgrammingFlow onComplete={handleComplete} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                📊 Historial de Programaciones
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Nueva Programación
              </button>
            </div>

            {completedRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay programaciones completadas
                </h3>
                <p className="text-gray-600">
                  Crea tu primera programación para ver el historial aquí.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {completedRequests.map((request, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {request.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Solicitado por: {request.requester}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.status === 'completed' ? 'Completada' : 'Aprobada'}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {request.completedAt?.toLocaleDateString() || request.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Asignado a:</span>
                        <p className="text-gray-800">{request.assignedTo}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Observaciones:</span>
                        <p className="text-gray-800">{request.observations.length}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Tareas:</span>
                        <p className="text-gray-800">{request.tasks.length}</p>
                      </div>
                    </div>

                    {request.observations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-2">Observaciones:</h4>
                        <ul className="space-y-1">
                          {request.observations.map(obs => (
                            <li key={obs.id} className="text-sm text-gray-600 flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                obs.type === 'error' ? 'bg-red-500' :
                                obs.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                              }`} />
                              {obs.message}
                              {obs.resolvedAt && (
                                <span className="text-green-600 text-xs">✓ Resuelta</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}