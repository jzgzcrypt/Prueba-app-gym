/**
 * ME LA HE SALTADO: DONDE VA AHORA.
 *
 * Saltarse una sesion clave (la tirada, la calidad, una prueba) no se arregla
 * metiendola en cualquier hueco: un dia mal elegido estropea tambien la
 * sesion de al lado. Aqui se busca el mejor sitio con las reglas de un
 * entrenador, y si no lo hay se dice que se deje pasar.
 *
 *  1. Lo importante manda: una prueba, la calidad o la tirada pueden quitarle
 *     el sitio a un suave, a la fuerza o a un dia libre. Un suave saltado no
 *     se recupera: se deja pasar. La fuerza solo va a un dia libre.
 *  2. Dos dias intensos (prueba, calidad, tenis) nunca seguidos. La tirada no
 *     va justo antes de un dia intenso (se llega con las piernas cargadas),
 *     pero si puede ir despues del tenis.
 *  3. Como mucho 3 dias despues de la que te saltaste. Puede pasar a la semana
 *     siguiente si respeta lo anterior.
 *  4. Si no cabe, se deja pasar: mejor perderla que cargar la semana.
 *
 * Puro: sin React, se prueba sin navegador.
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Que clase de sesion es un dia. */
export function claseDe(d) {
  if (!d) return "nada";
  if (d.tipo === "test" || d.tipo === "objetivo") return "prueba";
  if (d.tipo === "compromiso") return "tenis";
  if (d.tipo === "libre") return "libre";
  if (d.tipo === "fuerza") return "fuerza";
  if (d.esCalidad || d.intervalos && d.ritmo) return "calidad";
  if (d.tipo === "run" && (d.dayIdx === 6 || /tirada/i.test(d.titulo || ""))) return "tirada";
  if (d.tipo === "run") return "suave";
  return "nada";
}
const INTENSA = new Set(["prueba", "calidad", "tenis"]);
const CLAVE = new Set(["prueba", "calidad", "tirada"]);
/** "de el suave" → "del suave". */
const de = (txt) => (txt.startsWith("el ") ? "del " + txt.slice(3) : "de " + txt);
const NOMBRE = { prueba: "la prueba", calidad: "la calidad", tirada: "la tirada", suave: "el suave", fuerza: "la fuerza", libre: "el día libre", tenis: "el tenis" };
/** Cuanto cuesta quitarle el sitio a cada cosa (menos es mejor). */
const COSTE_CEDER = { libre: 0, suave: 1, fuerza: 3 };

export const esClave = (d) => CLAVE.has(claseDe(d));
export const nombreDe = (d) => NOMBRE[claseDe(d)] || "la sesión";

/** El nombre del dia como se dice: "el martes 13". */
export function diaHablado(d) {
  const f = new Date(d.isoDate + "T12:00:00");
  return "el " + DIAS[f.getDay()] + " " + f.getDate();
}

/**
 * Lo que toca de verdad cada dia con lo ya movido: { [iso]: dia | null }.
 * Un dia que cede su sitio o deja pasar lo suyo queda vacio; uno que recibe
 * una sesion pasa a tener esa.
 */
function efectivo(dias, movidas) {
  const m = movidas || {};
  const porIso = Object.fromEntries(dias.map(d => [d.isoDate, d]));
  const out = {};
  for (const d of dias) out[d.isoDate] = m[d.isoDate] ? null : d;
  for (const [origen, destino] of Object.entries(m)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(destino) && porIso[origen]) out[destino] = porIso[origen];
  }
  return out;
}

/**
 * Donde va una sesion saltada.
 * @param {object} dia     el dia saltado (del plan)
 * @param {object[]} dias  todos los dias del bloque (FLAT_DAYS), consecutivos
 * @param {object} movidas lo ya movido (origen -> destino | "cede:origen" | "pasa")
 * @param {object} checked lo hecho
 * @param {string} hoyIso
 * @returns {{ opciones: {dia:object, cede:object|null, texto:string}[], mejor: object|null, motivo: string }}
 */
