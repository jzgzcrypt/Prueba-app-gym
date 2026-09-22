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
 *   Martes     Running muy suave      Descarga activa: se corre para soltar.
 *   Miercoles  Fuerza A (+ hombro)    Tren superior: no compite con el tenis.
 *   Jueves     Running de CALIDAD     3 dias despues del tenis, piernas listas.
 *   Viernes    Fuerza B (+ hombro)    Hombro por segunda vez en la semana.
 *   Sabado     Pierna + prevencion    Gemelo, gluteo medio y core. Corto.
 *   Domingo    Tirada larga           6 dias despues del tenis, fresco.
 *
 * Tres carreras y el tenis. Se decidio NO meter una cuarta salida: la tarde
 * no es solo suya. El volumen sale de alargar la tirada del domingo.
 *
 * ─── LA REVISION DEL 22 DE SEPTIEMBRE ──────────────────────────────────────
 *
 * El punto de partida real es desconocido: vuelve de 1-3 meses parado y nunca
 * habia bajado de 5:00/km. 4:45 seria su mejor marca. Por eso:
 *
 *   PRUEBAS      S1 (domingo): cuanto aguanta corriendo seguido, sin exigir.
 *                S4 (jueves): 3 km a tope. De ahi salen los ritmos de S5-S7.
 *                S8 (domingo): 5 km a tope. DECIDE LA FECHA (ver REGLAS_BLOQUE).
 *   SERIES       Los jueves pasan de tempos continuos lentos (5:27 -> 5:05 y
 *                salto a 4:45 en S9) a series AL ritmo objetivo desde S6, que
 *                se alargan: 800 m -> 1 km -> 2 km -> 3 km. 4:45 deja de ser
 *                una sorpresa.
 *   CARGA        El pico esta en S9. S10 baja ~25% sin quitar ritmo y S11 otro
 *                ~40%. Antes S10 era la semana de mas running del bloque.
 *   FUERZA       S5 ya no duplica el volumen la semana que entra el ritmo.
 *                El hombro se mantiene hasta S10 (las laterales no cansan las
 *                piernas). Pecho y espalda con un minimo fijo. Nada a fallo
 *                salvo la ultima serie: al fallo el trapecio carga el cuello.
 *   PREVENCION   Gemelo, gluteo medio y plancha lateral todas las semanas
 *                hasta S10. Antes la cadera desaparecia justo en S6.
 *   CUELLO       Face pull y rotacion externa dos veces por semana. Dominadas
 *                sin llegar al limite.
 *   COMIDA       La vispera del test y del objetivo se come, y S10-S11 van
 *                sin deficit (ver `vispera` y `sinDeficit`, domain/nutricion).
 *   DIA D        Km 1 a 4:48, km 2-6 a 4:45, km 7 a tope. El reparto anterior
 *                pedia los dos ultimos km a 4:22.
 */
export const FECHA_INICIO = "2026-09-21"; // lunes

export const BLOQUE = {
  numero: 1,
  nombre: "Bloque 1 — Base 7K",
  objetivo: "7km @ 4:45/km",
  semanas: 11,
};

/**
 * Las reglas del bloque: que hacer cuando la semana no sale como estaba
 * escrita. Se ensenan en Coach > Plan global.
 */
export const REGLAS_BLOQUE = [
  { t: "La fecha la decide el 5 km de S8",
    d: "23:30 o menos: se mantiene el 6 de diciembre a 4:45. Entre 23:30 y 25:00: el bloque se alarga ~4 semanas. Más de 25:00: ~8 semanas. Se mueve la fecha, no se baja el ritmo." },
  { t: "Si pierdes el jueves",
    d: "Pásalo al viernes o al sábado. Si no cabe, se pierde. Nunca dos días duros seguidos, ni la calidad el día antes de la tirada." },
  { t: "Si pierdes el martes", d: "No se recupera. Es descarga, no entrenamiento." },
  { t: "Si enfermas 4 días o más", d: "Se repite la semana, no se salta. Eso empuja la fecha." },
  { t: "Si vas cansado", d: "Se recorta primero la fuerza. El 7K tiene fecha; el hombro aguanta una semana floja." },
  { t: "Suave es suave", d: "En los rodajes suaves tienes que poder hablar con frases completas. El ritmo de Strava se apunta, pero no manda." },
  { t: "Si algo molesta el cuello", d: "Ese día se cambia el ejercicio por una variante que no cargue el cuello. No se aprieta." },
];

