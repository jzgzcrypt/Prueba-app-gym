/**
 * BLOQUE 1 — Base 7K
 *
 * 11 semanas para llegar a 7 km a 4:45/km.
 *
 * El plan define la FORMA del bloque: 11 semanas, 7 dias cada una, en orden.
 * No contiene ni una sola fecha. Las fechas las pone el calendario a partir de
 * FECHA_INICIO, que es el unico sitio donde se decide cuando arranca el bloque.
 * Mover el bloque entero de fecha = cambiar esa constante. Nada mas.
 *
 * ─── LA SEMANA TIPO ────────────────────────────────────────────────────────
 *
 * Todo el bloque esta construido alrededor del tenis del lunes, que es un
 * compromiso fijo (ver domain/compromisos.js), no una sesion que se pueda
 * mover. De ahi sale esta semana, y cada dia esta donde esta por una razon:
 *
 *   Lunes      TENIS 20:00-21:30      La carga de la semana. Piernas y cardio.
 *   Martes     Running muy suave      Descarga activa. Las piernas vienen
 *                                     cargadas: se corre para soltar, no para
 *                                     entrenar.
 *   Miercoles  Fuerza A (+ hombro)    Tren superior: no compite con el tenis.
 *   Jueves     Running de CALIDAD     3 dias despues del tenis, que es cuando
 *                                     las piernas estan listas para intensidad.
 *   Viernes    Fuerza B (+ hombro)    Hombro por segunda vez en la semana: es
 *                                     la prioridad estetica del bloque y apenas
 *                                     genera fatiga sistemica.
 *   Sabado     Pierna minima + core   Unico dia de pierna, y corto: compite en
 *                                     directo con las piernas del tenis.
 *   Domingo    Tirada larga           6 dias despues del tenis, fresco para
 *                                     acumular volumen.
 *
 * Resultado: 4 estimulos de cardio (tenis + 3 carreras), 3 de fuerza, hombro
 * dos veces, pierna una sola vez y minima.
 *
 * Esta plantilla no es invencion nueva: es exactamente la que ya se habia
 * diseñado para las semanas con tenis. Aqui se aplica a las 11.
 *
 * ─── DONDE LA PLANTILLA SE ROMPE, Y POR QUE ────────────────────────────────
 *
 *   S1-S2 (RAMPA)  El jueves no lleva calidad sino la segunda salida: en una
 *                  rampa de entrada no se mete intensidad, se mete costumbre.
 *   S8 (TEST)      El domingo es el primer 7km. Esa semana el test ES la
 *                  sesion de calidad: no se hace un esfuerzo fuerte tres dias
 *                  antes de medirse. Jueves y sabado pasan a activacion.
 *   S9            El viernes es descanso total, no fuerza: viene de la sesion
 *                  mas dura del bloque (3km exactos a ritmo objetivo).
 *   S10-S11       Taper. El tenis sigue porque es un compromiso, pero con
 *                  aviso de jugar sin vaciarse. La fuerza casi desaparece.
 */
export const FECHA_INICIO = "2026-09-21"; // lunes

export const BLOQUE = {
  numero: 1,
  nombre: "Bloque 1 — Base 7K",
  objetivo: "7km @ 4:45/km",
  semanas: 11,
};

const LUNES_TENIS = { dow: "Lunes", tipo: "libre", cat: "descanso", titulo: "Tenis — compromiso fijo" };

