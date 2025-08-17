'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para manejar localStorage con TypeScript
 * Optimizado para SSR/SSG - evita problemas de hidratación
 * 
 * @param key - Clave para almacenar en localStorage
 * @param initialValue - Valor inicial si no existe en localStorage
 * @returns Array con [valor, setter] similar a useState
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Inicializar con el valor inicial para evitar problemas de hidratación
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar el valor de localStorage después del montaje del componente
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
    }
    
    setIsHydrated(true);
  }, [key]);

  // Función para actualizar el valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to local storage only on client side
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isHydrated] as const;
}