const LUNES_TENIS = { dow: "Lunes", tipo: "libre", cat: "descanso", titulo: "Tenis — compromiso fijo" };

// ─── Piezas que se repiten ──────────────────────────────────────────────────
// Nada a fallo salvo la ultima serie de las laterales.
const LAT_POLEA = (n) => ({ grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: n + "x12-15 (última al fallo)" });
const LAT_MANC = (n) => ({ grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: n + "x12-15 (última al fallo)" });
const FACE_PULL = { grupo: "Espalda", nombre: "Face pull en polea", series: "2x15" };
const ROT_EXT = { grupo: "Hombro", nombre: "Rotacion externa con banda", series: "2x15" };
const GEMELO = { grupo: "Pierna", nombre: "Elevacion de gemelo a una pierna", series: "3x15/lado" };
const CLAMSHELL = { grupo: "Cadera", nombre: "Clamshells con banda", series: "2x15" };
const PLANCHA_LAT = { grupo: "Core", nombre: "Plancha lateral", series: "2x30s/lado" };
const POGO = { grupo: "Pierna", nombre: "Pogo jumps", series: "2x20" };
const BULGARA = { grupo: "Pierna", nombre: "Sentadilla bulgara", series: "3x8/lado" };

/** Viernes de las semanas ligeras: el hombro no descansa por el running,
 *  porque las laterales no cansan las piernas. */
const HOMBRO_EXPRES = (n) => ({
  dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Hombro exprés — sin piernas", dur: "15 min",
  ejercicios: [LAT_MANC(n), ROT_EXT],
});

const CALENTAR = "15 min suave + 3 progresivos de 100 m.";

