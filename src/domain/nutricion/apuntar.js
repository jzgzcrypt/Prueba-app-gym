/**
 * APUNTAR EL DIA, EN LA APP Y CON POCOS TOQUES.
 *
 * Cuatro comidas (desayuno, comida, merienda, cena) y tres formas de apuntar
 * cada una, ninguna con frases que la app tenga que "entender":
 *
 *   · Lo de siempre — lo que mas has apuntado en esa comida, a un toque.
 *   · A ojo — palmas, puños y pulgares (plato.js), y extras fijos: pan,
 *     bebida, postre, picoteo.
 *   · Se las kcal — el numero de una etiqueta u otra app; manda ese numero.
 *
 * Cada apunte guarda sus macros ya calculados: lo apuntado en octubre sigue
 * diciendo lo mismo aunque cambien las tablas. Y una comida apuntada se
 * rehace entera (se sustituye), que es como se corrige de verdad.
 */

import { RACION, macrosDePorciones, textoPorcion } from "./plato.js";
import { macrosDelDia } from "./iifym.js";

export const COMIDAS = [
  { id: "desayuno", nombre: "Desayuno" },
  { id: "comida", nombre: "Comida" },
  { id: "merienda", nombre: "Merienda" },
  { id: "cena", nombre: "Cena" },
];
const ORDEN = COMIDAS.map(c => c.id);

/** Lo que cae y no es un plato: valores de una racion normal. */
export const EXTRAS = [
  { id: "pan", nombre: "Pan", kcal: 150, prot: 5, hc: 29, grasa: 1 },
  { id: "bebida", nombre: "Bebida o cerveza", kcal: 150, prot: 1, hc: 13, grasa: 0 },
  { id: "postre", nombre: "Postre o dulce", kcal: 250, prot: 4, hc: 32, grasa: 11 },
  { id: "picoteo", nombre: "Picoteo", kcal: 200, prot: 5, hc: 15, grasa: 13 },
];
const EXTRA = Object.fromEntries(EXTRAS.map(e => [e.id, e]));

const r = Math.round;
const conMacros = (m) => ({ kcal: r(m.kcal), prot: r(m.prot), hc: r(m.hc), grasa: r(m.grasa) });

/**
 * Un plato a ojo: `porciones` { prot, hc, verdura, grasa } en raciones de
 * mano y `extras` { pan: 1, bebida: 2 }. El texto es la descripcion.
 */
export function apunteAOjo(comida, porciones, extras = {}) {
  const m = macrosDePorciones(porciones || {});
  const partes = Object.keys(RACION).filter(k => porciones && porciones[k] > 0).map(k => textoPorcion(porciones[k], k));
  for (const [id, n] of Object.entries(extras || {})) {
    const e = EXTRA[id];
    if (!e || !(n > 0)) continue;
    for (const k of ["kcal", "prot", "hc", "grasa"]) m[k] += e[k] * n;
    partes.push((n > 1 ? n + " × " : "") + e.nombre.toLowerCase());
  }
  if (!partes.length) return null;
  return { comida, origen: "ojo", texto: partes.join(" · "), porciones: { ...porciones }, extras: { ...extras }, ...conMacros(m) };
}

/** Lo que dice una etiqueta u otra app: manda ese numero. */
export function apunteKcal(comida, kcal, prot = null) {
  if (!(kcal > 0)) return null;
  const p = prot > 0 ? prot : kcal * 0.2 / 4;          // sin proteina: un plato mixto normal
  const grasa = kcal * 0.3 / 9, hc = Math.max(0, (kcal - p * 4 - grasa * 9) / 4);
  return { comida, origen: "kcal", texto: r(kcal) + " kcal" + (prot > 0 ? " · " + r(prot) + " g proteína" : ""), ...conMacros({ kcal, prot: p, hc, grasa }) };
}

/** Repetir un apunte (de "lo de siempre" o de una idea) en otra comida u otro dia. */
export function repetir(apunte, comida, origen = "siempre") {
  const { kcal, prot, hc, grasa, texto, porciones, extras } = apunte;
  return { comida, origen, texto, ...(porciones ? { porciones } : {}), ...(extras ? { extras } : {}), kcal, prot, hc, grasa };
}

/**
 * Lo de siempre en una comida: lo mas apuntado en ella en todo el historial
 * (`log`: { dia: [apuntes] }), agrupado por texto, mas frecuente primero (a
 * igualdad, lo mas reciente). Devuelve la version mas reciente de cada uno.
 */
export function loDeSiempre(log, comida, n = 4) {
  const grupos = new Map();
  const dias = Object.keys(log || {}).sort();
  dias.forEach((dia, i) => {
    for (const ap of log[dia] || []) {
      if (!ap || ap.comida !== comida || !ap.texto || !(ap.kcal > 0)) continue;
      const g = grupos.get(ap.texto) || { veces: 0, ultimo: -1, apunte: null };
      g.veces++; g.ultimo = i; g.apunte = ap;
      grupos.set(ap.texto, g);
    }
  });
  return [...grupos.values()].sort((a, b) => b.veces - a.veces || b.ultimo - a.ultimo).slice(0, n).map(g => g.apunte);
}

/** Los macros de un apunte (los nuevos los llevan; los antiguos, por su tabla). */
function macrosDe(ap) {
  if (ap.kcal != null) return { kcal: ap.kcal || 0, prot: ap.prot || 0, hc: ap.hc || 0, grasa: ap.grasa || 0 };
  return macrosDelDia([ap]);
}

/**
 * El dia de un vistazo: { llevas, quedan, porComida: { desayuno: apunte|null… },
 * hechas (cuantas comidas apuntadas), siguiente (la primera sin apuntar, o null) }.
 * Un dia cerrado a la antigua (comida "dia") cuenta entero.
 */
export function resumenDia(apuntes, objetivo) {
  const lista = (apuntes || []).filter(Boolean);
  const llevas = { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  for (const ap of lista) { const m = macrosDe(ap); for (const k of Object.keys(llevas)) llevas[k] += m[k]; }
  const porComida = Object.fromEntries(ORDEN.map(c => [c, lista.filter(a => a.comida === c).slice(-1)[0] || null]));
  const hechas = ORDEN.filter(c => porComida[c]).length;
  const cerrado = lista.some(a => a.comida === "dia");
  const siguiente = cerrado ? null : ORDEN.find(c => !porComida[c]) || null;
  const quedan = {};
  for (const k of Object.keys(llevas)) quedan[k] = (objetivo ? objetivo[k] : 0) - llevas[k];
  return { llevas: conMacros(llevas), quedan: conMacros(quedan), porComida, hechas, siguiente, cerrado };
}

/**
 * Lo que comiste un dia, para el motor adaptativo: las kcal, o null si el
 * dia esta a medias. Cuenta con 3 comidas apuntadas (un dia a medias no dice
 * nada: no se asume que ayunaste), o con el cierre antiguo con tu IA.
 */
export function ingestaDelDia(apuntes) {
  const lista = (apuntes || []).filter(Boolean);
  const dia = lista.filter(a => a.comida === "dia").slice(-1)[0];
  if (dia) return dia.kcal > 0 ? dia.kcal : null;
  const res = resumenDia(lista, null);
  return res.hechas >= 3 && res.llevas.kcal > 0 ? res.llevas.kcal : null;
}
