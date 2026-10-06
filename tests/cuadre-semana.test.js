/**
 * IIFYM de la semana: lo que te pasas un dia se recorta en los que quedan.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { aplicarCuadre, cuadreSemana, textoCuadre } from "../src/domain/nutricion/cuadre-semana.js";

const semana = ["05", "06", "07", "08", "09", "10", "11"].map((dd, i) => ({ isoDate: "2026-10-" + dd, dayIdx: i, tipo: "run" }));
const obj = () => ({ kcal: 2100, prot: 165, hc: 214, grasa: 65 });
const log = (pares) => Object.fromEntries(pares.map(([iso, kcal]) => [iso, [{ kcal, prot: 150 }]]));

test("te pasas 800 el lunes: de miércoles a domingo, 160 menos cada día", () => {
  const c = cuadreSemana({ dias: semana, comidasLog: log([["2026-10-05", 2900]]), objetivoDe: obj, hoyIso: "2026-10-07" });
  assert.equal(c.saldo, 800);
  assert.equal(c.ajuste, -160);
  assert.equal(c.restantes, 5);
  assert.equal(c.sinCompensar, 0);
  assert.match(textoCuadre(c), /llevas \+800 kcal: hoy y los 4 días que quedan, 160 menos cada día\. La proteína no se toca\.$/);
});

test("te quedas corto: los días que quedan suben", () => {
  const c = cuadreSemana({ dias: semana, comidasLog: log([["2026-10-05", 1700], ["2026-10-06", 1900]]), objetivoDe: obj, hoyIso: "2026-10-07" });
  assert.equal(c.saldo, -600);
  assert.equal(c.ajuste, 120);
  assert.match(textoCuadre(c), /te faltan 600 kcal/);
});

test("tope de 300 al día y suelo de 1.800: lo que no cabe se queda sin compensar", () => {
  const c = cuadreSemana({ dias: semana, comidasLog: log([["2026-10-08", 3800]]), objetivoDe: obj, hoyIso: "2026-10-10" });
  assert.equal(c.ajuste, -300);
  assert.equal(c.sinCompensar, 1700 - 600);
  assert.match(textoCuadre(c), /1100 kcal se quedan sin compensar: no pasa nada/);
});

test("poco saldo o días sin apuntar: no se mueve nada", () => {
  assert.equal(cuadreSemana({ dias: semana, comidasLog: log([["2026-10-05", 2200]]), objetivoDe: obj, hoyIso: "2026-10-07" }).ajuste, 0);
  assert.equal(cuadreSemana({ dias: semana, comidasLog: {}, objetivoDe: obj, hoyIso: "2026-10-07" }).ajuste, 0);
  assert.equal(textoCuadre(cuadreSemana({ dias: semana, comidasLog: {}, objetivoDe: obj, hoyIso: "2026-10-07" })), null);
});

test("la víspera y el día de la prueba no se recortan", () => {
  const dias = semana.map(d => d.isoDate === "2026-10-10" ? { ...d, vispera: true } : d.isoDate === "2026-10-11" ? { ...d, tipo: "test" } : d);
  const c = cuadreSemana({ dias, comidasLog: log([["2026-10-05", 2700]]), objetivoDe: obj, hoyIso: "2026-10-08" });
  assert.equal(c.restantes, 2);
  assert.equal(c.ajuste, -300);
  assert.equal(c.ajusteDe(dias[5]), 0);
  assert.equal(c.ajusteDe(dias[3]), -300);
});

test("aplicar: la proteína igual, y nunca por debajo de 1.800", () => {
  const m = aplicarCuadre({ kcal: 2100, prot: 165, hc: 214, grasa: 65 }, -200);
  assert.equal(m.kcal, 1900); assert.equal(m.prot, 165);
  assert.ok(m.hc < 214 && m.grasa <= 65);
  assert.ok(Math.abs(m.prot * 4 + m.hc * 4 + m.grasa * 9 - m.kcal) <= 6);
  assert.equal(aplicarCuadre({ kcal: 1900, prot: 165, hc: 180, grasa: 60 }, -300).kcal, 1800);
});
