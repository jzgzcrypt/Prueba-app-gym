/**
 * EL DIA DE COMIDA EN NUMEROS.
 *
 * Lo apuntado un dia (el total que trae tu IA, o apuntes antiguos por
 * comidas) resumido: cuanto llevas, cuanto queda y si el dia cuenta para el
 * motor adaptativo. Funciones puras.
 */

import { macrosDelDia } from "./iifym.js";

export const COMIDAS = [
  { id: "desayuno", nombre: "Desayuno" },
  { id: "comida", nombre: "Comida" },
  { id: "merienda", nombre: "Merienda" },
  { id: "cena", nombre: "Cena" },
];
const ORDEN = COMIDAS.map(c => c.id);

const r = Math.round;
const conMacros = (m) => ({ kcal: r(m.kcal), prot: r(m.prot), hc: r(m.hc), grasa: r(m.grasa) });

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
