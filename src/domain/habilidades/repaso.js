/**
 * REPASO ESPACIADO — las cartas de estudio, aplicadas a una habilidad manual.
 *
 * El modelo de antes no servia: el truco te lo daba el numero de semana del
 * bloque de running. Si dominabas The Glide el martes, te lo seguia poniendo
 * seis dias mas, y si no lo dominabas te pasaba al siguiente igual. El
 * calendario mandaba sobre ti, que es justo al reves de como se aprende algo.
 *
 * Ahora manda lo que sabes:
 *
 *   1. Le das caña a UNO. El actual, todos los dias.
 *   2. Cuando lo dominas, pasa a la cola de repaso y el siguiente se convierte
 *      en el actual. Avanzas por dominio, no por calendario.
 *   3. Lo dominado vuelve cada X dias para que no se te caiga. Si sale, X
 *      crece; si no sale, X se encoge. Tu atencion sigue en el nuevo.
 *
 * Es el sistema de las cartas de estudio, y funciona por una razon concreta:
 * repasar algo justo cuando estas a punto de olvidarlo fija mucho mas que
 * repasarlo cuando aun lo tienes fresco. Por eso los intervalos crecen.
 *
 * Aqui no hay algoritmo opaco: hay una escalera de dias, y se ve entera.
 */

/** Los dias hasta el siguiente repaso, escalon a escalon.
 *
 *  Empieza en 2 —un dia de descanso ya es olvido suficiente para que el
 *  repaso valga— y acaba en 90, que para una habilidad de manos es
 *  practicamente "ya es tuyo". */
export const ESCALERA = [2, 5, 12, 30, 60, 90];

/** Cuando llegas al final de la escalera, el truco esta asentado: sigue
 *  volviendo, pero muy de vez en cuando. */
export const ESCALON_ASENTADO = ESCALERA.length - 1;

const MS_DIA = 86400000;

/** "2026-09-22" + n dias. A mediodia UTC, para que ningun cambio de hora
 *  mueva el dia al sumar. */
export function sumarDias(iso, n) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const r = new Date(Date.UTC(y, m - 1, d, 12) + n * MS_DIA);
  return r.getUTCFullYear() + "-" + String(r.getUTCMonth() + 1).padStart(2, "0")
    + "-" + String(r.getUTCDate()).padStart(2, "0");
}

/** Dias entre dos fechas. Negativo si la segunda es anterior. */
export function diasEntre(desde, hasta) {
  const a = new Date(String(desde) + "T12:00:00Z"), b = new Date(String(hasta) + "T12:00:00Z");
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b - a) / MS_DIA);
}

/**
 * Entra en la cola de repaso: acabas de decir que lo dominas.
 *
 * El primer repaso es a los dos dias, no mañana: "lo domino" dicho el mismo
 * dia que lo has practicado cien veces no significa gran cosa. A los dos dias
 * si lo sigue haciendo, lo tienes.
 */
export function dominar(hoy) {
  return { escalon: 0, proximo: sumarDias(hoy, ESCALERA[0]), ultimo: hoy, aciertos: 0, fallos: 0 };
}

/**
 * La respuesta a un repaso, y lo que pasa con ella.
 *
 *   bien     → sube un escalon. El siguiente repaso tarda mas en llegar.
 *   regular  → se queda donde esta. Te lo vuelve a poner en los mismos dias.
 *   mal      → baja al primer escalon. No se castiga mas que eso: fallar es
 *              informacion, no un suspenso, y volver a empezar la escalera ya
 *              es suficiente correccion.
 *
 * Tres fallos seguidos y deja de ser un repaso: vuelve a la mesa de trabajo
 * como truco actual, porque repasar algo que no te sale no es repasar.
 */
export function responder(estado, respuesta, hoy) {
  const base = estado || dominar(hoy);
  const fallos = respuesta === "mal" ? (base.fallos || 0) + 1 : 0;

  if (fallos >= 3) {
    // Fuera de la cola: esto no es repaso, es aprender.
    return { escalon: 0, proximo: hoy, ultimo: hoy, aciertos: base.aciertos || 0, fallos, reaprender: true };
  }

  const escalon = respuesta === "bien" ? Math.min(ESCALON_ASENTADO, (base.escalon || 0) + 1)
    : respuesta === "mal" ? 0
    : (base.escalon || 0);

  return {
    escalon,
    proximo: sumarDias(hoy, ESCALERA[escalon]),
    ultimo: hoy,
    aciertos: (base.aciertos || 0) + (respuesta === "bien" ? 1 : 0),
    fallos,
  };
}

/** ¿Toca hoy? Tambien si se paso de fecha: un repaso atrasado no se pierde. */
export const tocaHoy = (estado, hoy) => !!estado && !estado.reaprender && diasEntre(estado.proximo, hoy) >= 0;

/** Cuantos dias faltan para que vuelva. */
export const faltanDias = (estado, hoy) => (estado ? Math.max(0, diasEntre(hoy, estado.proximo)) : null);

/**
 * El dia de hoy, repartido: en que le das caña y que tienes que repasar.
 *
 * `items` es cualquier lista con `id`, en el orden en que se aprenden. El
 * actual es el primero que no has dominado todavia — se avanza dominando, no
 * esperando a que pase la semana.
 */
export function colaDeHoy(items, repaso, hoy) {
  const estados = repaso || {};
  const pendiente = (it) => !estados[it.id] || estados[it.id].reaprender;

  const actual = items.find(pendiente) || null;
  const repasos = items.filter(it => it !== actual && tocaHoy(estados[it.id], hoy));
  const luego = items
    .filter(it => it !== actual && estados[it.id] && !estados[it.id].reaprender && !tocaHoy(estados[it.id], hoy))
    .sort((a, b) => diasEntre(hoy, estados[a.id].proximo) - diasEntre(hoy, estados[b.id].proximo));

  return {
    actual,
    repasos,
    luego,
    // Lo que queda por ver por primera vez, para saber cuanto camino hay.
    nuevos: items.filter(it => it !== actual && !estados[it.id]),
  };
}

/** El resumen de siempre: cuanto llevas y cuanto queda. */
export function progresoDe(items, repaso) {
  const estados = repaso || {};
  const enCola = items.filter(it => estados[it.id] && !estados[it.id].reaprender);
  return {
    total: items.length,
    dominados: enCola.length,
    asentados: enCola.filter(it => estados[it.id].escalon >= ESCALON_ASENTADO).length,
    quedan: items.length - enCola.length,
  };
}
