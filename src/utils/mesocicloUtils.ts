import { Set, Progresion } from '@/types';
import { getLocalStorageItem, setLocalStorageItem } from './clientStorage';

export interface MesocicloDay {
  dia: string;
  entrenamiento: string;
  ejercicios: string[];
  cardio?: {
    tipo: string;
    duracion: number;
    intensidad: string;
  };
}

export interface Mesociclo {
  nombre: string;
  duracion: string;
  objetivo: string;
  estructura: string;
  volumen: {
    espalda: string;
    biceps: string;
    pecho: string;
    hombros: string;
    triceps: string;
    piernas: string;
  };
  intensidad: string;
  cardio: string;
  dieta: string;
  microciclos: {
    id: number;
    nombre: string;
    objetivo: string;
    intensidad: string;
    cardio: string;
    dias: MesocicloDay[];
  }[];
}

// Datos del mesociclo centralizados
export const getMesocicloData = (): Mesociclo => ({
  nombre: "Mesociclo 1 Definitivo - Definición",
  duracion: "6 semanas (Agosto - Mediados Septiembre)",
  objetivo: "Definición muscular con enfoque estético",
  estructura: "5 días entrenamiento en ciclo de 9 días (4 días push/pull, 1 día piernas, 4 descansos flexibles)",
  volumen: {
    espalda: "14-16 series",
    biceps: "10-12 series", 
    pecho: "9 series",
    hombros: "10-12 series",
    triceps: "9 series",
    piernas: "8 series"
  },
  intensidad: "RIR 3 (microciclos 1-2), RIR 2 (microciclo 3), RIR 1-2 (microciclo 4), RIR 1-0 (microciclo 5)",
  cardio: "3-4 sesiones/semana (25-30 min, trote continuo + intervalos intensos)",
  dieta: "~1800 kcal/día, ayuno intermitente 16/8 opcional desde semana 3",
        microciclos: [
        {
          id: 1,
          nombre: "Microciclo 1 - Adaptación (Semana 1)",
          objetivo: "Técnica, reacondicionamiento",
          intensidad: "RIR 3, sin técnicas intensivas",
          cardio: "3 sesiones, trote continuo + intervalos suaves",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x8-10 + 2x10-12)",
                "Jalón polea alta pecho apoyado unilateral (3x8-10)",
                "Remo polea pecho apoyado unilateral (2x8-10)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl alterno con mancuernas (1x6-8 + 2x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x8-10)",
                "Contractora pectoral máquina inclinada (2x10-12)",
                "Press en máquina (2x8-10)",
                "Elevaciones laterales polea con muñequera (2x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés mancuernas (1x8-10 + 2x10-12)",
                "Extensión tríceps katana polea baja (2x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x12-15)",
                "Prensa 45º (1x6-8 + 2x8-10)",
                "Sentadilla búlgara énfasis glúteo (1x6-8 + 2x8-10)",
                "Curl femoral en máquina (2x12-15)",
                "Extensión de rodilla en máquina (2x12-15)",
                "Elevaciones de talones en máquina (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
                "Jalón polea alta pecho apoyado unilateral (1x8-10 + 1x8-10)",
                "Máquina remo espalda alta (2x8-10)",
                "Pullover polea alta rodillas banco 60º (2x8-12)",
                "Face pull polea alta boca arriba (2x12-15)",
                "Low cable rear delt row (2x12-15)",
                "Curl barra Z (1x6-8 + 1x10-12)",
                "Curl bayesian en polea (2x10-12)",
                "Ab wheel (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x6-8 + 2x8-10)",
                "Contractora pectoral en máquina (2x10-12)",
                "Press militar mancuernas banco inclinado (1x7-9 + 1x9-11)",
                "Elevaciones laterales polea con muñequera (3x12-15)",
                "Elevaciones laterales mancuernas (2x>15)",
                "Press francés barra Z 30º (1x8-10 + 1x10-12)",
                "Extensión tríceps katana polea baja (3x8-10)",
                "Crunch abdominal en polea alta (2x12-15)"
              ],
              cardio: { tipo: "Trote continuo", duracion: 25, intensidad: "6:30-7:00 min/km + intervalos suaves" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 2,
          nombre: "Microciclo 2 - Intensificación (Semana 2-3)",
          objetivo: "Aumentar intensidad, introducir técnicas",
          intensidad: "RIR 2, técnicas intensivas opcionales",
          cardio: "4 sesiones, trote + intervalos moderados",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x6-8 + 2x8-10)",
                "Jalón polea alta pecho apoyado unilateral (3x6-8)",
                "Remo polea pecho apoyado unilateral (2x6-8)",
                "Face pull polea alta boca arriba (2x10-12)",
                "Low cable rear delt row (2x10-12)",
                "Curl alterno con mancuernas (1x6-8 + 2x8-10)",
                "Curl bayesian en polea (2x8-10)",
                "Crunch abdominal en polea alta (2x10-12)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 30, intensidad: "6:00-6:30 min/km + intervalos moderados" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x5-7 + 2x6-8)",
                "Contractora pectoral máquina inclinada (2x8-10)",
                "Press en máquina (2x6-8)",
                "Elevaciones laterales polea con muñequera (2x10-12)",
                "Elevaciones laterales mancuernas (2x12-15)",
                "Press francés mancuernas (1x6-8 + 2x8-10)",
                "Extensión tríceps katana polea baja (2x6-8)",
                "Crunch abdominal en polea alta (2x10-12)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 30, intensidad: "6:00-6:30 min/km + intervalos moderados" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x10-12)",
                "Prensa 45º (1x5-7 + 2x6-8)",
                "Sentadilla búlgara énfasis glúteo (1x5-7 + 2x6-8)",
                "Curl femoral en máquina (2x10-12)",
                "Extensión de rodilla en máquina (2x10-12)",
                "Elevaciones de talones en máquina (2x10-12)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 30, intensidad: "6:00-6:30 min/km + intervalos moderados" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x5-7 + 2x6-8)",
                "Jalón polea alta pecho apoyado unilateral (1x6-8 + 1x6-8)",
                "Máquina remo espalda alta (2x6-8)",
                "Pullover polea alta rodillas banco 60º (2x6-10)",
                "Face pull polea alta boca arriba (2x10-12)",
                "Low cable rear delt row (2x10-12)",
                "Curl barra Z (1x5-7 + 1x8-10)",
                "Curl bayesian en polea (2x8-10)",
                "Ab wheel (2x10-12)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 30, intensidad: "6:00-6:30 min/km + intervalos moderados" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x5-7 + 2x6-8)",
                "Contractora pectoral en máquina (2x8-10)",
                "Press militar mancuernas banco inclinado (1x6-8 + 1x8-10)",
                "Elevaciones laterales polea con muñequera (3x10-12)",
                "Elevaciones laterales mancuernas (2x12-15)",
                "Press francés barra Z 30º (1x6-8 + 1x8-10)",
                "Extensión tríceps katana polea baja (3x6-8)",
                "Crunch abdominal en polea alta (2x10-12)"
              ],
              cardio: { tipo: "Trote + intervalos", duracion: 30, intensidad: "6:00-6:30 min/km + intervalos moderados" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        },
        {
          id: 3,
          nombre: "Microciclo 3 - Pico (Semana 4-5)",
          objetivo: "Máxima intensidad, técnicas intensivas",
          intensidad: "RIR 1-0, técnicas intensivas obligatorias",
          cardio: "4-5 sesiones, intervalos intensos",
          dias: [
            { 
              dia: "Día 1", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x4-6 + 2x6-8)",
                "Jalón polea alta pecho apoyado unilateral (3x4-6)",
                "Remo polea pecho apoyado unilateral (2x4-6)",
                "Face pull polea alta boca arriba (2x8-10)",
                "Low cable rear delt row (2x8-10)",
                "Curl alterno con mancuernas (1x4-6 + 2x6-8)",
                "Curl bayesian en polea (2x6-8)",
                "Crunch abdominal en polea alta (2x8-10)"
              ],
              cardio: { tipo: "Intervalos intensos", duracion: 35, intensidad: "5:30-6:00 min/km + intervalos intensos" }
            },
            { 
              dia: "Día 2", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 45º (1x4-6 + 2x5-7)",
                "Contractora pectoral máquina inclinada (2x6-8)",
                "Press en máquina (2x4-6)",
                "Elevaciones laterales polea con muñequera (2x8-10)",
                "Elevaciones laterales mancuernas (2x10-12)",
                "Press francés mancuernas (1x4-6 + 2x6-8)",
                "Extensión tríceps katana polea baja (2x4-6)",
                "Crunch abdominal en polea alta (2x8-10)"
              ],
              cardio: { tipo: "Intervalos intensos", duracion: 35, intensidad: "5:30-6:00 min/km + intervalos intensos" }
            },
            { 
              dia: "Día 3", 
              entrenamiento: "Piernas (Frecuencia 1)", 
              ejercicios: [
                "Aducción de cadera en máquina (2x8-10)",
                "Prensa 45º (1x4-6 + 2x5-7)",
                "Sentadilla búlgara énfasis glúteo (1x4-6 + 2x5-7)",
                "Curl femoral en máquina (2x8-10)",
                "Extensión de rodilla en máquina (2x8-10)",
                "Elevaciones de talones en máquina (2x8-10)"
              ],
              cardio: { tipo: "Intervalos intensos", duracion: 35, intensidad: "5:30-6:00 min/km + intervalos intensos" }
            },
            { 
              dia: "Día 4", 
              entrenamiento: "Pull (Espalda, Bíceps, Core)", 
              ejercicios: [
                "Bent over rows con mancuernas (1x4-6 + 2x5-7)",
                "Jalón polea alta pecho apoyado unilateral (1x4-6 + 1x4-6)",
                "Máquina remo espalda alta (2x4-6)",
                "Pullover polea alta rodillas banco 60º (2x5-7)",
                "Face pull polea alta boca arriba (2x8-10)",
                "Low cable rear delt row (2x8-10)",
                "Curl barra Z (1x4-6 + 1x6-8)",
                "Curl bayesian en polea (2x6-8)",
                "Ab wheel (2x8-10)"
              ],
              cardio: { tipo: "Intervalos intensos", duracion: 35, intensidad: "5:30-6:00 min/km + intervalos intensos" }
            },
            { 
              dia: "Día 5", 
              entrenamiento: "Push (Pecho, Hombros, Tríceps, Core)", 
              ejercicios: [
                "Press inclinado multipower 30º (1x4-6 + 2x5-7)",
                "Contractora pectoral en máquina (2x6-8)",
                "Press militar mancuernas banco inclinado (1x4-6 + 1x6-8)",
                "Elevaciones laterales polea con muñequera (3x8-10)",
                "Elevaciones laterales mancuernas (2x10-12)",
                "Press francés barra Z 30º (1x4-6 + 1x6-8)",
                "Extensión tríceps katana polea baja (3x4-6)",
                "Crunch abdominal en polea alta (2x8-10)"
              ],
              cardio: { tipo: "Intervalos intensos", duracion: 35, intensidad: "5:30-6:00 min/km + intervalos intensos" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            },
            { 
              dia: "Descanso", 
              entrenamiento: "Descanso activo", 
              ejercicios: ["Estiramientos", "Movilidad", "Recuperación"],
              cardio: { tipo: "Caminata ligera", duracion: 20, intensidad: "Recuperación" }
            }
          ]
        }
      ]
});

