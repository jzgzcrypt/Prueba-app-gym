/**
 * El error del GPS, medido con el simulador (scripts/sim-gps.mjs): ruta con
 * giros, deriva, ruido, saltos de 20-60 m y fixes perdidos. Si un cambio en el
 * analizador lo empeora, esto falla. Tabla completa: node scripts/sim-gps.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as gps from "../src/domain/running/gps.js";
import { ESCENARIOS, evaluar } from "../scripts/sim-gps.mjs";

test("con Doppler: series de 400 m a ±3 s/km y distancia al ~1% incluso con mala señal", () => {
  for (const esc of Object.values(ESCENARIOS)) {
    const r = evaluar(gps, esc, { vueltas: 16 });
    assert.ok(r.series.p90 <= 3, esc.nombre + ": series ±" + r.series.p90.toFixed(1) + " s/km");
    assert.ok(r[1000].p90 <= 1.2, esc.nombre + ": 1 km " + r[1000].p90.toFixed(2) + "%");
    assert.ok(r[7000].p90 <= 0.6, esc.nombre + ": 7 km " + r[7000].p90.toFixed(2) + "%");
    assert.ok(Math.abs(r[7000].sesgo) <= 0.3, esc.nombre + ": sesgo 7 km " + r[7000].sesgo.toFixed(2) + "%");
  }
});

test("sin Doppler: nunca infla la distancia (sumar fixes crudos la infla un 25-180%)", () => {
  for (const esc of Object.values(ESCENARIOS)) {
    const r = evaluar(gps, esc, { vueltas: 16, doppler: false });
    assert.ok(r[3000].p90 <= 3, esc.nombre + ": 3 km " + r[3000].p90.toFixed(2) + "%");
    assert.ok(Math.abs(r[7000].sesgo) <= 1.5, esc.nombre + ": sesgo 7 km " + r[7000].sesgo.toFixed(2) + "%");
  }
});
