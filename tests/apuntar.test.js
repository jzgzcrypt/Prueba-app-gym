/**
 * El resumen del dia y lo que se le pasa al motor adaptativo.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ingestaDelDia, resumenDia } from "../src/domain/nutricion/apuntar.js";

const OBJ = { kcal: 2200, prot: 165, hc: 220, grasa: 70 };
const ap = (comida, kcal, prot = 20) => ({ comida, origen: "texto", texto: "x", kcal, prot, hc: 0, grasa: 0 });

test("resumen: el total de tu IA da lo que llevas y lo que queda", () => {
  const res = resumenDia([{ comida: "dia", origen: "ia", texto: "Total de tu IA", kcal: 1500, prot: 110, hc: 150, grasa: 50 }], OBJ);
  assert.equal(res.llevas.kcal, 1500);
  assert.equal(res.quedan.kcal, 700);
  assert.equal(res.quedan.prot, 55);
  assert.equal(res.cerrado, true);
});

test("resumen: apuntes antiguos por comidas también suman", () => {
  const res = resumenDia([ap("desayuno", 400, 30), ap("comida", 800, 50)], OBJ);
  assert.equal(res.llevas.kcal, 1200);
  assert.equal(res.hechas, 2);
  assert.equal(res.siguiente, "merienda");
});

test("al motor: cuenta el total de tu IA, o 3 comidas antiguas; a medias, no", () => {
  assert.equal(ingestaDelDia([{ comida: "dia", kcal: 2100 }]), 2100);
  assert.equal(ingestaDelDia([ap("desayuno", 400), ap("comida", 800)]), null);
  assert.equal(ingestaDelDia([ap("desayuno", 400), ap("comida", 800), ap("cena", 700)]), 1900);
  assert.equal(ingestaDelDia([]), null);
});
