'use client';

import { useState } from 'react';
import { addWeightAction, addCardioAction, addNeatAction } from '../actions';

export default function TestDatabasePage() {
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddWeight = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addWeightAction(formData);
      setMessage(result.message);
    } catch {
      setMessage('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCardio = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addCardioAction(formData);
      setMessage(result.message);
    } catch {
      setMessage('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNeat = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await addNeatAction(formData);
      setMessage(result.message);
    } catch {
      setMessage('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Prueba de Base de Datos</h1>
        
        {message && (
          <div className={`p-4 mb-6 rounded-lg ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario de Peso */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">⚖️ Agregar Peso</h2>
            <form action={handleAddWeight} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                <input 
                  type="number" 
                  name="peso" 
                  step="0.1" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="75.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cintura (cm)</label>
                <input 
                  type="number" 
                  name="cintura" 
                  step="0.1" 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="85.0"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar Peso'}
              </button>
            </form>
          </div>

          {/* Formulario de Cardio */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🏃 Agregar Cardio</h2>
            <form action={handleAddCardio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select name="tipo" required className="w-full p-2 border border-gray-300 rounded">
                  <option value="">Seleccionar...</option>
                  <option value="Trote">Trote</option>
                  <option value="Ciclismo">Ciclismo</option>
                  <option value="Natación">Natación</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duración (min)</label>
                <input 
                  type="number" 
                  name="duracion" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intensidad</label>
                <select name="intensidad" required className="w-full p-2 border border-gray-300 rounded">
                  <option value="">Seleccionar...</option>
                  <option value="Baja">Baja</option>
                  <option value="Moderada">Moderada</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Calorías</label>
                <input 
                  type="number" 
                  name="calorias" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="200"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar Cardio'}
              </button>
            </form>
          </div>

          {/* Formulario de NEAT */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🚶 Agregar NEAT</h2>
            <form action={handleAddNeat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select name="tipo" required className="w-full p-2 border border-gray-300 rounded">
                  <option value="">Seleccionar...</option>
                  <option value="pasos">Pasos</option>
                  <option value="cinta">Cinta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duración (min)</label>
                <input 
                  type="number" 
                  name="duracion" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Calorías</label>
                <input 
                  type="number" 
                  name="calorias" 
                  required 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pasos (opcional)</label>
                <input 
                  type="number" 
                  name="pasos" 
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="8000"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isLoading ? 'Guardando...' : 'Guardar NEAT'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📊 Instrucciones</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Ejecuta el esquema SQL</strong> en el Neon SQL Editor</p>
            <p>2. <strong>Configura las variables de entorno</strong> con <code>vercel env pull .env.development.local</code></p>
            <p>3. <strong>Prueba los formularios</strong> para verificar la conexión</p>
            <p>4. <strong>Verifica en Neon SQL Editor</strong> que los datos se guarden correctamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}