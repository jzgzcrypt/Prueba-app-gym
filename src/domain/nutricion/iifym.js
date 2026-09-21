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
 *   3. Y te propone varias cenas que encajan en lo que queda, con los gramos
 *      ya calculados, hechas SOLO con lo que tienes en casa.
 *
 * Las opciones que salen son intercambiables entre si: misma energia, mismos
 * macros, distinta comida. Eliges por apetito, no por calculo.
 *
 * Todo lo de este archivo son funciones puras: entran numeros, salen numeros.
 * No saben de pantallas ni de almacenamiento, y por eso se pueden probar.
 */

import { ALIMENTO, cantidadLegible, macrosDe } from "./alimentos.js";
import { macrosPlato } from "./cantina.js";

const CERO = { kcal: 0, prot: 0, hc: 0, grasa: 0 };

/** Menos de esto no da para un plato de verdad. */
export const MINIMO_PLATO = 350;

/** Lo que cabe en una cena. Mas que esto no es una cena: es el dia entero
 *  metido en un plato, y no te lo vas a comer. */
export const TOPE_CENA = 900;

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

/**
 * Reparte lo que queda entre la cena y lo que venga despues.
 *
 * Sin esto, un dia en el que has comido poco acaba proponiendo una cena de
 * 1.300 kcal — 260 g de gambas y 215 g de arroz. Nadie cena eso. Lo que pasa
 * de verdad es que meriendas, cenas y picas algo antes de dormir.
 *
 * Asi que la cena se topa y el sobrante se reserva, en vez de fingir que cabe
 * todo en un plato. El reparto es proporcional: si se recorta la energia, se
 * recortan los tres macros con ella, y la cena sigue estando equilibrada.
 */
export function repartirResto(resto, tope = TOPE_CENA) {
  if (!resto || resto.kcal <= tope) return { objetivo: resto, reservado: null };
  const f = tope / resto.kcal;
  const objetivo = { kcal: resto.kcal * f, prot: resto.prot * f, hc: resto.hc * f, grasa: resto.grasa * f };
  return { objetivo, reservado: redondearMacros(restarMacros(resto, objetivo)) };
}

/**
 * Que hacer con lo que queda. La cena no siempre es "una cena".
 *
 * No es un regaño: pasarse un dia no rompe once semanas. Es saber en que
 * situacion estas antes de abrir la nevera.
 */
export function estadoDelResto(resto, objetivo) {
  const pct = objetivo && objetivo.kcal ? resto.kcal / objetivo.kcal : 0;
  if (resto.kcal < 150) return {
    id: "pasado", titulo: "Hoy ya está",
    texto: "Con lo de hoy ya llegas. Cena proteína y verdura sin contar —te saciarás igual— y mañana sigue el plan. Un día no mueve la aguja; la semana sí.",
  };
  if (pct < 0.18) return {
    id: "justo", titulo: "Queda poco",
    texto: "Queda margen para una cena ligera. Proteína y verdura, y el carbohidrato déjalo para mañana.",
  };
  if (pct > 0.45) return {
    id: "sobra", titulo: "Queda mucho",
    texto: "Has comido corto. Cena completa y sin miedo: comer de menos los días de correr es lo que hace que la sesión siguiente se caiga.",
  };
  return {
    id: "encaja", titulo: "Cena normal",
    texto: "Vas justo donde toca. Cualquiera de estas cenas cuadra el día.",
  };
}

// ─── COMIDAS DE UN TOQUE ──────────────────────────────────────────────────
//
// Lo que comes casi siempre igual no merece calculo: merece un boton. El
// desayuno es el mismo porridge de los menus de 2022, y apuntarlo tiene que
// costar un gesto o no se apunta.

