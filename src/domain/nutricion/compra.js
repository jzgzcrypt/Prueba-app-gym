/**
 * LA COMPRA DE LA SEMANA.
 *
 * Sale sola de tu menu: se cuentan los dias de COMER y los de RECORTAR que
 * tiene la semana, se multiplican por lo que lleva cada comida y se suma. Si
 * editaste el menu —quitaste el desayuno, bajaste la avena—, la lista lo sabe.
 *
 * Y la lista dice dos cosas distintas, porque en el supermercado hay dos
 * preguntas distintas:
 *
 *   · LO QUE SÍ o sí — lo que el menu de esta semana necesita.
 *   · LO QUE DEPENDE — si no hay salmon hay merluza, y entonces no son 980 g
 *     de salmon sino 1,4 kg de merluza. Va al lado, con SU cantidad ya
 *     calculada, para no tener que hacer la cuenta delante del mostrador.
 *
 * Mas un tercer bloque, la despensa: sal, aceite, especias, cafe. Cosas que
 * igual te hacen falta y igual no, y que solo tu sabes si se te han acabado.
 * Por eso salen siempre, sin cantidad, y sin dar la lata.
 *
 * Las cantidades se redondean hacia ARRIBA a algo que se pueda comprar. Nadie
 * pide 173 g de pollo: se piden 200. Quedarse corto un jueves cuesta mas que
 * el gramo de mas.
 */

import { ALIMENTO, ALIMENTOS, equivalentesDe, cambiarPor } from "./alimentos.js";
import { menuDe } from "./menu-dia.js";

/** Donde esta cada cosa en el supermercado. Ordenado como se recorre. */
export const SECCIONES = [
  { id: "fresco", nombre: "Carnicería y pescadería" },
  { id: "verduleria", nombre: "Fruta y verdura" },
  { id: "refrigerado", nombre: "Lácteos, huevos y refrigerados" },
  { id: "despensa", nombre: "Despensa" },
  { id: "suplementos", nombre: "Suplementos" },
];

const SECCION_DE = {
  proteina: "fresco", verdura: "verduleria", fruta: "verduleria",
  carbo: "despensa", grasa: "despensa", extra: "refrigerado",
};

/** Excepciones: lo que no esta donde diria su grupo. */
const SECCION_EXPLICITA = {
  queso_batido: "refrigerado", yogur_proteico: "refrigerado", huevo: "refrigerado",
  clara: "refrigerado", pavo_lonchas: "refrigerado", jamon_serrano: "refrigerado",
  tofu: "refrigerado", whey: "suplementos", aguacate: "verduleria",
  patata: "verduleria", boniato: "verduleria",
};

const seccionDe = (id) => SECCION_EXPLICITA[id] || SECCION_DE[(ALIMENTO[id] || {}).grupo] || "despensa";

/**
 * Como se compra cada cosa: a que multiplo se redondea y como se dice.
 *
 * No es cosmetica. "1.190 g de pechuga" es un numero de hoja de calculo;
 * "1,2 kg" es lo que le pides al carnicero.
 */
const COMPRA = {
  // Fresco: al alza, de 50 en 50 g.
  _fresco: { paso: 50, formato: "peso" },
  // Seco: de 100 en 100 g, que es como vienen los paquetes.
  _seco: { paso: 100, formato: "peso" },
  // Verdura y fruta: de 100 en 100 g; se compra a ojo igual.
  _verde: { paso: 100, formato: "peso" },

  huevo: { paso: 360, formato: "docena", porUnidad: 60 },   // media docena
  yogur_proteico: { paso: 150, formato: "unidades", porUnidad: 150, nombreUnidad: "yogur" },
  queso_batido: { paso: 500, formato: "peso" },             // tarrina de medio kilo
  atun_lata: { paso: 156, formato: "unidades", porUnidad: 52, nombreUnidad: "lata" },
  legumbres: { paso: 400, formato: "unidades", porUnidad: 400, nombreUnidad: "bote" },
  bebida_almendras: { paso: 1000, formato: "volumen", nombreUnidad: "brick" },
  leche_desnatada: { paso: 1000, formato: "volumen", nombreUnidad: "brick" },
  aceite: { paso: 500, formato: "volumen" },
  pan_molde: { paso: 450, formato: "unidades", porUnidad: 450, nombreUnidad: "paquete" },
  tortitas_maiz: { paso: 100, formato: "unidades", porUnidad: 100, nombreUnidad: "paquete" },
  whey: { paso: 500, formato: "peso" },
};

