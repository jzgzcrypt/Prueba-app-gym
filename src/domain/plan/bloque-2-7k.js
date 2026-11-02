/**
 * BLOQUE 2 — 7K a 4:45, desde donde estas de verdad
 *
 * El bloque 1 daba por hechas sus semanas 1-5. No salieron: una carrera
 * suelta desde el 12 de octubre. Con el suave a ~6:40/km, el 5 km ronda los
 * 26-27 min y el objetivo pide 23:30: falta un 12-15 %. Constante, se mejora
 * un 1-2 % por semana, asi que hacen falta ~13 semanas. Este bloque empieza
 * el lunes 2 de noviembre y acaba con el 7K el domingo 31 de enero.
 *
 * Las semanas del 21 de septiembre al 1 de noviembre (bloque 1, S1-S6) se
 * quedan en el calendario como historia: lo apuntado sigue en su dia.
 *
 * ─── LA SEMANA TIPO ────────────────────────────────────────────────────────
 *
 *   Lunes      TENIS 20:00-21:30      Compromiso fijo (domain/compromisos.js).
 *   Martes     Correr suave           Para soltar el tenis.
 *   Miercoles  Hombro + empuje 30 min Con gemelo y plancha lateral.
 *   Jueves     Correr: la de calidad  3 dias despues del tenis.
 *   Viernes    Hombro + tiron 30 min  Con gluteo medio y bulgara.
 *   Sabado     Libre                  Descanso de verdad.
 *   Domingo    Tirada                 La que mas crece.
 *
 * Lo que manda son las 3 carreras. Nada mas compite con ellas: la fuerza es
 * corta y la prevencion va dentro de los dias de hombro.
 *
 * ─── LAS FASES ─────────────────────────────────────────────────────────────
 *
 *   S1-S2    VOLVER       3 suaves cortos. Crear el habito sin romperse.
 *   S3-S4    BASE         Fartlek suave; S4 jueves, prueba de 3 km.
 *   S5-S8    CONSTRUIR    Series de 400-800 m; S8 domingo, el 5 km que decide.
 *   S9-S11   ESPECIFICO   1 km -> 2 km -> 3 km a 4:45. Pico en S10.
 *   S12-S13  RECTA FINAL  Baja la carga, sin deficit. El 7K el domingo.
 *
 * La carga de running no sube mas de un 15 % sobre la mejor semana anterior
 * (tests/plan.test.js lo vigila).
 */
export const FECHA_INICIO_BLOQUE = "2026-11-02"; // lunes

/** Lo que dice el 5 km que decide la fecha: hasta este tiempo, tantas semanas
 *  extra (negativo: el 7K se adelanta). */
export const DECIDE_FECHA = [
  { hasta: 22 * 60 + 45, semanasExtra: -1 },
  { hasta: 23 * 60 + 30, semanasExtra: 0 },
  { hasta: 25 * 60, semanasExtra: 4 },
  { hasta: Infinity, semanasExtra: 8 },
];

/** El tiempo de 5 km hasta el que la fecha se mantiene: lo que va en linea con el objetivo. */
export const MANTIENE_FECHA = DECIDE_FECHA.find(t => t.semanasExtra === 0).hasta;

export const BLOQUE = {
  numero: 2,
  nombre: "Bloque 2 — 7K a 4:45",
  objetivo: "7km @ 4:45/km",
  semanas: 13,
};

/** Que hacer cuando la semana no sale como estaba escrita (Coach > Plan global). */
export const REGLAS_BLOQUE = [
  { t: "Lo que manda: 3 carreras por semana",
    d: "Martes, jueves y domingo. Si una semana sale 3 de 3, vas en camino. Todo lo demás (hombro, cuello, comida) suma, pero no compite con ellas." },
  { t: "La fecha la decide el 5 km de la semana 8",
    d: "22:45 o menos: el 7K se adelanta una semana. Hasta 23:30: se mantiene. Entre 23:30 y 25:00: se mueve ~4 semanas. Más de 25:00: ~8. Se mueve la fecha, no se baja el ritmo." },
  { t: "Si pierdes el jueves",
    d: "Pásalo al viernes o al sábado. Si no cabe, se pierde. Nunca dos días duros seguidos, ni la calidad el día antes de la tirada." },
  { t: "Si pierdes el martes", d: "No se recupera. Es para soltar el tenis, no entrenamiento." },
  { t: "Si enfermas o paras 4 días o más", d: "Lo perdido se pierde y se sigue: la vuelta tras el parón ajusta la carga. La fecha solo la mueve el 5 km." },
  { t: "Si vas cansado", d: "Se recorta primero el hombro. La carrera, aunque sea corta, se hace." },
  { t: "Suave es suave", d: "En los suaves tienes que poder hablar con frases completas. El ritmo se apunta, pero no manda." },
  { t: "Si algo molesta el cuello", d: "Ese día se cambia el ejercicio por una variante que no cargue el cuello. No se aprieta." },
];

