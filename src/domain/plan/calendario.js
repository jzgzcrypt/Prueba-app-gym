import { compromisoDelDia } from "../compromisos.js";
import { FECHA_INICIO, WEEKS as BLOQUE_1 } from "./bloque-1-base-7k.js";
import { BLOQUE, DECIDE_FECHA, FECHA_INICIO_BLOQUE, WEEKS as BLOQUE_2 } from "./bloque-2-7k.js";

/** Semanas del bloque 1 que se quedan como historia (21 Sep - 1 Nov). Despues
 *  sigue el bloque 2, que empieza el lunes siguiente. */
const SEMANAS_BLOQUE_1 = 6;
const PLAN = [
  ...BLOQUE_1.slice(0, SEMANAS_BLOQUE_1).map(w => ({ ...w, bloque: 1 })),
  ...BLOQUE_2.map(w => ({ ...w, bloque: 2 })),
];

/**
 * El calendario ata el plan a fechas reales.
 *
 * El plan no sabe en que fechas cae: solo dice que hay semanas de 7 dias en un
 * orden. Aqui se le suman los dias a FECHA_INICIO y salen las fechas de todo.
 * El calendario es el bloque 1 hasta el 1 de noviembre (historia) y el bloque
 * 2 (bloque-2-7k.js) desde el 2.
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
 * LA FECHA LA DECIDEN LOS DATOS.
 *
 * El plan va siempre en orden: lo que te saltas se pierde y la vuelta tras un
 * paron (ajuste.js) ajusta la carga. La fecha del 7K no se mueve por fallar
 * dias: la mueve la prueba de 5 km que decide (DECIDE_FECHA). Si dice que hace
 * falta mas tiempo, esas semanas extra se meten despues de ella, repitiendo la
 * semana de construccion que la sigue, antes de la recta final.
 *
 * @returns {number[]} el indice de la semana del plan para cada semana del calendario
 */
export function asignarSemanas({ plan, extra = 0 }) {
  const decide = plan.findIndex(w => w.days.some(d => d.prueba && d.prueba.decide));
  const orden = plan.map((_, i) => i);
  if (!extra || decide < 0 || decide + 1 >= plan.length) return orden;
  const construir = decide + 1;
  // Negativo: el 5 km fue mejor de lo previsto y el 7K se adelanta. Se quita
  // la semana que sigue a la prueba (nunca la recta final).
  if (extra < 0) return orden.filter(i => i < construir || i >= construir - extra || i >= plan.length - 2);
  return [...orden.slice(0, construir), ...Array(extra).fill(construir), ...orden.slice(construir)];
}

/** Las semanas extra que pide el 5 km apuntado (0 si aun no hay, o si se corrio como suave). */
export function semanasExtraDe(texto) {
  const t = String(texto || "").trim();
  if (!t || /suave/i.test(t)) return 0;
  const m = t.match(/(\d+):(\d{2})/);
  if (!m) return 0;
  let seg = Number(m[1]) * 60 + Number(m[2]);
  if (/\/\s*km/i.test(t) || Number(m[1]) < 10) seg *= 5; // vino como ritmo
  const tramo = DECIDE_FECHA.find(x => seg <= x.hasta);
  return tramo ? tramo.semanasExtra : 0;
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
  const wi = PLAN.findIndex(w => w.days.some(d => d.prueba && d.prueba.decide));
  if (!DATOS || wi < 0) return PLAN.map((_, i) => i);
  const di = PLAN[wi].days.findIndex(d => d.prueba && d.prueba.decide);
  const iso = sumarDias(FECHA_INICIO, wi * 7 + di);
  return asignarSemanas({ plan: PLAN, extra: semanasExtraDe((DATOS.ritmoReal || {})[iso]) });
})();

/** El plan con sus fechas puestas. Es este WEEKS, y no el del plan, el que usa
 *  toda la app: incluye `date` por dia y `dates` por semana ya calculados.
 *  Cada semana del calendario lleva la del plan que le toca (`planN`); `n` es
 *  su numero en el calendario y `extra` dice si es una semana extra del 5 km. */
export const WEEKS = ASIGNADAS.map((pi, wi) => {
  const wk = PLAN[pi];
  const days = wk.days.map((d, di) => {
    const isoDate = sumarDias(FECHA_INICIO, wi * 7 + di);
    const dia = { ...d, isoDate, date: etiquetaCorta(isoDate), dayIdx: di, weekN: wi + 1, bloque: wk.bloque };
    // La semana sin deficit se marca en la semana, pero la comida se decide
    // por dia: cada dia lleva la marca de su semana.
    if (wk.sinDeficit) dia.sinDeficit = true;
    if (wk.vuelta) dia.vueltaPlan = true;
    return aplicarCompromiso(dia, di);
  });
  return { ...wk, n: wi + 1, planN: wk.n, extra: wi > 0 && ASIGNADAS[wi - 1] === pi, days,
           dates: etiquetaRango(days[0].isoDate, days[days.length - 1].isoDate) };
});

/** Cuantas semanas extra ha metido el 5 km que decide la fecha (negativo: adelantado). */
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
export const RANGO_BLOQUE = etiquetaCorta(FECHA_INICIO_BLOQUE) + " - " + etiquetaCorta(FECHA_FIN);

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
export { BLOQUE, FECHA_INICIO, FECHA_INICIO_BLOQUE };

/**
 * El historial de bloques con el bloque en curso dentro. Lo guardado antes del
 * 2 de noviembre solo trae el bloque 1 como activo: se cierra el 1 de
 * noviembre y se abre el bloque 2. Lo que ya traiga el bloque 2 no se toca.
 */
export function conBloqueEnCurso(historial) {
  const h = Array.isArray(historial) ? historial : [];
  if (h.some(b => b.numero === BLOQUE.numero)) return h;
  const antes = h.map(b => (b.estado === "activo"
    ? { ...b, estado: "cerrado", fin: sumarDias(FECHA_INICIO_BLOQUE, -1),
        revision: b.revision || "Cerrado al empezar el bloque 2: plan nuevo desde donde estás de verdad." }
    : b));
  return [...antes, { numero: BLOQUE.numero, nombre: BLOQUE.nombre, inicio: FECHA_INICIO_BLOQUE, fin: FECHA_FIN,
    objetivoRunning: BLOQUE.objetivo, estado: "activo", revision: "" }];
}

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
