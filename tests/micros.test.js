/**
 * El perfil de vitaminas y minerales que trae tu IA.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { avisosMicros, estadoMicro, perfilDia, perfilSemana } from "../src/domain/nutricion/micros.js";

const m = (vitD, sodio, fibra = 30) => ({ micros: { fibra, hierro: 10, calcio: 1000, vitD, b12: 3, omega3: 1.6, sodio } });

test("el día suma lo que traen los apuntes; sin micros, null", () => {
  assert.deepEqual(perfilDia([m(4, 1000), { kcal: 500 }, m(2, 800)]).vitD, 6);
  assert.equal(perfilDia([{ kcal: 500 }]), null);
  assert.equal(perfilDia(undefined), null);
});

test("la semana: media de los días con dato", () => {
  const s = perfilSemana([[m(4, 2000)], [], [m(10, 3000)]]);
  assert.equal(s.diasConDato, 2);
  assert.equal(s.media.vitD, 7);
  assert.equal(s.media.sodio, 2500);
  assert.equal(perfilSemana([[], []]).media, null);
});

test("estado: los mínimos se llegan, el sodio no se pasa", () => {
  assert.equal(estadoMicro("vitD", 15).bien, true);
  assert.equal(estadoMicro("vitD", 5).bien, false);
  assert.equal(estadoMicro("sodio", 2000).bien, true);
  assert.equal(estadoMicro("sodio", 3000).bien, false);
});

test("avisos: vitamina D baja varios días y sodio alto de media; con pocos días, nada", () => {
  const dias = [m(3, 2800), m(4, 2600), m(12, 2500), m(2, 2700)].map(a => perfilDia([a]));
  const av = avisosMicros(dias);
  assert.ok(av.some(a => a.k === "vitD" && /baja 3 de 4 días/.test(a.texto) && /pescado azul/.test(a.idea)), JSON.stringify(av));
  assert.ok(av.some(a => a.k === "sodio" && /alto/.test(a.texto)));
  assert.ok(!av.some(a => a.k === "fibra"));
  assert.deepEqual(avisosMicros(dias.slice(0, 2)), []);
});
