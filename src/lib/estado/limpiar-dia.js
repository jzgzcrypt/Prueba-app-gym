/**
 * Vaciar un dia del registro.
 *
 * Marcar el dia equivocado es facil: la app se usa con el movil en la mano,
 * a veces mirando otra cosa. Hasta ahora no habia forma de deshacerlo — el
 * deshacer general dura 6 segundos y va por accion suelta, asi que un error
 * detectado al dia siguiente se quedaba para siempre.
 *
 * Se escribe como funcion pura, fuera de los componentes, por dos razones:
 * borra datos del usuario (lo mas delicado que hace la app) y se puede probar
 * sin abrir un navegador.
 */

/** Claves que guardan UN valor por dia, indexadas por dayKey exacto. */
const POR_DIA = ["notes", "painLog", "magiaLog", "guerreroLog", "workoutWeights",
                 "ritmoReal", "ritmoTramos", "sensaciones", "postponed", "comidasLog"];

/** Claves donde un dia puede tener varias entradas: el propio dayKey y
 *  ademas sufijos como "1-3-m" (cuello manana) o "1-3-movenf" (movilidad). */
const POR_DIA_CON_SUFIJO = ["checked", "cuelloChecks"];

/** ¿Esta entrada pertenece a este dia? Se compara el dayKey entero o el
 *  dayKey seguido de guion, nunca un prefijo suelto: asi "1-1" no se lleva
 *  por delante a "11-1". */
function esDelDia(clave, dayKey) {
  return clave === dayKey || clave.startsWith(dayKey + "-");
}

function sinEsteDia(mapa, dayKey, conSufijo) {
  if (!mapa) return mapa;
  const fuera = {};
  let quitadas = 0;
  for (const k of Object.keys(mapa)) {
    const coincide = conSufijo ? esDelDia(k, dayKey) : k === dayKey;
    if (coincide) quitadas++;
    else fuera[k] = mapa[k];
  }
  return quitadas ? fuera : mapa; // sin cambios: se devuelve el mismo objeto
}

/**
 * Devuelve los mapas de estado sin ningun rastro de ese dia.
 *
 * No muta lo que recibe: devuelve objetos nuevos solo donde hubo algo que
 * quitar, para que React no repinte de mas.
 *
 * @param {object} estado mapas indexados por dayKey
 * @param {string} dayKey  p. ej. "1-3" (semana 1, jueves)
 * @returns {{ estado: object, habiaAlgo: boolean }}
 */
export function limpiarDia(estado, dayKey) {
  if (!estado || !dayKey) return { estado: estado || {}, habiaAlgo: false };

  const salida = { ...estado };
  for (const k of POR_DIA) salida[k] = sinEsteDia(estado[k], dayKey, false);
  for (const k of POR_DIA_CON_SUFIJO) salida[k] = sinEsteDia(estado[k], dayKey, true);

  const habiaAlgo = [...POR_DIA, ...POR_DIA_CON_SUFIJO].some(k => salida[k] !== estado[k]);
  return { estado: salida, habiaAlgo };
}

/** Cuantas cosas hay registradas hoy en ese dia. Sirve para no ofrecer
 *  "vaciar" cuando no hay nada que vaciar, y para decir cuanto se va a borrar. */
export function cuantoHayEn(estado, dayKey) {
  if (!estado || !dayKey) return 0;
  let n = 0;
  for (const k of POR_DIA) n += Object.keys(estado[k] || {}).filter(c => c === dayKey).length;
  for (const k of POR_DIA_CON_SUFIJO) n += Object.keys(estado[k] || {}).filter(c => esDelDia(c, dayKey)).length;
  return n;
}
