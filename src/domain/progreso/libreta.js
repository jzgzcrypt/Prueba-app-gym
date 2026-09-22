/**
 * LA LIBRETA
 *
 * Lo que hacia la libreta del gimnasio y la app no hacia: al acabar, comparar
 * lo de hoy con lo de la ultima vez. No son rachas ni porcentajes: es tu dato
 * contra tu dato anterior, y contra el objetivo.
 *
 * Todo aqui es puro: recibe datos, devuelve lecturas. Las pantallas solo
 * las pintan.
 */

/** 7 km a 4:45/km, en segundos: 33:15. */
export const OBJETIVO_7K = 7 * 285;

/** Umbrales del 5 km de S8 (ver REGLAS_BLOQUE en el plan). */
export const DECIDE_FECHA = [
  { hasta: 23 * 60 + 30, semanasExtra: 0 },
  { hasta: 25 * 60, semanasExtra: 4 },
  { hasta: Infinity, semanasExtra: 8 },
];

/** 1995 -> "33:15"; 4000 -> "1:06:40". */
export function textoTiempo(seg) {
  const s = Math.round(seg);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mmss = (h ? String(m).padStart(2, "0") : String(m)) + ":" + String(r).padStart(2, "0");
  return h ? h + ":" + mmss : mmss;
}

/** Lee "mm:ss" o "h:mm:ss" y dice si parece un ritmo por km. */
function leer(str) {
  if (!str) return null;
  const t = String(str).trim();
  const partes = t.match(/(\d+):(\d{1,2})(?::(\d{1,2}))?/);
  if (!partes) return null;
  const [, a, b, c] = partes.map(Number);
  const seg = c != null && !Number.isNaN(c) ? a * 3600 + b * 60 + c : a * 60 + b;
  // "/km" lo deja claro; si no, por debajo de 10 minutos solo puede ser un ritmo.
  const esRitmo = /\/\s*km/i.test(t) || (c == null || Number.isNaN(c)) && a < 10;
  return { seg, esRitmo };
}

/** El ritmo por km de lo que se apunto, o null si es un tiempo total. */
export function leerRitmo(str) {
  const l = leer(str);
  return l && l.esRitmo ? l.seg : null;
}

/** El tiempo total de una prueba de `distKm`: acepta el tiempo ("14:20") o el
 *  ritmo ("4:47/km"), que es lo que da Strava en grande. */
export function leerTiempo(str, distKm) {
  const l = leer(str);
  if (!l) return null;
  return l.esRitmo ? Math.round(l.seg * distKm) : l.seg;
}

/** El 7K que corresponde a un tiempo en otra distancia (formula de Riegel,
 *  la que usan las calculadoras de carrera). */
export function equivalente7k(distKm, seg) {
  return Math.round(seg * Math.pow(7 / distKm, 1.06));
}

/**
 * Que dice el tiempo de una prueba.
 * @param {object} prueba  el campo `prueba` del dia del plan
 * @param {string} texto   lo apuntado: "14:20", "23:10" o "4:47/km"
 * @returns {null | {error:string} | {total, equivalente, ritmoEquivalente, titular, detalle, tono}}
 *   tono: "bien" | "ajuste" | "neutro"
 */
export function lecturaPrueba(prueba, texto) {
  if (!prueba || prueba.partida || !prueba.distKm) return null;
  if (!texto) return null;
  const total = leerTiempo(texto, prueba.distKm);
  if (!total) return { error: "Escribe el tiempo como 14:20, o el ritmo como 4:47/km." };

  const equivalente = equivalente7k(prueba.distKm, total);
  const ritmoEquivalente = Math.round(equivalente / 7);
  const base = { total, equivalente, ritmoEquivalente };
  const ritmoKm = textoTiempo(total / prueba.distKm) + "/km";

  if (prueba.distKm === 7) {
    const dif = total - OBJETIVO_7K;
    return dif <= 0
      ? { ...base, tono: "bien", titular: "Conseguido: " + textoTiempo(total) + " (" + ritmoKm + ")",
          detalle: dif < 0 ? textoTiempo(-dif) + " por debajo del objetivo." : "Clavado al segundo." }
      : { ...base, tono: "ajuste", titular: textoTiempo(total) + " (" + ritmoKm + ")",
          detalle: "A " + textoTiempo(dif) + " del objetivo. Es tu 7 km más rápido del bloque: desde aquí se sigue." };
  }

  const eqTxt = "Tu 7K equivalente hoy: " + textoTiempo(equivalente) + " (" + textoTiempo(ritmoEquivalente) + "/km).";

  if (prueba.decide) {
    const tramo = DECIDE_FECHA.find(t => total <= t.hasta);
    return tramo.semanasExtra === 0
      ? { ...base, tono: "bien", semanasExtra: 0, titular: "Se mantiene el 6 de diciembre",
          detalle: textoTiempo(total) + " en 5 km. " + eqTxt }
      : { ...base, tono: "ajuste", semanasExtra: tramo.semanasExtra,
          titular: "El bloque se alarga unas " + tramo.semanasExtra + " semanas",
          detalle: textoTiempo(total) + " en 5 km. " + eqTxt + " Se mueve la fecha, no el ritmo." };
  }

  if (prueba.enLinea) {
    const ok = total <= prueba.enLinea;
    // El equivalente de hoy sale por encima de 33:15 aunque vayas bien: lo que
    // se mide aqui es si vas en camino, no si ya estas. Hay que decirlo, o el
    // numero parece contradecir al titular.
    const umbral = textoTiempo(prueba.enLinea);
    return { ...base, tono: ok ? "bien" : "ajuste", enLinea: ok,
      titular: ok ? "Vas en línea con el 6 de diciembre" : "Por ahora, por detrás del 6 de diciembre",
      detalle: textoTiempo(total) + " en " + prueba.distKm + " km. " + eqTxt +
        " A estas alturas es normal estar por encima de 33:15: lo que cuenta es bajar de " + umbral +
        " en esta prueba, y " + (ok ? "lo has hecho." : "faltan " + textoTiempo(total - prueba.enLinea) + ". El 5 km de S8 decide.") };
  }

  return { ...base, tono: "neutro", titular: textoTiempo(total), detalle: eqTxt };
}

