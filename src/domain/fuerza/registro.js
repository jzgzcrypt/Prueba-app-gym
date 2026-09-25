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
 * reps es el minimo del rango y repsMax el tope ("12-15" -> 12 y 15; "10" -> 10 y 10).
 * @returns {{ reps:number|null, repsMax:number|null, unidad:"rep"|"s", porLado:boolean, texto:string }}
 */
export function objetivoSerie(series) {
  const s = String(series || "");
  const tras = s.replace(/^\d+\s*x\s*/i, "");
  const m = tras.match(/^(\d+)(?:\s*-\s*(\d+))?\s*(s)?/i);
  const porLado = /\/\s*lado/i.test(tras);
  if (!m) return { reps: null, repsMax: null, unidad: "rep", porLado, texto: tras };
  return {
    reps: Number(m[1]),
    repsMax: m[2] ? Number(m[2]) : Number(m[1]),
    unidad: m[3] ? "s" : "rep",
    porLado,
    texto: tras,
  };
}

/** El escalon de peso que existe en su gimnasio: mancuernas de 2 en 2 kg,
 *  barra de 2,5 en 2,5 (discos de 1,25 por lado), poleas y maquinas de 1 en 1. */
export function pasoPeso(nombre) {
  const n = nombre || "";
  if (/barra/i.test(n)) return 2.5;
  if (/mancuerna/i.test(n)) return 2;
  return 1;
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

const redondear = (x) => Math.round(x * 10) / 10;

/**
 * EL PESO DE HOY, DECIDIDO Y EXPLICADO (doble progresion)
 *
 * La idea es de TrueLift: que la app decida la carga y diga por que, en vez
 * de dejarle pensar si toca subir (que es una excusa para repetir siempre).
 *
 *   Llego al tope del rango en todas las series  -> sube un escalon y vuelve
 *                                                   al minimo del rango.
 *   La mayoria por debajo del minimo             -> baja un escalon.
 *   Lo demas                                     -> mantiene, a por una rep mas.
 *
 * Sin carga (sentadilla sin peso, plancha...) solo progresan las reps. Sin
 * reps apuntadas la ultima vez no se puede decidir: se mantiene y se pide
 * apuntarlas.
 * @returns {{ peso:number|null, reps:number|null,
 *   decision:"sube"|"mantiene"|"baja"|"primera"|"sin-carga", titular:string, porque:string }}
 */
export function sugerenciaCarga({ ultima, objetivo, nombre }) {
  const min = objetivo && objetivo.reps != null ? objetivo.reps : null;
  const max = objetivo && objetivo.repsMax != null ? objetivo.repsMax : min;
  const u = objetivo && objetivo.unidad === "s" ? " s" : "";

  if (!ultima || !ultima.series.length) {
    return { peso: null, reps: min, decision: "primera", titular: "Primera vez",
      porque: min != null ? "Elige un peso con el que llegues a " + min + u + " y apúntalo: la próxima vez decido yo." : "Apúntalo y la próxima vez decido yo." };
  }
  const antes = textoSeries(ultima.series);
  const pesoTrabajo = Math.max(0, ...ultima.series.map(x => x.peso || 0)) || null;

  // Sin carga: solo reps.
  if (pesoTrabajo == null) {
    const mejor = Math.max(0, ...ultima.series.map(x => x.reps || 0)) || null;
    const obj = mejor == null ? min : Math.max(min || 0, mejor + (objetivo && objetivo.unidad === "s" ? 5 : 1));
    return { peso: null, reps: obj, decision: "sin-carga", titular: "A por " + obj + u,
      porque: "La última vez: " + antes + ". Una más que entonces." };
  }

  const aPeso = ultima.series.filter(x => x.peso === pesoTrabajo);
  const conReps = aPeso.filter(x => x.reps != null);
  const paso = pasoPeso(nombre);

  if (!conReps.length || min == null) {
    return { peso: pesoTrabajo, reps: min, decision: "mantiene", titular: "Mantén " + pesoTrabajo + " kg",
      porque: "La última vez no apuntaste las repeticiones: apúntalas y sabré cuándo subir." };
  }
  if (conReps.length === aPeso.length && conReps.every(x => x.reps >= max)) {
    const nuevo = redondear(pesoTrabajo + paso);
    return { peso: nuevo, reps: min, decision: "sube", titular: "Sube a " + nuevo + " kg",
      porque: "La última vez: " + antes + ". Llegaste al tope (" + max + u + ") en todas: toca subir y volver a " + min + u + "." };
  }
  const bajo = conReps.filter(x => x.reps < min).length;
  if (bajo > conReps.length / 2 && pesoTrabajo - paso >= paso) {
    const nuevo = redondear(pesoTrabajo - paso);
    return { peso: nuevo, reps: min, decision: "baja", titular: "Baja a " + nuevo + " kg",
      porque: "La última vez: " + antes + ". No llegaste a " + min + u + ": con menos peso harás las repeticiones que construyen." };
  }
  const mejor = Math.max(...conReps.map(x => x.reps));
  const obj = Math.min(max, Math.max(min, mejor + 1));
  return { peso: pesoTrabajo, reps: obj, decision: "mantiene", titular: "Mantén " + pesoTrabajo + " kg",
    porque: "La última vez: " + antes + ". Sube cuando llegues a " + max + u + " en todas. Hoy, a por " + obj + "." };
}

/**
 * Lo que se propone en la serie `si`: lo que ya este apuntado en ella; si
 * no, el peso de la serie anterior de hoy (si lo cambiaste, las demas lo
 * siguen); si no, lo que decide `sugerenciaCarga`. Las reps, las que tocan hoy.
 */
export function propuestaSerie({ si, pesosHoy, repsHoy, ultima, objetivo, nombre }) {
  const ph = pesosHoy || {}, rh = repsHoy || {};
  const sug = sugerenciaCarga({ ultima, objetivo, nombre });
  const anteriorHoy = si > 0 ? num(ph[si - 1]) : null;

  let peso = num(ph[si]);
  if (peso == null && anteriorHoy != null) peso = anteriorHoy;
  if (peso == null) peso = sug.peso;

  let r = num(rh[si]);
  if (r == null) r = sug.reps;
  return { peso, reps: r };
}

// ─── Records ────────────────────────────────────────────────────────────────

/** La mejor serie de una lista: la de mas peso y, a igual peso, mas reps. */
export function mejorSerie(series) {
  let mejor = null;
  for (const s of series || []) {
    if (!mejor) { mejor = s; continue; }
    const p = s.peso ?? -1, mp = mejor.peso ?? -1;
    if (p > mp || (p === mp && (s.reps ?? 0) > (mejor.reps ?? 0))) mejor = s;
  }
  return mejor;
}

/** Todas las series de un ejercicio antes de una fecha. */
function seriesPrevias(nombre, antesDe, dias, pesos, reps) {
  const out = [];
  for (const d of dias || []) {
    if (!d.ejercicios || d.isoDate >= antesDe) continue;
    const idx = d.ejercicios.findIndex(e => e.nombre === nombre);
    if (idx !== -1) out.push(...seriesDe(d.isoDate, idx, pesos, reps));
  }
  return out;
}

/**
 * Los records que se batieron un dia. Record es superar todo lo anterior:
 * mas peso que nunca, o las mas reps de siempre con tu peso maximo. La
 * primera vez que haces un ejercicio no es record: no hay con que comparar.
 * @returns {Array<{nombre, tipo:"peso"|"reps", texto}>}
 */
export function recordsDelDia(dia, dias, pesos, reps) {
  if (!dia || !dia.ejercicios) return [];
  const out = [];
  dia.ejercicios.forEach((ej, idx) => {
    const hoy = mejorSerie(seriesDe(dia.isoDate, idx, pesos, reps));
    if (!hoy) return;
    const previas = seriesPrevias(ej.nombre, dia.isoDate, dias, pesos, reps);
    if (!previas.length) return;
    const antes = mejorSerie(previas);
    const texto = (hoy.peso != null ? hoy.peso + " kg" : "") + (hoy.reps != null ? (hoy.peso != null ? " × " : "") + hoy.reps + " reps" : "");
    if ((hoy.peso ?? -1) > (antes.peso ?? -1)) out.push({ nombre: ej.nombre, tipo: "peso", texto });
    else if ((hoy.peso ?? -1) === (antes.peso ?? -1) && (hoy.reps ?? 0) > (antes.reps ?? 0)) out.push({ nombre: ej.nombre, tipo: "reps", texto });
  });
  return out;
}

/** El mejor registro de cada ejercicio en todo el bloque, con su fecha. */
export function tablaRecords(dias, pesos, reps) {
  const porNombre = {};
  for (const d of dias || []) {
    if (!d.ejercicios) continue;
    d.ejercicios.forEach((ej, idx) => {
      const m = mejorSerie(seriesDe(d.isoDate, idx, pesos, reps));
      if (!m) return;
      const actual = porNombre[ej.nombre];
      // mejorSerie devuelve el primero si empatan: solo se cambia si hoy es mejor.
      if (!actual || mejorSerie([actual, m]) === m) {
        porNombre[ej.nombre] = { nombre: ej.nombre, peso: m.peso, reps: m.reps, fecha: d.date, isoDate: d.isoDate };
      }
    });
  }
  return Object.values(porNombre).sort((a, b) => a.isoDate < b.isoDate ? 1 : -1);
}
