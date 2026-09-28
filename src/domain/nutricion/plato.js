/**
 * LA CENA, A OJO.
 *
 * IIFYM en una frase: da igual que comas, importa cuanto suma el dia. Asi que
 * desayuno, comida y merienda los apuntas como caigan —la cantina, un menu
 * fuera, lo de siempre— y la cena es la que cuadra: se come lo que queda.
 *
 * Y lo que queda no se dice en gramos, que no vas a pesar: se dice en MANOS.
 *   🖐 palma      = una racion de proteina (la palma entera, grosor de la mano)
 *   ✊ puño       = una racion de hidrato (arroz, pasta, patata… ya cocinado)
 *   🥦 puño       = una racion de verdura
 *   👍 pulgar     = una racion de grasa (aceite, aguacate, queso, frutos secos)
 * Es el metodo de Precision Nutrition. Con valores de hombre:
 *   palma ≈ 25 g de proteina, ~150 kcal · puño de hidrato ≈ 30 g, ~140 kcal
 *   puño de verdura ≈ 30 kcal · pulgar ≈ 9 g de grasa, ~80 kcal
 * No es exacto, y no hace falta: el error de una cena a ojo es mucho menor
 * que el de no cenar pensando o de cenar "lo que haya".
 *
 * El orden al repartir es el mismo que en cuadrar.js:
 *   1. La proteina primero (1-3 palmas): quedarse corto no se recupera mañana.
 *   2. La verdura siempre (2 puños): volumen y saciedad, casi sin calorias.
 *   3. El hidrato con lo que quede de hidrato (0-3 puños): es la palanca.
 *   4. La grasa cierra las calorias (0-2 pulgares).
 * Todo en medias raciones: "1½ palmas" se entiende, "1,37" no.
 */

export const RACION = {
  prot:    { kcal: 150, prot: 25, hc: 2,  grasa: 6 },
  hc:      { kcal: 140, prot: 4,  hc: 30, grasa: 1 },
  verdura: { kcal: 30,  prot: 2,  hc: 5,  grasa: 0 },
  grasa:   { kcal: 80,  prot: 0,  hc: 0,  grasa: 9 },
};

/** Como se ve cada racion, para decirlo y para "ver en gramos". */
export const PORCION = {
  prot:    { mano: "palma", manos: "palmas", icono: "🖐", nombre: "Proteína", ejemplos: "pollo, pavo, pescado, huevos, ternera",
             gramos: [{ nombre: "pollo o pavo (crudo)", g: 130 }, { nombre: "pescado blanco", g: 170 }, { nombre: "huevos", g: 0, porRacion: 3 }] },
  hc:      { mano: "puño", manos: "puños", icono: "✊", nombre: "Hidrato", ejemplos: "arroz, pasta, patata, pan, legumbre",
             gramos: [{ nombre: "arroz o pasta (en crudo)", g: 40 }, { nombre: "patata cocida", g: 170 }, { nombre: "pan", g: 55 }] },
  verdura: { mano: "puño", manos: "puños", icono: "🥦", nombre: "Verdura", ejemplos: "la que quieras",
             gramos: [{ nombre: "verdura", g: 150 }] },
  grasa:   { mano: "pulgar", manos: "pulgares", icono: "👍", nombre: "Grasa", ejemplos: "aceite, aguacate, queso, frutos secos",
             gramos: [{ nombre: "aceite de oliva", g: 10 }, { nombre: "aguacate", g: 45 }, { nombre: "frutos secos", g: 15 }] },
};

const medio = (x) => Math.round(x * 2) / 2;
const entre = (x, a, b) => Math.max(a, Math.min(b, x));

/** "1½ palmas", "½ puño", "2 pulgares". */
export function textoPorcion(n, tipo) {
  const p = PORCION[tipo];
  const ent = Math.floor(n), mitad = n - ent >= 0.5;
  const num = (ent ? String(ent) : "") + (mitad ? "½" : "");
  return (num || "0") + " " + (n > 1 ? p.manos : p.mano);
}

