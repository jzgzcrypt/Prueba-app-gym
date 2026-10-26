/**
 * QUE RITMO ES "RPE 4-5/10" PARA TI.
 *
 * El plan dice el esfuerzo, pero corriendo lo que miras es el ritmo. Aqui se
 * traduce a una franja tuya, de lo mas fiable a lo menos:
 *
 *   series        el ritmo de las series, ajustado a tu ultima prueba
 *   prueba        el que va en linea con el objetivo
 *   suave/tirada  la media de tus 3 ultimos suaves (libreta o GPS); si no,
 *                 lo que sale de tu ultima prueba (5K + 75-100 s); si no, tu
 *                 prueba de partida
 *
 * RPE 3 o menos: la franja, algo mas lenta. En vuelta tras un paron: +10 s.
 * Sin ningun dato tuyo no se inventa: "a ritmo de poder hablar".
 *
 * Puro: sin React, se prueba sin navegador.
 */
import { ritmoDelDia, ultimaPrueba } from "./adaptar.js";
import { ritmoDePrueba } from "./objetivo.js";
import { parseRitmoToSeconds } from "./ritmo.js";
import { equivalente, leerRitmo, textoTiempo } from "../progreso/libreta.js";

/** El ritmo de lo apuntado: "7:16/km", o "25:03 · 3,45 km" (tiempo y distancia). */
function ritmoDeTexto(t) {
  const r = leerRitmo(t);
  if (r) return r;
  const m = /(\d+):(\d{2})\D+(\d+(?:[.,]\d+)?)\s*km/i.exec(String(t || ""));
  if (!m) return null;
  const km = Number(m[3].replace(",", "."));
  return km > 0 ? Math.round((Number(m[1]) * 60 + Number(m[2])) / km) : null;
}

/** Tus ultimos suaves antes de un dia: de la libreta ("6:40/km") o del GPS. */
function ultimosSuaves(dias, ritmoReal, gps, antesDe, cuantos = 3) {
  const out = [];
  for (const d of [...(dias || [])].reverse()) {
    if (d.isoDate >= antesDe || d.cat !== "runZ2" || d.intervalos) continue;
    const txt = (ritmoReal || {})[d.isoDate];
    let s = txt && /\/km/.test(txt) ? parseRitmoToSeconds(txt) : null;
    const g = (gps || {})[d.isoDate];
    if (!s && g && g.m >= 1000 && g.seg > 0) s = Math.round(g.seg / g.m * 1000);
    if (s && s > 240 && s < 600) out.push(s);
    if (out.length >= cuantos) break;
  }
  return out;
}

const franja = (a, b) => textoTiempo(a) + "–" + textoTiempo(b) + "/km";

/**
 * @returns {null | { desde:number, hasta:number, texto:string, fuente:string }}
 *   null si el dia no es de correr. Sin datos: desde/hasta null y texto
 *   "a ritmo de poder hablar".
 */
export function ritmoEsperado({ day, dias, ritmoReal, gps }) {
  if (!day || !/^(run|test|objetivo)$/.test(day.tipo || "")) return null;
  const vuelta = day.ajuste && /de vuelta/.test(day.ajuste.motivo || "") ? 10 : 0;

  if (day.ritmo && (day.intervalos || day.tipo === "objetivo")) {
    const aj = ritmoDelDia(day, dias, ritmoReal);
    const r = aj ? aj.ritmo : day.ritmo;
    return { desde: r - 3, hasta: r + 3, texto: textoTiempo(r) + "/km en las series",
             fuente: aj && aj.ajustado ? "ajustado a tu última prueba" : "el del plan" };
  }
  const rp = ritmoDePrueba(day);
  if (rp) return { desde: rp - 5, hasta: rp + 5, texto: "~" + textoTiempo(rp) + "/km", fuente: "el que va en línea con el objetivo" };

  // Suave o tirada: tu suave de verdad.
  let centro = null, fuente = "";
  const suaves = ultimosSuaves(dias, ritmoReal, gps, day.isoDate);
  if (suaves.length) {
    centro = Math.round(suaves.reduce((a, b) => a + b, 0) / suaves.length);
    fuente = suaves.length === 1 ? "de tu último suave" : "de tus " + suaves.length + " últimos suaves";
  } else {
    const p = ultimaPrueba(day.isoDate, dias, ritmoReal);
    if (p) {
      const cinco = equivalente(p.distKm, p.total, 5) / 5;
      centro = Math.round(cinco + 88);
      fuente = "de tu prueba de " + String(p.distKm).replace(".", ",") + " km";
    } else {
      const partida = (dias || []).find(d => d.prueba && d.prueba.partida && d.isoDate < day.isoDate && (ritmoReal || {})[d.isoDate]);
      const r = partida ? ritmoDeTexto(ritmoReal[partida.isoDate]) : null;
      if (r) { centro = r; fuente = "de tu prueba de partida"; }
    }
  }
  if (!centro) return { desde: null, hasta: null, texto: "a ritmo de poder hablar", fuente: "aún no hay carreras tuyas apuntadas" };

  const rpe = parseInt(String(day.rpe || ""), 10);
  let [a, b] = rpe && rpe <= 3 ? [centro, centro + 20] : [centro - 10, centro + 15];
  a += vuelta; b += vuelta;
  return { desde: a, hasta: b, texto: franja(a, b), fuente: fuente + (vuelta ? ", +10 s por la vuelta" : "") };
}