const comoSeCompra = (id) => {
  if (COMPRA[id]) return COMPRA[id];
  const grupo = (ALIMENTO[id] || {}).grupo;
  if (grupo === "proteina") return COMPRA._fresco;
  if (grupo === "verdura" || grupo === "fruta") return COMPRA._verde;
  return COMPRA._seco;
};

/** "yogur" → "yogures", "bote" → "botes". En español la regla depende de la
 *  última letra, y "3 yogurs" canta. */
const plural = (palabra) => /[aeiou]$/i.test(palabra) ? palabra + "s" : palabra + "es";

/** Hacia arriba, siempre. Quedarse corto el jueves cuesta más que el gramo de más. */
const alAlza = (gramos, paso) => Math.max(paso, Math.ceil(gramos / paso) * paso);

/** La cantidad, dicha como se pide en la tienda. */
export function cantidadDeCompra(id, gramos) {
  const c = comoSeCompra(id);
  const g = alAlza(gramos, c.paso);

  if (c.formato === "docena") {
    const uds = Math.ceil(g / c.porUnidad);
    const docenas = uds / 12;
    if (docenas >= 1 && Number.isInteger(docenas)) return docenas === 1 ? "1 docena" : docenas + " docenas";
    return uds + " huevos";
  }
  if (c.formato === "unidades") {
    const uds = Math.ceil(g / c.porUnidad);
    return uds + " " + (uds === 1 ? c.nombreUnidad : plural(c.nombreUnidad));
  }
  if (c.formato === "volumen") {
    const litros = g / 1000;
    const texto = litros >= 1 ? (Number.isInteger(litros) ? litros + " l" : litros.toFixed(1).replace(".", ",") + " l")
      : g + " ml";
    return texto;
  }
  return g >= 1000 ? (g / 1000).toFixed(1).replace(".0", "").replace(".", ",") + " kg" : g + " g";
}

/**
 * Cuantos dias de cada tipo tiene la semana.
 * @param {Array} dias dias de la semana, ya con su regla de comida resuelta
 */
export function tiposDeSemana(dias, comidaDelDia) {
  const cuenta = { comer: 0, recortar: 0 };
  for (const d of dias || []) {
    const c = comidaDelDia(d);
    if (c && cuenta[c.id] !== undefined) cuenta[c.id]++;
  }
  return cuenta;
}

/**
 * LO QUE COMES FUERA NO SE COMPRA.
 *
 * Y no es lo mismo que quitarlo del menu: la comida de la cantina SIGUE
 * contando para los macros del dia —por eso se apunta— pero no entra en el
 * carro. Confundir las dos cosas romperia una de las dos: o comprarias comida
 * de mas todas las semanas, o el dia dejaria de cuadrar.
 *
 * Se guarda por dia de la semana y no por tipo de dia, porque asi es como
 * pasa de verdad: de lunes a viernes comes en la cantina, el fin de semana en
 * casa. Y el lunes es dia de COMER igual que el domingo.
 *
 * 0 = lunes ... 6 = domingo.
 */
export const FUERA_POR_DEFECTO = { comida: [0, 1, 2, 3, 4] };

const seComeFuera = (fuera, comidaId, dayIdx) =>
  !!(fuera && Array.isArray(fuera[comidaId]) && fuera[comidaId].includes(dayIdx));

/**
 * Los gramos de cada alimento que pide la semana entera.
 *
 * Se recorren los dias de verdad, uno a uno, en vez de multiplicar por el
 * numero de dias de cada tipo: hace falta saber QUE dia es cada uno para
 * poder saltarse la comida del martes y no la del domingo.
 */
function gramosDeLaSemana(dias, comidaDelDia, edits, fuera) {
  const total = {};
  const menus = { comer: menuDe("comer", edits), recortar: menuDe("recortar", edits) };

  (dias || []).forEach((dia, i) => {
    const tipo = (comidaDelDia(dia) || {}).id;
    const menu = menus[tipo];
    if (!menu) return;
    // El indice del dia dentro de la semana: del propio dia si lo trae, y si
    // no, la posicion en la lista. Las semanas empiezan en lunes.
    const dayIdx = typeof dia.dayIdx === "number" ? dia.dayIdx : i;

    for (const comida of menu) {
      if (seComeFuera(fuera, comida.id, dayIdx)) continue;
      for (const ing of comida.ingredientes) {
        total[ing.id] = (total[ing.id] || 0) + ing.g;
      }
    }
  });
  return total;
}

