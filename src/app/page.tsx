'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Navigation } from '@/components/Navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ToastContainer } from '@/components/ToastContainer';
import { MesocicloView } from '@/components/MesocicloView';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
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
          <MesocicloView onBack={() => setActiveSection('dashboard')} />
        )}
        {activeSection === 'history' && (
          <HistoryView onBack={() => setActiveSection('dashboard')} />
        )}
        {activeSection === 'settings' && (
          <SettingsView onBack={() => setActiveSection('dashboard')} />
        )}
      </main>

      <ToastContainer />
    </div>
  );
}
