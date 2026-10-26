import test from "node:test";
import assert from "node:assert/strict";
import { ritmoEsperado } from "../src/domain/running/esperado.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const dia = (iso) => FLAT_DAYS.find(d => d.isoDate === iso);
const tirada = dia("2026-10-25");          // Tirada larga 40 min, RPE 4-5
const partida = FLAT_DAYS.find(d => d.prueba && d.prueba.partida);

test("suave con datos: la media de tus ultimos suaves, de la libreta o del GPS", () => {
  const r = ritmoEsperado({ day: tirada, dias: FLAT_DAYS,
    ritmoReal: { "2026-10-06": "6:40/km", "2026-10-11": "6:50/km" },
    gps: { "2026-10-20": { m: 3000, seg: 3 * 420 } } });   // 7:00/km
  assert.equal(r.desde, 410 - 10);
  assert.equal(r.texto, "6:40–7:05/km");
  assert.match(r.fuente, /3 últimos suaves/);
});

test("RPE 3: la franja, algo mas lenta", () => {
  const martes = dia("2026-10-27");   // RPE 3-4
  const r = ritmoEsperado({ day: { ...martes, rpe: "3/10" }, dias: FLAT_DAYS, ritmoReal: { "2026-10-11": "6:40/km" } });
  assert.equal(r.texto, "6:40–7:00/km");
});

test("sin suaves: de la ultima prueba (5K + ~88 s); sin prueba: de la partida", () => {
  const conPrueba = ritmoEsperado({ day: tirada, dias: FLAT_DAYS, ritmoReal: { "2026-10-15": "15:00" } });
  assert.match(conPrueba.fuente, /prueba de 3 km/);
  assert.ok(conPrueba.desde > 300 && conPrueba.hasta < 420);
  const deLaPartida = ritmoEsperado({ day: tirada, dias: FLAT_DAYS, ritmoReal: { [partida.isoDate]: "25:03 · 3,45 km" } });
  assert.match(deLaPartida.fuente, /partida/);
  assert.equal(deLaPartida.texto, "7:06–7:31/km");
});

test("sin ningun dato: no se inventa", () => {
  const r = ritmoEsperado({ day: tirada, dias: FLAT_DAYS, ritmoReal: {} });
  assert.equal(r.texto, "a ritmo de poder hablar");
  assert.equal(r.desde, null);
});

test("series y pruebas: su ritmo", () => {
  const series = ritmoEsperado({ day: dia("2026-10-29"), dias: FLAT_DAYS, ritmoReal: {} });
  assert.equal(series.texto, "4:45/km en las series");
  const prueba = ritmoEsperado({ day: dia("2026-10-15"), dias: FLAT_DAYS, ritmoReal: {} });
  assert.equal(prueba.texto, "~4:50/km");
});

test("en vuelta tras un paron: +10 s", () => {
  const enVuelta = { ...tirada, ajuste: { motivo: "14 días sin correr: salida 1 de 3 de vuelta, al 65 %." } };
  const r = ritmoEsperado({ day: enVuelta, dias: FLAT_DAYS, ritmoReal: { "2026-10-11": "6:40/km" } });
  assert.equal(r.texto, "6:40–7:05/km");
  assert.match(r.fuente, /vuelta/);
});

test("un dia que no es de correr: nada", () => {
  assert.equal(ritmoEsperado({ day: dia("2026-10-28"), dias: FLAT_DAYS, ritmoReal: {} }), null);
});
