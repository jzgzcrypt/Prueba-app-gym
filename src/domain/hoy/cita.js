/**
 * LAS CARRERAS SON CITAS, COMO EL TENIS.
 *
 * Lo que sale es lo que tiene hora fija (el tenis de los lunes); lo que
 * depende del sofa a las 16:00, no. Por eso cada carrera tiene su hora: el
 * martes, el jueves y el domingo. Con ella el calendario del movil avisa 15
 * min antes, y en HOY la fila de la carrera dice lo que hay que hacer para
 * salir: ropa puesta, movil en la entrada.
 *
 * horasCarrera: { "1": "17:30", "3": "17:30", "6": "10:00" } (indice del dia:
 * 0 = lunes ... 6 = domingo). null mientras no se han elegido.
 *
 * Puro: sin React, se prueba sin navegador.
 */

/** Los dias de carrera de la semana tipo y su hora por defecto. */
export const DIAS_CARRERA = [
  { idx: 1, dow: "Martes", def: "17:30", opciones: ["16:30", "17:30", "18:30", "19:30"] },
  { idx: 3, dow: "Jueves", def: "17:30", opciones: ["16:30", "17:30", "18:30", "19:30"] },
  { idx: 6, dow: "Domingo", def: "10:00", opciones: ["09:00", "10:00", "11:00", "18:00"] },
];

export const HORAS_POR_DEFECTO = Object.fromEntries(DIAS_CARRERA.map(d => [String(d.idx), d.def]));

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Solo las horas validas de los dias de carrera; null si no queda ninguna. */
export function limpiarHoras(h) {
  if (!h || typeof h !== "object") return null;
  const out = {};
  for (const d of DIAS_CARRERA) if (HHMM.test(String(h[d.idx] || ""))) out[d.idx] = h[d.idx];
  return Object.keys(out).length ? out : null;
}

/** "1-17:30,3-17:30,6-10:00" para el enlace del calendario, y al reves. */
export const horasAParam = (h) => Object.entries(limpiarHoras(h) || {}).map(([k, v]) => k + "-" + v).join(",");
export function horasDeParam(txt) {
  const h = {};
  for (const par of String(txt || "").split(",")) {
    const m = /^(\d)-(\d{2}:\d{2})$/.exec(par.trim());
    if (m) h[m[1]] = m[2];
  }
  return limpiarHoras(h);
}

const enMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

/**
 * Lo que dice la fila de la carrera de hoy, o null si no toca.
 * @param {{ day:object, horas:object|null, hecha:boolean, ahoraMin:number }} p
 */
export function citaCarrera({ day, horas, hecha, ahoraMin }) {
  if (!day || hecha || !/^(run|test|objetivo)$/.test(day.tipo || "")) return null;
  const hora = (limpiarHoras(horas) || {})[day.dayIdx];
  if (!hora) return null;
  if (ahoraMin <= enMin(hora)) return "Ropa puesta · móvil en la entrada · sales a las " + hora;
  return "Era a las " + hora + ": ropa puesta y sal, aunque sea corta";
}
