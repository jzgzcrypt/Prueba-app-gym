/**
 * CUADRAR EL DIA.
 *
 * Esta es la pieza central, y la idea es una sola: TU SIGUES TU MENU. Apuntas
 * lo que has comido de verdad —el desayuno tal cual, o lo que haya caido en
 * la cantina— y las CANTIDADES DE LO QUE QUEDA se recalculan para que el dia
 * siga sumando lo que tiene que sumar.
 *
 * No se te propone comida nueva. No se tira el menu. Se ajustan los gramos de
 * las comidas que aun no has hecho, que es exactamente lo que harias tu con
 * una calculadora si tuvieras ganas de hacerlo cada noche.
 *
 * Como se ajusta, y por que asi:
 *
 *   · La VERDURA, la FRUTA y las bebidas NO se tocan. Son volumen y costumbre;
 *     moverlas no arregla nada y quita saciedad justo cuando hace falta.
 *   · El CARBOHIDRATO es lo que mas se mueve. Es la palanca del dia: si a
 *     mediodia han caido macarrones y pan, la pasta de la cena baja.
 *   · La PROTEINA se mueve lo justo para llegar a los 165 g. Quedarse corto de
 *     proteina es lo unico que no se recupera mañana, asi que sube antes que
 *     bajar.
 *   · La GRASA cierra las calorias que queden.
 *
 * Los factores se resuelven a la vez y no uno detras de otro, porque los
 * alimentos no son puros: la pasta lleva proteina, el salmon lleva grasa. Se
 * itera cuatro veces, que es de sobra para que converja.
 *
 * Y hay topes. Si para cuadrar el dia hiciera falta multiplicar la cena por
 * tres, el problema no lo arregla la cena: lo dice el aviso y se deja la cena
 * en algo que una persona se pueda comer.
 */

import { ALIMENTO, cambiarPor, macrosDe } from "./alimentos.js";
import { menuDe } from "./menu-dia.js";
import { macrosDelDia, redondearMacros, restarMacros, sumarMacros } from "./iifym.js";

const CERO = { kcal: 0, prot: 0, hc: 0, grasa: 0 };

/** Lo que se puede estirar o encoger, y cuanto. Por debajo o por encima de
 *  esto ya no es una racion: es un castigo o un atracon. */
const AJUSTABLES = {
  carbo:    { macro: "hc", min: 0.25, max: 2.2 },
  proteina: { macro: "prot", min: 0.5, max: 1.8 },
  grasa:    { macro: "grasa", min: 0.2, max: 2.5 },
};

/** Estos no se tocan nunca. */
const FIJOS = ["verdura", "fruta", "extra"];

/**
 * De que se puede prescindir cuando el dia ya no cuadra encogiendo.
 *
 * Es lo que haces tu de verdad: si a mediodia han caido macarrones, pescado
 * rebozado y pan, no te haces una cena de 20 g de pasta — te saltas el
 * almuerzo. Encoger los cinco platos hasta lo ridiculo es lo que hace una
 * hoja de calculo, no una persona.
 *
 * El desayuno, la comida y la cena no se saltan NUNCA: saltarse una comida
 * principal es exactamente el habito que hay que evitar.
 */
const PRESCINDIBLES = ["precama", "almuerzo", "merienda", "postentreno"];

/** Por encima de esto, el dia no cuadra y hay que quitar algo. */
const MARGEN = 1.05;

const grupoDe = (id) => (ALIMENTO[id] ? ALIMENTO[id].grupo : "extra");

const redondear = (id, g) => {
  const paso = (ALIMENTO[id] && ALIMENTO[id].paso) || 5;
  return Math.max(0, Math.round(g / paso) * paso);
};

/** Suma los macros de los ingredientes de un grupo, a las cantidades del plan. */
function baseDe(ingredientes, grupos) {
  return ingredientes.reduce((t, i) =>
    grupos.includes(grupoDe(i.id)) ? sumarMacros(t, macrosDe(i.id, i.g)) : t, Object.assign({}, CERO));
}

/**
 * Los factores que hay que aplicar a cada grupo para que lo pendiente sume
 * lo que falta del dia.
 *
 * @returns {{factores: Record<string, number>, topado: string[]}}
 */
export function factoresPara(ingredientesPendientes, restante) {
  const fijo = baseDe(ingredientesPendientes, FIJOS);
  const base = {};
  for (const g of Object.keys(AJUSTABLES)) base[g] = baseDe(ingredientesPendientes, [g]);

  const factores = { carbo: 1, proteina: 1, grasa: 1 };
  const topado = [];

  for (let vuelta = 0; vuelta < 4; vuelta++) {
    for (const [grupo, { macro, min, max }] of Object.entries(AJUSTABLES)) {
      const capacidad = base[grupo][macro];
      if (capacidad <= 0) { factores[grupo] = 1; continue; }
      // Lo que ya aportan los demas grupos de ese macro, con sus factores actuales.
      let ajeno = fijo[macro];
      for (const otro of Object.keys(AJUSTABLES)) {
        if (otro !== grupo) ajeno += base[otro][macro] * factores[otro];
      }
      const bruto = (restante[macro] - ajeno) / capacidad;
      const acotado = Math.min(max, Math.max(min, bruto));
      factores[grupo] = acotado;
      if (vuelta === 3 && Math.abs(bruto - acotado) > 0.02) topado.push(grupo);
    }
  }
  return { factores, topado };
}

