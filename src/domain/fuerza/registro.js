/**
 * APUNTAR UNA SERIE
 *
 * La referencia es la libreta del gimnasio: cada serie es "peso x reps", y lo
 * primero que miras es lo que hiciste la ultima vez. Aqui se decide que se
 * propone en cada serie para que apuntarla sea un toque y no un formulario:
 * lo de la serie anterior de hoy, o lo de la ultima vez, o lo que pide el plan.
 *
 * Puro: sin React, se prueba sin navegador.
 */

/**
 * Lo que pide el plan en cada serie, leido de "3x12-15 (última al fallo)",
 * "3x10", "3x15/lado", "2x30s/lado", "3x5 (sin llegar al límite)", "2xmax".
 * @returns {{ reps:number|null, unidad:"rep"|"s", porLado:boolean, texto:string }}
 */
export function objetivoSerie(series) {
  const s = String(series || "");
  const tras = s.replace(/^\d+\s*x\s*/i, "");
  const m = tras.match(/^(\d+)(?:\s*-\s*(\d+))?\s*(s)?/i);
  const porLado = /\/\s*lado/i.test(tras);
  if (!m) return { reps: null, unidad: "rep", porLado, texto: tras };
  return {
    reps: Number(m[1]),
    unidad: m[3] ? "s" : "rep",
    porLado,
    texto: tras,
  };
}

/** Cuanto sube o baja el peso con cada toque: barra de 2,5 en 2,5; lo demas de 1 en 1. */
export function pasoPeso(nombre) {
  return /barra/i.test(nombre || "") ? 2.5 : 1;
}

/** Ejercicios que se hacen sin carga casi siempre: no se propone peso,
 *  aunque se puede anadir. */
export function sinCargaPorDefecto(nombre) {
  return /sin peso|plancha|clamshell|pogo|cossack|puente|dominadas|rotacion|gemelo|bulgara/i.test(nombre || "");
}

/** Segundos de descanso entre series. */
export function descansoEntreSeries(ejercicio) {
  if (!ejercicio) return 90;
  if (/core|cadera/i.test(ejercicio.grupo) || sinCargaPorDefecto(ejercicio.nombre)) return 60;
  if (/barra|press|dominadas|jalon|remo/i.test(ejercicio.nombre)) return 120;
  return 90;
}

const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Las series apuntadas de un ejercicio un dia: [{peso, reps}], en orden. */
export function seriesDe(isoDate, idx, pesos, reps) {
  const p = ((pesos || {})[isoDate] || {})[idx] || {};
  const r = ((reps || {})[isoDate] || {})[idx] || {};
  const claves = [...new Set([...Object.keys(p), ...Object.keys(r)])].map(Number).sort((a, b) => a - b);
  return claves.map(k => ({ peso: num(p[k]), reps: num(r[k]) })).filter(x => x.peso != null || x.reps != null);
}

/**
 * Si hoy se ha progresado respecto a la ultima vez. Primero manda el peso:
 * mas peso maximo es progresar. Con el mismo peso, mas reps en total tambien.
 * @returns {null | { tipo: "peso"|"reps"|"baja"|"igual", valor:number }}
 */
export function progresion(hoy, antes) {
  if (!hoy || !hoy.length || !antes || !antes.length) return null;
  const maxP = (xs) => Math.max(0, ...xs.map(x => x.peso || 0));
  const totR = (xs) => xs.reduce((n, x) => n + (x.reps || 0), 0);
  const dp = Math.round((maxP(hoy) - maxP(antes)) * 10) / 10;
  if (dp > 0) return { tipo: "peso", valor: dp };
  if (dp < 0) return { tipo: "baja", valor: dp };
  const dr = totR(hoy) - totR(antes);
  if (dr > 0 && hoy.every(x => x.reps != null)) return { tipo: "reps", valor: dr };
  return { tipo: "igual", valor: 0 };
}

/**
 * La ultima vez que se hizo este ejercicio, serie a serie.
 * @param {string} nombre
 * @param {string} antesDe   fecha ISO: solo cuentan dias anteriores
 * @param {Array} dias       los dias del bloque (FLAT_DAYS)
 * @param {object} pesos     workoutWeights: { fecha: { ej: { serie: "9" } } }
 * @param {object} reps      workoutReps:    { fecha: { ej: { serie: 12 } } }
 * @returns {null | { isoDate, fecha, series: Array<{peso:number|null, reps:number|null}> }}
 */
export function ultimaVez(nombre, antesDe, dias, pesos, reps) {
  let mejor = null;
  for (const d of dias || []) {
    if (!d.ejercicios || d.isoDate >= antesDe) continue;
    const idx = d.ejercicios.findIndex(e => e.nombre === nombre);
    if (idx === -1) continue;
    const series = seriesDe(d.isoDate, idx, pesos, reps);
    if (!series.length) continue;
    if (!mejor || d.isoDate > mejor.isoDate) mejor = { isoDate: d.isoDate, fecha: d.date, series };
  }
  return mejor;
}

/** Las series de una sesion en una linea: "8 kg × 14, 13, 12" si el peso no
 *  cambio, "8 × 14 · 9 × 12 kg" si cambio, "× 12, 11" sin peso. */
export function textoSeries(series) {
  const s = series || [];
  if (!s.length) return "";
  const pesos = s.map(x => x.peso);
  const reps = s.map(x => x.reps == null ? "?" : x.reps);
  if (pesos.every(p => p == null)) return "× " + reps.join(", ");
  if (pesos.every(p => p === pesos[0])) return pesos[0] + " kg × " + reps.join(", ");
  return s.map(x => (x.peso ?? "–") + " × " + (x.reps ?? "?")).join(" · ") + " kg";
}

/**
 * Lo que se propone en la serie `si`: lo que ya este apuntado en ella; si no,
 * lo de la serie anterior de hoy; si no, lo de esa serie la ultima vez; si
 * no, sin peso y las reps que pide el plan.
 */
export function propuestaSerie({ si, pesosHoy, repsHoy, ultima, objetivo }) {
  const ph = pesosHoy || {}, rh = repsHoy || {};
  const deUltima = ultima ? (ultima.series[si] || ultima.series[ultima.series.length - 1]) : null;
  const anteriorHoy = si > 0 ? { peso: num(ph[si - 1]), reps: num(rh[si - 1]) } : null;

  let peso = num(ph[si]);
  if (peso == null && anteriorHoy && anteriorHoy.peso != null) peso = anteriorHoy.peso;
  if (peso == null && deUltima && deUltima.peso != null) peso = deUltima.peso;

  let r = num(rh[si]);
  if (r == null && deUltima && deUltima.reps != null) r = deUltima.reps;
  if (r == null && objetivo && objetivo.reps != null) r = objetivo.reps;

  return { peso, reps: r };
}
