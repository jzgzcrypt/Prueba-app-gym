/**
 * COMPROMISOS FIJOS
 *
 * Un compromiso es algo que pasa SIEMPRE el mismo dia de la semana, pase lo que
 * pase y sea cual sea el bloque que este corriendo. No lo decide el plan de
 * entrenamiento: el plan tiene que trabajar alrededor de el.
 *
 * Por que existe esta figura y no esta metido en el plan como un dia mas:
 * el tenis de los lunes es un compromiso desde el 7 de septiembre, y el plan
 * solo lo recogio en las semanas 3, 4 y 5. Las semanas 1, 2 y 6 a 9 seguian
 * poniendo sesion de fuerza el lunes, porque se habian escrito antes y nadie
 * las volvio a tocar. Un compromiso escrito una sola vez, aparte del plan, no
 * se puede quedar a medio aplicar.
 *
 * El calendario los superpone sobre el plan y avisa si un plan futuro intenta
 * programar algo encima de uno (ver `colisiones` en calendario.js).
 *
 * dow: 0 = lunes ... 6 = domingo (misma posicion que los dias del plan).
 */

export const COMPROMISOS = [
  {
    id: "tenis",
    dow: 0, // lunes
    titulo: "Tenis",
    hora: "20:00 - 21:30",
    dur: "1h30",
    cat: "tenis",
    intensidad: "moderada",
    what: "1:30 de intervalos de tenis. Cuenta como tu sesión de cardio/calidad de la semana: nada de running ni de fuerza de pierna encima.",
    // Consecuencias sobre el resto de la semana. Estan escritas aqui, y no
    // repartidas por el plan, para que se apliquen solas a cualquier bloque.
    reglas: [
      "El lunes no se corre y no se hace pierna: el tenis ya es la carga.",
      "El martes, al día siguiente, va suave o descanso — las piernas vienen cargadas.",
      "Hombro y brazos no se ven afectados: el tenis no les genera fatiga.",
    ],
  },
];

/** El compromiso que toca un dia concreto de la semana, si lo hay. */
export function compromisoDelDia(dayIdx) {
  return COMPROMISOS.find((c) => c.dow === dayIdx) || null;
}