/** Los macros de un plato de raciones. */
export function macrosDePorciones(por) {
  const out = { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  for (const k of Object.keys(RACION)) for (const m of Object.keys(out)) out[m] += (por[k] || 0) * RACION[k][m];
  return out;
}

/**
 * La cena que cuadra el dia con lo que queda (`resto`: kcal, prot, hc, grasa).
 * Devuelve { porciones, macros, aviso, extraProteina }.
 *  aviso: null | "ligera" (queda poco) | "pasado" (el dia ya esta lleno).
 *  extraProteina: true si ni con 3 palmas se llega a la proteina del dia.
 */
export function platoCena(resto) {
  const verdura = 2;
  const kcal = resto.kcal;
  // El dia ya esta lleno: proteina (lo justo si falta) y verdura. Sin culpa.
  if (kcal < 150) {
    const prot = resto.prot > 20 ? 1 : 0.5;
    const porciones = { prot, hc: 0, verdura, grasa: 0 };
    return { porciones, macros: macrosDePorciones(porciones), aviso: "pasado", extraProteina: false };
  }
  // 1. Proteina: lo que falta, entre 1 y 3 palmas.
  const vProt = verdura * RACION.verdura.prot;
  let prot = entre(medio((resto.prot - vProt) / RACION.prot.prot), 1, 3);
  // Si queda poco, primero proteina y verdura; el resto se ajusta a las kcal.
  const kcalBase = verdura * RACION.verdura.kcal;
  if (kcalBase + prot * RACION.prot.kcal > kcal) prot = entre(medio((kcal - kcalBase) / RACION.prot.kcal), 1, 3);
  let libre = kcal - kcalBase - prot * RACION.prot.kcal;
  // 2. Hidrato: lo que quede de hidrato, sin pasarse de las kcal.
  const hcQueda = resto.hc - verdura * RACION.verdura.hc - prot * RACION.prot.hc;
  let hc = entre(medio(hcQueda / RACION.hc.hc), 0, 3);
  hc = Math.min(hc, Math.max(0, Math.floor(libre / RACION.hc.kcal * 2) / 2));
  libre -= hc * RACION.hc.kcal;
  // 3. Grasa: cierra las calorias.
  const grasa = entre(Math.floor(libre / RACION.grasa.kcal * 2) / 2, 0, 2);
  const porciones = { prot, hc, verdura, grasa };
  const macros = macrosDePorciones(porciones);
  const aviso = kcal < 350 ? "ligera" : null;
  const extraProteina = resto.prot - macros.prot > 20;
  return { porciones, macros, aviso, extraProteina };
}

/** "Cené esto": el plato como un apunte, igual que lo escrito a mano. */
export function apunteDePlato(plato) {
  const p = plato.porciones;
  const partes = ["prot", "hc", "verdura", "grasa"].filter(k => p[k] > 0).map(k => textoPorcion(p[k], k));
  const m = plato.macros;
  return { comida: "cena", origen: "texto", texto: "Cena a ojo: " + partes.join(" · "),
           kcal: Math.round(m.kcal), prot: Math.round(m.prot), hc: Math.round(m.hc), grasa: Math.round(m.grasa) };
}

/** Lo que pesa cada racion, para quien quiera verlo: [{ tipo, texto }]. */
export function enGramos(porciones) {
  const out = [];
  for (const tipo of ["prot", "hc", "verdura", "grasa"]) {
    const n = porciones[tipo];
    if (!n) continue;
    const opciones = PORCION[tipo].gramos.map(o => o.porRacion
      ? Math.round(n * o.porRacion) + " " + o.nombre
      : o.nombre + " " + Math.round(o.g * n / 5) * 5 + " g");
    out.push({ tipo, texto: opciones.join(" · ") });
  }
  return out;
}