export const WEEKS = [
  // ══ S1 · RAMPA ══ Entrar en la rutina. El domingo, la prueba de partida.
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
          { grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: "3x12-15" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runZ2", titulo: "Segunda salida", dur: "25 min", rpe: "3/10",
        what: "6x[90s correr / 2min caminar]. Piernas ya recuperadas del tenis.",
        intervalos: [{r:6,s:[["correr",90],["caminar",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Hombro + Brazos (rampa)", dur: "30 min",
        ejercicios: [
          { grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: "3x12-15" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención (rampa)", dur: "25 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "3x10" },
          { grupo: "Pierna", nombre: "Elevacion de gemelo a una pierna", series: "2x12/lado" },
          { grupo: "Cadera", nombre: "Puente gluteo + abduccion", series: "3x15" },
          { grupo: "Core", nombre: "Plancha lateral", series: "2x20s/lado" },
        ]},
      { dow: "Domingo", tipo: "test", cat: "runQ", titulo: "Prueba de partida", dur: "30 min", rpe: "4/10",
        what: "5 min andando rápido. Luego corre hasta 25 min SEGUIDOS a ritmo cómodo, en llano y grabando con Strava. Si necesitas caminar, caminas y sigues. No es un examen: es saber desde dónde empiezas. Apunta cuántos minutos aguantaste sin parar, el ritmo medio y cómo acabaste." },
    ]},

  // ══ S2 · ESTETICA ══ Entra el fartlek. Hombro dos veces, pecho y espalda con minimo fijo.
  { n: 2, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "20 min", rpe: "3/10",
        what: "15 min corriendo muy suave, pudiendo hablar. Piernas cargadas del tenis — nada de intensidad hoy." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro y pecho", dur: "45 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x10" },
          { grupo: "Pecho", nombre: "Press banca con barra", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek suave 4x[60s/2min]", dur: "25 min", rpe: "5/10", esCalidad: true,
        what: "4x[60s algo vivo / 2min suave]. Piernas ya recuperadas del tenis (3 días después).",
        intervalos: [{r:4,s:[["rapido",60],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          { grupo: "Pierna", nombre: "Sentadilla ATG sin peso", series: "2x10" },
          { grupo: "Pierna", nombre: "Cossack squat con peso corporal", series: "2x8/lado" },
          GEMELO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada suave", dur: "28 min", rpe: "4/10",
        what: "20 min corriendo suave continuo. Primera tirada sin caminar." },
    ]},

  // ══ S3 · ESTETICA ══ Entra la bulgara: pierna a una pierna, como se corre.
  { n: 3, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "22 min", rpe: "3/10",
        what: "16 min corriendo muy suave, pudiendo hablar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro y pecho", dur: "45 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x10" },
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x12" },
          { grupo: "Triceps", nombre: "Press frances con mancuernas", series: "3x10" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek 4x[75s/2min]", dur: "28 min", rpe: "5-6/10", esCalidad: true,
        what: "4x[75s algo vivo / 2min suave].",
        intervalos: [{r:4,s:[["rapido",75],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Espalda", nombre: "Remo con barra", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bayesian en polea", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          BULGARA, GEMELO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada suave, algo más larga", dur: "30 min", rpe: "4/10",
        what: "22 min corriendo suave continuo." },
    ]},

  // ══ S4 · ESTETICA ══ El jueves, la prueba de 3 km: de ella salen los ritmos.
  { n: 4, fase: "ESTETICA",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Suave — día después del tenis", dur: "22 min", rpe: "3/10",
        what: "16 min corriendo muy suave, pudiendo hablar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro y pecho", dur: "45 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press banca con barra", series: "3x8" },
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "test", cat: "runQ", titulo: "Prueba 3 km a tope", dur: "40 min", rpe: "9/10", esCalidad: true,
        what: CALENTAR + " Luego 3 km a tope, en llano y lo más regular que puedas: sal algo por debajo de lo que crees y aprieta el último km. 10 min suave para acabar. Apunta el tiempo total: de aquí salen los ritmos de S5 a S7. Orientativo: por debajo de ~14:30 vas en línea con 4:45." },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Dominadas", series: "3x5 (sin llegar al límite)" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          BULGARA, GEMELO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada más larga", dur: "35 min", rpe: "4/10",
        what: "26 min corriendo suave continuo." },
    ]},

  // ══ S5 · CALIDAD ══ Primeras series por debajo del ritmo objetivo. La fuerza NO sube a la vez.
  { n: 5, fase: "CALIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 de asimilación — suave", dur: "25 min", rpe: "3-4/10",
        what: "20 min muy suave, pudiendo hablar. Descarga del tenis, no entrenamiento." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro, pecho y tríceps", dur: "50 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x8" },
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x12" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "2x10" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 6x400m a 4:35", dur: "40 min", rpe: "7/10", esCalidad: true,
        what: CALENTAR + " 6x400 m a 4:35/km (~1:50 cada una) con 90 s de trote suave entre series. 10 min suave. Un poco más rápido que el objetivo, para que 4:45 empiece a parecer cómodo. Si el 3 km de S4 salió más lento de 4:50/km, haz las series a ese ritmo.",
        intervalos: [{r:6,s:[["rapido",110],["suave",90]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Dominadas", series: "3x5 (sin llegar al límite)" },
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          BULGARA, GEMELO, POGO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada larga 40 min", dur: "45 min", rpe: "4-5/10",
        what: "40 min suave continuo (~6 km). Primera tirada larga de verdad." },
    ]},

  // ══ S6 · ESPECIFICIDAD ══ Primeras series AL ritmo objetivo.
  { n: 6, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 de asimilación — suave", dur: "25 min", rpe: "3-4/10",
        what: "20 min muy suave, pudiendo hablar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro, pecho y tríceps", dur: "45 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "4x8" },
          { grupo: "Pecho", nombre: "Press banca con barra", series: "2x10" },
          { grupo: "Triceps", nombre: "Extension katana en polea baja", series: "3x10" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 5x800m a 4:45", dur: "45 min", rpe: "7/10", esCalidad: true,
        what: CALENTAR + " 5x800 m a 4:45/km (~3:48 cada una) con 2 min de trote suave entre series. 10 min suave. La primera vez que corres al ritmo del objetivo: en tramos cortos, para aprenderlo.",
        intervalos: [{r:5,s:[["rapido",228],["suave",120]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl bilateral con mancuernas", series: "3x10" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          BULGARA, GEMELO, POGO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada larga 50 min", dur: "55 min", rpe: "5/10",
        what: "50 min suave continuo (~7 km). Ya corres la distancia del objetivo, a tu ritmo." },
    ]},

  // ══ S7 · ESPECIFICIDAD ══ El ritmo objetivo en tramos de un kilometro.
  { n: 7, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 de asimilación — suave", dur: "25 min", rpe: "3-4/10",
        what: "20 min muy suave, pudiendo hablar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje — Hombro, pecho y tríceps", dur: "45 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x8" },
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "3x12" },
          { grupo: "Triceps", nombre: "Extension polea alta agarre en V", series: "3x12" },
          FACE_PULL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 4x1km a 4:45", dur: "45 min", rpe: "7-8/10", esCalidad: true,
        what: CALENTAR + " 4x1 km a 4:45/km con 90 s de trote suave entre series. 10 min suave. Cuatro de los siete kilómetros del objetivo, a su ritmo.",
        intervalos: [{r:4,s:[["rapido",285],["suave",90]]}] },
      { dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Tirón — Espalda, hombro y bíceps", dur: "45 min",
        ejercicios: [
          LAT_MANC(4),
          { grupo: "Espalda", nombre: "Dominadas", series: "3x5 (sin llegar al límite)" },
          { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" },
          { grupo: "Biceps", nombre: "Curl concentrado con mancuerna", series: "3x12" },
          ROT_EXT,
        ]},
      { dow: "Sabado", tipo: "fuerza", cat: "pierna", titulo: "Pierna + prevención", dur: "25 min",
        ejercicios: [
          BULGARA, GEMELO, POGO, CLAMSHELL, PLANCHA_LAT,
        ]},
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada larga 60 min", dur: "65 min", rpe: "5/10",
        what: "60 min suave continuo (~8-9 km). Más larga que el objetivo: que el día D los 7 km se te hagan cortos." },
    ]},

  // ══ S8 · ESPECIFICIDAD ══ Semana del test de 5 km, que decide la fecha.
  { n: 8, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 muy suave", dur: "22 min", rpe: "3/10",
        what: "18 min suave. Semana de test: todo lo de aquí al domingo es preparar, no entrenar." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje ligero + prevención", dur: "35 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Pecho", nombre: "Aperturas con mancuernas en banco", series: "2x10" },
          FACE_PULL, GEMELO, CLAMSHELL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Activación + progresivos", dur: "20 min", rpe: "3-4/10",
        what: "10 min suave + 4x100m progresivos. No hay sesión de calidad esta semana: el test del domingo es la sesión." },
      HOMBRO_EXPRES(4),
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación 15 min", dur: "15 min", rpe: "2/10", vispera: true,
        what: "15 min trote suave. Hoy se come con carbohidrato: mañana es el test." },
      { dow: "Domingo", tipo: "test", cat: "runQ", titulo: "Test 5 km — decide la fecha", dur: "45 min", rpe: "9/10",
        what: CALENTAR + " 5 km a tope, en llano. Km 1 algo contenido, luego regular, y el último lo que quede. Con el tiempo se decide: 23:30 o menos, el objetivo se queda el 6 de diciembre. Entre 23:30 y 25:00, el bloque se alarga unas 4 semanas. Más de 25:00, unas 8." },
    ]},

  // ══ S9 · ESPECIFICIDAD ══ El pico de carga del bloque: 6 km al ritmo, en tres tramos.
  { n: 9, fase: "ESPECIFICIDAD",
    days: [
      LUNES_TENIS,
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Z2 suave — recuperar del test", dur: "22 min", rpe: "3/10",
        what: "18 min muy suave. Vienes del test del domingo y del tenis de ayer." },
      { dow: "Miercoles", tipo: "fuerza", cat: "tiron", titulo: "Tirón ligero + prevención", dur: "35 min",
        ejercicios: [
          LAT_POLEA(4),
          { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "2x10" },
          FACE_PULL, GEMELO, CLAMSHELL,
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 3x2km a 4:45", dur: "55 min", rpe: "8/10", esCalidad: true,
        what: CALENTAR + " 3x2 km a 4:45/km con 2 min de trote suave entre series. 10 min suave. La sesión más dura del bloque: 6 km al ritmo del objetivo.",
        intervalos: [{r:3,s:[["rapido",570],["suave",120]]}] },
      HOMBRO_EXPRES(4),
      { dow: "Sabado", tipo: "run", cat: "runQ", titulo: "Progresivos", dur: "15 min", rpe: "3/10",
        what: "10 min trote suave + 4x100m progresivos." },
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada larga 55 min", dur: "60 min", rpe: "5/10",
        what: "55 min suave continuo (~8 km). La última tirada larga: a partir de aquí baja la carga." },
    ]},

  // ══ S10 · PUENTE ══ Baja el volumen, se mantiene el ritmo. Sin deficit.
  { n: 10, fase: "PUENTE", sinDeficit: true,
    days: [
      { ...LUNES_TENIS, notaPlan: "Empieza a bajar la carga: juega, pero no te vacíes. Nada de ir a por todas hoy." },
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Activación suave", dur: "20 min", rpe: "3/10",
        what: "15 min trote suave, sin exigencia." },
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Empuje ligero — mantenimiento", dur: "25 min",
        ejercicios: [
          LAT_POLEA(3),
          { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "2x10" },
          FACE_PULL,
          { grupo: "Pierna", nombre: "Elevacion de gemelo a una pierna", series: "2x15/lado" },
        ]},
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 2x3km a 4:45", dur: "45 min", rpe: "8/10", esCalidad: true,
        what: CALENTAR + " 2x3 km a 4:45/km con 2 min de trote suave entre medias. 10 min suave. Seis kilómetros al ritmo, en dos tramos. Si esto sale, el domingo 11 sale.",
        intervalos: [{r:2,s:[["rapido",855],["suave",120]]}] },
      HOMBRO_EXPRES(3),
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación", dur: "15 min", rpe: "2-3/10",
        what: "15 min trote suave." },
      { dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Rodaje suave 5 km", dur: "35 min", rpe: "4/10",
        what: "5 km muy suave. Ya está todo hecho: a partir de aquí solo se descansa." },
    ]},

  // ══ S11 · OBJETIVO ══ Taper final: menos volumen, el ritmo se recuerda. Sin deficit.
  { n: 11, fase: "OBJETIVO", sinDeficit: true,
    days: [
      { ...LUNES_TENIS, notaPlan: "Semana del objetivo: juega suave. Faltan 6 días y las piernas son lo único que importa." },
      { dow: "Martes", tipo: "run", cat: "runZ2", titulo: "Activación mínima", dur: "20 min", rpe: "2-3/10",
        what: "15 min trote muy suave." },
      { dow: "Miercoles", tipo: "libre", cat: "descanso", titulo: "Descanso total" },
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Recordatorio 2x1km a 4:45", dur: "30 min", rpe: "5/10",
        what: "10 min suave + 2x1 km a 4:45/km con 2 min de trote entre medias + 5 min suave. Poco volumen, el ritmo exacto: que el cuerpo lo recuerde.",
        intervalos: [{r:2,s:[["rapido",285],["suave",120]]}] },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso — prepara todo" },
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación final", dur: "15 min", rpe: "2/10", vispera: true,
        what: "10 min trote muy suave. Hoy se come bien, con carbohidrato en cada comida." },
      { dow: "Domingo", tipo: "objetivo", cat: "runQ", titulo: "7KM A 4:45/km — EL DÍA", dur: "~33:15", rpe: "8-9/10",
        what: "Calienta 10 min suave + 3 progresivos. Km 1 a 4:48, y no más rápido: la emoción te va a empujar. Km 2 a 6 a 4:45 clavados. Km 7 a tope, lo que quede. Desayuno con carbohidrato 2-3 h antes." },
    ]},
];
