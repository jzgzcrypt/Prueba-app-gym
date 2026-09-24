/**
 * EL RESUMEN DE LA SEMANA
 *
 * Lo que hacen Strava y Hevy cada lunes: la semana en cuatro numeros y los
 * records. No es un porcentaje de adherencia: es lo que hiciste, contado.
 */
import { recordsDelDia, seriesDe } from "../fuerza/registro.js";
import { leerRitmo, textoTiempo } from "./libreta.js";

const SESION = ["run", "test", "objetivo", "fuerza", "compromiso"];
const CORRER = ["run", "test", "objetivo"];
const minutos = (d) => Number(((d.dur || "").match(/(\d+)/) || [0, 0])[1]);

/**
 * @param {object} semana   una semana del calendario (con days fechados)
 * @param {object} datos    { checked, ritmoReal, pesos, reps }
 * @param {Array}  dias     todos los dias del bloque (para los records)
 */
export function resumenSemana(semana, { checked, ritmoReal, pesos, reps }, dias) {
  const ch = checked || {};
  const sesiones = semana.days.filter(d => SESION.includes(d.tipo));
  const hechas = sesiones.filter(d => ch[d.isoDate]);
  const minutosCorriendo = hechas.filter(d => CORRER.includes(d.tipo)).reduce((n, d) => n + minutos(d), 0);
  const series = semana.days.reduce((n, d) =>
    n + (d.ejercicios || []).reduce((m, _, idx) => m + seriesDe(d.isoDate, idx, pesos, reps).length, 0), 0);
  const records = semana.days.flatMap(d => recordsDelDia(d, dias, pesos, reps));
  const calidad = semana.days.find(d => d.ritmo && leerRitmo((ritmoReal || {})[d.isoDate]));
  const ritmoCalidad = calidad ? textoTiempo(leerRitmo(ritmoReal[calidad.isoDate])) + "/km" : null;
  return {
    n: semana.n, dates: semana.dates, fase: semana.fase,
    sesiones: { hechas: hechas.length, total: sesiones.length },
    minutosCorriendo, series, records, ritmoCalidad,
    completa: hechas.length === sesiones.length,
  };
}

/** El resumen como texto, para compartirlo. */
export function textoResumen(r, nombreBloque) {
  const lineas = [
    "Semana " + r.n + " · " + nombreBloque,
    r.sesiones.hechas + "/" + r.sesiones.total + " sesiones",
  ];
  if (r.minutosCorriendo) lineas.push(r.minutosCorriendo + " min corriendo");
  if (r.ritmoCalidad) lineas.push("Series a " + r.ritmoCalidad);
  if (r.series) lineas.push(r.series + " series de fuerza");
  if (r.records.length) lineas.push(r.records.length + (r.records.length === 1 ? " récord: " : " récords: ") +
    r.records.map(x => x.nombre + " " + x.texto).join(", "));
  return lineas.join("\n");
}

/** Las sesiones que hacen "cumplida" una semana: el running del jueves y del
 *  domingo, las dos que construyen el 7K. Un martes o una fuerza perdida no
 *  rompe nada: premiar la constancia sin castigar un mal dia. */
function clavesDeSemana(semana) {
  return semana.days.filter(d => (d.dayIdx === 3 || d.dayIdx === 6) && ["run", "test", "objetivo"].includes(d.tipo));
}

/**
 * Semanas seguidas cumplidas, contando hacia atras desde la ultima terminada.
 * La semana en curso suma si ya esta cumplida, pero no corta la cuenta si aun
 * no lo esta: todavia puede cumplirse.
 */
export function semanasCumplidas(semanas, checked, hoyIso) {
  const ch = checked || {};
  const cumplida = (s) => { const c = clavesDeSemana(s); return c.length > 0 && c.every(d => ch[d.isoDate]); };
  let n = 0;
  for (let i = semanas.length - 1; i >= 0; i--) {
    const s = semanas[i];
    if (s.days[0].isoDate > hoyIso) continue;              // aun no ha empezado
    const enCurso = s.days[6].isoDate >= hoyIso;
    if (cumplida(s)) { n++; continue; }
    if (enCurso) continue;                                  // puede cumplirse todavia
    break;
  }
  return n;
}
