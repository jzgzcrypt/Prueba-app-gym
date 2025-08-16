'use client';

import { useState, useEffect } from 'react';

/**
 * Hook para manejar código que solo debe ejecutarse en el cliente
 * Evita errores de hidratación en SSR
 */
export function useClientOnly<T>(initialValue: T, clientValue: T): T {
  const [value, setValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setValue(clientValue);
  }, [clientValue]);

  return isClient ? value : initialValue;
}

/**
 * Hook para verificar si estamos en el cliente
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}