/**
 * LO QUE HAY EN CASA.
 *
 * Esta tabla no es una base de datos de alimentos: es TU despensa. Todo lo que
 * hay aqui sale de los dos menus del dietista de 2022 o de lo que se compra
 * en una casa normal. Si un alimento no esta aqui es porque no lo tienes, y
 * una comida que propone algo que no tienes es una comida que no te vas a
 * hacer.
 *
 * Los valores son por 100 g del alimento tal y como lo pesas: el arroz y la
 * pasta EN CRUDO, la patata y el boniato COCIDOS, la carne CRUDA. Es como se
 * pesa de verdad en una cocina, y mezclarlo es el error que hace que las
 * cuentas no cuadren nunca.
 *
 * No hay que ser exacto. Un 10% arriba o abajo no cambia nada en once
 * semanas; no pesar nunca, si.
 *
 *   grupo: donde entra en el plato — proteina | carbo | verdura | fruta | grasa | extra
 *   paso:  a que multiplo se redondean los gramos al proponerlo (un huevo no
 *          se parte en tres, el arroz si se puede servir de cinco en cinco)
 */

/** @typedef {{id:string,nombre:string,grupo:string,kcal:number,prot:number,hc:number,grasa:number,paso?:number,unidad?:{nombre:string,g:number},nota?:string}} Alimento */

