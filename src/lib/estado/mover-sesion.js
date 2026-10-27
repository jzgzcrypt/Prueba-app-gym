/**
 * Mover una sesion a otro dia.
 *
 * Antes esto era un post-it: se guardaba "movida al jueves" en el dia de
 * origen y NADIE lo leia. El jueves no se enteraba, la sesion no aparecia en
 * ninguna parte, y era la unica herramienta que habia para reaccionar a un dia
 * fallado. Un boton que aparenta funcionar es peor que no tenerlo.
 *
 * Ahora el traslado es real: el dia de origen se queda vacio y el de destino
 * muestra la sesion, sin tocar el plan. El plan sigue siendo el plan; lo que
 * cambia es donde cae hoy.
 *
 * Forma de `movidas`:  { "2026-09-22": "2026-09-24" }   origen -> destino
 */

/** Adonde se ha movido lo de este dia, si es que se ha movido. */
export function destinoDe(movidas, fecha) {
  return movidas?.[fecha] || null;
}

/** Que sesiones han venido a caer en este dia desde otros dias. */
export function llegadasA(movidas, fecha) {
  if (!movidas) return [];
  return Object.keys(movidas).filter(origen => movidas[origen] === fecha);
}

/**
 * Las sesiones que de verdad tocan un dia: la suya —si no se la han llevado—
 * mas las que hayan venido de otros dias.
 *
 * @param {object} dia      el dia del plan, ya con fecha
 * @param {object} movidas  mapa origen -> destino
 * @param {Array}  todos    todos los dias del bloque, para buscar los origenes
 * @returns {{ propia: object|null, llegadas: Array, movidaA: string|null }}
 */
export function sesionesDelDia(dia, movidas, todos) {
  const fecha = dia.isoDate;
  const movidaA = destinoDe(movidas, fecha);
  const llegadas = llegadasA(movidas, fecha)
    .map(origen => todos.find(d => d.isoDate === origen))
    .filter(Boolean);
  return { propia: movidaA ? null : dia, llegadas, movidaA };
}

/**
 * Quita todo movimiento que toque a un dia, como origen o como destino, sin
 * dejar la otra mitad colgando: lo que salio de el, lo que llego a el y los
 * "cede" de ambos lados. Es lo que necesita "Vaciar este dia".
 */
export function quitarMovimientosDe(movidas, dia) {
  if (!movidas) return movidas;
  const m = { ...movidas };
  const v = m[dia];
  delete m[dia];
  if (typeof v === "string" && v.startsWith("cede:")) delete m[v.slice(5)];
  for (const k of Object.keys(m)) {
    if (m[k] === dia) delete m[k];                 // llego aqui desde k
    else if (m[k] === "cede:" + dia) delete m[k];  // otro dia le cedio el sitio
  }
  return Object.keys(m).length === Object.keys(movidas).length ? movidas : m;
}

/**
 * Mueve lo de un dia a otro, o lo devuelve a su sitio si destino es null.
 *
 * Reglas, y el motivo de cada una:
 *  - No se mueve a un dia que ya ha recibido otra sesion: juntar dos sesiones
 *    en un dia es justo lo que hace que no se haga ninguna.
 *  - No se encadenan traslados: si el destino ya movio lo suyo a otro sitio,
 *    se rechaza antes que dejar el registro en un estado que nadie entiende.
 *  - No se mueve a si mismo.
 *
 * @returns {{ movidas: object, ok: boolean, motivo: string|null }}
 */
export function moverSesion(movidas, origen, destino) {
  const actual = movidas || {};

  if (destino == null) {
    // Devolver deshace el traslado entero: tambien el "cede" que dejo en el
    // dia de destino (si no, ese dia se quedaba vacio para siempre).
    const fuera = { ...actual };
    delete fuera[origen];
    for (const k of Object.keys(fuera)) if (fuera[k] === "cede:" + origen) delete fuera[k];
    return { movidas: fuera, ok: true, motivo: null };
  }

  if (origen === destino) return { movidas: actual, ok: false, motivo: "Es el mismo día." };
  if (llegadasA(actual, destino).some(o => o !== origen)) {
    return { movidas: actual, ok: false, motivo: "Ese día ya ha recibido otra sesión." };
  }
  if (actual[destino] && actual[destino] !== "pasa") {
    return { movidas: actual, ok: false, motivo: "Ese día ya movió lo suyo a otro sitio." };
  }

  return { movidas: { ...actual, [origen]: destino }, ok: true, motivo: null };
}
