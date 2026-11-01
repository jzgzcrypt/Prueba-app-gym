import { compromisoDelDia } from "../compromisos.js";
import { BLOQUE, FECHA_INICIO, WEEKS as PLAN } from "./bloque-1-base-7k.js";

/**
 * El calendario ata el plan a fechas reales.
 *
 * El plan (bloque-1-base-7k.js) no sabe en que fechas cae: solo dice que hay 11
 * semanas de 7 dias en un orden. Aqui se le suman los dias a FECHA_INICIO y
 * salen las fechas de todo el bloque.
 *
 * Por eso mover el bloque entero es cambiar una constante, y por eso el dia que
 * los bloques se creen desde la app (Fase 3) no hay que tocar nada de esto: se
 * le pasara otro plan y otra fecha de inicio.
 */

const MS_DIA = 24 * 60 * 60 * 1000;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** Devuelve la fecha LOCAL de hoy como "YYYY-MM-DD", sin pasar por UTC.
 *  toISOString() convierte a UTC y devuelve el dia equivocado en las ultimas
 *  horas del dia segun la zona horaria del dispositivo. */
export function todayLocalIso() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/** "2026-09-21" + n dias -> "2026-09-28". Se opera a mediodia UTC para que
 *  ningun cambio de horario de verano mueva el dia al sumar. */
function sumarDias(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12));
  const r = new Date(t.getTime() + n * MS_DIA);
  return r.getUTCFullYear() + "-" + String(r.getUTCMonth() + 1).padStart(2, "0") + "-" + String(r.getUTCDate()).padStart(2, "0");
}

/** "2026-09-21" -> "21 Sep" (etiqueta corta para la interfaz). */
function etiquetaCorta(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return Number(d) + " " + MESES[m - 1];
}

/** "2026-09-21", "2026-09-27" -> "21-27 Sep"  |  cruzando mes -> "28 Sep-4 Oct". */
function etiquetaRango(isoIni, isoFin) {
  const mIni = Number(isoIni.split("-")[1]);
  const mFin = Number(isoFin.split("-")[1]);
  const dIni = Number(isoIni.split("-")[2]);
  return mIni === mFin
    ? dIni + "-" + etiquetaCorta(isoFin)
    : etiquetaCorta(isoIni) + "-" + etiquetaCorta(isoFin);
}

/**
 * EL PLAN SIGUE DESDE DONDE ESTAS, Y LA FECHA SE MUEVE.
 *
 * Antes cada semana del plan caia en una semana fija del calendario, la
 * hicieras o no: tras dos semanas paradas el plan seguia en la semana 6 y el
 * 7K seguia el 6 de diciembre, como si nada. Ahora:
 *
 *   - Una semana ya pasada en la que hiciste al menos la mitad de sus
 *     sesiones, cuenta: la siguiente es la siguiente del plan.
 *   - Si no, la siguiente REPITE esa semana del plan: se sigue desde donde
 *     estas y el final (el 7K) se corre una semana.
 *   - Las semanas de antes de tu primer dato apuntado cuentan como hechas:
 *     no se castiga lo que aun no apuntabas en la app.
 *   - La semana en curso y las que vienen siguen el plan en orden.
 *
 * Puro: `hecho(iso)` dice si ese dia se hizo lo suyo.
 * @returns {number[]} el indice de la semana del plan para cada semana del calendario
 */
export function asignarSemanas({ plan, inicio, hoyIso, hecho, primerDato }) {
  const asignadas = [];
  let p = 0, c = 0;
  while (p < plan.length && c < plan.length + 26) {
    asignadas.push(p);
    const lunes = sumarDias(inicio, c * 7), domingo = sumarDias(inicio, c * 7 + 6);
    let avanza = true;
    if (domingo < hoyIso && (!primerDato || domingo >= primerDato)) {
      const sesiones = plan[p].days.map((d, di) => ({ d, iso: sumarDias(lunes, di) }))
        .filter(({ d }) => d.tipo && d.tipo !== "libre");
      const hechas = sesiones.filter(({ iso }) => hecho(iso)).length;
      avanza = !sesiones.length || hechas * 2 >= sesiones.length;
    }
    if (avanza) p++;
    c++;
  }
  return asignadas;
}

/** Lo apuntado en este movil, leido al arrancar (en el servidor no hay nada). */
function leerDatos() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return JSON.parse(window.localStorage.getItem("programa7k:datos") || "null");
  } catch { return null; }
}

const DATOS = leerDatos();
const ASIGNADAS = (() => {
  if (!DATOS) return PLAN.map((_, i) => i);
  const ch = DATOS.checked || {}, gps = DATOS.gps || {}, rr = DATOS.ritmoReal || {};
  const hecho = (iso) => !!ch[iso] || !!(gps[iso] && gps[iso].m > 0) || !!String(rr[iso] || "").trim();
  const fechas = [...Object.keys(ch), ...Object.keys(gps), ...Object.keys(rr)].filter(k => /^\d{4}-\d{2}-\d{2}/.test(k)).map(k => k.slice(0, 10)).sort();
  return asignarSemanas({ plan: PLAN, inicio: FECHA_INICIO, hoyIso: todayLocalIso(), hecho, primerDato: fechas[0] || null });
})();

/** El plan con sus fechas puestas. Es este WEEKS, y no el del plan, el que usa
 *  toda la app: incluye `date` por dia y `dates` por semana ya calculados.
 *  Cada semana del calendario lleva la del plan que le toca (`planN`); `n` es
 *  su numero en el calendario y `repite` dice si repite la anterior. */
