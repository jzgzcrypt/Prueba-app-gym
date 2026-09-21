/**
 * Que se come cada dia.
 *
 * La regla, en una linea: LOS DIAS QUE CORRES FUERTE, COMES. LOS DIAS QUE NO,
 * RECORTAS.
 *
 * El motivo esta en la fisiologia y no en la fuerza de voluntad: la grasa
 * alimenta el trote suave, pero NO alimenta 4:45/km — eso tira de glucogeno,
 * que viene de los carbohidratos que comes, no de la barriga. Asi que las
 * sesiones que construyen el 7K van con el deposito lleno, y el deficit se
 * concentra en los dias que no lo necesitan.
 *
 * La media semanal queda en deficit suave: unos 3 kg de grasa en las 11
 * semanas. Poco sobre el papel, pero con IMC 25,7 es lo que hay que perder,
 * y apretar mas se lleva por delante el objetivo de running.
 *
 * La proteina NO se negocia ningun dia: es lo unico que protege el hombro
 * mientras se pierde grasa.
 */

/**
 * LOS NUMEROS, Y DE DONDE SALEN.
 *
 * Habia dos cifras sobre la mesa y no cuadraban:
 *
 *   · El dietista de 2022 escribio 2.081 kcal en dia de entreno y 1.814 en
 *     dia de descanso. Son numeros de un cuerpo que levantaba pesas y no
 *     corria, y con una prisa por bajar grasa que hoy no toca.
 *   · La primera version de esta app dijo 2.800 y 2.350. Eso era una
 *     estimacion mia, y de mas: 2.800 con este gasto no deja deficit.
 *
 * Lo que hay aqui es la reconciliacion, y esta escrita para que la puedas
 * discutir en vez de creertela: 86 kg y 183 cm dan un metabolismo basal de
 * unas 1.830 kcal. Con trabajo sentado, 8-10.000 pasos y la sesion del dia,
 * el gasto real cae sobre 2.600 los dias fuertes y 2.450 los demas. Restando
 * el deficit donde toca quedan los numeros de abajo: media semanal en torno a
 * 2.220 kcal, unas 400 por debajo del gasto. Eso son ~0,4 kg de grasa a la
 * semana sin tocar el rendimiento del 7K.
 *
 * Si en tres semanas la cintura no se mueve, baja 150 kcal de HC en los dias
 * de RECORTAR. Si el ritmo Z2 se pone duro, subelas. El numero no manda: la
 * cintura y las piernas mandan.
 *
 * La proteina es la misma los dos dias porque no se negocia: es lo unico que
 * protege el hombro mientras se pierde grasa. La grasa se mantiene alta para
 * no tocar las hormonas. EL CARBOHIDRATO ES LA PALANCA — y por eso sube
 * justo los dias que hay que correr rapido.
 */

/** @typedef {{kcal:number,prot:number,hc:number,grasa:number}} Macros */

/** @type {Record<string, Macros>} */
export const OBJETIVO_MACROS = {
  comer:    { kcal: 2500, prot: 165, hc: 302, grasa: 70 },
  recortar: { kcal: 2100, prot: 165, hc: 214, grasa: 65 },
};

export const PROTEINA_DIARIA = "150-170 g";

export const COMIDA = {
  comer: {
    id: "comer",
    etiqueta: "COMER",
    kcal: "2.500 kcal",
    macros: OBJETIVO_MACROS.comer,
    detalle: "Hoy el deposito va lleno. Carbohidratos alrededor de la sesion.",
  },
  recortar: {
    id: "recortar",
    etiqueta: "RECORTAR",
    kcal: "2.100 kcal",
    macros: OBJETIVO_MACROS.recortar,
    detalle: "Hoy no hay sesion de intensidad: aqui es donde se pierde la grasa.",
  },
};

/**
 * Que toca comer este dia, deducido de lo que toca entrenar.
 *
 * Se comen los dias de: tenis (1h30 de intensidad real), la sesion de calidad,
 * el test, el dia del objetivo, y la tirada larga del domingo.
 */
export function comidaDelDia(dia) {
  if (!dia) return COMIDA.recortar;
  const esFuerte = dia.tipo === "compromiso"
    || dia.esCalidad
    || dia.tipo === "test"
    || dia.tipo === "objetivo"
    || (dia.tipo === "run" && (dia.dayIdx === 6 || dia.dow === "Domingo")); // la tirada larga
  return esFuerte ? COMIDA.comer : COMIDA.recortar;
}
