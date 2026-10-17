/**
 * LA SESION, APUNTADA EN TU CALENDARIO.
 *
 * Como hace Runna con Strava, pero sin servidor: al acabar, un enlace abre
 * Google Calendar con el evento ya relleno (hora real, distancia, tiempo,
 * ritmo o las series) y tu le das a Guardar.
 *
 * Puro: sin React, se prueba sin navegador.
 */

const mmss = (s) => {
  const t = Math.round(s), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), r = t % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(r).padStart(2, "0");
};
/** "35 min" → 35. */
const minutosDe = (dur) => { const n = parseInt(String(dur || ""), 10); return Number.isFinite(n) && n > 0 ? n : 45; };

/**
 * @param {object} p
 * @param {object} p.day     el dia del plan
 * @param {object} [p.gps]   lo que midio el GPS: { m, seg, cadencia, ruta: { t0 } }
 * @param {{nombre:string, texto:string}[]} [p.series] fuerza: cada ejercicio con sus series ya en texto
 * @param {number} p.ahora   ms (fin de la sesion si no hay GPS)
 * @returns {{ titulo:string, inicio:Date, fin:Date, detalles:string }}
 */
export function eventoSesion({ day, gps, series, ahora }) {
  const esFuerza = day.tipo === "fuerza";
  const titulo = (esFuerza ? "🏋️ " : day.tipo === "compromiso" ? "🎾 " : "🏃 ") + day.titulo;
  let inicio, fin;
  if (gps && gps.ruta && gps.ruta.t0 && gps.seg > 0) {
    inicio = new Date(gps.ruta.t0);
    fin = new Date(gps.ruta.t0 + gps.seg * 1000);
  } else {
    const dur = gps && gps.seg > 0 ? gps.seg * 1000 : minutosDe(day.dur) * 60000;
    fin = new Date(ahora);
    inicio = new Date(ahora - dur);
  }
  const lineas = [];
  if (!esFuerza && gps && gps.m > 0) {
    lineas.push("📊 Resumen:");
    lineas.push("Distancia: " + (gps.m / 1000).toFixed(2) + " km");
    if (gps.seg > 0) {
      lineas.push("Tiempo: " + mmss(gps.seg));
      lineas.push("Ritmo medio: " + mmss(gps.seg / (gps.m / 1000)) + " /km");
    }
    if (gps.cadencia) lineas.push("Cadencia: " + gps.cadencia + " pasos/min");
  }
  const conSeries = (series || []).filter(s => s.texto);
  if (esFuerza && conSeries.length) {
    lineas.push("📊 Series:");
    for (const s of conSeries) lineas.push(s.nombre + ": " + s.texto);
  }
  lineas.push("", "Programa 7K");
  return { titulo, inicio, fin, detalles: lineas.join("\n") };
}

/** 2026-10-08T16:23:00Z → "20261008T162300Z" (UTC, como lo pide Google). */
const fechaGoogle = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** El enlace que abre Google Calendar con el evento relleno. */
export function urlGoogleCalendar(ev) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.titulo,
    dates: fechaGoogle(ev.inicio) + "/" + fechaGoogle(ev.fin),
    details: ev.detalles,
  });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}