/** La clave de un cambio: que ingrediente, de que comida. */
export const claveCambio = (comidaId, alimentoId) => comidaId + ":" + alimentoId;

/**
 * Aplica los cambios de alimento al menu: "hoy no hay salmon, hay merluza".
 *
 * La cantidad se recalcula igualando el macro que define al grupo, asi que el
 * plato sigue sumando lo mismo antes incluso de que entre el recalculo del
 * dia. Es la tabla de equivalencias, hecha con una calculadora.
 */
function aplicarCambios(menu, cambios) {
  if (!cambios) return menu;
  return menu.map(c => {
    const ingredientes = c.ingredientes.map(i => {
      const nuevo = cambios[claveCambio(c.id, i.id)];
      if (!nuevo || !ALIMENTO[nuevo]) return i;
      return { id: nuevo, g: cambiarPor(i.id, i.g, nuevo), enLugarDe: i.id };
    });
    return Object.assign({}, c, { ingredientes });
  });
}

/** Gramos de proteina por caloria. Cuanto mas alto, mas cara de perder es esa
 *  comida: quitarla cuesta proteina, que es lo que no se recupera mañana. */
function densidadProteica(comida) {
  const m = comida.ingredientes.reduce((t, i) => sumarMacros(t, macrosDe(i.id, i.g)), Object.assign({}, CERO));
  return m.kcal > 0 ? m.prot / m.kcal : 0;
}

/** Recalcula un conjunto de comidas para que sumen lo que falta del dia. */
function resolver(pendientes, restante) {
  const { factores, topado } = factoresPara(pendientes.flatMap(c => c.ingredientes), restante);
  const ajustadas = pendientes.map(c => {
    const ingredientes = c.ingredientes.map(i => {
      const grupo = grupoDe(i.id);
      const f = FIJOS.includes(grupo) ? 1 : (factores[grupo] || 1);
      const gramos = redondear(i.id, i.g * f);
      return { id: i.id, gramos, gramosPlan: i.g, cambio: gramos - i.g, enLugarDe: i.enLugarDe };
    }).filter(i => i.gramos > 0);
    const macros = ingredientes.reduce((t, i) => sumarMacros(t, macrosDe(i.id, i.gramos)), Object.assign({}, CERO));
    return Object.assign({}, c, { hecha: false, ingredientes, macros: redondearMacros(macros) });
  });
  const total = ajustadas.reduce((t, c) => sumarMacros(t, c.macros), Object.assign({}, CERO));
  return { ajustadas, total, factores, topado };
}

/**
 * El dia entero: lo comido, lo que falta, y el menu pendiente ya recalculado.
 *
 * @param {{tipoDia:string, objetivo:object, apuntes:Array, cambios?:object, edits?:object}} entrada
 */
export function cuadrarDia({ tipoDia, objetivo, apuntes, cambios, edits }) {
  const menu = aplicarCambios(menuDe(tipoDia, edits), cambios);
  const lista = Array.isArray(apuntes) ? apuntes : [];

  // Una comida esta hecha cuando hay algun apunte que la nombra. Los apuntes
  // sin comida (un picoteo, una caña) suman al dia pero no cierran nada.
  const hechas = new Set(lista.filter(a => a && a.comida).map(a => a.comida));
  const comido = macrosDelDia(lista);
  const restante = restarMacros(objetivo, comido);

  let pendientes = menu.filter(c => !hechas.has(c.id));

  // Primero se intenta cuadrar con todo el menu. Si aun asi se pasa, se van
  // quitando las comidas prescindibles hasta que entre — que es lo que harias
  // tu antes que cenar 20 g de pasta.
  const saltadas = [];
  let intento = resolver(pendientes, restante);
  while (intento.total.kcal > restante.kcal * MARGEN) {
    // Se quita la que peor proteina da por caloria: el queso batido de la
    // precama son 20 g de proteina por 118 kcal, asi que es lo ultimo que se
    // toca; la fruta con frutos secos del almuerzo, lo primero.
    //
    // Y solo se quita si la proteina del dia aguanta. Ahorrar calorias a costa
    // de la proteina es el peor cambio posible: las calorias se recuperan
    // mañana y la proteina que falta hoy se paga en el hombro.
    const candidatas = pendientes
      .filter(c => PRESCINDIBLES.includes(c.id))
      .sort((a, b) => densidadProteica(a) - densidadProteica(b));

    let elegida = null, siguiente = null;
    for (const c of candidatas) {
      const prueba = resolver(pendientes.filter(o => o.id !== c.id), restante);
      if (prueba.total.prot >= restante.prot * 0.9) { elegida = c; siguiente = prueba; break; }
    }
    if (!elegida) break;

    saltadas.push(elegida.id);
    pendientes = pendientes.filter(c => c.id !== elegida.id);
    intento = siguiente;
  }

  const { ajustadas, total: totalAjustado, factores, topado } = intento;

  // Se devuelve el dia ENTERO y en orden, con las hechas marcadas. Una comida
  // hecha no desaparece: sigue en su sitio, con lo que apuntaste, porque en la
  // cantina caen tres cosas y las apuntas de una en una.
  const porId = Object.fromEntries(ajustadas.map(c => [c.id, c]));
  const comidas = menu.map(c => porId[c.id]
    || Object.assign({}, c, {
      hecha: !saltadas.includes(c.id), saltada: saltadas.includes(c.id),
      ingredientes: [], macros: Object.assign({}, CERO),
    }));

  const previsto = redondearMacros(sumarMacros(comido, totalAjustado));

  return {
    comido: redondearMacros(comido),
    restante: redondearMacros(restante),
    hechas,
    comidas,
    pendientes: ajustadas,
    saltadas,
    factores,
    // Como queda el dia si te comes lo ajustado. Si esto no llega al objetivo
    // es porque los topes han entrado: el aviso lo dice.
    previsto,
    aviso: avisoDe({ restante, pendientes, topado, objetivo, saltadas, menu, previsto }),
  };
}

