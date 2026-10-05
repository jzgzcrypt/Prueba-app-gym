/**
 * QUE COMER AHORA.
 *
 * Saber que quedan 1.240 kcal no ayuda a las nueve de la noche: ayuda que te
 * digan "pollo a la plancha con arroz y verduras". Asi que:
 *
 *   1. `platoPara` reparte lo que toca en esa comida en raciones de mano
 *      (la cena: todo lo que queda, con platoCena; el resto: su parte).
 *   2. `ideasPara` busca en una lista de platos normales, hechos con lo que
 *      hay en casa, los tres que mas se parecen a esas raciones.
 *
 * Cada idea lleva sus raciones: sus macros salen de las mismas manos que el
 * resto de la app, y "me lo como" la apunta tal cual.
 */

import { macrosDePorciones, platoCena } from "./plato.js";

const P = (prot, hc, verdura, grasa) => ({ prot, hc, verdura, grasa });
const PRINCIPAL = ["comida", "cena"];

/** @type {{id:string, nombre:string, momentos:string[], porciones:{prot:number,hc:number,verdura:number,grasa:number}}[]} */
export const IDEAS = [
  // ─── Comida o cena ─────────────────────────────────────────────────────
  { id: "pollo_arroz", nombre: "Pollo a la plancha con arroz y verduras", momentos: PRINCIPAL, porciones: P(1.5, 1, 2, 1) },
  { id: "tortilla_patata", nombre: "Tortilla de 3 huevos con patata y ensalada", momentos: PRINCIPAL, porciones: P(1.5, 1, 1.5, 1.5) },
  { id: "salmon_patata", nombre: "Salmón al horno con patata y brócoli", momentos: PRINCIPAL, porciones: P(1.5, 1, 2, 1.5) },
  { id: "merluza_verdura", nombre: "Merluza con verduras salteadas", momentos: PRINCIPAL, porciones: P(1.5, 0, 2.5, 1) },
  { id: "ternera_boniato", nombre: "Ternera con boniato y pimientos", momentos: PRINCIPAL, porciones: P(1.5, 1.5, 2, 1) },
  { id: "pasta_atun", nombre: "Pasta con atún y tomate", momentos: PRINCIPAL, porciones: P(1, 2, 1, 1) },
  { id: "lentejas", nombre: "Lentejas con verduras y un huevo", momentos: PRINCIPAL, porciones: P(1, 2, 1.5, 0.5) },
  { id: "ensalada_pollo", nombre: "Ensalada grande con pollo y aguacate", momentos: PRINCIPAL, porciones: P(1.5, 0, 3, 1.5) },
  { id: "revuelto_tostada", nombre: "Revuelto de huevo y claras con champiñones y una tostada", momentos: PRINCIPAL, porciones: P(1.5, 0.5, 1.5, 1) },
  { id: "burger_pan", nombre: "Hamburguesa de ternera magra con pan y ensalada", momentos: PRINCIPAL, porciones: P(1.5, 1.5, 1.5, 1) },
  { id: "gambas_arroz", nombre: "Arroz con gambas", momentos: PRINCIPAL, porciones: P(1, 1.5, 1, 1.5) },
  { id: "wok_pavo", nombre: "Wok de pavo con verduras y quinoa", momentos: PRINCIPAL, porciones: P(1.5, 1, 2, 0.5) },
  { id: "crema_tortilla", nombre: "Crema de verduras y tortilla francesa de 2 huevos", momentos: PRINCIPAL, porciones: P(1, 0, 2.5, 1) },
  { id: "lomo_patata", nombre: "Lomo a la plancha con patata y ensalada", momentos: PRINCIPAL, porciones: P(1.5, 1, 1.5, 1) },
  { id: "pollo_curry", nombre: "Pollo al curry con arroz (plato grande)", momentos: PRINCIPAL, porciones: P(2, 2, 1, 1) },
  { id: "tofu_arroz", nombre: "Tofu salteado con verduras y arroz", momentos: PRINCIPAL, porciones: P(1, 1, 2, 1.5) },
  { id: "pescado_ensalada", nombre: "Pescado blanco a la plancha con ensalada", momentos: PRINCIPAL, porciones: P(1.5, 0, 2, 0.5) },
  { id: "pavo_ensalada", nombre: "Pavo a la plancha con ensalada", momentos: PRINCIPAL, porciones: P(1, 0, 2, 0.5) },
  // ─── Desayuno ──────────────────────────────────────────────────────────
  { id: "porridge", nombre: "Porridge de avena con whey y fruta", momentos: ["desayuno"], porciones: P(1, 1.5, 0, 0.5) },
  { id: "tostadas_pavo", nombre: "Tostadas con pavo y tomate", momentos: ["desayuno", "merienda"], porciones: P(1, 1.5, 0.5, 0.5) },
  { id: "huevos_tostada", nombre: "Huevos revueltos con una tostada", momentos: ["desayuno"], porciones: P(1.5, 1, 0, 1) },
  { id: "yogur_avena", nombre: "Yogur proteico con avena y fruta", momentos: ["desayuno", "merienda"], porciones: P(1, 1, 0, 0) },
  // ─── Merienda ──────────────────────────────────────────────────────────
  { id: "queso_batido", nombre: "Queso batido con frutos rojos", momentos: ["merienda", "desayuno"], porciones: P(1, 0.5, 0, 0) },
  { id: "yogur_nueces", nombre: "Yogur proteico y un puñado de frutos secos", momentos: ["merienda"], porciones: P(1, 0.5, 0, 1) },
  { id: "batido_platano", nombre: "Batido de whey con plátano", momentos: ["merienda", "desayuno"], porciones: P(1, 1, 0, 0) },
  { id: "tortitas_pavo", nombre: "Tortitas de maíz con pavo", momentos: ["merienda"], porciones: P(0.5, 1, 0, 0) },
  { id: "fruta_frutos_secos", nombre: "Una pieza de fruta y un puñado de frutos secos", momentos: ["merienda"], porciones: P(0, 1, 0, 1) },
  { id: "atun_tortitas", nombre: "Lata de atún con tortitas de maíz", momentos: ["merienda"], porciones: P(1, 0.5, 0, 0) },
];

