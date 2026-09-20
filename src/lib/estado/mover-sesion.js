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
    if (!(origen in actual)) return { movidas: actual, ok: true, motivo: null };
    const fuera = { ...actual };
    delete fuera[origen];
    return { movidas: fuera, ok: true, motivo: null };
  }

  if (origen === destino) return { movidas: actual, ok: false, motivo: "Es el mismo día." };
  if (llegadasA(actual, destino).some(o => o !== origen)) {
    return { movidas: actual, ok: false, motivo: "Ese día ya ha recibido otra sesión." };
  }
  if (actual[destino]) {
    return { movidas: actual, ok: false, motivo: "Ese día ya movió lo suyo a otro sitio." };
  }

  return { movidas: { ...actual, [origen]: destino }, ok: true, motivo: null };
}
