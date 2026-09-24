/**
 * Tu contra el plan: la linea del plan sale de sus propios umbrales, y cada
 * dato se compara en la unidad del objetivo, el 7K.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import { lineaPlan, planEn, puntosReales, tuContraElPlan, textoDiferencia } from "../src/domain/progreso/plan-vs-real.js";
import { OBJETIVO_7K } from "../src/domain/progreso/libreta.js";

const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);

test("la linea del plan baja hasta 33:15 el dia D", () => {
  const l = lineaPlan(FLAT_DAYS);
  assert.equal(l.length, 4);
  assert.equal(l.at(-1).seg, OBJETIVO_7K);
  for (let i = 1; i < l.length; i++) assert.ok(l[i].seg < l[i - 1].seg, "tiene que bajar siempre");
  assert.ok(l[0].seg > 36 * 60 && l[0].seg < 40 * 60, "el punto de partida es razonable: " + l[0].seg);
});

test("el plan en S4 es tu 3 km en linea pasado a 7K", () => {
  const l = lineaPlan(FLAT_DAYS);
  const s4 = dia(4, "Jueves");
  assert.equal(planEn(4 + 3 / 7, l), l[1].seg);
  const r = tuContraElPlan(FLAT_DAYS, { [s4.isoDate]: "14:30" });
  assert.equal(r.diferencia, 0, "14:30 es justo lo que pide el plan");
  assert.ok(tuContraElPlan(FLAT_DAYS, { [s4.isoDate]: "14:00" }).diferencia < 0, "mas rapido = por delante");
  assert.ok(tuContraElPlan(FLAT_DAYS, { [s4.isoDate]: "15:00" }).diferencia > 0, "mas lento = por detras");
});

test("las series cuentan como estimacion, los rodajes no cuentan", () => {
  const s6 = dia(6, "Jueves"), mar = dia(6, "Martes");
  const p = puntosReales(FLAT_DAYS, { [s6.isoDate]: "4:45/km", [mar.isoDate]: "6:30/km" });
  assert.equal(p.length, 1);
  assert.equal(p[0].tipo, "series");
});

test("sin datos no inventa nada", () => {
  const r = tuContraElPlan(FLAT_DAYS, {});
  assert.equal(r.ultimo, null);
  assert.equal(r.diferencia, null);
  assert.equal(textoDiferencia(null), null);
});

test("la diferencia se dice en lenguaje normal", () => {
  assert.equal(textoDiferencia(-25), "25 s por delante del plan");
  assert.equal(textoDiferencia(70), "1:10 por detrás del plan");
  assert.equal(textoDiferencia(3), "Justo en el plan");
});
