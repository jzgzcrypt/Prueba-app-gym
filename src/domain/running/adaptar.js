/**
 * EL PLAN SE AJUSTA A TUS PRUEBAS
 *
 * Las series del plan piden 4:45/km (4:35 los 400 m). Si la ultima prueba dice
 * que todavia no estas ahi, clavar 4:45 no te entrena: te revienta en la
 * segunda serie y te ensena a salir demasiado rapido. Lo que se hace, como en
 * cualquier plan serio, es correr las series al ritmo que te toca HOY segun
 * tu ultima prueba, y dejar que el siguiente test lo suba.
 *
 * Solo se ajusta hacia abajo: si la prueba dice que puedes ir mas rapido que
 * el plan, se mantiene el plan. Acelerar es cosa del siguiente test, no de una
 * cuenta. Y el dia del objetivo no se toca nunca: es 4:45.
 *
 *   Series de 400 m      ritmo de 3 km menos 5 s   (algo mas rapido que 3K)
 *   Series de 800 m o +  ritmo de 5 km             (el de "series largas")
 */
import { equivalente, leerTiempo } from "../progreso/libreta.js";

/** La ultima prueba cronometrada antes de un dia, ya leida. */
export function ultimaPrueba(antesDe, dias, ritmoReal) {
  let mejor = null;
  for (const d of dias || []) {
    const p = d.prueba;
    if (!p || !p.distKm || p.distKm === 7 || d.isoDate >= antesDe) continue;
    const total = leerTiempo((ritmoReal || {})[d.isoDate], p.distKm);
    if (!total) continue;
    if (!mejor || d.isoDate > mejor.isoDate) mejor = { isoDate: d.isoDate, titulo: d.titulo, date: d.date, distKm: p.distKm, total };
  }
  return mejor;
}

/**
 * El ritmo al que toca correr las series de un dia.
 * @returns {null | { ritmo:number, plan:number, ajustado:boolean, fuente:object|null }}
 */
export function ritmoDelDia(dia, dias, ritmoReal) {
  if (!dia || !dia.ritmo) return null;
  const plan = dia.ritmo;
  if (dia.tipo === "objetivo") return { ritmo: plan, plan, ajustado: false, fuente: null };
  const fuente = ultimaPrueba(dia.isoDate, dias, ritmoReal);
  if (!fuente) return { ritmo: plan, plan, ajustado: false, fuente: null };
  const derivado = (dia.tramoM || 1000) <= 400
    ? equivalente(fuente.distKm, fuente.total, 3) / 3 - 5
    : equivalente(fuente.distKm, fuente.total, 5) / 5;
  const ritmo = Math.max(plan, Math.round(derivado));
  return { ritmo, plan, ajustado: ritmo > plan, fuente };
}