/**
 * Obtiene el día actual del mesociclo con lógica flexible para manejar microciclos variables
 * 
 * Esta función calcula dinámicamente:
 * - El microciclo actual basado en la duración real de cada uno
 * - El día dentro del microciclo actual
 * - Ajustes flexibles para retrasos de un día
 * 
 * @returns Objeto con información completa del día actual del mesociclo
 */
export const getCurrentMesocicloDay = () => {
  const mesociclo = getMesocicloData();
  const today = new Date();
  
  // Obtener fecha de inicio desde localStorage de forma segura
  let startDate: Date;
  const storedStartDate = getLocalStorageItem<string | null>('mesociclo_start_date', null);
  
  if (storedStartDate) {
    startDate = new Date(storedStartDate);
  } else {
    // Si no hay fecha configurada, usar el lunes de esta semana
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    startDate = monday;
  }
  
  // Calcular días transcurridos desde el inicio
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determinar microciclo actual basado en la duración real de cada microciclo
  let microcicloIndex = 0;
  let daysInPreviousMicrociclos = 0;
  
  // Calcular en qué microciclo estamos basado en la duración real
  for (let i = 0; i < mesociclo.microciclos.length; i++) {
    const microcicloDuration = mesociclo.microciclos[i].dias.length;
    if (daysDiff < daysInPreviousMicrociclos + microcicloDuration) {
      microcicloIndex = i;
      break;
    }
    daysInPreviousMicrociclos += microcicloDuration;
  }
  
  // Si hemos superado todos los microciclos, usar el último
  if (microcicloIndex >= mesociclo.microciclos.length) {
    microcicloIndex = mesociclo.microciclos.length - 1;
  }
  
  const currentMicrociclo = mesociclo.microciclos[microcicloIndex];
  
  // Calcular día dentro del microciclo actual
  const daysInCurrentMicrociclo = daysDiff - daysInPreviousMicrociclos;
  const mesocicloDayIndex = Math.min(daysInCurrentMicrociclo, currentMicrociclo.dias.length - 1);
  
  // LÓGICA DE FLEXIBILIDAD: Permitir retrasos de un día
  const dayOfWeek = today.getDay();
  let adjustedDayIndex = mesocicloDayIndex;
  
  // Si es domingo (0) y el día anterior era un día de entrenamiento, permitir continuar
  if (dayOfWeek === 0 && mesocicloDayIndex > 0) {
    // Verificar si el día anterior era un día de entrenamiento
    const previousDay = currentMicrociclo.dias[mesocicloDayIndex - 1];
    if (previousDay.entrenamiento !== 'Descanso activo') {
      adjustedDayIndex = mesocicloDayIndex - 1; // Usar el día anterior
    }
  }
  
  // Si es lunes (1) y el día anterior era domingo, verificar si podemos avanzar
  if (dayOfWeek === 1 && mesocicloDayIndex < currentMicrociclo.dias.length - 1) {
    const currentDay = currentMicrociclo.dias[mesocicloDayIndex];
    if (currentDay.entrenamiento === 'Descanso activo') {
      adjustedDayIndex = mesocicloDayIndex + 1; // Avanzar al siguiente día
    }
  }
  
  const currentDay = currentMicrociclo.dias[adjustedDayIndex];
  
  return {
    microciclo: currentMicrociclo,
    dia: currentDay,
    mesociclo: mesociclo,
    semanaActual: microcicloIndex + 1,
    diaSemana: dayOfWeek,
    diaMesociclo: adjustedDayIndex + 1,
    diasTranscurridos: daysDiff,
    diasEnMicrociclo: daysInCurrentMicrociclo,
    microcicloCompletado: adjustedDayIndex >= currentMicrociclo.dias.length - 1
  };
};