const LUNES_TENIS = { dow: "Lunes", tipo: "libre", cat: "descanso", titulo: "Tenis — compromiso fijo" };
const SABADO_LIBRE = { dow: "Sabado", tipo: "libre", cat: "descanso", titulo: "Libre" };

// ─── Piezas ─────────────────────────────────────────────────────────────────
const LAT_POLEA = (n) => ({ grupo: "Hombro", nombre: "Elevaciones laterales polea muñequera cruzadas", series: n + "x12-15 (última al fallo)" });
const LAT_MANC = (n) => ({ grupo: "Hombro", nombre: "Elevaciones laterales mancuerna", series: n + "x12-15 (última al fallo)" });
const FACE_PULL = { grupo: "Espalda", nombre: "Face pull en polea", series: "2x15" };
const ROT_EXT = { grupo: "Hombro", nombre: "Rotacion externa con banda", series: "2x15" };
const GEMELO = { grupo: "Pierna", nombre: "Elevacion de gemelo a una pierna", series: "3x15/lado" };
const CLAMSHELL = { grupo: "Cadera", nombre: "Clamshells con banda", series: "2x15" };
const PLANCHA_LAT = { grupo: "Core", nombre: "Plancha lateral", series: "2x30s/lado" };
const BULGARA = { grupo: "Pierna", nombre: "Sentadilla bulgara", series: "2x8/lado" };

const CALENTAR = "15 min suave + 3 progresivos de 100 m.";

/** Miercoles: hombro y empuje, con la prevencion de gemelo y core. 30 min. */
const MIERCOLES = (n, pecho) => ({
  dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Hombro + empuje", dur: "30 min", patrones: ["hombro", "cadenaPosterior"],
  ejercicios: [LAT_POLEA(n), pecho, FACE_PULL, GEMELO, PLANCHA_LAT],
});
/** Viernes: hombro y tiron, con gluteo medio. 30 min. */
const VIERNES = (n, espalda, conBulgara = true) => ({
  dow: "Viernes", tipo: "fuerza", cat: "tiron", titulo: "Hombro + tirón", dur: "30 min", patrones: ["columna", "cadera"],
  ejercicios: [LAT_MANC(n), espalda, ROT_EXT, CLAMSHELL, ...(conBulgara ? [BULGARA] : [])],
});
const PRESS_INC = { grupo: "Pecho", nombre: "Press inclinado con mancuernas", series: "3x10" };
const PRESS_BANCA = { grupo: "Pecho", nombre: "Press banca con barra", series: "3x8" };
const JALON = { grupo: "Espalda", nombre: "Jalon al pecho unilateral", series: "3x10" };
const REMO = { grupo: "Espalda", nombre: "Remo unilateral en polea", series: "3x10" };

const suave = (dow, min, dur, extra, rpe = "3/10") => ({
  dow, tipo: "run", cat: "runZ2", titulo: "Suave " + min + " min", dur: dur + " min", rpe,
  what: min + " min suave continuo, pudiendo hablar. " + extra,
});
const tirada = (min, dur, extra) => ({
  dow: "Domingo", tipo: "run", cat: "runZ2", titulo: "Tirada " + min + " min", dur: dur + " min", rpe: "4-5/10",
  what: min + " min suave continuo. " + extra,
});