export const WEEKS = [
  // ══ S1 · RAMPA ══ Entrar en la rutina. Nada de intensidad: solo costumbre.
  { n: 1, fase: "RAMPA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Correr/Caminar — suelta piernas", dur: "25 min", rpe: "3/10",
        what: "6x[90s correr / 2min caminar]. Vienes del tenis: esto es para soltar, no para entrenar.",
        intervalos: [{r:6,s:[["correr",90],["caminar",120]]}] },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje + Tirón (rampa)", dur: "35 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x10" },
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "3xfallo" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runZ2", titulo: "Segunda salida", dur: "25 min", rpe: "3/10",
        what: "6x[90s correr / 2min caminar]. Piernas ya recuperadas del tenis.",
        intervalos: [{r:6,s:[["correr",90],["caminar",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Hombro + Brazos (rampa)", dur: "30 min",
        ejercicios: [
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "3xfallo" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + Core (rampa)", dur: "30 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "3x10" },
          { grupo: "Core", nombre: "Plancha frontal", series: "3x30s" },
          { grupo: "Cadera", nombre: "Puente gluteo + abduccion", series: "3x15" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tercera salida", dur: "25 min", rpe: "3-4/10",
        what: "5x[2min correr / 2min caminar]. Bloques más largos, menos caminata.",
        intervalos: [{r:5,s:[["correr",120],["caminar",120]]}] },
    ]},

  // ══ S2 · RAMPA ══ Los bloques de carrera se alargan, la caminata se acorta.
  { n: 2, fase: "RAMPA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Correr/Caminar — suelta piernas", dur: "28 min", rpe: "3/10",
        what: "5x[3min correr / 90s caminar]. Suave: vienes del tenis.",
        intervalos: [{r:5,s:[["correr",180],["caminar",90]]}] },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje (rampa)", dur: "40 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x12" },
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "4xfallo" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x10-12" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runZ2", titulo: "Intervalos 3 min", dur: "30 min", rpe: "4/10",
        what: "5x[3min correr / 90s caminar]. Hoy sí puedes apretar un poco.",
        intervalos: [{r:5,s:[["correr",180],["caminar",90]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón + Hombro (rampa)", dur: "40 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "3x12" },
          { grupo: "Biceps", nombre: "Curl bayesian en polea", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + Core (rampa)", dur: "35 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "3x10" },
          { grupo: "Core", nombre: "Plancha frontal", series: "3x35s" },
          { grupo: "Cadera", nombre: "Clamshells con banda", series: "3x15/lado" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "4 min continuos", dur: "32 min", rpe: "4/10",
        what: "4x[4min correr / 1min caminar]. Primera vez con más carrera que caminata.",
        intervalos: [{r:4,s:[["correr",240],["caminar",60]]}] },
    ]},

  // ══ S3 · ESTETICA ══ Entra la calidad (fartlek) y el hombro a alta frecuencia.
  { n: 3, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "20 min", rpe: "3/10",
        what: "15 min corriendo muy suave. Piernas cargadas del tenis — nada de intensidad hoy." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro y brazos a tope", dur: "50 min",
        ejercicios: [
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "4xfallo" },
          { grupo: "Hombro", nombre: "Elevaciones frontales unilateral", series: "3x12" },
          { grupo: "Pecho", nombre: "Press banca con barra", series: "2x10" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          { grupo: "Triceps", nombre: "Press frances con mancuernas", series: "3x10" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek suave 4x[60s/2min]", dur: "25 min", rpe: "5/10", esCalidad: true,
        what: "4x[60s algo vivo / 2min suave]. Piernas ya recuperadas del tenis (3 días después).",
        intervalos: [{r:4,s:[["rapido",60],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Hombro + Brazos — alta frecuencia", dur: "35 min",
        ejercicios: [
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "4xfallo" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna mínima — soporte y salud", dur: "20 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "2x10" },
          { grupo: "Pierna", nombre: "Cossack squat con peso corporal", series: "2x8/lado" },
          { grupo: "Cadera", nombre: "Puente gluteo + abduccion", series: "2x15" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada suave", dur: "28 min", rpe: "4/10",
        what: "20 min corriendo suave continuo. Primera tirada sin caminar." },
    ]},

  // ══ S4 · ESTETICA ══
  { n: 4, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "22 min", rpe: "3/10",
        what: "16 min corriendo muy suave." },
      { dow: "Miercoles", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda moderada, Hombro y brazos a tope", dur: "50 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Espalda", nombre: "Remo con barra", series: "2x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "4xfallo" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bayesian en polea", series: "3x10" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek 4x[75s/2min]", dur: "28 min", rpe: "5-6/10", esCalidad: true,
        what: "4x[75s algo vivo / 2min suave].",
        intervalos: [{r:4,s:[["rapido",75],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "empuje", titulo: "Hombro + Brazos — alta frecuencia", dur: "35 min",
        ejercicios: [
          { grupo: "Hombro", nombre: "Elevaciones frontales unilateral", series: "3x12" },
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "4xfallo" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna mínima — soporte y salud", dur: "20 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "2x10" },
          { grupo: "Pierna", nombre: "Cossack squat con peso corporal", series: "2x8/lado" },
          { grupo: "Cadera", nombre: "Clamshells con banda", series: "2x15" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada suave, algo más larga", dur: "30 min", rpe: "4/10",
        what: "22 min corriendo suave continuo." },
    ]},

  // ══ S5 · ESTETICA ══ Cierre de la fase estetica.
  { n: 5, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "22 min", rpe: "3/10",
        what: "16 min corriendo muy suave." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Pecho moderado, Hombro y brazos a tope", dur: "50 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Press banca con barra", series: "3x8" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "4xfallo" },
          { grupo: "Hombro", nombre: "Elevaciones frontales unilateral", series: "3x12" },
          { grupo: "Triceps", nombre: "Press frances con mancuernas", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek 5x[75s/2min]", dur: "30 min", rpe: "5-6/10", esCalidad: true,
        what: "5x[75s algo vivo / 2min suave]. Última semana antes de meter ritmo de verdad.",
        intervalos: [{r:5,s:[["rapido",75],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda moderada, Hombro y brazos a tope", dur: "50 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Dominadas", series: "2xmax" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "2x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "4xfallo" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna mínima — soporte y salud", dur: "20 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "2x10" },
          { grupo: "Pierna", nombre: "Cossack squat con peso corporal", series: "2x8/lado" },
          { grupo: "Cadera", nombre: "Puente gluteo + abduccion", series: "2x15" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada más larga", dur: "35 min", rpe: "4/10",
        what: "26 min corriendo suave continuo." },
    ]},

  // ══ S6 · CALIDAD ══ Primera sesion a ritmo objetivo. Pico de volumen de fuerza.
  { n: 6, fase: "CALIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 de asimilación — suave", dur: "25 min", rpe: "3-4/10",
        what: "20 min Z2 muy suave. Descarga del tenis, no entrenamiento." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — volumen alto de tríceps", dur: "60 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "4x8" },
          { grupo: "Pecho", nombre: "Press banca con barra", series: "3x10" },
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x12" },
          { grupo: "Hombro", nombre: "Elevaciones frontales unilateral", series: "3x12" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "5xfallo" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x8-10" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x10" },
          { grupo: "Triceps", nombre: "Press frances con mancuernas", series: "3x10" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Ritmo específico 3km", dur: "38 min", rpe: "7/10", esCalidad: true,
        what: "3km a 5:20-5:35/km. Primera vez a ritmo de verdad — piernas frescas (3 días desde el tenis)." },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón + Hombro + Bíceps", dur: "60 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Dominadas", series: "3x6" },
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x8" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "3x12" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "4x12" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + Core", dur: "35 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "3x12" },
          { grupo: "Pierna", nombre: "Cossack squat con peso corporal", series: "3x8/lado" },
          { grupo: "Core", nombre: "Plancha lateral", series: "3x30s/lado" },
          { grupo: "Cadera", nombre: "Clamshells con banda", series: "3x15" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Long run 40 min", dur: "50 min", rpe: "5/10",
        what: "40 min Z2 (~6km). Primera tirada larga de verdad." },
    ]},

  // ══ S7 · ESPECIFICIDAD ══ El ritmo se acerca al objetivo. La fuerza empieza a ceder.
  { n: 7, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 de asimilación — suave", dur: "25 min", rpe: "3-4/10",
        what: "20 min Z2 muy suave." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje", dur: "50 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "4x8" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "4xfallo" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x12" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Ritmo 5km", dur: "45 min", rpe: "7-8/10", esCalidad: true,
        what: "5km a 5:00-5:10/km. La sesión clave del bloque antes del primer 7km." },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón + Hombro", dur: "50 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Dominadas", series: "1xmax" },
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Hombro", nombre: "Elevaciones frontales unilateral", series: "3x12" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x12" },
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna ligera", dur: "25 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "2x12" },
          { grupo: "Core", nombre: "Plancha frontal", series: "2x40s" },
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Long run 48 min", dur: "58 min", rpe: "5-6/10",
        what: "48 min Z2 (~6.5-7km). Ya estás en distancia de objetivo." },
    ]},

  // ══ S8 · ESPECIFICIDAD ══ Semana del primer 7km. Todo cede ante el test del domingo.
  { n: 8, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 muy suave", dur: "22 min", rpe: "3/10",
        what: "18 min Z2 suave. Semana de test: todo lo de aquí al domingo es preparar, no entrenar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje ligero", dur: "30 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "3xfallo" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Activación + progresivos", dur: "20 min", rpe: "3-4/10",
        what: "10 min suave + 4x100m progresivos. No hay sesión de calidad esta semana: el test del domingo es la sesión." },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso total — falta el test" },
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación 15 min", dur: "15 min", rpe: "2/10",
        what: "15 min trote suave. Solo para no llegar frío mañana." },
      { dow: "Domingo", tipo: "test", cat: "runQ", titulo: "Primer 7km del bloque", dur: "~46-50 min", rpe: "5-7/10",
        what: "7km continuo. 5km Z2, últimos 2km más vivos. No es a ritmo objetivo: es para saber dónde estás." },
    ]},

  // ══ S9 · ESPECIFICIDAD ══ La sesion mas dura del bloque: el ritmo objetivo, de verdad.
  { n: 9, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 suave — recuperar del test", dur: "22 min", rpe: "3/10",
        what: "18 min Z2 muy suave. Vienes del 7km del domingo y del tenis de ayer." },
      { dow: "Miercoles", tipo: "fuerza", cat: "tiron", titulo: "Tirón ligero", dur: "25 min",
        ejercicios: [
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "2x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "2x10" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "3km exactos a 4:45/km", dur: "35 min", rpe: "8-9/10", esCalidad: true,
        what: "3km a 4:45/km exactos. El ritmo del objetivo, en menos distancia. Aquí sabes si el 7km es posible." },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso total — vienes de la sesión más dura" },
      { dow: "Sabado", tipo: "run", cat: "runQ", titulo: "Progresivos", dur: "20 min", rpe: "3/10",
        what: "10 min trote suave + 4x100m progresivos." },
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "6km suave", dur: "40 min", rpe: "5/10",
        what: "6km a Z2-Z3. Última tirada con volumen antes del taper." },
    ]},

  // ══ S10 · TAPER ══ El volumen baja a proposito. Se llega descansado, no mas fuerte.
  { n: 10, fase: "TAPER",
    days: [
      { ...LUNES_TENIS, notaPlan: "Taper: juega, pero no te vacíes. Nada de ir a por todas hoy." },
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Activación suave", dur: "25 min", rpe: "3/10",
        what: "20 min trote suave, sin exigencia." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje ligero — mantenimiento", dur: "20 min",
        ejercicios: [
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "2x10" },
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "2xfallo" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Progresivos", dur: "20 min", rpe: "3-4/10",
        what: "10 min trote suave + 4x100m progresivos. Recordarle a las piernas qué es ir rápido." },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso total" },
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación", dur: "20 min", rpe: "2-3/10",
        what: "15 min trote suave." },
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Último ensayo largo suave", dur: "35 min", rpe: "4/10",
        what: "5km a ritmo cómodo, sin forzar." },
    ]},

  // ══ S11 · OBJETIVO ══ Taper final. Solo se llega fresco.
  { n: 11, fase: "OBJETIVO",
    days: [
      { ...LUNES_TENIS, notaPlan: "Semana del objetivo: juega suave. Faltan 6 días y las piernas son lo único que importa." },
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Activación mínima", dur: "20 min", rpe: "2-3/10",
        what: "15 min trote muy suave." },
      { dow: "Miercoles", tipo: "libre", cat: "descanso", titulo: "Descanso total" },
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Progresivos", dur: "20 min", rpe: "3-4/10",
        what: "10 min trote suave + 4x100m progresivos. El último recordatorio de ritmo." },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso — prepara todo" },
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación final", dur: "15 min", rpe: "2/10",
        what: "10 min jogging muy suave." },
      { dow: "Domingo", tipo: "objetivo", cat: "runQ", titulo: "7KM A 4:45/km — EL DÍA", dur: "~33:15", rpe: "8-9/10",
        what: "Km1-2 a 5:00. Km3-5 a 4:50. Km6-7 lo que dé. Negative split: salir conservador, acabar fuerte." },
    ]},
];
