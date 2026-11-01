import test from "node:test";
import assert from "node:assert/strict";
import { asignarSemanas, semanasExtraDe } from "../src/domain/plan/calendario.js";
import { WEEKS as PLAN } from "../src/domain/plan/bloque-1-base-7k.js";

test("sin el 5 km apuntado, el plan va en orden: lo perdido se pierde, no se repite", () => {
  assert.deepEqual(asignarSemanas({ plan: PLAN }), PLAN.map((_, i) => i));
});

test("el 5 km decide: 23:30 se mantiene; 24:30 mete 4 semanas; 26:00, 8", () => {
  assert.equal(semanasExtraDe("23:20"), 0);
  assert.equal(semanasExtraDe("24:30"), 4);
  assert.equal(semanasExtraDe("26:00"), 8);
  assert.equal(semanasExtraDe("4:54/km"), 4, "como ritmo: 24:30");
  assert.equal(semanasExtraDe("6:30/km (suave)"), 0, "corrido como suave no decide");
  assert.equal(semanasExtraDe(""), 0);
});

test("las semanas extra van despues de la prueba que decide, antes de la recta final", () => {
  const a = asignarSemanas({ plan: PLAN, extra: 4 });
  assert.equal(a.length, PLAN.length + 4);
  const decide = PLAN.findIndex(w => w.days.some(d => d.prueba && d.prueba.decide));
  assert.deepEqual(a.slice(decide, decide + 6), [decide, decide + 1, decide + 1, decide + 1, decide + 1, decide + 1]);
  assert.equal(a[a.length - 1], PLAN.length - 1, "el 7K sigue siendo lo ultimo");
});
