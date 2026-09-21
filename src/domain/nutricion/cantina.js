/**
 * LA CANTINA.
 *
 * El problema real: comes fuera y no pesas nada. Cualquier sistema que te
 * pida gramos a mediodia es un sistema que vas a abandonar el martes.
 *
 * Asi que aqui no se pesa: se señala. Tocas lo que ha caido —primero,
 * segundo, guarnicion, pan, postre— y dices si fue poco, normal o mucho. Con
 * eso sale una estimacion suficientemente buena, y la app calcula la cena
 * para que el DIA cuadre. Que la comida se desvie da igual; lo que cuenta es
 * el total del dia.
 *
 * Los platos son raciones de comedor, no de restaurante: lo que cabe en un
 * plato de bandeja. Los numeros son aproximados a proposito — apuntar algo
 * razonable siempre gana a no apuntar nada.
 */

/** Cuanto de ese plato te pusiste. Multiplica todos los macros. */
export const RACIONES = [
  { id: "poco", etiqueta: "Poco", factor: 0.6 },
  { id: "normal", etiqueta: "Normal", factor: 1 },
  { id: "mucho", etiqueta: "Mucho", factor: 1.5 },
];

export const RACION_POR_DEFECTO = "normal";

/** @typedef {{id:string,nombre:string,seccion:string,kcal:number,prot:number,hc:number,grasa:number}} PlatoCantina */

