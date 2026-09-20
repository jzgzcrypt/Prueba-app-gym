/**
 * Vaciar un dia borra datos del usuario. Es lo mas delicado que hace la app,
 * asi que se prueba con mas cuidado que nada.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { limpiarDia, cuantoHayEn } from "../src/lib/estado/limpiar-dia.js";

const estadoEjemplo = () => ({
  checked:      { "1-3": true, "1-3-movenf": true, "1-4": true, "11-3": true },
  cuelloChecks: { "1-3-m": true, "1-3-t": true, "1-4-n": true },
  notes:        { "1-3": "me costo", "1-4": "bien" },
  painLog:      { "1-3": { rodilla: 4 }, "1-4": { cuello: 2 } },
  magiaLog:     { "1-3": true },
  guerreroLog:  { "1-4": true },
  workoutWeights: { "1-3": { 0: { 0: "20" } } },
  ritmoReal:    { "1-3": "5:12", "1-6": "5:30" },
  ritmoTramos:  { "1-3": "6:00" },
  sensaciones:  { "1-3": "duro", "1-6": "bien" },
  postponed:    { "1-3": { destino: "Jueves" } },
});

test("borra todo lo del dia, incluidos los sufijos", () => {
  const { estado } = limpiarDia(estadoEjemplo(), "1-3");
  assert.equal(estado.checked["1-3"], undefined);
  assert.equal(estado.checked["1-3-movenf"], undefined);
  assert.equal(estado.cuelloChecks["1-3-m"], undefined);
  assert.equal(estado.cuelloChecks["1-3-t"], undefined);
  for (const k of ["notes","painLog","magiaLog","workoutWeights","ritmoReal","ritmoTramos","sensaciones","postponed"]) {
    assert.equal(estado[k]["1-3"], undefined, `queda rastro en ${k}`);
  }
});

test("no toca ningun otro dia", () => {
  const { estado } = limpiarDia(estadoEjemplo(), "1-3");
  assert.equal(estado.checked["1-4"], true);
  assert.equal(estado.cuelloChecks["1-4-n"], true);
  assert.equal(estado.notes["1-4"], "bien");
  assert.deepEqual(estado.painLog["1-4"], { cuello: 2 });
  assert.equal(estado.guerreroLog["1-4"], true);
  assert.equal(estado.ritmoReal["1-6"], "5:30");
  assert.equal(estado.sensaciones["1-6"], "bien");
});

test("vaciar la semana 1 no se lleva por delante la semana 11", () => {
  // "1-3" es prefijo textual de "11-3" si se compara mal. Es el fallo que
  // borraria en silencio la semana del objetivo.
  const { estado } = limpiarDia(estadoEjemplo(), "1-3");
  assert.equal(estado.checked["11-3"], true, "se ha borrado un dia de la semana 11");
});

test("no muta el estado que recibe", () => {
  const antes = estadoEjemplo();
  const copia = structuredClone(antes);
  limpiarDia(antes, "1-3");
  assert.deepEqual(antes, copia);
});

test("avisa de si habia algo que borrar", () => {
  assert.equal(limpiarDia(estadoEjemplo(), "1-3").habiaAlgo, true);
  assert.equal(limpiarDia(estadoEjemplo(), "9-9").habiaAlgo, false);
});

test("un dia sin nada registrado devuelve los mismos objetos", () => {
  const antes = estadoEjemplo();
  const { estado } = limpiarDia(antes, "9-9");
  // Mismas referencias: React no repinta por gusto.
  assert.equal(estado.checked, antes.checked);
  assert.equal(estado.notes, antes.notes);
});

test("cuenta lo que hay registrado en el dia", () => {
  assert.equal(cuantoHayEn(estadoEjemplo(), "1-3"), 12);
  assert.equal(cuantoHayEn(estadoEjemplo(), "9-9"), 0);
});

test("aguanta estado incompleto sin romperse", () => {
  assert.equal(limpiarDia(null, "1-3").habiaAlgo, false);
  assert.equal(limpiarDia({}, "1-3").habiaAlgo, false);
  assert.equal(limpiarDia({ checked: undefined }, "1-3").habiaAlgo, false);
  assert.equal(cuantoHayEn({}, "1-3"), 0);
});
