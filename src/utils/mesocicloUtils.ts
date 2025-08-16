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

// Función para obtener el día actual del mesociclo con lógica flexible
export const getCurrentMesocicloDay = () => {
  const mesociclo = getMesocicloData();
  
  // LÓGICA FLEXIBLE: Calcular microciclo y día actual
  const today = new Date();
  const startDate = new Date('2024-08-01'); // Fecha de inicio del mesociclo
  
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

// Función para obtener el plan semanal dinámico con lógica flexible
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
  const startDate = new Date('2024-08-01');
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