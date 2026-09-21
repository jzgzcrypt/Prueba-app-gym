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

export const PROTEINA_DIARIA = "150-170 g";

export const COMIDA = {
  comer: {
    id: "comer",
    etiqueta: "COMER",
    kcal: "~2.800 kcal",
    detalle: "Hoy el deposito va lleno. Carbohidratos alrededor de la sesion.",
  },
  recortar: {
    id: "recortar",
    etiqueta: "RECORTAR",
    kcal: "~2.350 kcal",
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
