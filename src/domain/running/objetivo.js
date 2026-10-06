/**
 * QUE TOCA HOY EN UN RODAJE, Y COMO SE DICE MIENTRAS CORRES.
 *
 * En un rodaje el plan dice "16 min corriendo muy suave" dentro de una
 * sesion de 22 min (con calentamiento y estiramientos). Aqui se saca lo que
 * hay que correr, para contarlo hacia atras y avisar al acabar; los avisos de
 * la cuenta atras; y la frase de cada km, comparada con el objetivo del dia
 * o, en los dias suaves, con tu suave de siempre (ir rapido un dia suave no
 * es mejor: es no recuperar).
 *
 * Puro: sin React, se prueba sin navegador.
 */

import { parseRitmoToSeconds } from "./ritmo.js";

/**
 * Lo que hay que correr en un rodaje continuo, leido del principio de `what`:
 * "16 min corriendo muy suave, pudiendo hablar." → { tipo:"min", seg:960,
 * texto:"16 min corriendo muy suave, pudiendo hablar", resto:null };
 * "10 min suave + 4x100m progresivos." → resto "4x100m progresivos";
 * "5 km muy suave." → { tipo:"km", m:5000 }. null en series, pruebas o si no se entiende.
 */
export function objetivoCarrera(day) {
  if (!day || day.intervalos || day.prueba || !/^(run|objetivo)$/.test(day.tipo || "")) return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(min|km)\b([^.+]*)(?:\+\s*([^.]+))?/i.exec(day.what || "");
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  const texto = (m[1] + " " + m[2] + m[3]).replace(/\s+/g, " ").trim().replace(/,$/, "");
  const resto = m[4] ? m[4].trim() : null;
  return m[2].toLowerCase() === "min"
    ? { tipo: "min", seg: Math.round(n * 60), texto, resto }
    : { tipo: "km", m: Math.round(n * 1000), texto, resto };
}

/** "16 minutos", "1 minuto", "5 kilómetros" — como se dice en voz alta. */
export function objetivoHablado(obj) {
  if (!obj) return "";
  if (obj.tipo === "km") { const k = obj.m / 1000; return String(k).replace(".", ",") + (k === 1 ? " kilómetro" : " kilómetros"); }
  const min = Math.round(obj.seg / 60);
  return min + (min === 1 ? " minuto" : " minutos");
}

/**
 * Los avisos de la cuenta atras que se cruzan al pasar de `antes` a `ahora`,
 * con `total` el objetivo. En segundos: mitad (si dura 6 min o mas), ultimo
 * minuto (si dura 3 o mas), 3-2-1 y hecho. En metros (`enMetros`): mitad y
 * ultimo kilometro (desde 2 km) y hecho.
 * @returns {{ id:string, texto:string, fin?:boolean }[]}
 */
export function avisosCuentaAtras(total, antes, ahora, enMetros = false) {
  if (!total || ahora <= antes) return [];
  const marcas = [];
  if (enMetros) {
    if (total >= 2000) marcas.push({ en: total / 2, id: "mitad", texto: "Mitad hecha." });
    if (total >= 2000) marcas.push({ en: total - 1000, id: "ultimo", texto: "Último kilómetro." });
  } else {
    if (total >= 360) marcas.push({ en: total / 2, id: "mitad", texto: "Mitad hecha." });
    if (total >= 180) marcas.push({ en: total - 60, id: "ultimo", texto: "Último minuto." });
    for (const n of [3, 2, 1]) marcas.push({ en: total - n, id: "c" + n, texto: ["", "Uno", "Dos", "Tres"][n] });
  }
  marcas.push({ en: total, id: "fin", texto: "", fin: true });
  return marcas.filter(x => x.en > antes && x.en <= ahora).map(({ id, texto, fin }) => (fin ? { id, texto, fin } : { id, texto }));
}

/** La frase del final: "¡Hecho! 16 minutos. Ahora 4x100m progresivos." */
export function fraseFin(obj) {
  if (!obj) return "¡Hecho!";
  return "¡Hecho! " + objetivoHablado(obj) + "." + (obj.resto ? " Ahora " + obj.resto + "." : " Ya puedes parar.");
}

/** "6 42" para la voz. */
const hablado = (seg) => { const r = Math.round(seg), m = Math.floor(r / 60), s = r % 60; return m + " " + (s === 0 ? "en punto" : String(s).padStart(2, "0")); };
const segundos = (n) => n + (n === 1 ? " segundo" : " segundos");

/**
 * Lo que se dice al cerrar cada km. `objetivo`: ritmo (s/km) con el que
 * comparar, o null. `suave`: true si el objetivo es tu suave de siempre.
 */
export function vozDelKm({ km, segKm, objetivo, suave = false }) {
  const base = "Kilómetro " + km + " en " + hablado(segKm) + ".";
  if (!objetivo) return base;
  const dif = Math.round(segKm - objetivo);
  if (suave) {
    if (dif < -20) return base + " " + segundos(-dif) + " más rápido que tu suave: suelta un poco, hoy es para recuperar.";
    if (dif < -8) return base + " Algo más rápido que tu suave: bien si puedes hablar.";
    if (dif > 30) return base + " Más tranquilo que tu suave. Bien si es lo que pide el cuerpo.";
    return base + " Dentro de tu suave.";
  }
  if (Math.abs(dif) <= 5) return base + " En el objetivo.";
  return base + " " + segundos(Math.abs(dif)) + (dif < 0 ? " más rápido" : " más lento") + " que el objetivo.";
}

/**
 * Tu suave de siempre (s/km): la media de tus ultimos `cuantos` rodajes
 * suaves continuos apuntados antes de `antesDe`. null si no hay ninguno.
 */
export function suaveHabitual({ dias, ritmoReal, antesDe, cuantos = 3, claveDe = (d) => d.isoDate }) {
  const ritmos = [];
  for (const d of [...(dias || [])].reverse()) {
    if (d.isoDate >= antesDe || d.cat !== "runZ2" || d.intervalos) continue;
    const v = (ritmoReal || {})[claveDe(d)];
    if (!v || !/\/km/.test(v)) continue;
    const s = parseRitmoToSeconds(v);
    if (s && s > 240 && s < 600) ritmos.push(s);
    if (ritmos.length >= cuantos) break;
  }
  return ritmos.length ? Math.round(ritmos.reduce((a, b) => a + b, 0) / ritmos.length) : null;
}
