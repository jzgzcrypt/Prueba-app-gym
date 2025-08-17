import { Suspense } from 'react';
import DashboardClient from '@/components/DashboardClient';
import { LoadingFallback } from '@/components/LoadingFallback';
import {
  getWeightsAction,
  getWorkoutsAction,
  getCardioAction,
  getNeatAction,
  getSeguimientoAction,
  getEntrenosNoProgramadosAction,
  getAdherenciaDiariaAction,
  getMesocicloConfigAction
} from './actions';

// Esta función se ejecuta en el servidor
async function getDashboardData() {
  try {
    // Ejecutar todas las consultas en paralelo para mejor rendimiento
    const [
      weights,
      workouts,
      cardio,
      neat,
      seguimiento,
      entrenosNoProgramados,
      adherencia,
      mesocicloConfig
    ] = await Promise.all([
      getWeightsAction(),
      getWorkoutsAction(),
      getCardioAction(),
      getNeatAction(),
      getSeguimientoAction(),
      getEntrenosNoProgramadosAction(),
      getAdherenciaDiariaAction(),
      getMesocicloConfigAction()
    ]);

    return {
      weights: weights.data || [],
      workouts: workouts.data || [],
      cardio: cardio.data || [],
      neat: neat.data || [],
      seguimiento: seguimiento.data || [],
      entrenosNoProgramados: entrenosNoProgramados.data || [],
      adherencia: adherencia.data || [],
      mesocicloConfig: mesocicloConfig.data
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Retornar datos vacíos en caso de error
    return {
      weights: [],
      workouts: [],
      cardio: [],
      neat: [],
      seguimiento: [],
      entrenosNoProgramados: [],
      adherencia: [],
      mesocicloConfig: null
    };
  }
}

export default async function DashboardPage() {
  // Obtener datos en el servidor
  const initialData = await getDashboardData();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardClient initialData={initialData} />
    </Suspense>
  );
}