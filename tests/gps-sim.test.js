/**
 * El error del GPS, medido con el simulador (scripts/sim-gps.mjs): ruta con
 * giros, deriva, ruido, saltos de 20-60 m y fixes perdidos. Si un cambio en el
 * analizador lo empeora, esto falla. Tabla completa: node scripts/sim-gps.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as gps from "../src/domain/running/gps.js";
import { ESCENARIOS, evaluar } from "../scripts/sim-gps.mjs";

test("móvil real, ruta de 2 km con curvas: distancia a ±2% (p90), sin sesgo", () => {
  for (const doppler of [true, false]) {
    const r = evaluar(gps, ESCENARIOS.movil, { vueltas: 20, doppler });
    assert.ok(r[2000].p90 <= 2, (doppler ? "con" : "sin") + " Doppler: 2 km " + r[2000].p90.toFixed(2) + "%");
    assert.ok(Math.abs(r[2000].sesgo) <= 1, "sesgo " + r[2000].sesgo.toFixed(2));
    assert.ok(r[7000].p90 <= 2, "7 km " + r[7000].p90.toFixed(2) + "%");
  }
});

test("móvil real: series de 400 m a ±4 s/km", () => {
  const r = evaluar(gps, ESCENARIOS.movil, { vueltas: 16 });
  assert.ok(r.series.p90 <= 4, "series ±" + r.series.p90.toFixed(1) + " s/km");
});

test("móvil en ciudad con rebotes frecuentes: 2 km a ±4%", () => {
  const r = evaluar(gps, ESCENARIOS.movilCiudad, { vueltas: 20 });
  assert.ok(r[2000].p90 <= 4, "2 km " + r[2000].p90.toFixed(2) + "%");
});
