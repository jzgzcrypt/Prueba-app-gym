/**
 * MIS COMIDAS Y QUE COMER CON LO QUE QUEDA.
 *
 * Mis comidas: las de siempre, guardadas una vez con sus kcal y su proteina,
 * para apuntarlas de un toque. La primera vez salen las del menu de casa
 * (MENU_DIA), con sus macros calculados; luego se editan, se borran o se
 * crean las tuyas.
 *
 * Que comer: con lo que queda del dia, las comidas tuyas (una, o dos juntas)
 * que mejor lo cierran — sin pasarse de kcal y llegando a la proteina, que
 * es lo que no se recupera mañana. Sin IA: solo tus comidas y una cuenta.
 *
 * Puro: sin React, se prueba sin navegador.
 */

import { macrosDe } from "./alimentos.js";
import { MENU_DIA } from "./menu-dia.js";

/** Nombre de cada comida del menu de casa, como se diria en voz alta. */
const NOMBRES = {
  comer: {
    desayuno: "Avena con whey y tostada con aguacate",
    almuerzo: "Yogur proteico con fruta",
    comida: "Pollo con arroz y verdura",
    postentreno: "Batido de whey con plátano",
    cena: "Pasta con huevo y verdura",
    precama: "Queso batido",
  },
  recortar: {
    desayuno: "Avena con whey y tostada de jamón",
    comida: "Pollo con legumbres y verdura",
    merienda: "Queso batido con frutos rojos",
    cena: "Salmón con boniato y verdura",
  },
};

const r = Math.round;

/** Los macros de una comida del menu: la suma de sus ingredientes. */
function macrosComida(ingredientes) {
  const t = { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  for (const i of ingredientes) { const m = macrosDe(i.id, i.g); for (const k of Object.keys(t)) t[k] += m[k]; }
  return { kcal: r(t.kcal), prot: r(t.prot), hc: r(t.hc), grasa: r(t.grasa) };
}

/** Mis comidas de partida: las del menu de casa, sin repetir nombre. */
export function habitualesIniciales() {
  const vistas = new Set(), salida = [];
  for (const tipo of Object.keys(NOMBRES)) {
    for (const c of MENU_DIA[tipo] || []) {
      const nombre = NOMBRES[tipo][c.id];
      if (!nombre || vistas.has(nombre)) continue;
      vistas.add(nombre);
      salida.push({ id: tipo + "-" + c.id, nombre, ...macrosComida(c.ingredientes) });
    }
  }
  return salida;
}

/** El momento del menu de una comida ("comer-cena" → "cena"); las tuyas, su id. */
const momento = (h) => (/^(comer|recortar)-(.+)$/.exec(h.id || "") || [])[2] || h.id;

/**
 * Lo que mejor cierra el dia con lo que queda. `quedan`: { kcal, prot }.
 * Devuelve hasta `cuantas` opciones [{ comidas:[habitual], kcal, prot }],
 * la mejor primero. Ninguna pasa de lo que queda mas un 10%. Vacio si queda
 * poco (menos de 150 kcal) o no hay comidas que quepan. `yaComidas`: ids de
 * Mis comidas apuntadas hoy; no se propone otra del mismo momento (si ya has
 * desayunado, no sale otro desayuno).
 */
export function recomendar({ habituales, quedan, cuantas = 2, yaComidas = [] }) {
  const hechos = new Set(yaComidas.filter(Boolean).map(id => momento({ id })));
  const lista = (habituales || []).filter(h => h && h.kcal > 0 && !hechos.has(momento(h)));
  if (!quedan || quedan.kcal < 150 || !lista.length) return [];
  const tope = quedan.kcal * 1.1;
  const faltaProt = Math.max(0, quedan.prot || 0);
  const opciones = [];
  const probar = (comidas) => {
    const kcal = comidas.reduce((s, c) => s + c.kcal, 0);
    const prot = comidas.reduce((s, c) => s + (c.prot || 0), 0);
    if (kcal > tope) return;
    // Lo que queda sin cubrir, en kcal: cada gramo de proteina que falta
    // pesa como 4 kcal y otra vez lo mismo, porque es lo que mas importa.
    const nota = Math.abs(quedan.kcal - kcal) + 8 * Math.max(0, faltaProt - prot);
    opciones.push({ comidas, kcal, prot, nota });
  };
  // Dos comidas del mismo momento del menu (dos comidas de mediodia, dos
  // cenas) no se proponen juntas: nadie come pollo con arroz y luego pollo con legumbres.
  lista.forEach((a, i) => {
    probar([a]);
    for (let j = i + 1; j < lista.length; j++) if (momento(a) !== momento(lista[j])) probar([a, lista[j]]);
  });
  opciones.sort((x, y) => x.nota - y.nota);
  // Que las opciones no se repitan comida: la segunda es otra idea, no la misma con algo mas.
  const elegidas = [], usadas = new Set();
  for (const o of opciones) {
    if (o.comidas.some(c => usadas.has(c.id))) continue;
    elegidas.push({ comidas: o.comidas, kcal: o.kcal, prot: o.prot });
    o.comidas.forEach(c => usadas.add(c.id));
    if (elegidas.length >= cuantas) break;
  }
  return elegidas;
}

/**
 * Mis comidas con lo que devuelve tu IA (`leidas`, de leerComidas): a cada
 * una que coincida por nombre (sin mayusculas ni espacios de mas) se le ponen
 * los micros y los macros que traiga. Las demas no se tocan. Devuelve
 * { habituales, completadas }.
 */
export function completarHabituales(habituales, leidas) {
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const porNombre = new Map((leidas || []).map(l => [norm(l.nombre), l]));
  let completadas = 0;
  const salida = (habituales || []).map(h => {
    const l = porNombre.get(norm(h.nombre));
    if (!l) return h;
    completadas++;
    return { ...h, kcal: l.kcal || h.kcal, prot: l.prot ?? h.prot, hc: l.hc ?? h.hc, grasa: l.grasa ?? h.grasa,
             ...(l.micros ? { micros: l.micros } : {}) };
  });
  return { habituales: salida, completadas };
}

/**
 * Cargar en Mis comidas lo que devuelve tu IA: las que ya tienes (mismo
 * nombre) se actualizan con completarHabituales; las demas se anaden.
 * `nuevoId` da el id de cada nueva. Devuelve { habituales, nuevas, actualizadas }.
 */
export function cargarHabituales(habituales, leidas, nuevoId) {
  const norm = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const tengo = new Set((habituales || []).map(h => norm(h.nombre)));
  const { habituales: actualizadas, completadas } = completarHabituales(habituales, leidas);
  const vistas = new Set();
  const nuevas = (leidas || []).filter(l => {
    const n = norm(l.nombre);
    if (!n || tengo.has(n) || vistas.has(n)) return false;
    vistas.add(n); return true;
  }).map(l => ({ id: nuevoId(), nombre: l.nombre.trim(), kcal: l.kcal, prot: l.prot || 0, hc: l.hc || 0, grasa: l.grasa || 0,
                 ...(l.micros ? { micros: l.micros } : {}) }));
  return { habituales: [...actualizadas, ...nuevas], nuevas: nuevas.length, actualizadas: completadas };
}
