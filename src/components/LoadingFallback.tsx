'use client';

import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="glass-card text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="loading-spinner"></div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-blue-600 bg-clip-text text-transparent mb-2">
          Mi Entrenamiento
        </h2>
        <p className="text-gray-600">Cargando aplicación...</p>
        <div className="mt-6">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};