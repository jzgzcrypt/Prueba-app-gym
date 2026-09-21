/**
 * TU MENU DEL DIA.
 *
 * Esto no es una sugerencia ni un generador: es el menu que sigues, con la
 * misma forma que tenian los programas del dietista de 2022 —desayuno,
 * almuerzo, comida, post-entreno, cena, precama— y con los alimentos que
 * tienes en casa.
 *
 * Lo unico que cambia respecto al papel es que aqui los ingredientes llevan
 * el alimento identificado y los gramos aparte. Eso es lo que permite lo
 * importante: cuando apuntas que has comido otra cosa, LAS CANTIDADES DE LO
 * QUE QUEDA SE RECALCULAN para que el dia siga cuadrando. El menu no se tira;
 * se ajusta.
 *
 * Hay dos menus porque hay dos tipos de dia, igual que en 2022: el dia que
 * corres fuerte comes, y el dia que no, recortas. La diferencia esta casi
 * toda en el carbohidrato, que es la palanca.
 *
 * Los gramos de aqui son el PUNTO DE PARTIDA: suman lo que dice
 * OBJETIVO_MACROS con un margen de unas 50 kcal. A partir de ahi manda el
 * recalculo.
 */

export const COMIDAS_DEL_DIA = [
  { id: "desayuno", nombre: "Desayuno", cuando: "Al levantarte" },
  { id: "almuerzo", nombre: "Almuerzo", cuando: "Media mañana" },
  { id: "comida", nombre: "Comida", cuando: "Mediodía · normalmente en la cantina" },
  { id: "postentreno", nombre: "Post-entreno", cuando: "Al acabar la sesión" },
  { id: "merienda", nombre: "Merienda", cuando: "Media tarde" },
  { id: "cena", nombre: "Cena", cuando: "Noche" },
  { id: "precama", nombre: "Precama", cuando: "Antes de dormir" },
];

export const COMIDA_DEL_DIA = Object.fromEntries(COMIDAS_DEL_DIA.map(c => [c.id, c]));

/** @typedef {{id:string,g:number}} Ingrediente */
/** @typedef {{id:string,nombre:string,cuando:string,ingredientes:Ingrediente[]}} ComidaPlan */

/** @type {Record<string, ComidaPlan[]>} */
export const MENU_DIA = {
  // ─── DIA DE COMER — tenis, calidad, test, objetivo y tirada larga ───────
  comer: [
    { id: "desayuno", ingredientes: [
      { id: "bebida_almendras", g: 300 }, { id: "whey", g: 25 }, { id: "avena", g: 50 },
      { id: "frutos_rojos", g: 50 }, { id: "pan_molde", g: 30 }, { id: "aguacate", g: 60 },
    ] },
    { id: "almuerzo", ingredientes: [
      { id: "fruta", g: 150 }, { id: "yogur_proteico", g: 150 }, { id: "frutos_secos", g: 10 },
    ] },
    { id: "comida", ingredientes: [
      { id: "verdura", g: 300 }, { id: "pollo", g: 170 }, { id: "arroz", g: 100 },
      { id: "fruta", g: 150 }, { id: "aceite", g: 5 },
    ] },
    { id: "postentreno", ingredientes: [
      { id: "bebida_almendras", g: 400 }, { id: "whey", g: 20 }, { id: "platano", g: 120 },
    ] },
    { id: "cena", ingredientes: [
      { id: "verdura", g: 300 }, { id: "pasta", g: 85 }, { id: "huevo", g: 120 }, { id: "aceite", g: 10 },
    ] },
    { id: "precama", ingredientes: [{ id: "queso_batido", g: 250 }] },
  ],

  // ─── DIA DE RECORTAR — fuerza, suave y descanso ─────────────────────────
  recortar: [
    { id: "desayuno", ingredientes: [
      { id: "bebida_almendras", g: 300 }, { id: "whey", g: 25 }, { id: "avena", g: 45 },
      { id: "pan_molde", g: 60 }, { id: "jamon_serrano", g: 40 }, { id: "fruta", g: 150 },
    ] },
    { id: "comida", ingredientes: [
      { id: "verdura", g: 300 }, { id: "pollo", g: 170 }, { id: "legumbres", g: 200 },
      { id: "fruta", g: 150 }, { id: "aceite", g: 10 },
    ] },
    { id: "merienda", ingredientes: [
      { id: "queso_batido", g: 250 }, { id: "frutos_rojos", g: 50 },
    ] },
    { id: "cena", ingredientes: [
      { id: "verdura", g: 300 }, { id: "boniato", g: 250 }, { id: "salmon", g: 140 }, { id: "aceite", g: 10 },
    ] },
  ],
};

/** El menu del dia con el nombre y el cuando ya puestos. */
export function menuDe(tipoDia) {
  const plan = MENU_DIA[tipoDia] || MENU_DIA.recortar;
  return plan.map(c => Object.assign({}, COMIDA_DEL_DIA[c.id], c));
}