/** @type {PlatoCantina[]} */
export const PLATOS_CANTINA = [
  // ─── PRIMEROS ──────────────────────────────────────────────────────────
  { id: "ensalada_mixta", nombre: "Ensalada mixta", seccion: "Primero", kcal: 140, prot: 5, hc: 10, grasa: 9 },
  { id: "crema_verduras", nombre: "Crema de verduras", seccion: "Primero", kcal: 160, prot: 5, hc: 18, grasa: 7 },
  { id: "verdura_rehogada", nombre: "Verdura rehogada", seccion: "Primero", kcal: 180, prot: 6, hc: 14, grasa: 11 },
  { id: "gazpacho", nombre: "Gazpacho", seccion: "Primero", kcal: 130, prot: 2, hc: 11, grasa: 9 },
  { id: "sopa", nombre: "Sopa de fideos", seccion: "Primero", kcal: 180, prot: 7, hc: 27, grasa: 4 },
  { id: "lentejas", nombre: "Lentejas guisadas", seccion: "Primero", kcal: 400, prot: 20, hc: 48, grasa: 13 },
  { id: "garbanzos", nombre: "Garbanzos o potaje", seccion: "Primero", kcal: 430, prot: 19, hc: 50, grasa: 16 },
  { id: "macarrones", nombre: "Macarrones con tomate", seccion: "Primero", kcal: 450, prot: 14, hc: 70, grasa: 12 },
  { id: "arroz_cantina", nombre: "Arroz, paella o similar", seccion: "Primero", kcal: 470, prot: 16, hc: 68, grasa: 14 },
  { id: "pure_patata", nombre: "Puré de patata", seccion: "Primero", kcal: 250, prot: 5, hc: 35, grasa: 10 },

  // ─── SEGUNDOS ──────────────────────────────────────────────────────────
  { id: "pollo_plancha", nombre: "Pollo a la plancha", seccion: "Segundo", kcal: 260, prot: 42, hc: 1, grasa: 10 },
  { id: "pollo_guisado", nombre: "Pollo guisado o en salsa", seccion: "Segundo", kcal: 360, prot: 38, hc: 8, grasa: 19 },
  { id: "pollo_empanado", nombre: "Pollo empanado o San Jacobo", seccion: "Segundo", kcal: 480, prot: 33, hc: 28, grasa: 26 },
  { id: "ternera", nombre: "Filete de ternera", seccion: "Segundo", kcal: 320, prot: 40, hc: 0, grasa: 17 },
  { id: "carne_guisada", nombre: "Carne guisada o estofado", seccion: "Segundo", kcal: 420, prot: 34, hc: 12, grasa: 26 },
  { id: "albondigas", nombre: "Albóndigas", seccion: "Segundo", kcal: 400, prot: 28, hc: 16, grasa: 25 },
  { id: "cerdo_plancha", nombre: "Lomo o cerdo a la plancha", seccion: "Segundo", kcal: 300, prot: 38, hc: 1, grasa: 16 },
  { id: "pescado_plancha", nombre: "Pescado a la plancha", seccion: "Segundo", kcal: 210, prot: 34, hc: 0, grasa: 8 },
  { id: "pescado_rebozado", nombre: "Pescado rebozado o frito", seccion: "Segundo", kcal: 420, prot: 26, hc: 24, grasa: 25 },
  { id: "tortilla_patata", nombre: "Tortilla de patata", seccion: "Segundo", kcal: 400, prot: 14, hc: 30, grasa: 25 },
  { id: "huevos_cantina", nombre: "Huevos o revuelto", seccion: "Segundo", kcal: 280, prot: 20, hc: 3, grasa: 21 },
  { id: "lasana", nombre: "Lasaña o canelones", seccion: "Segundo", kcal: 520, prot: 26, hc: 45, grasa: 26 },
  { id: "croquetas", nombre: "Croquetas o fritos", seccion: "Segundo", kcal: 450, prot: 14, hc: 36, grasa: 28 },
  { id: "pizza", nombre: "Pizza o bocadillo", seccion: "Segundo", kcal: 600, prot: 25, hc: 62, grasa: 27 },

  // ─── GUARNICION ────────────────────────────────────────────────────────
  { id: "g_ensalada", nombre: "Ensalada", seccion: "Guarnición", kcal: 90, prot: 2, hc: 6, grasa: 6 },
  { id: "g_verdura", nombre: "Verdura o pisto", seccion: "Guarnición", kcal: 110, prot: 3, hc: 9, grasa: 7 },
  { id: "g_patatas_fritas", nombre: "Patatas fritas", seccion: "Guarnición", kcal: 340, prot: 4, hc: 40, grasa: 18 },
  { id: "g_patata_asada", nombre: "Patata asada o cocida", seccion: "Guarnición", kcal: 160, prot: 4, hc: 34, grasa: 1 },
  { id: "g_arroz", nombre: "Arroz blanco", seccion: "Guarnición", kcal: 230, prot: 5, hc: 48, grasa: 2 },

  // ─── PAN Y POSTRE ──────────────────────────────────────────────────────
  { id: "pan_cantina", nombre: "Panecillo", seccion: "Pan y postre", kcal: 150, prot: 5, hc: 28, grasa: 1.5 },
  { id: "p_fruta", nombre: "Fruta", seccion: "Pan y postre", kcal: 80, prot: 1, hc: 18, grasa: 0.3 },
  { id: "p_yogur", nombre: "Yogur", seccion: "Pan y postre", kcal: 90, prot: 5, hc: 12, grasa: 2.5 },
  { id: "p_natillas", nombre: "Natillas, flan o arroz con leche", seccion: "Pan y postre", kcal: 220, prot: 5, hc: 32, grasa: 8 },
  { id: "p_dulce", nombre: "Dulce o bollería", seccion: "Pan y postre", kcal: 320, prot: 4, hc: 42, grasa: 15 },
  { id: "p_refresco", nombre: "Refresco con azúcar", seccion: "Pan y postre", kcal: 140, prot: 0, hc: 35, grasa: 0 },
  { id: "p_cerveza", nombre: "Caña o cerveza", seccion: "Pan y postre", kcal: 130, prot: 1, hc: 11, grasa: 0 },
];

/** @type {Record<string, PlatoCantina>} */
export const PLATO_CANTINA = Object.fromEntries(PLATOS_CANTINA.map(p => [p.id, p]));

export const SECCIONES_CANTINA = ["Primero", "Segundo", "Guarnición", "Pan y postre"];

export const platosDe = (seccion) => PLATOS_CANTINA.filter(p => p.seccion === seccion);

export const factorRacion = (id) => (RACIONES.find(r => r.id === id) || RACIONES[1]).factor;

/** Los macros de un plato en la racion indicada. */
export function macrosPlato(id, racion) {
  const p = PLATO_CANTINA[id];
  if (!p) return { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  const f = factorRacion(racion);
  return { kcal: p.kcal * f, prot: p.prot * f, hc: p.hc * f, grasa: p.grasa * f };
}