/**
 * Que dice el ritmo de una sesion con ritmo marcado (las series).
 * @param {object} dia        el dia del plan, con `ritmo` (s/km)
 * @param {string} texto      el ritmo apuntado
 * @param {Array<{isoDate:string, ritmo:number, texto:string}>} anteriores
 *        sesiones con ritmo de dias anteriores, ya leidas
 */
export function lecturaRitmo(dia, texto, anteriores = []) {
  if (!dia || !dia.ritmo || !texto) return null;
  const hoy = leerRitmo(texto);
  if (!hoy) return null;
  const dif = hoy - dia.ritmo;
  const previa = anteriores.filter(a => a.isoDate < dia.isoDate).sort((a, b) => a.isoDate < b.isoDate ? -1 : 1).at(-1) || null;
  const vsObjetivo = Math.abs(dif) <= 3
    ? "Al ritmo que pedía la sesión."
    : dif < 0
      ? textoTiempo(-dif) + " por debajo de lo que pedía la sesión (" + textoTiempo(dia.ritmo) + "/km)."
      : textoTiempo(dif) + " por encima de lo que pedía la sesión (" + textoTiempo(dia.ritmo) + "/km).";
  const mejora = previa ? previa.ritmo - hoy : 0;
  const vsAnterior = !previa
    ? "Primera sesión de series del bloque."
    : mejora > 0
      ? textoTiempo(mejora) + "/km más rápido que la última sesión de series (" + textoTiempo(previa.ritmo) + "/km)."
      : mejora === 0
        ? "Igual que la última sesión de series."
        : "La última sesión de series fuiste a " + textoTiempo(previa.ritmo) + "/km. Hoy costó más; pasa.";
  return {
    ritmo: hoy, objetivo: dia.ritmo, dif,
    tono: dif <= 3 ? "bien" : "ajuste",
    titular: textoTiempo(hoy) + "/km",
    detalle: vsObjetivo + " " + vsAnterior,
  };
}

/** Peso maximo de las series apuntadas de un ejercicio: { 0: "8", 1: "9" } -> 9. */
function pesoMaximo(series) {
  if (!series) return null;
  const v = Object.values(series).map(x => parseFloat(x)).filter(x => !Number.isNaN(x) && x > 0);
  return v.length ? Math.max(...v) : null;
}

/**
 * Cada ejercicio de hoy contra la ultima vez que se hizo.
 * @returns {Array<{nombre, hoy:number|null, antes:{fecha:string, v:number}|null}>}
 */
export function comparativaFuerza(dia, workoutWeights, dias) {
  if (!dia || !dia.ejercicios) return [];
  const hoyW = (workoutWeights || {})[dia.isoDate] || {};
  return dia.ejercicios.map((ej, i) => {
    let antes = null;
    for (const d of dias) {
      if (d.isoDate >= dia.isoDate || !d.ejercicios) continue;
      const idx = d.ejercicios.findIndex(e => e.nombre === ej.nombre);
      if (idx === -1) continue;
      const v = pesoMaximo(((workoutWeights || {})[d.isoDate] || {})[idx]);
      if (v != null && (!antes || d.isoDate > antes.isoDate)) antes = { isoDate: d.isoDate, fecha: d.date, v };
    }
    return { nombre: ej.nombre, hoy: pesoMaximo(hoyW[i]), antes };
  });
}

/** Dias desde la ultima copia, y si toca hacer una: cada 7 dias, y solo si ya
 *  hay algo apuntado que perder. */
export function copiaPendiente(ultimoBackup, hoyIso, hayDatos) {
  if (!hayDatos) return { toca: false, dias: null };
  if (!ultimoBackup) return { toca: true, dias: null };
  const dias = Math.round((Date.parse(hoyIso + "T12:00:00Z") - Date.parse(ultimoBackup + "T12:00:00Z")) / 86400000);
  return { toca: dias >= 7, dias };
}

/** Cuantos dias faltan para la proxima medicion (cada 14 desde el inicio del
 *  bloque, el mismo calendario que ya avisa en HOY). 0 = hoy. */
export function diasParaMedir(fechaInicio, hoyIso) {
  const pasados = Math.round((Date.parse(hoyIso + "T12:00:00Z") - Date.parse(fechaInicio + "T12:00:00Z")) / 86400000);
  if (pasados <= 0) return Math.abs(pasados);
  return (14 - (pasados % 14)) % 14;
}
