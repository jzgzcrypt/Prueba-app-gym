/**
 * LA MOVILIDAD VA DENTRO DE LA SESION
 *
 * Todo lo que va pegado a una sesion se hace; lo que queda suelto "para casa"
 * no se hace. Por eso no hay movilidad de dia libre: cada ejercicio de
 * movilidad vive en el calentamiento o el enfriamiento de una sesion que ya
 * vas a hacer (gimnasio, carrera o tenis).
 *
 *   Gimnasio     calentamiento corto + el patron de movilidad que toca ese dia
 *                (ver PATRONES_POR_SESION en patrones.js) + estiramiento al acabar.
 *   Running      lo que pide el plan: trote suave, movilidad dinamica y
 *                progresivos antes; gemelo y cintilla al acabar. En la calle,
 *                sin material.
 *   Tenis        rotacion de hombro y tobillo antes; cintilla y gemelo despues.
 *   Descanso     nada. Descansar tambien es el plan.
 *
 * El cuello NO esta aqui: es el protocolo de la fisio, va aparte y es diario.
 */
export const MOVILIDAD = {
  empuje: {
    cal: [{ id: "clavicula_circulos", ex: "Clavícula con banda", t: "90s", reps: "2 series" }, { id: "apertura_pecho_banda", ex: "Apertura de pecho con banda", t: "90s", reps: "12 reps" }],
    enf: [{ id: "estiramiento_pectoral_mancuerna", ex: "Pectoral con mancuerna", t: "45s/lado", reps: "1 serie/lado" }],
  },
  tiron: {
    cal: [{ id: "dead_hang", ex: "Dead hang", t: "30s", reps: "2 series" }, { id: "apertura_pecho_banda", ex: "Apertura de pecho con banda", t: "90s", reps: "12 reps" }],
    enf: [{ id: "estiramiento_dorsal", ex: "Estiramiento dorsal", t: "45s/lado", reps: "1 serie/lado" }],
  },
  pierna: {
    cal: [{ id: "circulos_tobillo_ktw", ex: "Tobillo + knee-to-wall", t: "60s", reps: "10 reps/lado" }, { id: "puente_gluteo_resp", ex: "Puente de glúteo", t: "1 min", reps: "12 reps" }],
    enf: [{ id: "estiramiento_90_90", ex: "90/90 de cadera", t: "45s/lado", reps: "1 serie/lado" }, { id: "estiramiento_gemelo_soleo", ex: "Gemelo/sóleo", t: "30s/lado", reps: "1 serie/lado" }],
  },
  // Calidad y pruebas: el calentamiento que pide el plan, en ese orden.
  runQ: {
    cal: [{ ex: "Trote muy suave", t: "15 min", reps: "hablando sin esfuerzo" }, { id: "cossack_dinamico", ex: "Cossack dinámico", t: "60s", reps: "8 reps/lado" }, { id: "circulos_tobillo_ktw", ex: "Tobillo + knee-to-wall", t: "60s", reps: "10 reps/lado" }, { id: "progresivos", ex: "Progresivos de 100 m", t: "2 min", reps: "3, acelerando hasta el ritmo de las series" }],
    enf: [{ ex: "Trote suave", t: "10 min", reps: "para bajar pulsaciones" }, { id: "estiramiento_gemelo_soleo", ex: "Gemelo/sóleo en un bordillo", t: "30s/lado", reps: "1 serie/lado" }, { id: "estiramiento_cintilla_it", ex: "Cintilla IT", t: "30s/lado", reps: "1 serie/lado" }],
  },
  runZ2: {
    cal: [{ ex: "Andar rápido", t: "3 min", reps: "para entrar en calor" }, { id: "circulos_tobillo_ktw", ex: "Tobillo + knee-to-wall", t: "60s", reps: "10 reps/lado" }],
    enf: [{ id: "estiramiento_gemelo_soleo", ex: "Gemelo/sóleo en un bordillo", t: "30s/lado", reps: "1 serie/lado" }],
  },
  // El tenis carga hombro (saque), tobillo y cadera (cambios de direccion) y
  // cintilla IT (frenadas laterales): se hace en la pista, antes y despues.
  tenis: {
    cal: [{ id: "circulos_hombro_rotacion", ex: "Rotación externa de hombro", t: "60s", reps: "12 reps/lado" }, { id: "circulos_tobillo_ktw", ex: "Tobillo + knee-to-wall", t: "60s", reps: "10 reps/lado" }],
    enf: [{ id: "estiramiento_cintilla_it", ex: "Cintilla IT", t: "30s/lado", reps: "1 serie/lado" }, { id: "estiramiento_gemelo_soleo", ex: "Gemelo/sóleo", t: "30s/lado", reps: "1 serie/lado" }],
  },
  descanso: { cal: [], enf: [] },
};

/** El dia del objetivo se calienta menos: 10 minutos, lo que pide el plan. */
const CALENTAMIENTO_OBJETIVO = [
  { ex: "Trote muy suave", t: "10 min", reps: "sin gastar nada" },
  { id: "progresivos", ex: "Progresivos de 100 m", t: "2 min", reps: "3, el último a 4:45" },
];

/** Calentamiento corto: para rodajes suaves, activaciones y la prueba de S1. */
const CALENTAMIENTO_SUAVE = MOVILIDAD.runZ2;

/**
 * La movilidad de un dia del plan.
 *
 * El calentamiento largo (15 min + movilidad + progresivos) es para lo que va
 * a tope: series y pruebas cronometradas. Las activaciones y los progresivos
 * sueltos son mas cortos que ese calentamiento, asi que llevan el suave.
 * Desde S4 la calidad suma skips (tecnica de carrera); la potencia de pierna
 * ya esta en el plan (pogo jumps), no se duplica aqui.
 */
export function getMovilidadDelDia(dia) {
  if (!dia) return MOVILIDAD.descanso;
  if (dia.tipo === "objetivo") return { cal: CALENTAMIENTO_OBJETIVO, enf: MOVILIDAD.runQ.enf.slice(0, 2) };
  if (dia.tipo === "compromiso") return MOVILIDAD[dia.cat] || MOVILIDAD.descanso;
  const esCorrer = dia.tipo === "run" || dia.tipo === "test";
  if (esCorrer) {
    const aTope = dia.esCalidad || (dia.tipo === "test" && !(dia.prueba && dia.prueba.partida));
    if (!aTope) return CALENTAMIENTO_SUAVE;
    const base = MOVILIDAD.runQ;
    if (dia.weekN >= 4 && dia.weekN <= 9) {
      const skips = { id: "skips_altos", ex: "Skips altos", t: "60s", reps: "2 x 20 m" };
      // Van antes de los progresivos, que son lo ultimo antes de empezar.
      return { cal: [...base.cal.slice(0, -1), skips, base.cal.at(-1)], enf: base.enf };
    }
    return base;
  }
  return MOVILIDAD[dia.cat] || MOVILIDAD.descanso;
}
