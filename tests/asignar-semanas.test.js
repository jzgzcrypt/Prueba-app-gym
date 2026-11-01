import test from "node:test";
import assert from "node:assert/strict";
import { asignarSemanas } from "../src/domain/plan/calendario.js";
import { WEEKS as PLAN, FECHA_INICIO } from "../src/domain/plan/bloque-1-base-7k.js";

// Las sesiones (no libres) de una semana del plan, como fechas del calendario.
const sesiones = (pi, c) => PLAN[pi].days.map((d, di) => [d, di]).filter(([d]) => d.tipo && d.tipo !== "libre")
  .map(([, di]) => { const t = new Date(Date.UTC(2026, 8, 21 + c * 7 + di)); return t.toISOString().slice(0, 10); });

test("si cumples cada semana, el plan va en orden y no se mueve", () => {
  const hechas = new Set(); PLAN.forEach((_, i) => sesiones(i, i).forEach(iso => hechas.add(iso)));
  const a = asignarSemanas({ plan: PLAN, inicio: FECHA_INICIO, hoyIso: "2026-12-07", hecho: (iso) => hechas.has(iso), primerDato: "2026-09-21" });
  assert.deepEqual(a, PLAN.map((_, i) => i));
});

test("semanas sin cumplir se repiten y la fecha final se corre", () => {
  // Cumple las 3 primeras; la 4 (12-18 oct) y la 5 (19-25 oct), nada.
  const hechas = new Set(); [0, 1, 2].forEach(i => sesiones(i, i).forEach(iso => hechas.add(iso)));
  const a = asignarSemanas({ plan: PLAN, inicio: FECHA_INICIO, hoyIso: "2026-11-01", hecho: (iso) => hechas.has(iso), primerDato: "2026-09-21" });
  assert.deepEqual(a.slice(0, 6), [0, 1, 2, 3, 3, 3], "la semana del 26 oct sigue en la 4 del plan");
  assert.equal(a.length, PLAN.length + 2, "el 7K se corre 2 semanas");
});

test("lo de antes de tu primer dato no te castiga", () => {
  const a = asignarSemanas({ plan: PLAN, inicio: FECHA_INICIO, hoyIso: "2026-11-01", hecho: () => false, primerDato: "2026-10-25" });
  // Hasta el 18 oct cuenta como hecho; la del 19-25 (con tu primer dato) sin cumplir se repite.
  assert.deepEqual(a.slice(0, 6), [0, 1, 2, 3, 4, 4]);
});
