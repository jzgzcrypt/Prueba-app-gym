/**
 * LA PRUEBA DE 2 SEMANAS: MENOS FRENTES Y VER SI FUNCIONA.
 *
 * Nada se borra: es una capa encima del plan. Mientras dura:
 *  - el sabado (pierna + prevencion) pasa a libre, y lo esencial de la pierna
 *    va en 10 minutos detras de los rodajes del martes y del domingo;
 *  - el cuello cuenta con 1 toma (despues de la ducha); las 3 siguen ahi;
 *  - magia y guerrero son extras: no cuentan en contra.
 * Al acabar se compara con las 2 semanas de antes y tu eliges.
 *
 * Puro: sin React, se prueba sin navegador.
 */

export const PRUEBA_DEFECTO = { desde: "2026-10-12", hasta: "2026-10-25" };

/** La prueba vigente (null si la quitaste). `guardada` undefined = la de por defecto. */
export const pruebaDe = (guardada) => (guardada === undefined ? PRUEBA_DEFECTO : guardada);
export const enPrueba = (prueba, iso) => !!prueba && !prueba.volver && iso >= prueba.desde && iso <= prueba.hasta;

/** Toca decidir: la prueba acabo y aun no has elegido. */
export const tocaDecidir = (prueba, hoyIso) => !!prueba && !prueba.decidido && hoyIso > prueba.hasta;
/** Quedarse: las reglas de la prueba siguen hasta el final del bloque. */
export const quedarse = (prueba, finIso) => ({ ...prueba, hasta: finIso, decidido: true });
/** Volver al plan de antes (la prueba queda guardada, sin efecto). */
export const volverAlPlan = (prueba) => ({ ...prueba, decidido: true, volver: true });

/** En que dia de la prueba estas (1-14), o null fuera de ella. */
export function diaDePrueba(prueba, iso) {
  if (!enPrueba(prueba, iso) || prueba.decidido) return null;
  return Math.round((new Date(iso + "T12:00:00") - new Date(prueba.desde + "T12:00:00")) / 86400000) + 1;
}

/** La pierna esencial, en 10 minutos, detras de un rodaje. */
export const PIERNA_10 = [
  { nombre: "Sentadilla búlgara", series: "2x8/lado" },
  { nombre: "Elevación de gemelo a una pierna", series: "2x15/lado" },
  { nombre: "Plancha lateral", series: "1x30s/lado" },
];

/** El dia tal y como queda en la prueba (el plan original no se toca). */
export function diaEnPrueba(day, prueba) {
  if (!day || !enPrueba(prueba, day.isoDate)) return day;
  if (day.tipo === "fuerza" && day.cat === "pierna") {
    return { ...day, tipo: "libre", titulo: "Libre", dur: "", ejercicios: undefined, original: day,
             what: "Día libre de la prueba de 2 semanas. La pierna va en 10 min detrás de los rodajes del martes y del domingo." };
  }
  if (day.tipo === "run" && (day.dayIdx === 1 || day.dayIdx === 6) && !day.intervalos) {
    return { ...day, pierna10: PIERNA_10 };
  }
  return day;
}

/**
 * Un dia "cumplido": hiciste lo principal (o era libre) y el cuello al menos
 * una vez. Es lo que se cuenta, sin rachas.
 */
export function cumplido(day, { checked, cuelloChecks }) {
  const iso = day.isoDate;
  const cuello = ["m", "t", "n"].some(k => (cuelloChecks || {})[iso + "-" + k]);
  const principal = day.tipo === "libre" || !!(checked || {})[iso];
  return principal && cuello;
}

/** Cuantos dias cumpliste de los que ya han pasado en [desde, hasta). */
export function diasCumplidos(dias, desde, hasta, datos) {
  const tramo = dias.filter(d => d.isoDate >= desde && d.isoDate < hasta);
  return { hechos: tramo.filter(d => cumplido(d, datos)).length, total: tramo.length };
}

const sumarDias = (iso, n) => { const f = new Date(iso + "T12:00:00"); f.setDate(f.getDate() + n); return f.toISOString().slice(0, 10); };

/**
 * La comparacion del final: las 2 semanas de la prueba contra las 2 de antes.
 * Sesiones hechas, dias con cuello, dias cumplidos y como te sentiste.
 */
export function compararPrueba({ dias, prueba, checked, cuelloChecks, sentir, aplicar = (d) => d }) {
  const tramo = (desde, hasta) => {
    const ds = dias.filter(d => d.isoDate >= desde && d.isoDate <= hasta).map(aplicar);
    const sesiones = ds.filter(d => d.tipo !== "libre");
    const hechas = sesiones.filter(d => (checked || {})[d.isoDate]).length;
    const cuello = ds.filter(d => ["m", "t", "n"].some(k => (cuelloChecks || {})[d.isoDate + "-" + k])).length;
    const cumpl = ds.filter(d => cumplido(d, { checked, cuelloChecks })).length;
    const notas = Object.entries(sentir || {}).filter(([iso]) => iso >= desde && iso <= hasta).map(([, v]) => v.nota).filter(Number.isFinite);
    return { sesiones: sesiones.length, hechas, cuello, cumplidos: cumpl, dias: ds.length,
             sentir: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length * 10) / 10 : null };
  };
  const antesDesde = sumarDias(prueba.desde, -14), antesHasta = sumarDias(prueba.desde, -1);
  return { antes: tramo(antesDesde, antesHasta), durante: tramo(prueba.desde, prueba.hasta) };
}

/** El lunes de la semana de un dia (clave de "como te has sentido"). */
export function lunesDe(iso) {
  const f = new Date(iso + "T12:00:00");
  const dow = (f.getDay() + 6) % 7;
  return sumarDias(iso, -dow);
}