/** @type {Alimento[]} */
export const ALIMENTOS = [
  // ─── PROTEINA ──────────────────────────────────────────────────────────
  { id: "pollo", nombre: "Pechuga de pollo", grupo: "proteina", kcal: 110, prot: 23, hc: 0, grasa: 2.5, paso: 10, nota: "cruda" },
  { id: "pavo", nombre: "Pechuga de pavo", grupo: "proteina", kcal: 105, prot: 24, hc: 0, grasa: 1.5, paso: 10, nota: "cruda" },
  { id: "burger_meat", nombre: "Burger meat magra", grupo: "proteina", kcal: 130, prot: 21, hc: 1, grasa: 5, paso: 10, nota: "cruda" },
  { id: "ternera", nombre: "Ternera magra", grupo: "proteina", kcal: 135, prot: 21, hc: 0, grasa: 5.5, paso: 10, nota: "cruda" },
  { id: "lomo", nombre: "Lomo adobado", grupo: "proteina", kcal: 140, prot: 22, hc: 1, grasa: 5.5, paso: 10, nota: "crudo" },
  { id: "merluza", nombre: "Merluza o pescado blanco", grupo: "proteina", kcal: 75, prot: 17, hc: 0, grasa: 1, paso: 10 },
  { id: "salmon", nombre: "Salmón", grupo: "proteina", kcal: 200, prot: 20, hc: 0, grasa: 13, paso: 10, nota: "pescado azul" },
  { id: "atun_lata", nombre: "Atún al natural", grupo: "proteina", kcal: 108, prot: 24, hc: 0, grasa: 1, paso: 10, unidad: { nombre: "lata", g: 52 } },
  { id: "gambas", nombre: "Gambas o langostinos", grupo: "proteina", kcal: 85, prot: 18, hc: 0, grasa: 1, paso: 10 },
  { id: "huevo", nombre: "Huevo", grupo: "proteina", kcal: 130, prot: 12.5, hc: 0.7, grasa: 9, paso: 60, unidad: { nombre: "huevo", g: 60 } },
  { id: "clara", nombre: "Clara de huevo", grupo: "proteina", kcal: 48, prot: 11, hc: 0.7, grasa: 0.2, paso: 33, unidad: { nombre: "clara", g: 33 } },
  { id: "jamon_serrano", nombre: "Jamón serrano", grupo: "proteina", kcal: 240, prot: 31, hc: 0, grasa: 12, paso: 10 },
  { id: "pavo_lonchas", nombre: "Pavo en lonchas", grupo: "proteina", kcal: 100, prot: 18, hc: 1.5, grasa: 2.5, paso: 10 },
  { id: "queso_batido", nombre: "Queso fresco batido 0%", grupo: "proteina", kcal: 47, prot: 8, hc: 4, grasa: 0.2, paso: 25 },
  { id: "yogur_proteico", nombre: "Yogur proteico", grupo: "proteina", kcal: 60, prot: 10, hc: 4, grasa: 0.3, paso: 150, unidad: { nombre: "yogur", g: 150 } },
  { id: "whey", nombre: "Proteína whey", grupo: "proteina", kcal: 390, prot: 78, hc: 6, grasa: 6, paso: 5, unidad: { nombre: "cacito", g: 25 } },
  { id: "tofu", nombre: "Tofu firme", grupo: "proteina", kcal: 120, prot: 13, hc: 1.5, grasa: 7, paso: 10 },

  // ─── CARBOHIDRATO ──────────────────────────────────────────────────────
  { id: "arroz", nombre: "Arroz", grupo: "carbo", kcal: 355, prot: 7, hc: 78, grasa: 0.9, paso: 5, nota: "en crudo" },
  { id: "pasta", nombre: "Pasta", grupo: "carbo", kcal: 360, prot: 12, hc: 72, grasa: 1.5, paso: 5, nota: "en crudo" },
  { id: "quinoa", nombre: "Quinoa", grupo: "carbo", kcal: 368, prot: 14, hc: 64, grasa: 6, paso: 5, nota: "en crudo" },
  { id: "cuscus", nombre: "Cuscús", grupo: "carbo", kcal: 360, prot: 12, hc: 72, grasa: 1.5, paso: 5, nota: "en crudo" },
  { id: "patata", nombre: "Patata cocida", grupo: "carbo", kcal: 80, prot: 2, hc: 17, grasa: 0.1, paso: 25 },
  { id: "boniato", nombre: "Boniato", grupo: "carbo", kcal: 90, prot: 1.6, hc: 20, grasa: 0.1, paso: 25 },
  { id: "legumbres", nombre: "Legumbres de bote", grupo: "carbo", kcal: 100, prot: 7, hc: 13, grasa: 1.5, paso: 25, nota: "escurridas" },
  { id: "lentejas_secas", nombre: "Lentejas secas", grupo: "carbo", kcal: 340, prot: 24, hc: 50, grasa: 1.5, paso: 5 },
  { id: "pan_molde", nombre: "Pan de molde", grupo: "carbo", kcal: 250, prot: 8, hc: 47, grasa: 3, paso: 30, unidad: { nombre: "rebanada", g: 30 } },
  { id: "pan", nombre: "Pan", grupo: "carbo", kcal: 265, prot: 9, hc: 50, grasa: 1.5, paso: 10 },
  { id: "avena", nombre: "Harina de avena", grupo: "carbo", kcal: 375, prot: 13, hc: 60, grasa: 7, paso: 5 },
  { id: "tortitas_maiz", nombre: "Tortitas de maíz", grupo: "carbo", kcal: 380, prot: 8, hc: 80, grasa: 2, paso: 7, unidad: { nombre: "tortita", g: 7 } },

  // ─── VERDURA — el volumen del plato ────────────────────────────────────
  { id: "verdura", nombre: "Verdura variada", grupo: "verdura", kcal: 30, prot: 2, hc: 4, grasa: 0.3, paso: 50 },
  { id: "ensalada", nombre: "Ensalada", grupo: "verdura", kcal: 20, prot: 1.5, hc: 2, grasa: 0.2, paso: 50 },
  { id: "brocoli", nombre: "Brócoli", grupo: "verdura", kcal: 34, prot: 2.8, hc: 4, grasa: 0.4, paso: 50 },
  { id: "calabacin", nombre: "Calabacín", grupo: "verdura", kcal: 17, prot: 1.2, hc: 2, grasa: 0.3, paso: 50 },
  { id: "champinones", nombre: "Champiñones", grupo: "verdura", kcal: 22, prot: 3, hc: 1, grasa: 0.3, paso: 50 },
  { id: "pimiento", nombre: "Pimiento", grupo: "verdura", kcal: 26, prot: 1, hc: 5, grasa: 0.3, paso: 50 },
  { id: "tomate", nombre: "Tomate", grupo: "verdura", kcal: 18, prot: 0.9, hc: 3.5, grasa: 0.2, paso: 50 },

  // ─── FRUTA ─────────────────────────────────────────────────────────────
  { id: "fruta", nombre: "Fruta de temporada", grupo: "fruta", kcal: 55, prot: 0.7, hc: 12, grasa: 0.2, paso: 25 },
  { id: "frutos_rojos", nombre: "Frutos rojos", grupo: "fruta", kcal: 45, prot: 1, hc: 8, grasa: 0.4, paso: 25 },
  { id: "platano", nombre: "Plátano", grupo: "fruta", kcal: 90, prot: 1.1, hc: 20, grasa: 0.3, paso: 120, unidad: { nombre: "plátano", g: 120 } },

  // ─── GRASA — poca cantidad, mucho impacto ──────────────────────────────
  { id: "aceite", nombre: "Aceite de oliva", grupo: "grasa", kcal: 900, prot: 0, hc: 0, grasa: 100, paso: 5 },
  { id: "aguacate", nombre: "Aguacate", grupo: "grasa", kcal: 160, prot: 2, hc: 2, grasa: 15, paso: 10 },
  { id: "frutos_secos", nombre: "Frutos secos", grupo: "grasa", kcal: 600, prot: 20, hc: 10, grasa: 52, paso: 5 },
  { id: "crema_cacahuete", nombre: "Crema de cacahuete", grupo: "grasa", kcal: 600, prot: 25, hc: 12, grasa: 50, paso: 5 },

  // ─── EXTRAS ────────────────────────────────────────────────────────────
  { id: "bebida_almendras", nombre: "Bebida de almendras zero", grupo: "extra", kcal: 13, prot: 0.5, hc: 0.1, grasa: 1.1, paso: 50 },
  { id: "leche_desnatada", nombre: "Leche desnatada", grupo: "extra", kcal: 34, prot: 3.4, hc: 4.8, grasa: 0.2, paso: 50 },
];

