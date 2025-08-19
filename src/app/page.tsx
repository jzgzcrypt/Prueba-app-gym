'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Navigation } from '@/components/Navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ToastContainer } from '@/components/ToastContainer';
import { useToast } from '@/hooks/useToast';

export default function HomePage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'mesociclo' | 'history' | 'settings'>('dashboard');

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
      />
      
      <main className="container mx-auto px-4 py-6">
        {activeSection === 'dashboard' && (
          <Dashboard showToast={showToast} />
        )}
        {activeSection === 'mesociclo' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📅 Visualización del Mesociclo
            </h2>
            <p className="text-gray-600">
              Vista macro de semanas de entrenamiento - En desarrollo
            </p>
          </div>
        )}
        {activeSection === 'history' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📊 Historial de Progresos
            </h2>
            <p className="text-gray-600">
              Gráficas de NEAT, cardio, peso, medidas y entrenamientos - En desarrollo
            </p>
          </div>
        )}
        {activeSection === 'settings' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ⚙️ Configuración
            </h2>
            <p className="text-gray-600">
              Parámetros de usuario, unidades y recordatorios - En desarrollo
            </p>
          </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}
