/**
 * Utilidades para manejo seguro de localStorage
 * Compatible con SSR/SSG
 */

/**
 * Verifica si estamos en el cliente
 */
export const isClient = () => typeof window !== 'undefined';

/**
 * Obtiene un valor de localStorage de forma segura
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!isClient()) return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Guarda un valor en localStorage de forma segura
 */
export const setLocalStorageItem = <T>(key: string, value: T): boolean => {
  if (!isClient()) return false;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Elimina un valor de localStorage de forma segura
 */
export const removeLocalStorageItem = (key: string): boolean => {
  if (!isClient()) return false;
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
};