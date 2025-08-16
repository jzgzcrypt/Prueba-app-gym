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
    }
  ]
});

// Función para obtener el día actual del mesociclo
export const getCurrentMesocicloDay = () => {
  const mesociclo = getMesocicloData();
  
  // LÓGICA DINÁMICA: Calcular semana y día actual del mesociclo
  const today = new Date();
  const startDate = new Date('2024-08-01'); // Fecha de inicio del mesociclo (ajustar según necesidad)
  
  // Calcular días transcurridos desde el inicio
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determinar microciclo actual (cada microciclo dura 9 días)
  const microcicloIndex = Math.floor(daysDiff / 9);
  const currentMicrociclo = mesociclo.microciclos[Math.min(microcicloIndex, mesociclo.microciclos.length - 1)];
  
  // Mapear día de la semana actual (0=Domingo, 1=Lunes, etc.) al día del mesociclo
  const dayOfWeek = today.getDay();
  let mesocicloDayIndex = 0;
  
  // Mapeo inteligente: Lunes=0, Martes=1, Miércoles=2, Jueves=3, Viernes=4, Sábado=5, Domingo=6
  // Pero el mesociclo tiene 6 días (0-5) + 3 descansos
  if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Lunes a Sábado
    mesocicloDayIndex = dayOfWeek - 1; // 0-5
  } else { // Domingo
    mesocicloDayIndex = 5; // Último día de entrenamiento
  }
  
  // Asegurar que no exceda los días disponibles
  mesocicloDayIndex = Math.min(mesocicloDayIndex, currentMicrociclo.dias.length - 1);
  
  const currentDay = currentMicrociclo.dias[mesocicloDayIndex];
  
  return {
    microciclo: currentMicrociclo,
    dia: currentDay,
    mesociclo: mesociclo,
    semanaActual: microcicloIndex + 1,
    diaSemana: dayOfWeek,
    diaMesociclo: mesocicloDayIndex + 1
  };
};

// Función para obtener el plan semanal dinámico
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
  
  // Mapear cada día de la semana al día correspondiente del mesociclo
  diasSemana.forEach((diaSemana, index) => {
    const dayOfWeek = index + 1; // 1=Lunes, 2=Martes, etc.
    let mesocicloDayIndex = 0;
    
    if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Lunes a Sábado
      mesocicloDayIndex = dayOfWeek - 1; // 0-5
    } else { // Domingo
      mesocicloDayIndex = 5; // Último día de entrenamiento
    }
    
    // Asegurar que no exceda los días disponibles
    mesocicloDayIndex = Math.min(mesocicloDayIndex, currentData.microciclo.dias.length - 1);
    
    const diaMesociclo = currentData.microciclo.dias[mesocicloDayIndex];
    
    plan[diaSemana] = {
      entrenamiento: diaMesociclo.entrenamiento,
      ejercicios: diaMesociclo.ejercicios,
      cardio: diaMesociclo.cardio,
      descanso: diaMesociclo.entrenamiento === 'Descanso activo'
    };
  });
  
  return plan;
};