export const WEEKS = ASIGNADAS.map((pi, wi) => {
  const wk = PLAN[pi];
  const days = wk.days.map((d, di) => {
    const isoDate = sumarDias(FECHA_INICIO, wi * 7 + di);
    const dia = { ...d, isoDate, date: etiquetaCorta(isoDate), dayIdx: di, weekN: wi + 1 };
    // La semana sin deficit se marca en la semana, pero la comida se decide
    // por dia: cada dia lleva la marca de su semana.
    if (wk.sinDeficit) dia.sinDeficit = true;
    return aplicarCompromiso(dia, di);
  });
  return { ...wk, n: wi + 1, planN: wk.n, repite: wi > 0 && ASIGNADAS[wi - 1] === pi, days,
           dates: etiquetaRango(days[0].isoDate, days[days.length - 1].isoDate) };
});

/** Cuantas semanas se ha movido el final por semanas repetidas. */
export const SEMANAS_MOVIDAS = WEEKS.length - PLAN.length;

/** Superpone el compromiso fijo del dia, si lo hay, sobre lo que diga el plan.
 *  El compromiso manda: es algo que ocurre si o si. */
function aplicarCompromiso(dia, dayIdx) {
  const c = compromisoDelDia(dayIdx);
  if (!c) return dia;
  return {
    ...dia,
    tipo: "compromiso",
    cat: c.cat,
    titulo: c.titulo,
    dur: c.dur,
    hora: c.hora,
    what: c.what,
    reglas: c.reglas,
    compromiso: c.id,
    // El compromiso decide QUE pasa ese dia; el plan puede anadir el contexto
    // de la fase en la que cae (p. ej. "es taper, no te vacies").
    notaPlan: dia.notaPlan || null,
  };
}

/** Dias en los que el plan programaba algo encima de un compromiso fijo.
 *  Deberia estar siempre vacio: si no lo esta, el plan hay que corregirlo,
 *  porque el compromiso se lo esta comiendo y esa sesion se perderia.
 *  Es justo el fallo que tenia el plan de origen (fuerza los lunes de tenis). */
export const colisiones = [];
PLAN.forEach((wk) => wk.days.forEach((d, di) => {
  const c = compromisoDelDia(di);
  if (c && d.tipo && d.tipo !== "libre") {
    colisiones.push({ semana: wk.n, dia: d.dow, compromiso: c.id, planificado: d.titulo });
  }
}));
if (process.env.NODE_ENV !== "production" && colisiones.length) {
  console.warn("[calendario] El plan pisa compromisos fijos:", colisiones);
}

/** Etiqueta corta -> fecha ISO. Se mantiene porque varias pantallas buscan por
 *  la etiqueta que ya tienen a mano; dentro de un bloque no hay etiquetas
 *  repetidas, asi que la busqueda es univoca. */
export const DATE_MAP = {};
WEEKS.forEach((wk) => wk.days.forEach((d) => { DATE_MAP[d.date] = d.isoDate; }));

/** Todos los dias del bloque en una sola lista, que es como navega la app. */
export const FLAT_DAYS = [];
WEEKS.forEach((wk, wi) => wk.days.forEach((d, di) =>
  FLAT_DAYS.push({ ...d, weekIdx: wi, dayIdx: di, weekN: wk.n })));

/** Fechas clave del bloque, derivadas igual que el resto. */
export const FECHA_FIN = FLAT_DAYS[FLAT_DAYS.length - 1].isoDate;
export const RANGO_BLOQUE = etiquetaCorta(FECHA_INICIO) + " - " + etiquetaCorta(FECHA_FIN);

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
/** "2026-12-06" -> "6 de diciembre". */
export function fechaLarga(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return d + " de " + MESES_LARGOS[m - 1];
}
/** El dia del 7K y el de la prueba que decide la fecha, como se dicen. */
export const FECHA_OBJETIVO_TXT = fechaLarga((FLAT_DAYS.find(d => d.tipo === "objetivo") || {}).isoDate || FECHA_FIN);
export const FECHA_DECIDE_TXT = fechaLarga((FLAT_DAYS.find(d => d.prueba && d.prueba.decide) || {}).isoDate);
export { BLOQUE, FECHA_INICIO };

/** Indice del dia de hoy. Antes de empezar el bloque devuelve el primer dia;
 *  despues de acabarlo, el ultimo. */
export function findTodayIndex() {
  const todayIso = todayLocalIso();
  let idx = FLAT_DAYS.findIndex((d) => d.isoDate === todayIso);
  if (idx === -1) {
    idx = FLAT_DAYS.findIndex((d) => d.isoDate > todayIso);
    if (idx === -1) idx = FLAT_DAYS.length - 1;
  }
  return idx;
}

/**
 * La clave con la que se guarda TODO lo que pasa un dia.
 *
 * Es la fecha real, no "semana-dia del bloque". Es el unico sitio donde se
 * decide este formato: si algun dia vuelve a cambiar, se cambia aqui y ya.
 *
 * Que sea la fecha es lo que permite que la app sea un diario —el 20 de
 * septiembre existe aunque no haya bloque— y lo que evita que el Bloque 2,
 * al volver a numerar desde 1, escriba encima del Bloque 1.
 */
export const claveDia = (dia) => dia.isoDate;

/** La clave de una semana es la fecha de su lunes, por el mismo motivo: la
 *  bitacora tiene que seguir siendo legible cuando el Bloque 2 vuelva a
 *  numerar las semanas desde 1. */
export const claveSemana = (semana) => semana.days[0].isoDate;

export const TIPO_LABEL = { run: "RUNNING", fuerza: "FUERZA", test: "TEST", libre: "DESCANSO", objetivo: "OBJETIVO", compromiso: "COMPROMISO" };