/** La parte de lo que queda que le toca a cada comida (la cena, todo). */
const PARTE = { desayuno: 0.25, comida: 0.45, merienda: 0.2, cena: 1 };

const medio = (x) => Math.round(x * 2) / 2;
const entre = (x, a, b) => Math.max(a, Math.min(b, x));

/**
 * Las raciones que tocan en una comida con lo que `quedan` del dia:
 * { porciones, macros, aviso: null | "ligera" | "pasado" }.
 */
export function platoPara(momento, quedan) {
  if (momento === "cena") {
    const c = platoCena(quedan);
    return { porciones: c.porciones, macros: c.macros, aviso: c.aviso };
  }
  const f = PARTE[momento] || 0.3;
  const obj = { kcal: quedan.kcal * f, prot: quedan.prot * f, hc: quedan.hc * f };
  if (obj.kcal < 120) {
    const porciones = { prot: 0.5, hc: 0, verdura: 0, grasa: 0 };
    return { porciones, macros: macrosDePorciones(porciones), aviso: "pasado" };
  }
  const verdura = momento === "comida" ? 2 : 0;
  const prot = entre(medio(obj.prot / 25), 0.5, momento === "comida" ? 2.5 : 1.5);
  const hc = entre(medio(obj.hc / 30), 0, momento === "comida" ? 2.5 : 2);
  const libre = obj.kcal - prot * 150 - hc * 140 - verdura * 30;
  const grasa = entre(Math.floor(libre / 80 * 2) / 2, 0, momento === "comida" ? 2 : 1);
  const porciones = { prot, hc, verdura, grasa };
  return { porciones, macros: macrosDePorciones(porciones), aviso: obj.kcal < 250 ? "ligera" : null };
}

/**
 * Las `n` ideas de ese momento que mas se parecen a las raciones que tocan,
 * ajustadas a ellas: el plato es el mismo, pero con mas o menos hidrato y
 * grasa (y media palma arriba o abajo) para que cuadre con lo que queda.
 */
export function ideasPara(porciones, momento, n = 3) {
  const peso = { prot: 1.5, hc: 1, grasa: 1, verdura: 0.3 };
  const distancia = (p) => Object.keys(peso).reduce((s, k) => s + peso[k] * Math.abs((p[k] || 0) - (porciones[k] || 0)), 0);
  const ajustar = (p) => {
    const hacia = (k, abajo, arriba) => Math.max(0, p[k] + Math.max(-abajo, Math.min(arriba, medio((porciones[k] || 0) - p[k]))));
    return { prot: Math.max(0.5, hacia("prot", 0.5, 0.5)), hc: hacia("hc", 1, 1.5), verdura: p.verdura, grasa: hacia("grasa", 1, 1) };
  };
  return IDEAS.filter(i => i.momentos.includes(momento))
    .map(i => ({ i, d: distancia(i.porciones) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map(({ i }) => { const p = ajustar(i.porciones); return { id: i.id, nombre: i.nombre, momentos: i.momentos, porciones: p, macros: macrosDePorciones(p) }; });
}