/** @type {Record<string, Alimento>} */
export const ALIMENTO = Object.fromEntries(ALIMENTOS.map(a => [a.id, a]));

export const porGrupo = (grupo) => ALIMENTOS.filter(a => a.grupo === grupo);

/** Los macros de X gramos de un alimento. Devuelve ceros si no existe. */
export function macrosDe(id, gramos) {
  const a = ALIMENTO[id];
  if (!a || !gramos) return { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  const f = gramos / 100;
  return { kcal: a.kcal * f, prot: a.prot * f, hc: a.hc * f, grasa: a.grasa * f };
}

/** "180 g (3 huevos)" — la cantidad como la vas a servir, no como la calcula la maquina. */
export function cantidadLegible(id, gramos) {
  const a = ALIMENTO[id];
  if (!a) return gramos + " g";
  if (!a.unidad) return Math.round(gramos) + " g";
  const n = gramos / a.unidad.g;
  const redondo = Math.round(n * 2) / 2;
  if (redondo < 0.5) return Math.round(gramos) + " g";
  const plural = redondo === 1 ? a.unidad.nombre : a.unidad.nombre + "s";
  return String(redondo).replace(".5", ",5") + " " + plural;
}

// ─── INTERCAMBIAR ─────────────────────────────────────────────────────────
//
// Lo que de verdad hace que una dieta se sostenga: si hoy no hay pollo, hay
// pavo, y la cantidad se ajusta sola para que el plato siga sumando lo mismo.
// Es la tabla de equivalencias del dietista, pero calculada en vez de
// aproximada.

/** El macro que define a cada grupo, y por el que se iguala al cambiar. */
const MACRO_DEL_GRUPO = { proteina: "prot", carbo: "hc", grasa: "grasa" };

/** Por que se puede cambiar un alimento: lo de su mismo grupo. */
export function equivalentesDe(id) {
  const a = ALIMENTO[id];
  if (!a) return [];
  return ALIMENTOS.filter(o => o.grupo === a.grupo && o.id !== id);
}

/**
 * Cuantos gramos del alimento nuevo equivalen a estos del viejo.
 *
 * Se iguala el macro que define al grupo —la proteina en la carne, el
 * carbohidrato en el arroz, la grasa en el aceite— porque es a lo que va ese
 * alimento en el plato. Habra algo de dispersion de calorias, y es asumible:
 * antes la adherencia que la exactitud.
 */
export function cambiarPor(id, gramos, nuevoId) {
  const viejo = ALIMENTO[id], nuevo = ALIMENTO[nuevoId];
  if (!viejo || !nuevo) return gramos;
  const macro = MACRO_DEL_GRUPO[nuevo.grupo];
  if (!macro || !nuevo[macro]) return gramos; // verdura y fruta: a igualdad de gramos
  const objetivo = (viejo[macro] / 100) * gramos;
  const paso = nuevo.paso || 5;
  return Math.max(paso, Math.round((objetivo / (nuevo[macro] / 100)) / paso) * paso);
}