export function proponerHueco({ dia, dias, movidas, checked, hoyIso }) {
  const clase = claseDe(dia);
  if (clase === "suave") return { opciones: [], mejor: null, motivo: "Un suave saltado no se recupera: se deja pasar y sigues con lo siguiente." };
  if (clase === "tenis" || clase === "libre" || clase === "nada") return { opciones: [], mejor: null, motivo: "No hay nada que recolocar." };
  const i0 = dias.findIndex(d => d.isoDate === dia.isoDate);
  if (i0 < 0) return { opciones: [], mejor: null, motivo: "" };
  const ef = efectivo(dias, movidas);
  const ch = checked || {};
  const recibe = new Set(Object.values(movidas || {}).filter(v => /^\d{4}/.test(v)));
  const intensa = (iso) => INTENSA.has(claseDe(ef[iso]));
  const opciones = [];
  for (let k = 1; k <= 3; k++) {
    const c = dias[i0 + k];
    if (!c || c.isoDate < hoyIso) continue;
    if (ch[c.isoDate] || recibe.has(c.isoDate)) continue;
    const ocupa = ef[c.isoDate];
    const claseOcupa = ocupa ? claseDe(ocupa) : "libre";
    if (!(claseOcupa in COSTE_CEDER)) continue;              // no se pisa otra clave ni el tenis
    if (clase === "fuerza" && claseOcupa !== "libre") continue; // la fuerza solo va a un hueco libre
    const antes = dias[i0 + k - 1], despues = dias[i0 + k + 1];
    const antesIntensa = antes && antes.isoDate !== dia.isoDate && intensa(antes.isoDate);
    const despuesIntensa = despues && intensa(despues.isoDate);
    if (INTENSA.has(clase) && (antesIntensa || despuesIntensa)) continue;
    if (clase === "tirada" && despuesIntensa) continue;
    const coste = k * 10 + COSTE_CEDER[claseOcupa];
    const cede = ocupa && claseOcupa !== "libre" ? ocupa : null;
    const texto = diaHablado(c).replace(/^el /, "El ") + ": " +
      (cede ? nombreDe(dia) + " ocupa el sitio " + de(nombreDe(cede)) + ", que se queda fuera." : "es un hueco libre.");
    opciones.push({ dia: c, cede, texto, coste });
  }
  opciones.sort((a, b) => a.coste - b.coste);
  const limpias = opciones.map(({ dia: d, cede, texto }) => ({ dia: d, cede, texto }));
  if (!limpias.length && clase === "fuerza") {
    return { opciones: [], mejor: null, motivo: "La fuerza solo va a un día libre y no hay ninguno en los próximos 3 días. Mejor dejarla pasar." };
  }
  if (!limpias.length) {
    return { opciones: [], mejor: null, motivo: "No cabe en los próximos 3 días sin pisar otra sesión clave o juntar dos días duros. Mejor dejarla pasar que cargar la semana." };
  }
  const m = limpias[0];
  return { opciones: limpias, mejor: m,
    motivo: "Mejor " + diaHablado(m.dia) + ": " + (m.cede ? nombreDe(dia) + " ocupa el sitio " + de(nombreDe(m.cede)) + ", que se queda fuera." : "es un hueco libre.") };
}

/**
 * Aplica una opcion: la sesion va a `destino` y, si `cede`, la de ese dia sale.
 * Devuelve el nuevo mapa de movidas.
 */
export function recolocar(movidas, origen, destino, cede) {
  // Si ya estaba movida (una sesion recibida que tampoco se hizo), primero
  // se deshace lo anterior: nada queda colgando.
  const m = deshacer(movidas, origen);
  m[origen] = destino;
  if (cede) m[destino] = "cede:" + origen;
  return m;
}

/** Dejarla pasar: queda apuntado que fue a proposito (ya no avisa). */
export function dejarPasar(movidas, origen) {
  return { ...deshacer(movidas, origen), [origen]: "pasa" };
}

/** Deshacer lo hecho con una sesion: vuelve a su dia y libera el que cedio. */
export function deshacer(movidas, origen) {
  const m = { ...(movidas || {}) };
  const destino = m[origen];
  delete m[origen];
  if (destino && m[destino] === "cede:" + origen) delete m[destino];
  return m;
}

/**
 * La sesion de ayer que falta por resolver, o null: no hecha, ni movida, ni
 * dejada pasar. Una clave se recoloca; de las demas (suave, fuerza, tenis) se
 * pregunta si la hiciste y, si no, se deja pasar o se mueve.
 */
export function pendienteDeRecolocar({ dias, movidas, checked, hoyIso }) {
  const i = dias.findIndex(d => d.isoDate === hoyIso);
  if (i <= 0) return null;
  const ayer = dias[i - 1];
  const m = movidas || {};
  // Una sesion que llego movida a ayer y no se hizo, tambien cuenta.
  const llegada = Object.keys(m).filter(o => m[o] === ayer.isoDate && !(checked || {})[o])
    .map(o => dias.find(d => d.isoDate === o)).filter(Boolean)
    .find(d => ["prueba", "calidad", "tirada", "suave", "fuerza", "tenis"].includes(claseDe(d)));
  if (llegada) return llegada;
  if (["prueba", "calidad", "tirada", "suave", "fuerza", "tenis"].includes(claseDe(ayer)) && !(checked || {})[ayer.isoDate] && !m[ayer.isoDate]) return ayer;
  return null;
}
