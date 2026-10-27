/**
 * AHORA TOCA: UNA COSA CADA VEZ.
 *
 * HOY abria con todo a la vez. Aqui se decide que es lo de ahora, segun la
 * hora y lo que ya has hecho, y que viene despues. Si se te paso algo, no hay
 * reproche: se pasa a lo siguiente que aun tiene sentido.
 *
 *   mañana (antes de las 12)   cuello al lavarte los dientes · pesarte
 *   tarde (desde las 16)       zapatillas puestas y la sesion
 *   despues de la sesion       cuello despues de la ducha
 *   noche (desde las 21)       apuntar lo que has comido · cuello al acostarte
 *   todo hecho                 si te apetece, magia o guerrero (extras)
 *
 * Puro: sin React, se prueba sin navegador.
 */

/**
 * @param {object} p
 * @param {number} p.hora          0-23
 * @param {object} p.day           el dia (ya con la prueba aplicada)
 * @param {boolean} p.sesionHecha
 * @param {{m:boolean,t:boolean,n:boolean}} p.cuello
 * @param {boolean} p.pesado       peso de hoy apuntado
 * @param {boolean} p.comidaApuntada
 * @param {string[]} [p.noHechas] ids que dijiste que hoy no haces: se saltan
 * @param {boolean} [p.sesionNo] la sesion se dejo pasar (cuenta como resuelta, no como hecha)
 * @returns {{ ahora: {id,titulo,sub,accion}, despues: {id,titulo}[], dia: {id,titulo,estado}[] }}
 */
/** Todo lo del dia, sin mirar la hora: { id, titulo, estado: "hecho"|"no"|"pendiente" }. */
function todoElDia({ day, sesionHecha, sesionNo, sesionMovida, cuello, pesado, comidaApuntada, no }) {
  const c = cuello || {};
  const out = [];
  if (day && day.tipo !== "libre") {
    const titulo = day.tipo === "compromiso" ? "Tenis" : day.tipo === "fuerza" ? "Fuerza" : day.tipo === "run" ? "Correr" : "Prueba";
    out.push({ id: "sesion", titulo, estado: sesionMovida ? "movida" : sesionHecha ? (sesionNo ? "no" : "hecho") : "pendiente" });
  }
  const cuelloNo = ["cuello-m", "cuello-t", "cuello-n"].every(k => no.has(k));
  out.push({ id: "cuello", titulo: "Cuello", estado: c.m || c.t || c.n ? "hecho" : cuelloNo ? "no" : "pendiente" });
  out.push({ id: "peso", titulo: "Pesarte", estado: pesado ? "hecho" : no.has("peso") ? "no" : "pendiente" });
  out.push({ id: "comida", titulo: "Comida", estado: comidaApuntada ? "hecho" : no.has("comida") ? "no" : "pendiente" });
  return out;
}

export function ahoraToca({ hora, day, sesionHecha, sesionNo = false, sesionMovida = false, cuello, pesado, comidaApuntada, noHechas = [] }) {
  const hay = day && day.tipo !== "libre";
  const esTenis = day && day.tipo === "compromiso";
  const lista = [];
  const c = cuello || {};
  const algunCuello = c.m || c.t || c.n;
  if (hora < 12) {
    if (!c.m) lista.push({ id: "cuello-m", titulo: "Cuello", sub: "Al lavarte los dientes. 2 minutos.", accion: "cuello" });
    if (!pesado) lista.push({ id: "peso", titulo: "Pésate", sub: "En ayunas, antes del desayuno.", accion: "peso" });
  }
  if (hay && !sesionHecha && hora < 22) {
    const esFuerza = day.tipo === "fuerza";
    lista.push(esTenis
      ? { id: "sesion", titulo: "Tenis a las 20:00", sub: "Cuenta como la sesión de hoy.", accion: "sesion" }
      : esFuerza
      ? { id: "sesion", titulo: hora >= 16 ? "Primera serie" : "Hoy: " + day.titulo, icono: "mancuerna",
          sub: hora >= 16 ? day.titulo + ". Solo haz la primera serie: lo demás viene solo." : "A partir de las 16:00, al llegar a casa.", accion: "sesion" }
      : { id: "sesion", titulo: hora >= 16 ? "Zapatillas puestas" : "Hoy: " + day.titulo, sub: hora >= 16 ? day.titulo + ". Solo ponte las zapatillas: lo demás viene solo." : "A partir de las 16:00, al llegar a casa.", accion: "sesion" });
  }
  if (!c.t && hora >= 12) lista.push({ id: "cuello-t", titulo: "Cuello", sub: algunCuello ? "Después de la ducha. 2 minutos." : "Después de la ducha. Con esta ya cuenta el día.", accion: "cuello" });
  if (hora >= 21 && !comidaApuntada) lista.push({ id: "comida", titulo: "Apunta lo que has comido", sub: "Mis comidas o pegar de tu IA. 1 minuto.", accion: "comida" });
  if (hora >= 21 && !c.n) lista.push({ id: "cuello-n", titulo: "Cuello", sub: "Al acostarte. 2 minutos.", accion: "cuello" });
  const no = new Set(noHechas);
  const pendientes = lista.filter(x => !no.has(x.id));
  const dia = todoElDia({ day, sesionHecha, sesionNo, sesionMovida, cuello, pesado, comidaApuntada, no });
  if (!pendientes.length) {
    return { ahora: { id: "extras", titulo: "Todo lo de hoy, hecho", sub: "Si te apetece: 5 min de magia en el sofá en vez del móvil, o la respiración de guerrero.", accion: "extras" }, despues: [], dia };
  }
  return { ahora: pendientes[0], despues: pendientes.slice(1, 3).map(({ id, titulo }) => ({ id, titulo })), dia };
}
