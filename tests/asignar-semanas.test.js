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

import { WEEKS as BLOQUE_2 } from "../src/domain/plan/bloque-2-7k.js";

test("bloque 2: 22:45 o menos adelanta una semana, quitando la que sigue a la prueba", () => {
  assert.equal(semanasExtraDe("22:40"), -1);
  assert.equal(semanasExtraDe("22:46"), 0);
  const a = asignarSemanas({ plan: BLOQUE_2, extra: -1 });
  assert.equal(a.length, BLOQUE_2.length - 1);
  assert.ok(!a.includes(8), "la semana 9 (la que sigue al 5 km) se quita");
  assert.deepEqual(a.slice(-2), [11, 12], "la recta final no se toca");
});

test("bloque 2: con 24:30 el 7K se mueve 4 semanas, despues del 5 km", () => {
  const a = asignarSemanas({ plan: BLOQUE_2, extra: 4 });
  assert.equal(a.length, BLOQUE_2.length + 4);
  assert.deepEqual(a.slice(7, 13), [7, 8, 8, 8, 8, 8]);
  assert.equal(a.at(-1), 12);
});
