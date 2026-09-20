export const MOVILIDAD = {
  empuje: {
    cal: [{ id: "clavicula_circulos", ex: "Clavicula con banda", t: "90s", reps: "2 series" }, { id: "apertura_pecho_banda", ex: "Apertura de pecho", t: "90s", reps: "12 reps" }],
    enf: [{ id: "estiramiento_pectoral_mancuerna", ex: "Pectoral con mancuerna", t: "45s/lado", reps: "1 serie/lado" }, { id: "catcow", ex: "Cat-cow", t: "1 min", reps: "10 reps" }],
  },
  tiron: {
    cal: [{ id: "cossack_squat", ex: "Cossack squat", t: "90s", reps: "8 reps/lado" }, { id: "dead_hang", ex: "Dead hang", t: "30s", reps: "2 series" }],
    enf: [{ id: "estiramiento_dorsal", ex: "Estiramiento dorsal", t: "45s/lado", reps: "1 serie/lado" }, { id: "retraccion_escapular", ex: "Retraccion escapular", t: "1 min", reps: "10 reps" }],
  },
  pierna: {
    cal: [{ id: "sentadilla_atg", ex: "Sentadilla ATG", t: "90s", reps: "10 reps" }, { id: "cossack_squat", ex: "Cossack squat", t: "90s", reps: "8 reps/lado" }],
    enf: [{ id: "estiramiento_90_90", ex: "90/90 de cadera", t: "45s/lado", reps: "1 serie/lado" }, { id: "puente_gluteo_resp", ex: "Puente de gluteo", t: "1 min", reps: "12 reps" }],
  },
  runQ: {
    cal: [{ id: "cossack_dinamico", ex: "Cossack dinamico", t: "60s", reps: "8 reps/lado" }, { id: "progresivos", ex: "3 progresivos", t: "2 min", reps: "3 series" }],
    enf: [{ id: "estiramiento_cintilla_it", ex: "Cintilla IT", t: "30s/lado", reps: "1 serie/lado" }, { id: "foam_roller_gemelo", ex: "Foam roller gemelo", t: "2 min", reps: "1 serie/pierna" }],
  },
  runZ2: {
    cal: [{ id: "circulos_tobillo_ktw", ex: "Tobillo mas knee-to-wall", t: "60s", reps: "10 reps/lado" }],
    enf: [{ id: "estiramiento_gemelo_soleo", ex: "Gemelo/soleo", t: "30s/lado", reps: "1 serie/lado" }],
  },
  descanso: {
    cal: [],
    enf: [{ id: "clavicula_circulos", ex: "Clavicula con banda", t: "90s", reps: "2 series" }, { id: "retraccion_escapular", ex: "Retraccion mas apertura pecho", t: "2 min", reps: "10 reps" }],
  }
};

// Progresion de agilidad atletica: pierna y running de calidad suman
// un ejercicio avanzado (rango o potencia, alternando) segun la semana.
// Semanas 1-3: base. Semanas 4-6: +rango. Semanas 7-9: +potencia. Semanas 10-11: mantenimiento (sin sumar, taper).
export function getMovilidad(cat, weekN) {
  const base = MOVILIDAD[cat] || MOVILIDAD.descanso;
  if (cat !== "pierna" && cat !== "runQ") return base;
  if (weekN <= 3) return base;

  const extra = weekN <= 6
    ? (cat === "pierna"
        ? { id: "cadera_90_90_dinamico", ex: "90/90 dinamico (avanzado)", t: "90s", reps: "8 reps/lado" }
        : { id: "skips_altos", ex: "Skips altos (avanzado)", t: "60s", reps: "3 series" })
    : weekN <= 9
    ? (cat === "pierna"
        ? { id: "step_ups_explosivos", ex: "Step-ups explosivos (avanzado)", t: "90s", reps: "8 reps/lado" }
        : { id: "bounds_horizontales", ex: "Bounds horizontales (avanzado)", t: "90s", reps: "3 series" })
    : null; // semanas 10-11: taper, sin sumar carga extra

  if (!extra) return base;
  return { cal: [...base.cal, extra], enf: base.enf };
}
