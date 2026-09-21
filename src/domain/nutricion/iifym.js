/**
 * IIFYM — "si encaja en tus macros".
 *
 * La idea entera cabe en una frase: NO IMPORTA QUE COMAS, IMPORTA CUANTO
 * SUMA EL DIA. Dos cenas distintas con las mismas calorias y los mismos
 * macros hacen exactamente lo mismo con tu cuerpo. Por eso no hay un menu
 * que cumplir: hay un objetivo de dia, y muchas formas de llegar.
 *
 * Eso resuelve el problema de verdad, que no es saber que comer — es que
 * comes fuera, no pesas nada a mediodia, y a las nueve de la noche no sabes
 * si te has pasado o te falta. Aqui:
 *
 *   1. Apuntas por encima lo que ha caido en la cantina (señalar, no pesar).
 *   2. La app resta y sabe lo que queda del dia.
 *   3. Y recalcula las cantidades de lo que te queda de menu para que cuadre
 *      (eso vive en cuadrar.js, que es donde esta la parte interesante).
 *
 * Aqui esta solo la aritmetica del dia: sumar lo apuntado y restar. Todo son
 * funciones puras —entran numeros, salen numeros—, no saben de pantallas ni
 * de almacenamiento, y por eso se pueden probar.
 */

import { macrosDe } from "./alimentos.js";
import { macrosPlato } from "./cantina.js";

const CERO = { kcal: 0, prot: 0, hc: 0, grasa: 0 };


export const sumarMacros = (a, b) => ({
  kcal: a.kcal + b.kcal, prot: a.prot + b.prot, hc: a.hc + b.hc, grasa: a.grasa + b.grasa,
});

export const restarMacros = (a, b) => ({
  kcal: a.kcal - b.kcal, prot: a.prot - b.prot, hc: a.hc - b.hc, grasa: a.grasa - b.grasa,
});

export const redondearMacros = (m) => ({
  kcal: Math.round(m.kcal), prot: Math.round(m.prot), hc: Math.round(m.hc), grasa: Math.round(m.grasa),
});

/**
 * Lo que suma todo lo apuntado hoy.
 *
 * Un apunte es { origen, id, gramos } si viene de casa, o
 * { origen: "cantina", id, racion } si viene del comedor.
 */
export function macrosDelDia(apuntes) {
  if (!Array.isArray(apuntes)) return Object.assign({}, CERO);
  return apuntes.reduce((total, ap) => {
    if (!ap || !ap.id) return total;
    if (ap.origen === "cantina") return sumarMacros(total, macrosPlato(ap.id, ap.racion));
    if (ap.origen === "rapida") return sumarMacros(total, macrosRapida(ap.id));
    return sumarMacros(total, macrosDe(ap.id, ap.gramos));
  }, Object.assign({}, CERO));
}

/** Lo que queda del dia. Puede salir en negativo, y eso tambien es informacion. */
export function restoDelDia(objetivo, apuntes) {
  return restarMacros(objetivo, macrosDelDia(apuntes));
}

// ─── COMIDAS DE UN TOQUE ──────────────────────────────────────────────────
//
// Lo que comes casi siempre igual no merece calculo: merece un boton. El
// desayuno es el mismo porridge de los menus de 2022, y apuntarlo tiene que
// costar un gesto o no se apunta.

export const COMIDAS_RAPIDAS = [
  { id: "porridge", nombre: "Porridge de siempre", detalle: "Bebida de almendras + whey + avena + frutos rojos", kcal: 430, prot: 34, hc: 45, grasa: 9 },
  { id: "tostadas", nombre: "Tostadas con aguacate", detalle: "2 rebanadas + 60 g de aguacate + pavo", kcal: 400, prot: 22, hc: 33, grasa: 19 },
  { id: "batido_post", nombre: "Batido post-entreno", detalle: "Bebida de almendras + whey + crema de arroz", kcal: 230, prot: 20, hc: 26, grasa: 3 },
  { id: "yogur_fruta", nombre: "Yogur y fruta", detalle: "Yogur proteico + 150 g de fruta", kcal: 175, prot: 11, hc: 24, grasa: 1 },
  { id: "queso_batido_snack", nombre: "Queso batido", detalle: "250 g con frutos rojos", kcal: 140, prot: 21, hc: 14, grasa: 0.7 },
  { id: "cafe", nombre: "Café solo", detalle: "Con edulcorante", kcal: 5, prot: 0, hc: 0, grasa: 0 },
  { id: "picoteo", nombre: "Picoteo sin controlar", detalle: "Lo que caiga por casa. Mejor apuntarlo que fingir que no pasó.", kcal: 350, prot: 8, hc: 35, grasa: 19 },
];

const RAPIDA = Object.fromEntries(COMIDAS_RAPIDAS.map(c => [c.id, c]));

export function macrosRapida(id) {
  const c = RAPIDA[id];
  return c ? { kcal: c.kcal, prot: c.prot, hc: c.hc, grasa: c.grasa } : Object.assign({}, CERO);
}
