/**
 * IIFYM DE LA SEMANA: LO QUE TE PASAS UN DIA SE RECORTA EN LOS QUE QUEDAN.
 *
 * El dia cuadra con IIFYM; la semana, con esto. Se suma lo que te has pasado
 * (o quedado corto) en los dias ya cerrados de esta semana con algo apuntado,
 * y se reparte entre los que quedan hasta el domingo, hoy incluido.
 *
 * Con cuidado, porque recortar mal frena mas que pasarse:
 *  - la proteina no se toca nunca: sale de hidratos (70%) y grasa (30%);
 *  - como mucho 300 kcal al dia arriba o abajo, y nunca por debajo de 1.800;
 *  - la vispera de una prueba y el dia de la prueba no se recortan: se llega
 *    con el deposito lleno;
 *  - menos de 150 kcal de saldo no se mueve nada: es ruido;
 *  - lo que no quepa se queda sin compensar, y se dice sin drama.
 * Los dias sin nada apuntado no cuentan: no se sabe que comiste.
 *
 * Puro: sin React, se prueba sin navegador.
 */

import { TOPE } from "./adaptativo.js";
import { sumaDelDia } from "./pegar-ia.js";

export const CUADRE = { maxDia: 300, minimoSaldo: 150 };

/** Un dia que no se recorta: la vispera de una prueba o la prueba. */
const protegido = (d) => !!(d.vispera || d.tipo === "test" || d.tipo === "objetivo");

/**
 * El cuadre de la semana de `hoyIso`.
 * @param {object[]} dias  los 7 dias de la semana
 * @param {(d) => {kcal:number}} objetivoDe  el objetivo de cada dia (sin cuadre)
 * @returns {{ saldo:number, ajuste:number, restantes:number, sinCompensar:number, cerrados:number, ajusteDe:(d)=>number }}
 */
export function cuadreSemana({ dias, comidasLog, objetivoDe, hoyIso, claveDe = (d) => d.isoDate }) {
  let saldo = 0, cerrados = 0;
  for (const d of dias) {
    if (d.isoDate >= hoyIso) continue;
    const aps = (comidasLog || {})[claveDe(d)];
    if (!aps || !aps.filter(Boolean).length) continue;
    saldo += sumaDelDia(aps).kcal - objetivoDe(d).kcal;
    cerrados++;
  }
  saldo = Math.round(saldo);
  const quedan = dias.filter(d => d.isoDate >= hoyIso);
  // Para recortar no cuentan los dias protegidos; para sumar, si.
  const utiles = saldo > 0 ? quedan.filter(d => !protegido(d)) : quedan;
  let ajuste = 0;
  if (Math.abs(saldo) >= CUADRE.minimoSaldo && utiles.length) {
    ajuste = Math.round(-saldo / utiles.length / 10) * 10;
    ajuste = Math.max(-CUADRE.maxDia, Math.min(CUADRE.maxDia, ajuste));
  }
  // Lo que de verdad se puede mover: con el suelo de 1.800 algun dia recorta menos.
  let movido = 0;
  for (const d of utiles) movido += aplicarCuadre(objetivoDe(d), ajuste).kcal - objetivoDe(d).kcal;
  const sinCompensar = Math.abs(saldo) >= CUADRE.minimoSaldo ? Math.round(saldo + movido) : 0;
  const ids = new Set(utiles.map(d => d.isoDate));
  return {
    saldo, ajuste, restantes: utiles.length, sinCompensar, cerrados,
    ajusteDe: (d) => (ids.has(d.isoDate) ? ajuste : 0),
  };
}

/** Los macros de un dia con el cuadre: la proteina igual, el resto de hidratos y grasa. */
export function aplicarCuadre(macros, ajuste) {
  if (!ajuste) return macros;
  const kcal = Math.max(TOPE.minimo, macros.kcal + ajuste);
  const delta = kcal - macros.kcal;
  const grasa = Math.max(45, Math.round(macros.grasa + delta * 0.3 / 9));
  const hc = Math.max(0, Math.round((kcal - macros.prot * 4 - grasa * 9) / 4));
  return { kcal: Math.round(kcal), prot: macros.prot, hc, grasa };
}

/** La frase del cuadre, o null si no hay nada que cuadrar. */
export function textoCuadre(c) {
  if (!c || !c.ajuste) {
    if (c && Math.abs(c.sinCompensar) >= CUADRE.minimoSaldo && !c.restantes) return "Semana cerrada con " + signo(c.saldo) + " kcal. El lunes empieza de cero.";
    return null;
  }
  const n = c.restantes;
  const cuando = n === 1 ? "hoy" : "hoy y " + (n === 2 ? "mañana" : "los " + (n - 1) + " días que quedan");
  const base = c.saldo > 0
    ? "Esta semana llevas " + signo(c.saldo) + " kcal: " + cuando + ", " + Math.abs(c.ajuste) + " menos cada día."
    : "Esta semana te faltan " + Math.abs(c.saldo) + " kcal: " + cuando + ", " + c.ajuste + " más cada día.";
  const resto = Math.abs(c.sinCompensar) >= CUADRE.minimoSaldo
    ? " " + Math.abs(c.sinCompensar) + " kcal se quedan sin compensar: no pasa nada."
    : "";
  return base + " La proteína no se toca." + resto;
}

const signo = (n) => (n > 0 ? "+" : "−") + Math.abs(Math.round(n)).toLocaleString("es-ES");