/**
 * Lo que hay que decirle a alguien que acaba de apuntar su comida.
 *
 * Nunca es una regañina. Un dia no mueve once semanas; lo que mueve es no
 * saber donde estas, y eso es lo que arregla esta frase.
 */
function avisoDe({ restante, pendientes, topado, objetivo, saltadas, menu, previsto }) {
  // El orden importa: primero donde estas, despues que se ha tocado, y solo al
  // final los matices. Un aviso que llega tarde no sirve de nada.

  // 1. El dia ya esta cerrado, con todo apuntado.
  if (pendientes.length === 0) {
    if (restante.kcal < -objetivo.kcal * 0.08) return {
      id: "pasado", texto: "Día cerrado, y por encima de lo previsto. No pasa nada: mañana el menú sale igual y la semana se recoloca sola.",
    };
    if (restante.kcal > objetivo.kcal * 0.12) return {
      id: "corto", texto: "Día cerrado, y por debajo. Comer de menos los días de correr es lo que hace que la sesión siguiente se caiga — mañana no te quedes corto.",
    };
    return { id: "cerrado", texto: "Día cerrado y cuadrado." };
  }

  // 2. Ya no queda margen: lo que falte del menu sobra.
  if (restante.kcal <= 0) return {
    id: "pasado", texto: "Con lo de hoy ya has llegado. Lo que queda, redúcelo a proteína y verdura: te saciarás igual y el día no se va más.",
  };

  // 3. Se ha tenido que quitar algo del menu.
  if (saltadas && saltadas.length) {
    const nombres = saltadas.map(id => (menu.find(c => c.id === id) || { nombre: id }).nombre.toLowerCase());
    return {
      id: "saltada",
      texto: "Con lo de hoy no cabe el menú entero, así que se " +
        (nombres.length === 1 ? "quita " + nombres[0] : "quitan " + nombres.join(" y ")) +
        ". Es lo que harías tú: antes saltarse eso que cenar una ración de mentira.",
    };
  }

  // 4. Las calorias cuadran pero la proteina no llega. Es el unico macro que
  //    no se recupera mañana, asi que se dice y se dice como arreglarlo.
  if (previsto && previsto.prot < objetivo.prot * 0.9) return {
    id: "falta-proteina",
    texto: "Las calorías cuadran, pero te quedas en " + Math.round(previsto.prot) + " g de proteína. " +
      "Mete un queso fresco batido o un yogur proteico: son 20 g por poco más de 100 kcal, " +
      "y la proteína que falta hoy se paga en el hombro.",
  };

  // 5. Ni encogiendo ni quitando sale. Se dice, sin dramatizar.
  if (topado.includes("carbo") || topado.includes("proteina")) return {
    id: "no-cuadra",
    texto: "No cuadra solo con lo que queda: las cantidades de abajo están en su tope. Ajusta lo que puedas y mañana sigue el menú tal cual — no se arregla en un día.",
  };

  return null;
}

/**
 * Convierte una comida del plan en apuntes, para cuando te la comes tal cual.
 * Se congelan los gramos que tenias delante, no los del papel: eso es lo que
 * comiste de verdad.
 */
export function apuntesDe(comidaAjustada) {
  return comidaAjustada.ingredientes.map(i => ({
    comida: comidaAjustada.id, origen: "casa", id: i.id, gramos: i.gramos,
  }));
}