/**
 * Cosas que en este menu no se cambian por nada.
 *
 * Tener el mismo grupo no significa que una sustituya a la otra: la whey del
 * batido no se reemplaza por pollo, y los 2 kg de queso batido de la precama
 * tampoco. Ofrecer esos cambios llena la lista de ruido y hace desconfiar del
 * resto, que si son buenos.
 */
const SIN_CAMBIO = new Set([
  "whey", "queso_batido", "yogur_proteico", "bebida_almendras", "leche_desnatada", "aceite",
]);

/**
 * Lo que se puede comprar en su lugar, con la cantidad ya convertida.
 *
 * Se enseñan pocas y las que de verdad usarias: tres por alimento. Una lista
 * de quince alternativas no ayuda a decidir, entretiene.
 */
function alternativasDe(id, gramos) {
  if (SIN_CAMBIO.has(id)) return [];
  return equivalentesDe(id)
    .filter(o => !SIN_CAMBIO.has(o.id))
    .slice(0, 3)
    .map(o => ({
      id: o.id, nombre: o.nombre, cantidad: cantidadDeCompra(o.id, cambiarPor(id, gramos, o.id)),
    }));
}

/**
 * Cosas que igual hacen falta y igual no. No llevan cantidad a proposito:
 * solo tu sabes si se te ha acabado la sal.
 */
export const DESPENSA = [
  { id: "sal", nombre: "Sal" },
  { id: "especias", nombre: "Especias y hierbas" },
  { id: "vinagre", nombre: "Vinagre" },
  { id: "salsas", nombre: "Salsas bajas en calorías", nota: "Mira la etiqueta: más de 100 kcal por 100 g no es baja en calorías" },
  { id: "cafe", nombre: "Café" },
  { id: "edulcorante", nombre: "Edulcorante" },
  { id: "caldo", nombre: "Caldo o pastillas" },
  { id: "creatina", nombre: "Creatina monohidrato", nota: "0,1 g por kg de peso al día" },
  { id: "bebidas_zero", nombre: "Bebidas sin azúcar", nota: "Para picar entre horas sin sumar nada" },
];

/**
 * La compra de la semana, lista para ir al supermercado.
 *
 * @param {{dias:Array, comidaDelDia:Function, edits?:object, fuera?:object, margen?:number}} entrada
 */
export function listaDeLaCompra({ dias, comidaDelDia, edits, fuera, margen = 1.1 }) {
  const cuenta = tiposDeSemana(dias, comidaDelDia);
  const gramos = gramosDeLaSemana(dias, comidaDelDia, edits, fuera);

  const items = Object.keys(gramos)
    .filter(id => ALIMENTO[id])
    .map(id => {
      // El margen cubre los dias que el recalculo sube: si un dia comes corto
      // fuera, la cena de ese dia pide mas de lo que dice el menu.
      const conMargen = gramos[id] * margen;
      return {
        id,
        nombre: ALIMENTO[id].nombre,
        seccion: seccionDe(id),
        gramos: Math.round(gramos[id]),
        cantidad: cantidadDeCompra(id, conMargen),
        alternativas: alternativasDe(id, conMargen),
      };
    });

  const porSeccion = SECCIONES
    .map(s => ({ ...s, items: items.filter(i => i.seccion === s.id).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) }))
    .filter(s => s.items.length > 0);

  return {
    cuenta, dias: (cuenta.comer || 0) + (cuenta.recortar || 0),
    secciones: porSeccion, items, despensa: DESPENSA,
    // Cuantas comidas se hacen fuera, para poder decirlo en pantalla.
    fueraDeCasa: Object.keys(fuera || {}).reduce((t, k) => t + (fuera[k] || []).length, 0),
  };
}

/** Para poder tachar: una clave estable por semana y alimento. */
export const claveCompra = (inicioSemana, id) => inicioSemana + ":" + id;

/** Todo lo que existe en la despensa, por si hace falta listarlo entero. */
export const todosLosAlimentos = () => ALIMENTOS;
