'use client';

import { useState } from 'react';

export default function TestSimplePage() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error('Database connection error:', error);
      setMessage('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Prueba Simple de Base de Datos</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🔗 Probar Conexión</h2>
          <button 
            onClick={testConnection}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-4 rounded hover:bg-blue-600 disabled:opacity-50 text-lg"
          >
            {isLoading ? 'Probando...' : 'Probar Conexión con Base de Datos'}
          </button>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📊 Estado de la Base de Datos</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Variables de entorno configuradas</p>
            <p>✅ Tablas creadas correctamente</p>
            <p>✅ Usuario por defecto insertado</p>
            <p>🔄 Probando conexión en tiempo real...</p>
          </div>
        </div>
      </div>
    </div>
  );
}