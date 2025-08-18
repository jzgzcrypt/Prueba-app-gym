import { useState, useEffect } from 'react';
import { useToast } from './useToast';
import { WeightEntry, CardioEntry, DietEntry, NeatEntry, EntrenoNoProgramado } from '@/types';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useSync() {
  const { showToast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    error: null
  });

  // Detectar cambios en la conectividad
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true, error: null }));
      showToast('🌐 Conexión restaurada', 'success');
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
      showToast('📡 Sin conexión - Usando datos locales', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Función para sincronizar datos
  const syncData = async (table: string, localData: Record<string, unknown>[] | WeightEntry[] | CardioEntry[] | DietEntry[] | NeatEntry[] | EntrenoNoProgramado[]) => {
    if (!syncStatus.isOnline) {
      showToast('📡 Sin conexión - Los datos se guardarán localmente', 'warning');
      return false;
    }

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          table,
          data: localData
        })
      });

      if (!response.ok) {
        throw new Error('Error en la sincronización');
      }

      const result = await response.json();
      
      if (result.success) {
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSync: new Date(),
          error: null 
        }));
        showToast('✅ Datos sincronizados correctamente', 'success');
        return true;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error sincronizando datos:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
      showToast('❌ Error sincronizando datos', 'error');
      return false;
    }
  };

  // Función para guardar datos
  const saveData = async (table: string, data: Record<string, unknown> | CardioEntry | WeightEntry | DietEntry | NeatEntry | EntrenoNoProgramado) => {
    if (!syncStatus.isOnline) {
      showToast('📡 Sin conexión - Los datos se guardarán localmente', 'warning');
      return false;
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          table,
          data
        })
      });

      if (!response.ok) {
        throw new Error('Error guardando datos');
      }

      const result = await response.json();
      
      if (result.success) {
        showToast('✅ Datos guardados en la nube', 'success');
        return true;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error guardando datos:', error);
      showToast('❌ Error guardando en la nube - Usando almacenamiento local', 'error');
      return false;
    }
  };

  // Función para cargar datos
  const loadData = async (table: string) => {
    if (!syncStatus.isOnline) {
      showToast('📡 Sin conexión - Cargando datos locales', 'warning');
      return null;
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'load',
          table
        })
      });

      if (!response.ok) {
        throw new Error('Error cargando datos');
      }

      const result = await response.json();
      
      if (result.success) {
        showToast('✅ Datos cargados desde la nube', 'success');
        return result.data;
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('❌ Error cargando desde la nube - Usando datos locales', 'error');
      return null;
    }
  };

  // Función para sincronización automática
  const autoSync = async (table: string, localData: Record<string, unknown>[]) => {
    if (syncStatus.isOnline && !syncStatus.isSyncing) {
      await syncData(table, localData);
    }
  };

  return {
    syncStatus,
    syncData,
    saveData,
    loadData,
    autoSync
  };
}