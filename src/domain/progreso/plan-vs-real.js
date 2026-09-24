/**
 * TU CONTRA EL PLAN
 *
 * Una sola pregunta: ¿voy segun plan? Se responde en la unidad del objetivo,
 * el 7K. Cada dato que apuntas se convierte en el 7K que harias hoy, y se
 * compara con el que el plan espera a esas alturas.
 *
 * La linea del plan sale de los propios umbrales del plan, no de una curva
 * inventada: el 3 km de S4 en linea (14:30), el 5 km de S8 que mantiene la
 * fecha (23:30) y el objetivo (33:15), todos pasados a 7K. Antes de S4 se
 * prolonga con la misma pendiente.
 *
 * Los puntos reales salen de:
 *   pruebas   el tiempo, pasado a 7K (formula de Riegel). Es el dato bueno.
 *   series    su ritmo medio, leido como ritmo de 5 km (400 m: de 3 km menos
 *             5 s), la misma equivalencia con la que se ajustan las series
 *             (running/adaptar.js). Es una estimacion: se pinta hueca.
 */
import { DECIDE_FECHA, OBJETIVO_7K, equivalente, equivalente7k, leerRitmo, leerTiempo } from "./libreta.js";

/** Posicion de un dia en el eje: semana + fraccion de semana. */
export const posicion = (d) => d.weekN + d.dayIdx / 7;

/** La linea del plan: [{x, seg}] ordenada. */
export function lineaPlan(dias) {
  const s4 = dias.find(d => d.prueba && d.prueba.enLinea);
  const s8 = dias.find(d => d.prueba && d.prueba.decide);
  const obj = dias.find(d => d.tipo === "objetivo");
  if (!s4 || !s8 || !obj) return [];
  const a = { x: posicion(s4), seg: equivalente7k(s4.prueba.distKm, s4.prueba.enLinea) };
  const b = { x: posicion(s8), seg: equivalente7k(s8.prueba.distKm, DECIDE_FECHA[0].hasta) };
  const c = { x: posicion(obj), seg: OBJETIVO_7K };
  const pendiente = (b.seg - a.seg) / (b.x - a.x);
  const inicio = { x: 1, seg: Math.round(a.seg - pendiente * (a.x - 1)) };
  return [inicio, a, b, c];
}

/** Lo que el plan espera en una posicion del eje. */
export function planEn(x, linea) {
  if (!linea.length) return null;
  if (x <= linea[0].x) return linea[0].seg;
  for (let i = 1; i < linea.length; i++) {
    const p = linea[i - 1], q = linea[i];
    if (x <= q.x) return Math.round(p.seg + (q.seg - p.seg) * (x - p.x) / (q.x - p.x));
  }
  return linea[linea.length - 1].seg;
}

/** Los puntos reales: pruebas y series apuntadas, ya en 7K. */
export function puntosReales(dias, ritmoReal) {
  const rr = ritmoReal || {};
  const out = [];
  for (const d of dias) {
    const texto = rr[d.isoDate];
    if (!texto) continue;
    if (d.prueba && d.prueba.distKm) {
      const total = leerTiempo(texto, d.prueba.distKm);
      if (total) out.push({ x: posicion(d), seg: equivalente7k(d.prueba.distKm, total), tipo: "prueba", dia: d, texto });
    } else if (d.ritmo && d.tramoM) {
      const p = leerRitmo(texto);
      if (!p) continue;
      const seg = d.tramoM <= 400 ? equivalente(3, (p + 5) * 3, 7) : equivalente(5, p * 5, 7);
      out.push({ x: posicion(d), seg, tipo: "series", dia: d, texto });
    }
  }
  return out.sort((a, b) => a.x - b.x);
}

/**
 * Todo junto: la linea del plan, tus puntos y la conclusion.
 * diferencia: segundos respecto al plan en tu ultimo dato. Negativo = por
 * delante (tu 7K es mas rapido de lo que el plan espera a esas alturas).
 */
export function tuContraElPlan(dias, ritmoReal) {
  const linea = lineaPlan(dias);
  const puntos = puntosReales(dias, ritmoReal).map(p => ({ ...p, plan: planEn(p.x, linea) }));
  const ultimo = puntos.at(-1) || null;
  return { linea, puntos, ultimo, diferencia: ultimo ? ultimo.seg - ultimo.plan : null };
}

/** "25 s por delante del plan", "1:10 por detrás del plan", "Justo en el plan". */
export function textoDiferencia(dif) {
  if (dif == null) return null;
  const a = Math.abs(Math.round(dif));
  if (a <= 5) return "Justo en el plan";
  const t = a >= 60 ? Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0") : a + " s";
  return t + (dif < 0 ? " por delante del plan" : " por detrás del plan");
}
