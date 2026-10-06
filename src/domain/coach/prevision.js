/**
 * LO QUE DICE EL COACH: COMO LLEGAS AL 6 DE DICIEMBRE.
 *
 * Una frase y un numero. El numero es la prevision de tu 7K el dia del
 * objetivo: tu ultimo dato (prueba o series, pasado a 7K) comparado con lo que
 * el plan espera a esas alturas (plan-vs-real.js), y esa misma distancia
 * llevada al final. Es deliberadamente simple: si vas 40 s por detras del
 * plan, se preve que llegas 40 s por detras. Ni optimista ni catastrofista;
 * cada prueba la corrige.
 *
 * Puro: sin React, se prueba sin navegador.
 */

import { OBJETIVO_7K, textoTiempo } from "../progreso/libreta.js";
import { tuContraElPlan } from "../progreso/plan-vs-real.js";

const ritmoDe = (seg7k) => { const s = Math.round(seg7k / 7); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const dif = (s) => { const a = Math.abs(Math.round(s)); return a >= 60 ? Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0") : a + " s"; };

/**
 * La prevision para el dia del objetivo.
 * @returns {null | { seg:number, texto:string, ritmo:string, diferencia:number, base:"prueba"|"series", ultimo:object, puntos:object[], linea:object[] }}
 */
export function prevision(dias, ritmoReal) {
  const t = tuContraElPlan(dias, ritmoReal);
  if (!t.ultimo || t.diferencia == null) return null;
  const seg = Math.round(OBJETIVO_7K + t.diferencia);
  return { seg, texto: textoTiempo(seg), ritmo: ritmoDe(seg), diferencia: Math.round(t.diferencia),
           base: t.ultimo.tipo, ultimo: t.ultimo, puntos: t.puntos, linea: t.linea };
}

/** La frase del coach. `proxima`: la proxima prueba (dia) si no hay datos aun. */
export function veredictoCoach(prev, proxima) {
  if (!prev) {
    return { tono: "neutro", texto: proxima
      ? "Aún sin pruebas. El " + proxima.prueba.distKm + " km del " + proxima.date + " da la primera previsión: hasta entonces, cumplir es lo único que cuenta."
      : "Aún sin datos para prever el 7K." };
  }
  const d = prev.diferencia;
  if (Math.abs(d) <= 5) return { tono: "bien", texto: "Vas en el plan: el 6 de diciembre, 7 km en " + prev.texto + "." };
  if (d < 0) return { tono: "bien", texto: "Vas " + dif(d) + " por delante del plan. Con esto, 7 km en " + prev.texto + " (" + prev.ritmo + "/km)." };
  if (d <= 60) return { tono: "ojo", texto: "Un poco por detrás (" + dif(d) + "). Es recuperable: hoy llegarías en " + prev.texto + " (" + prev.ritmo + "/km)." };
  return { tono: "ojo", texto: "Por detrás del plan (" + dif(d) + "): hoy llegarías en " + prev.texto + ". El 5 km del 15 de noviembre decide si se mantiene la fecha." };
}

/** En que se basa la prevision, en frases cortas. */
export function porQue(prev) {
  const base = [
    "La línea del plan sale de sus propias pruebas: 3 km en 14:30 en la semana 4, 5 km en 23:30 en la 8 y 7 km en 33:15 el 6 de diciembre.",
    "Cada prueba se pasa a lo que harías en 7 km (fórmula de Riegel, la que usan las calculadoras de carrera).",
    "Las series cuentan menos: su ritmo se lee como tu ritmo de 5 km y se pinta hueco, como estimación.",
  ];
  if (!prev) return base;
  const u = prev.ultimo;
  return [
    "Tu último dato: " + (u.tipo === "prueba" ? "prueba de " + u.dia.prueba.distKm + " km en " + u.texto : "series a " + u.texto) +
      " (" + u.dia.date + "), que equivale a 7 km en " + textoTiempo(u.seg) + ". El plan esperaba " + textoTiempo(u.plan) + " a esas alturas.",
    "Se supone que mantienes esa distancia con el plan hasta el final: " + textoTiempo(OBJETIVO_7K) + (prev.diferencia >= 0 ? " + " : " − ") + dif(prev.diferencia) + " = " + prev.texto + ".",
    ...base,
  ];
}

/**
 * Riesgos: las alarmas del parte (sesion clave sin hacer, molestias,
 * estancado) y, si la prevision va mas de un minuto por detras, eso.
 * @returns {{ texto:string, accion:string }[]}
 */
export function riesgos({ alarmas, prev }) {
  const out = (alarmas || []).map(a => ({ texto: a.texto, accion: a.accion }));
  if (prev && prev.diferencia > 60) {
    out.push({ texto: "La previsión va " + dif(prev.diferencia) + " por detrás del objetivo.",
               accion: "Prioriza jueves (calidad) y domingo (tirada): son las que más mueven el 7K. Lo demás, si puedes." });
  }
  return out;
}

/**
 * Los hitos del bloque: las pruebas y el objetivo, con su resultado o lo que
 * falta. estado: "hecho" | "proximo" (el siguiente sin hacer) | "futuro".
 */
export function hitos(dias, ritmoReal, hoyIso) {
  const rr = ritmoReal || {};
  let proximoMarcado = false;
  return dias.filter(d => d.prueba).map(d => {
    const r = rr[d.isoDate];
    let estado = r ? "hecho" : "futuro";
    if (!r && !proximoMarcado && d.isoDate >= hoyIso) { estado = "proximo"; proximoMarcado = true; }
    const nombre = d.prueba.partida ? "Prueba de partida" : d.tipo === "objetivo" ? "El día: 7 km" : d.prueba.distKm + " km a tope";
    const meta = d.prueba.enLinea ? "en línea: " + textoTiempo(d.prueba.enLinea) + " o menos"
      : d.prueba.decide ? "23:30 o menos mantiene la fecha" : d.tipo === "objetivo" ? "33:15 (4:45/km)" : "tu punto de partida";
    return { iso: d.isoDate, fecha: d.date, semana: d.weekN, nombre, estado, resultado: r || null, meta };
  });
}
