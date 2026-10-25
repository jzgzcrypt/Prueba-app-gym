import test from "node:test";
import assert from "node:assert/strict";
import { diaAjustado, estadoCarga } from "../src/domain/plan/ajuste.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";
import { objetivoCarrera } from "../src/domain/running/objetivo.js";

const dia = (iso) => FLAT_DAYS.find(d => d.isoDate === iso);
const hechos = (...isos) => Object.fromEntries(isos.map(i => [i, true]));
// Hasta el 11 de octubre, todo hecho.
const hastaEl11 = hechos(...FLAT_DAYS.filter(d => d.isoDate <= "2026-10-11" && (d.tipo === "run" || d.tipo === "test")).map(d => d.isoDate));

test("menos de 7 dias sin correr: nada cambia", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: hastaEl11, hoyIso: "2026-10-16" });
  assert.deepEqual(e.vuelta, {});
  assert.equal(diaAjustado(dia("2026-10-18"), e), dia("2026-10-18"));
});

test("14 dias parado: 3 salidas de vuelta, la tirada de 40 min pasa a 26", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: hastaEl11, hoyIso: "2026-10-25" });
  assert.equal(e.paro, 14);
  const isos = Object.keys(e.vuelta).sort();
  assert.equal(isos.length, 3);
  assert.equal(isos[0], "2026-10-25");
  assert.deepEqual(isos.map(i => e.vuelta[i].factor), [0.65, 0.77, 0.88]);
  const d = diaAjustado(dia("2026-10-25"), e);
  assert.equal(objetivoCarrera(d).seg, 26 * 60);
  assert.match(d.titulo, /26 min/);
  assert.doesNotMatch(d.what, /~6 km/);
  assert.match(d.ajuste.motivo, /14 días sin correr: salida 1 de 3/);
});

test("las series de la primera mitad de la vuelta pasan a suave con progresivos", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: hastaEl11, hoyIso: "2026-10-25" });
  const jueves = diaAjustado(dia("2026-10-29"), e);   // 5x800 a 4:45, salida 3 de 3
  assert.equal(e.vuelta["2026-10-29"].n, 3);
  assert.ok(jueves.intervalos, "la 3 de 3 ya es segunda mitad: series, pero menos");
  assert.match(jueves.titulo, /^Series 4x800/);
  const martes = diaAjustado(dia("2026-10-27"), e);
  assert.ok(!martes.intervalos);
});

test("28 dias parado: 6 salidas y la primera al 40 %; una prueba en la vuelta no se hace", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: hechos("2026-09-27"), hoyIso: "2026-10-25" });
  assert.equal(e.paro, 28);
  const isos = Object.keys(e.vuelta).sort();
  assert.equal(isos.length, 6);
  assert.equal(e.vuelta[isos[0]].factor, 0.4);
  const series = diaAjustado(dia("2026-10-29"), e);
  assert.equal(series.tipo, "run");
  assert.ok(!series.intervalos && !series.ritmo);
  assert.match(series.titulo, /Suave \+ progresivos/);
});

test("tras la vuelta, el plan normal", () => {
  const vuelto = { ...hastaEl11, ...hechos("2026-10-25", "2026-10-27", "2026-10-29") };
  const e = estadoCarga({ dias: FLAT_DAYS, checked: vuelto, hoyIso: "2026-10-31" });
  assert.equal(diaAjustado(dia("2026-11-01"), e), dia("2026-11-01"));
  assert.ok(diaAjustado(dia("2026-10-29"), e).ajuste, "lo hecho en la vuelta sigue contado como vuelta");
});

test("constancia baja sin paron: series mas cortas y la tirada no crece", () => {
  // Del 12 al 24 solo una salida de 4 (sin paron de 7 dias: el 20 corrio).
  const pocas = { ...hastaEl11, ...hechos("2026-10-15") };
  const e = estadoCarga({ dias: FLAT_DAYS, checked: pocas, gps: { "2026-10-20": { m: 3000 } }, hoyIso: "2026-10-26" });
  assert.deepEqual(e.vuelta["2026-10-27"], undefined);
  assert.ok(e.constancia);
  const jueves = diaAjustado(dia("2026-10-29"), e);
  assert.match(jueves.titulo, /^Series 3x800/);
  const domingo = diaAjustado(dia("2026-11-01"), e);   // tirada 50 → como la anterior (40)
  assert.equal(objetivoCarrera(domingo).seg, 40 * 60);
});

test("el dia del objetivo no se toca nunca", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: hechos("2026-09-27"), hoyIso: "2026-12-06" });
  const obj = FLAT_DAYS.find(d => d.tipo === "objetivo");
  assert.equal(diaAjustado(obj, e), obj);
});

test("lo apuntado en la libreta (de Strava) cuenta como carrera hecha", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: {}, ritmoReal: { "2026-10-11": "30:10 · 4,2 km" }, hoyIso: "2026-10-25" });
  assert.equal(e.paro, 14);
});

test("sin ninguna carrera apuntada y el plan ya empezado: vuelta desde el inicio, diciendo por que", () => {
  const e = estadoCarga({ dias: FLAT_DAYS, checked: {}, hoyIso: "2026-10-25" });
  const d = diaAjustado(dia("2026-10-25"), e);
  assert.ok(d.ajuste);
  assert.match(d.ajuste.motivo, /No hay ninguna carrera apuntada/);
  assert.ok(objetivoCarrera(d).seg < 40 * 60);
  const antes = estadoCarga({ dias: FLAT_DAYS, checked: {}, hoyIso: "2026-09-01" });
  assert.deepEqual(antes.vuelta, {});
});
