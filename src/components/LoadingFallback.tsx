'use client';

import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="nav-clean p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-primary">Mi Entrenamiento</h1>
            <p className="text-gray-600 mt-2">
              Cargando...
            </p>
          </div>
          <div className="flex-1"></div>
        </div>
      </div>
      
      {/* Loading Content */}
      <div className="px-6">
        <div className="clean-card text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    </div>
  );
};