export const COMIDAS_RAPIDAS = [
  { id: "porridge", nombre: "Porridge de siempre", detalle: "Bebida de almendras + whey + avena + frutos rojos", kcal: 430, prot: 34, hc: 45, grasa: 9 },
  { id: "tostadas", nombre: "Tostadas con aguacate", detalle: "2 rebanadas + 60 g de aguacate + pavo", kcal: 400, prot: 22, hc: 33, grasa: 19 },
  { id: "batido_post", nombre: "Batido post-entreno", detalle: "Bebida de almendras + whey + crema de arroz", kcal: 230, prot: 18, hc: 22, grasa: 3 },
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

// ─── LAS PLANTILLAS ───────────────────────────────────────────────────────
//
// Una plantilla no lleva gramos: lleva la FORMA del plato — una proteina, un
// carbohidrato, verdura y una grasa. Los gramos los pone el calculo segun lo
// que te quede del dia, y por eso el mismo plato sirve para una cena de 500
// kcal y para una de 900.
//
// Todas se hacen con lo que hay en casa y en menos de veinte minutos. Una
// cena que pide ingredientes que no tienes es una cena que acaba en pizza.

export const PLANTILLAS = [
  { id: "pollo_arroz", nombre: "Pollo con arroz", proteina: "pollo", carbo: "arroz", verdura: "verdura", grasa: "aceite", momentos: ["cena", "comida"] },
  { id: "merluza_patata", nombre: "Merluza con patata", proteina: "merluza", carbo: "patata", verdura: "ensalada", grasa: "aceite", momentos: ["cena", "comida"] },
  { id: "tortilla_pan", nombre: "Tortilla con pan y ensalada", proteina: "huevo", carbo: "pan", verdura: "ensalada", grasa: "aceite", momentos: ["cena"] },
  { id: "salmon_boniato", nombre: "Salmón con boniato", proteina: "salmon", carbo: "boniato", verdura: "brocoli", grasa: null, momentos: ["cena", "comida"] },
  { id: "atun_pasta", nombre: "Pasta con atún", proteina: "atun_lata", carbo: "pasta", verdura: "tomate", grasa: "aceite", momentos: ["cena", "comida"] },
  { id: "ternera_quinoa", nombre: "Ternera con quinoa", proteina: "ternera", carbo: "quinoa", verdura: "pimiento", grasa: "aceite", momentos: ["cena", "comida"] },
  { id: "pavo_cuscus", nombre: "Pavo con cuscús", proteina: "pavo", carbo: "cuscus", verdura: "calabacin", grasa: "aguacate", momentos: ["cena", "comida"] },
  { id: "gambas_arroz", nombre: "Arroz con gambas", proteina: "gambas", carbo: "arroz", verdura: "pimiento", grasa: "aceite", momentos: ["cena", "comida"] },
  { id: "pollo_legumbres", nombre: "Legumbres con pollo", proteina: "pollo", carbo: "legumbres", verdura: "verdura", grasa: "aceite", momentos: ["comida"] },
  { id: "burger_patata", nombre: "Burger meat con patata", proteina: "burger_meat", carbo: "patata", verdura: "ensalada", grasa: "aguacate", momentos: ["cena", "comida"] },
  { id: "revuelto_champi", nombre: "Revuelto con champiñones", proteina: "huevo", carbo: "patata", verdura: "champinones", grasa: "aceite", momentos: ["cena"] },
  { id: "tofu_arroz", nombre: "Tofu salteado con arroz", proteina: "tofu", carbo: "arroz", verdura: "brocoli", grasa: "aceite", momentos: ["cena"] },
  { id: "lomo_pan", nombre: "Lomo con pan y tomate", proteina: "lomo", carbo: "pan", verdura: "tomate", grasa: "aceite", momentos: ["cena"] },
  { id: "dulce_avena", nombre: "Avena con queso batido", proteina: "queso_batido", carbo: "avena", verdura: null, grasa: "crema_cacahuete", momentos: ["cena"], nota: "Para la noche que no te apetece cocinar." },
];

// Topes de cordura: lo que cabe en un plato de verdad.
const LIMITES = {
  proteina: { min: 80, max: 300 },
  carbo: { min: 0, max: 450 },
  verdura: { fijo: 250 },
  grasa: { min: 0, max: 45 },
};

const redondear = (id, g) => {
  const paso = (ALIMENTO[id] && ALIMENTO[id].paso) || 5;
  return Math.max(0, Math.round(g / paso) * paso);
};

const acotar = (g, lim) => Math.min(lim.max, Math.max(g <= 0 ? 0 : lim.min, g));

/**
 * Pone gramos a una plantilla para que encaje en el objetivo.
 *
 * El orden importa y no es arbitrario: la verdura se fija primero porque es
 * volumen que sacia y casi no suma; el carbohidrato se despeja del objetivo
 * de HC, que es la palanca del dia; la proteina de lo que falte de proteina,
 * descontando la que ya aporta el carbohidrato (la pasta lleva 12 g por 100,
 * y no contarla es el error clasico); y la grasa al final, con lo que sobre.
 *
 * Se recalcula el carbohidrato una segunda vez porque la proteina elegida
 * tambien trae algo de HC. Con dos pasadas el resultado ya converge.
 */
export function escalarPlato(plantilla, objetivo) {
  const gramos = {};
  if (plantilla.verdura) gramos[plantilla.verdura] = LIMITES.verdura.fijo;

  const porG = (id, macro) => (ALIMENTO[id] ? ALIMENTO[id][macro] / 100 : 0);
  const totalDe = (excepto) => Object.keys(gramos).reduce((t, id) =>
    id === excepto ? t : sumarMacros(t, macrosDe(id, gramos[id])), Object.assign({}, CERO));

  for (let pasada = 0; pasada < 2; pasada++) {
    if (plantilla.carbo) {
      const resto = totalDe(plantilla.carbo);
      const hcPorG = porG(plantilla.carbo, "hc");
      gramos[plantilla.carbo] = hcPorG > 0
        ? acotar(redondear(plantilla.carbo, (objetivo.hc - resto.hc) / hcPorG), LIMITES.carbo) : 0;
    }
    if (plantilla.proteina) {
      const resto = totalDe(plantilla.proteina);
      const protPorG = porG(plantilla.proteina, "prot");
      gramos[plantilla.proteina] = protPorG > 0
        ? acotar(redondear(plantilla.proteina, (objetivo.prot - resto.prot) / protPorG), LIMITES.proteina) : 0;
    }
  }

  if (plantilla.grasa) {
    const resto = totalDe(plantilla.grasa);
    const grasaPorG = porG(plantilla.grasa, "grasa");
    gramos[plantilla.grasa] = grasaPorG > 0
      ? acotar(redondear(plantilla.grasa, (objetivo.grasa - resto.grasa) / grasaPorG), LIMITES.grasa) : 0;
  }

  const orden = [plantilla.proteina, plantilla.carbo, plantilla.verdura, plantilla.grasa];
  const ingredientes = orden.filter(id => id && gramos[id] > 0).map(id => ({
    id, gramos: gramos[id],
    nombre: ALIMENTO[id] ? ALIMENTO[id].nombre : id,
    cantidad: cantidadLegible(id, gramos[id]),
  }));

  const macros = ingredientes.reduce((t, i) => sumarMacros(t, macrosDe(i.id, i.gramos)), Object.assign({}, CERO));

  return {
    id: plantilla.id, nombre: plantilla.nombre, nota: plantilla.nota,
    ingredientes, macros: redondearMacros(macros),
    desvio: redondearMacros(restarMacros(macros, objetivo)),
    error: errorFrente(macros, objetivo),
  };
}

/**
 * Como de lejos se queda un plato del objetivo.
 *
 * Las calorias pesan el doble que los macros sueltos, porque son lo que de
 * verdad decide si bajas grasa. Y la proteina pesa mas que el HC y la grasa,
 * porque quedarse corto de proteina es lo unico que no se recupera al dia
 * siguiente.
 */
function errorFrente(macros, objetivo) {
  const rel = (a, b) => (b > 0 ? Math.abs(a - b) / b : 0);
  return 2 * rel(macros.kcal, objetivo.kcal)
    + 1.5 * rel(macros.prot, objetivo.prot)
    + rel(macros.hc, objetivo.hc)
    + rel(macros.grasa, objetivo.grasa);
}

/**
 * Varias comidas distintas que encajan en el mismo objetivo.
 *
 * Se descartan las que se pasan de lejos y se evita repetir proteina: tres
 * opciones de pollo no son tres opciones. Salen ordenadas por lo bien que
 * cuadran, pero cualquiera de ellas vale — de eso va todo esto.
 */
export function generarComidas(objetivo, opciones) {
  const { momento = "cena", cuantas = 3, excluir = [], plantillas = PLANTILLAS } = opciones || {};
  // Por debajo de esto no hay plato que proponer: cualquier cosa que saliera
  // seria una racion de mentira. Ahi lo honesto es decir que el dia ya esta,
  // que es justo lo que dice estadoDelResto().
  if (!objetivo || objetivo.kcal < MINIMO_PLATO) return [];

  const candidatas = plantillas
    .filter(p => p.momentos.includes(momento) && !excluir.includes(p.id))
    .map(p => escalarPlato(p, objetivo))
    .filter(p => p.ingredientes.length > 0)
    .sort((a, b) => a.error - b.error);

  const elegidas = [];
  const proteinasUsadas = new Set();
  for (const c of candidatas) {
    const prot = c.ingredientes[0] ? c.ingredientes[0].id : "";
    if (proteinasUsadas.has(prot)) continue;
    proteinasUsadas.add(prot);
    elegidas.push(c);
    if (elegidas.length >= cuantas) break;
  }
  // Si con la regla de no repetir no salen suficientes, se completan igual:
  // mas vale una opcion parecida que una pantalla a medias.
  for (const c of candidatas) {
    if (elegidas.length >= cuantas) break;
    if (!elegidas.includes(c)) elegidas.push(c);
  }
  return elegidas;
}