export const WEEKS = [
  // ══ S1 · VOLVER ══ Tres salidas cortas. Lo unico que importa es salir.
  // `vuelta`: estas semanas ya son la vuelta tras el paron; ajuste.js no las recorta.
  { n: 1, fase: "VOLVER", vuelta: true,
    days: [
      LUNES_TENIS,
      suave("Martes", 20, 20, "Primera de tres. Si hay que caminar algún minuto, se camina y se sigue."),
      MIERCOLES(5, PRESS_INC),
      { ...suave("Jueves", 18, 22, "Al final, 4 progresivos de 15 s. Nada más: esta semana es crear la rutina."), titulo: "Suave + progresivos" },
      VIERNES(5, JALON, false),
      SABADO_LIBRE,
      tirada(25, 25, "La más larga de la semana, igual de suave."),
    ]},

  // ══ S2 · VOLVER ══
  { n: 2, fase: "VOLVER", vuelta: true,
    days: [
      LUNES_TENIS,
      suave("Martes", 22, 22, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_INC),
      { ...suave("Jueves", 20, 25, "Al final, 5 progresivos de 15 s."), titulo: "Suave + progresivos" },
      VIERNES(5, REMO, false),
      SABADO_LIBRE,
      tirada(30, 30, "Media hora seguida. Si sale, el hábito ya está."),
    ]},

  // ══ S3 · BASE ══ Entra un fartlek suave.
  { n: 3, fase: "BASE",
    days: [
      LUNES_TENIS,
      suave("Martes", 25, 25, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_BANCA),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Fartlek 6x[1 min/2 min]", dur: "28 min", rpe: "5-6/10", esCalidad: true,
        what: "8 min suave. 6x[1 min algo vivo / 2 min suave]. 2 min suave para acabar. Vivo es incómodo pero controlado, no a tope.",
        intervalos: [{ r: 6, s: [["rapido", 60], ["suave", 120]] }] },
      VIERNES(5, JALON),
      SABADO_LIBRE,
      tirada(33, 33, "Un poco más que la semana pasada, igual de suave."),
    ]},

  // ══ S4 · BASE ══ El jueves, la prueba de 3 km: de ella salen los ritmos.
  { n: 4, fase: "BASE",
    days: [
      LUNES_TENIS,
      suave("Martes", 22, 22, "Suave de verdad: el jueves es la prueba."),
      MIERCOLES(5, PRESS_INC),
      { dow: "Jueves", tipo: "test", cat: "runQ", titulo: "Prueba 3 km a tope", dur: "40 min", rpe: "9/10", esCalidad: true,
        prueba: { distKm: 3, enLinea: 870 },
        what: CALENTAR + " Luego 3 km a tope, en llano y lo más regular que puedas: sal algo por debajo de lo que crees y aprieta el último km. 10 min suave para acabar. Apunta el tiempo total: de aquí salen los ritmos de las series. Orientativo: por debajo de ~14:30 vas en línea con 4:45." },
      VIERNES(5, REMO),
      SABADO_LIBRE,
      tirada(35, 35, "Tras la prueba, suave y sin mirar el reloj."),
    ]},

  // ══ S5 · CONSTRUIR ══ Primeras series, cortas y algo por debajo del objetivo.
  { n: 5, fase: "CONSTRUIR",
    days: [
      LUNES_TENIS,
      suave("Martes", 25, 25, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_BANCA),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 6x400m a 4:35", dur: "40 min", rpe: "7/10", esCalidad: true, ritmo: 275, tramoM: 400,
        what: CALENTAR + " 6x400 m a 4:35/km (~1:50 cada una) con 90 s de trote suave entre series. 10 min suave. Si el 3 km salió más lento de 4:50/km, la app ajusta el ritmo a tu prueba.",
        intervalos: [{ r: 6, s: [["rapido", 110], ["suave", 90]] }] },
      VIERNES(5, JALON),
      SABADO_LIBRE,
      tirada(45, 45, "Primera tirada larga de verdad."),
    ]},

  // ══ S6 · CONSTRUIR ══ El ritmo objetivo, en tramos de 800 m.
  { n: 6, fase: "CONSTRUIR",
    days: [
      LUNES_TENIS,
      suave("Martes", 28, 28, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_INC),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 5x800m a 4:45", dur: "45 min", rpe: "7/10", esCalidad: true, ritmo: 285, tramoM: 800,
        what: CALENTAR + " 5x800 m a 4:45/km (~3:48 cada una) con 2 min de trote suave entre series. 10 min suave. La primera vez al ritmo del objetivo: en tramos cortos, para aprenderlo.",
        intervalos: [{ r: 5, s: [["rapido", 228], ["suave", 120]] }] },
      VIERNES(5, REMO),
      SABADO_LIBRE,
      tirada(50, 50, "Ya corres más tiempo del que dura el objetivo."),
    ]},

  // ══ S7 · CONSTRUIR ══
  { n: 7, fase: "CONSTRUIR",
    days: [
      LUNES_TENIS,
      suave("Martes", 30, 30, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_BANCA),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 6x800m a 4:45", dur: "48 min", rpe: "7-8/10", esCalidad: true, ritmo: 285, tramoM: 800,
        what: CALENTAR + " 6x800 m a 4:45/km con 2 min de trote suave entre series. 10 min suave. Una más que la semana pasada.",
        intervalos: [{ r: 6, s: [["rapido", 228], ["suave", 120]] }] },
      VIERNES(5, JALON),
      SABADO_LIBRE,
      tirada(55, 55, "La más larga hasta ahora, igual de suave."),
    ]},

  // ══ S8 · CONSTRUIR ══ Semana del 5 km, que decide la fecha.
  { n: 8, fase: "CONSTRUIR",
    days: [
      LUNES_TENIS,
      suave("Martes", 22, 22, "Semana de prueba: de aquí al domingo es preparar, no entrenar."),
      MIERCOLES(4, PRESS_INC),
      { ...suave("Jueves", 15, 20, "Al final, 4x100 m progresivos. No hay calidad esta semana: la prueba del domingo es la sesión.", "3-4/10"), titulo: "Activación + progresivos" },
      VIERNES(5, REMO, false),
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación 15 min", dur: "15 min", rpe: "2/10", vispera: true,
        what: "15 min trote suave. Hoy se come con carbohidrato: mañana es la prueba." },
      { dow: "Domingo", tipo: "test", cat: "runQ", titulo: "Test 5 km — decide la fecha", dur: "45 min", rpe: "9/10",
        prueba: { distKm: 5, decide: true },
        what: CALENTAR + " 5 km a tope, en llano. Km 1 algo contenido, luego regular, y el último lo que quede. Con el tiempo se decide: 22:45 o menos, el 7K se adelanta una semana; hasta 23:30, se mantiene; entre 23:30 y 25:00, se mueve unas 4 semanas; más de 25:00, unas 8." },
    ]},

  // ══ S9 · ESPECIFICO ══ El ritmo en tramos de un kilometro.
  { n: 9, fase: "ESPECÍFICO",
    days: [
      LUNES_TENIS,
      suave("Martes", 25, 25, "Vienes de la prueba y del tenis: muy suave."),
      MIERCOLES(5, PRESS_BANCA),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 4x1km a 4:45", dur: "45 min", rpe: "7-8/10", esCalidad: true, ritmo: 285, tramoM: 1000,
        what: CALENTAR + " 4x1 km a 4:45/km con 90 s de trote suave entre series. 10 min suave. Cuatro de los siete kilómetros, a su ritmo.",
        intervalos: [{ r: 4, s: [["rapido", 285], ["suave", 90]] }] },
      VIERNES(5, JALON),
      SABADO_LIBRE,
      tirada(55, 55, "Suave: el ritmo se trabaja el jueves, no hoy."),
    ]},

  // ══ S10 · ESPECIFICO ══ El pico del bloque: 6 km al ritmo en tres tramos.
  { n: 10, fase: "ESPECÍFICO",
    days: [
      LUNES_TENIS,
      suave("Martes", 28, 28, "Vienes del tenis: para soltar."),
      MIERCOLES(5, PRESS_INC),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 3x2km a 4:45", dur: "55 min", rpe: "8/10", esCalidad: true, ritmo: 285, tramoM: 2000,
        what: CALENTAR + " 3x2 km a 4:45/km con 2 min de trote suave entre series. 10 min suave. La sesión más dura del bloque: 6 km al ritmo del objetivo.",
        intervalos: [{ r: 3, s: [["rapido", 570], ["suave", 120]] }] },
      VIERNES(5, REMO),
      SABADO_LIBRE,
      tirada(60, 60, "La tirada más larga del bloque. Que el día D los 7 km se te hagan cortos."),
    ]},

  // ══ S11 · ESPECIFICO ══ Dos tramos de 3 km. Empieza a bajar el volumen.
  { n: 11, fase: "ESPECÍFICO",
    days: [
      LUNES_TENIS,
      suave("Martes", 25, 25, "Vienes del tenis: para soltar."),
      MIERCOLES(4, PRESS_BANCA),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 2x3km a 4:45", dur: "45 min", rpe: "8/10", esCalidad: true, ritmo: 285, tramoM: 3000,
        what: CALENTAR + " 2x3 km a 4:45/km con 2 min de trote suave entre medias. 10 min suave. Seis kilómetros al ritmo, en dos tramos. Si esto sale, el 7K sale.",
        intervalos: [{ r: 2, s: [["rapido", 855], ["suave", 120]] }] },
      VIERNES(4, JALON),
      SABADO_LIBRE,
      tirada(45, 45, "Ya baja: suave y corta."),
    ]},

  // ══ S12 · RECTA FINAL ══ Menos volumen, el ritmo se mantiene. Sin deficit.
  { n: 12, fase: "RECTA FINAL", sinDeficit: true,
    days: [
      { ...LUNES_TENIS, notaPlan: "Empieza a bajar la carga: juega, pero no te vacíes." },
      suave("Martes", 22, 22, "Sin exigencia."),
      MIERCOLES(3, PRESS_INC),
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Series 3x1km a 4:45", dur: "38 min", rpe: "7/10", esCalidad: true, ritmo: 285, tramoM: 1000,
        what: CALENTAR + " 3x1 km a 4:45/km con 2 min de trote suave entre series. 8 min suave. Poco volumen, el ritmo exacto.",
        intervalos: [{ r: 3, s: [["rapido", 285], ["suave", 120]] }] },
      VIERNES(3, REMO, false),
      SABADO_LIBRE,
      tirada(35, 35, "Ya está todo hecho: a partir de aquí se descansa."),
    ]},

  // ══ S13 · OBJETIVO ══ La semana del 7K. Sin deficit.
  { n: 13, fase: "OBJETIVO", sinDeficit: true,
    days: [
      { ...LUNES_TENIS, notaPlan: "Semana del objetivo: juega suave. Faltan 6 días y las piernas son lo único que importa." },
      suave("Martes", 15, 20, "Muy suave.", "2-3/10"),
      { dow: "Miercoles", tipo: "fuerza", cat: "empuje", titulo: "Hombro exprés — sin piernas", dur: "15 min", patrones: [],
        ejercicios: [LAT_POLEA(3), ROT_EXT] },
      { dow: "Jueves", tipo: "run", cat: "runQ", titulo: "Recordatorio 2x1km a 4:45", dur: "30 min", rpe: "5/10", ritmo: 285, tramoM: 1000,
        what: "10 min suave + 2x1 km a 4:45/km con 2 min de trote entre medias + 5 min suave. Que el cuerpo recuerde el ritmo.",
        intervalos: [{ r: 2, s: [["rapido", 285], ["suave", 120]] }] },
      { dow: "Viernes", tipo: "libre", cat: "descanso", titulo: "Descanso — prepara todo" },
      { dow: "Sabado", tipo: "run", cat: "runZ2", titulo: "Activación final", dur: "15 min", rpe: "2/10", vispera: true,
        what: "10 min trote muy suave. Hoy se come bien, con carbohidrato en cada comida." },
      { dow: "Domingo", tipo: "objetivo", cat: "runQ", titulo: "7KM A 4:45/km — EL DÍA", dur: "~33:15", rpe: "8-9/10", ritmo: 285,
        prueba: { distKm: 7 },
        what: "Calienta 10 min suave + 3 progresivos. Km 1 a 4:48, y no más rápido: la emoción te va a empujar. Km 2 a 6 a 4:45 clavados. Km 7 a tope, lo que quede. Desayuno con carbohidrato 2-3 h antes." },
    ]},
];
