import test from "node:test";
import assert from "node:assert/strict";
import { eventoSesion, urlGoogleCalendar } from "../src/domain/plan/evento-calendario.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const dia = (iso) => FLAT_DAYS.find(d => d.isoDate === iso);

test("carrera con GPS: hora real de la ruta y el resumen como Runna", () => {
  const t0 = Date.UTC(2026, 9, 8, 16, 23);
  const ev = eventoSesion({ day: dia("2026-10-13"), gps: { m: 2100, seg: 901, ruta: { t0 } }, ahora: t0 + 3600e3 });
  assert.equal(ev.inicio.getTime(), t0);
  assert.equal(ev.fin.getTime(), t0 + 901e3);
  assert.match(ev.titulo, /^🏃 /);
  assert.match(ev.detalles, /Distancia: 2\.10 km/);
  assert.match(ev.detalles, /Tiempo: 15:01/);
  assert.match(ev.detalles, /Ritmo medio: 7:09 \/km/);
});

test("fuerza sin GPS: termina ahora, dura lo del plan y lleva las series", () => {
  const ahora = Date.UTC(2026, 9, 14, 18, 0);
  const d = dia("2026-10-14");
  const ev = eventoSesion({ day: d, series: [{ nombre: "Press militar", texto: "12 kg × 10, 10" }, { nombre: "Remo", texto: "" }], ahora });
  assert.equal(ev.fin.getTime(), ahora);
  assert.equal(ev.inicio.getTime(), ahora - parseInt(d.dur, 10) * 60000);
  assert.match(ev.titulo, /^🏋️ /);
  assert.match(ev.detalles, /Press militar: 12 kg × 10, 10/);
  assert.doesNotMatch(ev.detalles, /Remo/);
});

test("el enlace de Google Calendar: plantilla, fechas en UTC y texto codificado", () => {
  const ev = { titulo: "🏃 Suave", inicio: new Date(Date.UTC(2026, 9, 8, 16, 23)), fin: new Date(Date.UTC(2026, 9, 8, 16, 38, 1)), detalles: "a\nb" };
  const u = new URL(urlGoogleCalendar(ev));
  assert.equal(u.hostname, "calendar.google.com");
  assert.equal(u.searchParams.get("action"), "TEMPLATE");
  assert.equal(u.searchParams.get("dates"), "20261008T162300Z/20261008T163801Z");
  assert.equal(u.searchParams.get("text"), "🏃 Suave");
  assert.equal(u.searchParams.get("details"), "a\nb");
});

test("con pausas, el evento acaba en el ultimo punto de la ruta, no en el tiempo en movimiento", () => {
  const t0 = Date.UTC(2026, 9, 8, 16, 0);
  const ev = eventoSesion({ day: dia("2026-10-13"), gps: { m: 3000, seg: 1200, ruta: { t0, p: [[0, 0, 0], [0, 0, 1500]] } }, ahora: t0 });
  assert.equal(ev.fin.getTime(), t0 + 1500e3);
});