/**
 * Obtiene el plan semanal dinámico basado en el mesociclo actual
 * 
 * Esta función mapea los días de la semana actual a los ejercicios del microciclo,
 * manejando transiciones entre microciclos y días de descanso.
 * 
 * @returns Plan semanal con entrenamientos y cardio para cada día
 */
export const getWeeklyPlan = () => {
  const currentData = getCurrentMesocicloDay();
  
  // Obtener los días de la semana actual del microciclo
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const plan: { [key: string]: {
    entrenamiento: string;
    ejercicios: string[];
    cardio?: {
      tipo: string;
      duracion: number;
      intensidad: string;
    };
    descanso?: boolean;
  } } = {};
  
  // Calcular el día de inicio de la semana actual en el microciclo
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Domingo, 1=Lunes, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Lunes como inicio de semana
  
  // Calcular días transcurridos hasta el inicio de la semana
  let startDate: Date;
  try {
    if (typeof window !== 'undefined') {
      const storedStartDate = localStorage.getItem('mesociclo_start_date');
      if (storedStartDate) {
        startDate = new Date(storedStartDate);
      } else {
        // Si no hay fecha configurada, usar el lunes de esta semana
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToMonday);
        startDate = monday;
      }
    } else {
      startDate = new Date('2025-01-01');
    }
  } catch {
    startDate = new Date('2025-01-01');
  }
  
  const daysToStartOfWeek = Math.floor((startOfWeek.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determinar microciclo de la semana actual
  let microcicloIndex = 0;
  let daysInPreviousMicrociclos = 0;
  
  for (let i = 0; i < currentData.mesociclo.microciclos.length; i++) {
    const microcicloDuration = currentData.mesociclo.microciclos[i].dias.length;
    if (daysToStartOfWeek < daysInPreviousMicrociclos + microcicloDuration) {
      microcicloIndex = i;
      break;
    }
    daysInPreviousMicrociclos += microcicloDuration;
  }
  
  const weekMicrociclo = currentData.mesociclo.microciclos[microcicloIndex];
  
  // Calcular día de inicio de la semana en el microciclo
  const daysInCurrentMicrociclo = daysToStartOfWeek - daysInPreviousMicrociclos;
  const startDayInMicrociclo = Math.max(0, daysInCurrentMicrociclo);
  
  // Mapear cada día de la semana
  diasSemana.forEach((diaSemana, index) => {
    const dayIndexInMicrociclo = startDayInMicrociclo + index;
    
    // Si excede los días del microciclo, usar el último día o pasar al siguiente microciclo
    if (dayIndexInMicrociclo >= weekMicrociclo.dias.length) {
      // Verificar si hay siguiente microciclo
      if (microcicloIndex + 1 < currentData.mesociclo.microciclos.length) {
        const nextMicrociclo = currentData.mesociclo.microciclos[microcicloIndex + 1];
        const nextDayIndex = dayIndexInMicrociclo - weekMicrociclo.dias.length;
        const diaMesociclo = nextMicrociclo.dias[Math.min(nextDayIndex, nextMicrociclo.dias.length - 1)];
        
        plan[diaSemana] = {
          entrenamiento: diaMesociclo.entrenamiento,
          ejercicios: diaMesociclo.ejercicios,
          cardio: diaMesociclo.cardio,
          descanso: diaMesociclo.entrenamiento === 'Descanso activo'
        };
      } else {
        // Usar el último día del microciclo actual
        const diaMesociclo = weekMicrociclo.dias[weekMicrociclo.dias.length - 1];
        plan[diaSemana] = {
          entrenamiento: diaMesociclo.entrenamiento,
          ejercicios: diaMesociclo.ejercicios,
          cardio: diaMesociclo.cardio,
          descanso: diaMesociclo.entrenamiento === 'Descanso activo'
        };
      }
    } else {
      const diaMesociclo = weekMicrociclo.dias[dayIndexInMicrociclo];
      plan[diaSemana] = {
        entrenamiento: diaMesociclo.entrenamiento,
        ejercicios: diaMesociclo.ejercicios,
        cardio: diaMesociclo.cardio,
        descanso: diaMesociclo.entrenamiento === 'Descanso activo'
      };
    }
  });
  
  return plan;
};

/**
 * Configura la fecha de inicio del mesociclo personal
 * 
 * @param startDate - Fecha de inicio del mesociclo
 */
export const setMesocicloStartDate = (startDate: Date) => {
  try {
    if (typeof window !== 'undefined') {
      // Validar que la fecha sea válida antes de guardar
      if (!isNaN(startDate.getTime())) {
        localStorage.setItem('mesociclo_start_date', startDate.toISOString());
        console.log('Fecha de inicio configurada:', startDate.toISOString().split('T')[0]);
      } else {
        console.error('Fecha inválida:', startDate);
      }
    }
  } catch (error) {
    console.error('Error al guardar fecha de inicio:', error);
  }
};

/**
 * Obtiene la fecha de inicio configurada del mesociclo
 * 
 * @returns Fecha de inicio o null si no está configurada
 */
export const getMesocicloStartDate = (): Date | null => {
  try {
    if (typeof window !== 'undefined') {
      const storedDate = localStorage.getItem('mesociclo_start_date');
      if (storedDate) {
        const date = new Date(storedDate);
        // Validar que la fecha sea válida
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
  } catch {
    console.error('Error al obtener fecha de inicio');
  }
  return null;
};

/**
 * Calcula calorías quemadas para diferentes tipos de entrenos no programados
 * 
 * @param tipo - Tipo de actividad
 * @param duracion - Duración en minutos
 * @param intensidad - Nivel de intensidad
 * @param peso - Peso corporal en kg
 * @param datosEspecificos - Datos específicos de la actividad
 * @returns Calorías estimadas
 */
export const calcularCaloriasEntrenoNoProgramado = (
  tipo: string,
  duracion: number,
  intensidad: 'baja' | 'moderada' | 'alta' | 'muy alta',
  peso: number = 75,
  datosEspecificos?: Record<string, unknown>
): number => {
  // MET (Metabolic Equivalent of Task) por actividad e intensidad
  const metValues: { [key: string]: { [key: string]: number } } = {
    tenis: {
      baja: 4.5,      // Tenis recreativo
      moderada: 6.0,  // Tenis moderado
      alta: 8.0,      // Tenis competitivo
      'muy alta': 10.0 // Tenis profesional
    },
    natacion: {
      baja: 4.0,      // Natación lenta
      moderada: 6.0,  // Natación moderada
      alta: 8.0,      // Natación rápida
      'muy alta': 10.0 // Natación competitiva
    },
    alpinismo: {
      baja: 6.0,      // Senderismo fácil
      moderada: 8.0,  // Alpinismo moderado
      alta: 10.0,     // Alpinismo difícil
      'muy alta': 12.0 // Alpinismo extremo
    },
    ciclismo: {
      baja: 4.0,      // Ciclismo lento
      moderada: 6.0,  // Ciclismo moderado
      alta: 8.0,      // Ciclismo rápido
      'muy alta': 12.0 // Ciclismo competitivo
    },
    running: {
      baja: 6.0,      // Trote lento
      moderada: 8.0,  // Running moderado
      alta: 10.0,     // Running rápido
      'muy alta': 12.0 // Running competitivo
    },
    futbol: {
      baja: 6.0,      // Futbol recreativo
      moderada: 8.0,  // Futbol moderado
      alta: 10.0,     // Futbol competitivo
      'muy alta': 12.0 // Futbol profesional
    },
    baloncesto: {
      baja: 6.0,      // Baloncesto recreativo
      moderada: 8.0,  // Baloncesto moderado
      alta: 10.0,     // Baloncesto competitivo
      'muy alta': 12.0 // Baloncesto profesional
    },
    escalada: {
      baja: 5.0,      // Escalada fácil
      moderada: 7.0,  // Escalada moderada
      alta: 9.0,      // Escalada difícil
      'muy alta': 11.0 // Escalada extrema
    },
    yoga: {
      baja: 2.5,      // Yoga suave
      moderada: 3.5,  // Yoga moderado
      alta: 4.5,      // Yoga intenso
      'muy alta': 6.0  // Power yoga
    },
    pilates: {
      baja: 3.0,      // Pilates básico
      moderada: 4.0,  // Pilates moderado
      alta: 5.0,      // Pilates avanzado
      'muy alta': 6.0  // Pilates intenso
    },
    crossfit: {
      baja: 8.0,      // Crossfit moderado
      moderada: 10.0, // Crossfit estándar
      alta: 12.0,     // Crossfit intenso
      'muy alta': 15.0 // Crossfit extremo
    },
    otro: {
      baja: 3.0,      // Actividad general baja
      moderada: 5.0,  // Actividad general moderada
      alta: 7.0,      // Actividad general alta
      'muy alta': 9.0  // Actividad general muy alta
    }
  };

  // Obtener MET base para la actividad
  const metBase = metValues[tipo]?.[intensidad] || metValues.otro[intensidad];
  
  // Ajustes específicos por actividad
  let metAjustado = metBase;
  
  if (tipo === 'natacion' && datosEspecificos?.estilo) {
    const ajustesEstilo: Record<string, number> = {
      libre: 1.0,
      espalda: 0.9,
      braza: 1.1,
      mariposa: 1.3,
      combinado: 1.2
    };
    const estilo = datosEspecificos.estilo as string;
    metAjustado *= ajustesEstilo[estilo] || 1.0;
  }
  
  if (tipo === 'alpinismo' && datosEspecificos?.desnivel) {
    // Ajustar por desnivel (más desnivel = más intensidad)
    const desnivel = datosEspecificos.desnivel as number;
    const desnivelPorHora = (desnivel / duracion) * 60;
    if (desnivelPorHora > 500) metAjustado *= 1.3;
    else if (desnivelPorHora > 300) metAjustado *= 1.2;
    else if (desnivelPorHora > 100) metAjustado *= 1.1;
  }
  
  if (tipo === 'ciclismo' && datosEspecificos?.desnivel) {
    // Ajustar por desnivel en ciclismo
    const desnivel = datosEspecificos.desnivel as number;
    const desnivelPorHora = (desnivel / duracion) * 60;
    if (desnivelPorHora > 300) metAjustado *= 1.4;
    else if (desnivelPorHora > 200) metAjustado *= 1.3;
    else if (desnivelPorHora > 100) metAjustado *= 1.2;
  }
  
  if (tipo === 'running' && datosEspecificos?.ritmoMinKm) {
    // Ajustar por ritmo (más rápido = más intensidad)
    const ritmoMinKm = datosEspecificos.ritmoMinKm as number;
    if (ritmoMinKm < 4) metAjustado *= 1.4;
    else if (ritmoMinKm < 5) metAjustado *= 1.3;
    else if (ritmoMinKm < 6) metAjustado *= 1.2;
  }
  
  // Calcular calorías: MET * peso * tiempo / 60
  const calorias = Math.round(metAjustado * peso * duracion / 60);
  
  return calorias;
};

/**
 * Función de prueba para verificar el seguimiento del mesociclo
 * 
 * @param testDate - Fecha para probar (opcional, usa hoy por defecto)
 * @returns Información detallada del seguimiento para debugging
 */
export const testMesocicloTracking = (testDate?: Date) => {
  const date = testDate || new Date();
  const mesociclo = getMesocicloData();
  
  // Obtener fecha de inicio
  let startDate: Date;
  try {
    if (typeof window !== 'undefined') {
      const storedStartDate = localStorage.getItem('mesociclo_start_date');
      if (storedStartDate) {
        startDate = new Date(storedStartDate);
        console.log('📅 Fecha configurada encontrada:', startDate.toISOString().split('T')[0]);
      } else {
        // Si no hay fecha configurada, usar el lunes de esta semana
        const dayOfWeek = date.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek;
        const monday = new Date(date);
        monday.setDate(date.getDate() - daysToMonday);
        startDate = monday;
        console.log('📅 Usando lunes de esta semana como fecha por defecto:', startDate.toISOString().split('T')[0]);
      }
    } else {
      startDate = new Date('2025-01-01');
    }
  } catch {
    startDate = new Date('2025-01-01');
  }
  
  // Calcular días transcurridos
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determinar microciclo actual
  let microcicloIndex = 0;
  let daysInPreviousMicrociclos = 0;
  
  for (let i = 0; i < mesociclo.microciclos.length; i++) {
    const microcicloDuration = mesociclo.microciclos[i].dias.length;
    if (daysDiff < daysInPreviousMicrociclos + microcicloDuration) {
      microcicloIndex = i;
      break;
    }
    daysInPreviousMicrociclos += microcicloDuration;
  }
  
  if (microcicloIndex >= mesociclo.microciclos.length) {
    microcicloIndex = mesociclo.microciclos.length - 1;
  }
  
  const currentMicrociclo = mesociclo.microciclos[microcicloIndex];
  const daysInCurrentMicrociclo = daysDiff - daysInPreviousMicrociclos;
  const mesocicloDayIndex = Math.min(daysInCurrentMicrociclo, currentMicrociclo.dias.length - 1);
  
  return {
    fecha: date.toISOString().split('T')[0],
    fechaInicio: startDate.toISOString().split('T')[0],
    diasTranscurridos: daysDiff,
    microcicloIndex,
    microcicloNombre: currentMicrociclo.nombre,
    diaEnMicrociclo: mesocicloDayIndex + 1,
    totalDiasMicrociclo: currentMicrociclo.dias.length,
    diaSemana: date.getDay(),
    diaActual: currentMicrociclo.dias[mesocicloDayIndex],
    proximoDia: mesocicloDayIndex < currentMicrociclo.dias.length - 1 ? currentMicrociclo.dias[mesocicloDayIndex + 1] : null
  };
};

// Configuración de progresión por microciclo
export interface ProgresionConfig {
  microciclo: number;
  fase: string;
  intensidad: string;
  incrementoPeso: number;
  ajusteRepeticiones: number;
  rpeMinimo: number;
  rpeMaximo: number;
  toleranciaRepeticiones: number;
  tecnicasIntensivas: boolean;
}

// Configuraciones de progresión para cada microciclo
export const getProgresionConfig = (microcicloId: number): ProgresionConfig => {
  const configs: { [key: number]: ProgresionConfig } = {
    1: {
      microciclo: 1,
      fase: "Adaptación",
      intensidad: "RIR 3",
      incrementoPeso: 2.5, // Incremento conservador
      ajusteRepeticiones: 2, // Ajuste de repeticiones
      rpeMinimo: 6, // RPE mínimo para progresar
      rpeMaximo: 8, // RPE máximo antes de bajar peso
      toleranciaRepeticiones: 3, // Tolerancia en repeticiones
      tecnicasIntensivas: false // Sin técnicas intensivas
    },
    2: {
      microciclo: 2,
      fase: "Intensificación",
      intensidad: "RIR 2",
      incrementoPeso: 5, // Incremento moderado
      ajusteRepeticiones: 1, // Ajuste más fino
      rpeMinimo: 7, // RPE más alto para progresar
      rpeMaximo: 9, // RPE máximo más alto
      toleranciaRepeticiones: 2, // Tolerancia menor
      tecnicasIntensivas: true // Técnicas opcionales
    },
    3: {
      microciclo: 3,
      fase: "Pico",
      intensidad: "RIR 1-0",
      incrementoPeso: 2.5, // Incremento conservador en pico
      ajusteRepeticiones: 1, // Ajuste muy fino
      rpeMinimo: 8, // RPE muy alto para progresar
      rpeMaximo: 10, // RPE máximo
      toleranciaRepeticiones: 1, // Tolerancia mínima
      tecnicasIntensivas: true // Técnicas obligatorias
    }
  };

  return configs[microcicloId] || configs[1]; // Default al microciclo 1
};

/**
 * Algoritmo de progresión dinámico que se adapta a cada fase del microciclo
 * 
 * Este algoritmo toma decisiones inteligentes basadas en:
 * - La fase actual del microciclo (Adaptación, Intensificación, Pico)
 * - El RPE reportado por el usuario
 * - Las repeticiones realizadas vs objetivo
 * - Los parámetros específicos de cada microciclo
 * 
 * @param ejercicio - Nombre del ejercicio
 * @param series - Array de series completadas
 * @param pesoActual - Peso actual del ejercicio
 * @param repeticionesObjetivo - Repeticiones objetivo
 * @param microcicloId - ID del microciclo actual
 * @returns Objeto de progresión con recomendaciones
 */
export const calcularProgresionDinamica = (
  ejercicio: string, 
  series: Set[], 
  pesoActual: number, 
  repeticionesObjetivo: number,
  microcicloId: number
): Progresion => {
  const config = getProgresionConfig(microcicloId);
  const repeticionesPromedio = series.reduce((sum, set) => sum + set.repeticiones, 0) / series.length;
  const pesoPromedio = series.reduce((sum, set) => sum + set.peso, 0) / series.length;
  const rpePromedio = series.reduce((sum, set) => sum + (set.rpe || 0), 0) / series.length;
  
  let proximoAjuste: 'peso' | 'repeticiones' | 'mantener' = 'mantener';
  let nuevoPeso = pesoActual;
  let nuevasRepeticiones = repeticionesObjetivo;
  let incrementoPeso = 0;
  let ajusteRepeticiones = 0;

  // Si todas las series están completadas
  if (series.every(set => set.completado)) {
    
    // LÓGICA DE PROGRESIÓN POR MICROCICLO
    
    // MICROCICLO 1 - ADAPTACIÓN (RIR 3)
    if (microcicloId === 1) {
      // Progresión más permisiva, enfocada en técnica
      if (repeticionesPromedio > repeticionesObjetivo + config.toleranciaRepeticiones && rpePromedio <= config.rpeMaximo) {
        proximoAjuste = 'peso';
        incrementoPeso = config.incrementoPeso;
        nuevoPeso = pesoActual + incrementoPeso;
      }
      // Si RPE es muy bajo, subir peso
      else if (rpePromedio < config.rpeMinimo && repeticionesPromedio >= repeticionesObjetivo) {
        proximoAjuste = 'peso';
        incrementoPeso = config.incrementoPeso;
        nuevoPeso = pesoActual + incrementoPeso;
      }
      // Si no se alcanzan las repeticiones, bajar objetivo
      else if (repeticionesPromedio < repeticionesObjetivo - config.toleranciaRepeticiones) {
        proximoAjuste = 'repeticiones';
        ajusteRepeticiones = -config.ajusteRepeticiones;
        nuevasRepeticiones = Math.max(repeticionesObjetivo + ajusteRepeticiones, 6);
      }
    }
    
    // MICROCICLO 2 - INTENSIFICACIÓN (RIR 2)
    else if (microcicloId === 2) {
      // Progresión moderada, introduciendo intensidad
      if (repeticionesPromedio > repeticionesObjetivo + config.toleranciaRepeticiones && rpePromedio >= config.rpeMinimo && rpePromedio <= config.rpeMaximo) {
        proximoAjuste = 'peso';
        incrementoPeso = config.incrementoPeso;
        nuevoPeso = pesoActual + incrementoPeso;
      }
      // Si RPE es muy alto, mantener peso
      else if (rpePromedio > config.rpeMaximo) {
        proximoAjuste = 'mantener';
      }
      // Si no se alcanzan las repeticiones, ajustar objetivo
      else if (repeticionesPromedio < repeticionesObjetivo - config.toleranciaRepeticiones) {
        proximoAjuste = 'repeticiones';
        ajusteRepeticiones = -config.ajusteRepeticiones;
        nuevasRepeticiones = Math.max(repeticionesObjetivo + ajusteRepeticiones, 6);
      }
    }
    
    // MICROCICLO 3 - PICO (RIR 1-0)
    else if (microcicloId === 3) {
      // Progresión conservadora, máxima intensidad
      if (repeticionesPromedio > repeticionesObjetivo + config.toleranciaRepeticiones && rpePromedio >= config.rpeMinimo && rpePromedio < config.rpeMaximo) {
        proximoAjuste = 'peso';
        incrementoPeso = config.incrementoPeso;
        nuevoPeso = pesoActual + incrementoPeso;
      }
      // Si RPE es máximo, mantener peso
      else if (rpePromedio >= config.rpeMaximo) {
        proximoAjuste = 'mantener';
      }
      // Si no se alcanzan las repeticiones, ajustar objetivo
      else if (repeticionesPromedio < repeticionesObjetivo - config.toleranciaRepeticiones) {
        proximoAjuste = 'repeticiones';
        ajusteRepeticiones = -config.ajusteRepeticiones;
        nuevasRepeticiones = Math.max(repeticionesObjetivo + ajusteRepeticiones, 6);
      }
    }
  }

  return {
    ejercicio,
    historial: [{
      fecha: new Date().toISOString().split('T')[0],
      peso: pesoPromedio,
      repeticiones: repeticionesPromedio,
      rpe: rpePromedio
    }],
    pesoActual: nuevoPeso,
    repeticionesObjetivo: nuevasRepeticiones,
    proximoAjuste,
    microciclo: microcicloId,
    fase: config.fase,
    intensidad: config.intensidad,
    incrementoPeso,
    ajusteRepeticiones
  };
};

// Interfaces para el parsing de ejercicios
export interface SeriePlan {
  numero: number;
  repeticionesObjetivo: string; // "5-7", "8-10", "12-15", etc.
  tipo: 'top' | 'rest' | 'normal';
  rpeObjetivo?: number;
}

export interface EjercicioPlan {
  nombre: string;
  series: SeriePlan[];
  descripcion: string;
}

// Parser para convertir el formato del mesociclo a un plan registrable
export const parseEjercicioMesociclo = (ejercicioString: string): EjercicioPlan => {
  // Extraer nombre del ejercicio (antes del paréntesis)
  const nombre = ejercicioString.split('(')[0].trim();
  
  // Extraer información de series del paréntesis
  const seriesMatch = ejercicioString.match(/\(([^)]+)\)/);
  const seriesInfo = seriesMatch ? seriesMatch[1] : '3x10';
  
  const series: SeriePlan[] = [];
  let serieNumero = 1;
  
  // Parsear diferentes formatos de series
  if (seriesInfo.includes('+')) {
    // Formato: "1x5-7 + 2x8-10" o "1x8-10 + 1x10-12"
    const partes = seriesInfo.split('+').map(p => p.trim());
    
    partes.forEach(parte => {
      const match = parte.match(/(\d+)x([^x]+)/);
      if (match) {
        const numSeries = parseInt(match[1]);
        const reps = match[2].trim();
        
        for (let i = 0; i < numSeries; i++) {
          series.push({
            numero: serieNumero++,
            repeticionesObjetivo: reps,
            tipo: serieNumero === 2 ? 'top' : 'rest', // Primera serie es top set
            rpeObjetivo: determinarRpeObjetivo(reps)
          });
        }
      }
    });
  } else {
    // Formato simple: "2x10-12", "3x8-10", etc.
    const match = seriesInfo.match(/(\d+)x([^x]+)/);
    if (match) {
      const numSeries = parseInt(match[1]);
      const reps = match[2].trim();
      
      for (let i = 0; i < numSeries; i++) {
        series.push({
          numero: serieNumero++,
          repeticionesObjetivo: reps,
          tipo: 'normal',
          rpeObjetivo: determinarRpeObjetivo(reps)
        });
      }
    }
  }
  
  return {
    nombre,
    series,
    descripcion: ejercicioString
  };
};

// Función para determinar RPE objetivo basado en el rango de repeticiones
const determinarRpeObjetivo = (reps: string): number => {
  if (reps.includes('>')) return 8; // ">15" = RPE alto
  if (reps.includes('-')) {
    const [min, max] = reps.split('-').map(r => parseInt(r));
    const promedio = (min + max) / 2;
    
    if (promedio <= 6) return 9; // RPE muy alto para pocas reps
    if (promedio <= 8) return 8; // RPE alto para reps medias
    if (promedio <= 12) return 7; // RPE medio para reps altas
    return 6; // RPE bajo para muchas reps
  }
  
  const num = parseInt(reps);
  if (num <= 6) return 9;
  if (num <= 8) return 8;
  if (num <= 12) return 7;
  return 6;
};