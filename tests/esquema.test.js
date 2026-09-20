/**
 * Lo que protegen estos tests no es codigo: son anos de historial.
 *
 * Una migracion mal escrita no da error — da datos silenciosamente perdidos, y
 * no se nota hasta que alguien busca una semana de hace dos anos y no esta.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { migrar, VERSION_ESQUEMA } from "../src/lib/storage/esquema.js";

test("migrar deja siempre los datos en la version actual", () => {
  for (const entrada of [null, undefined, {}, { version: 1 }, { version: VERSION_ESQUEMA }, "no es un objeto"]) {
    assert.equal(migrar(entrada).datos.version, VERSION_ESQUEMA);
  }
});

test("v1 → v2: la bitacora de texto libre pasa a las tres preguntas", () => {
  const { datos } = migrar({ version: 1, weeklyLog: { 1: "la semana fue bien", 2: "se cayo entera" } });
  assert.deepEqual(datos.weeklyLog[1], { paso: "la semana fue bien", porque: "", ajuste: "" });
  assert.deepEqual(datos.weeklyLog[2], { paso: "se cayo entera", porque: "", ajuste: "" });
});

test("el texto escrito se conserva entero, sin repartirlo a ojo", () => {
  const original = "Running 3/3. Motivo real: pereza. Ajuste: anclar a una hora fija.";
  const { datos } = migrar({ version: 1, weeklyLog: { 4: original } });
  assert.equal(datos.weeklyLog[4].paso, original);
  // Repartirlo entre los tres campos seria inventar lo que no se escribio.
  assert.equal(datos.weeklyLog[4].porque, "");
  assert.equal(datos.weeklyLog[4].ajuste, "");
});

test("una bitacora ya migrada no se vuelve a tocar", () => {
  const ya = { paso: "a", porque: "b", ajuste: "c" };
  const { datos } = migrar({ version: 2, weeklyLog: { 1: ya } });
  assert.deepEqual(datos.weeklyLog[1], ya);
});

test("los datos sin version se tratan como v1 y se migran", () => {
  const { datos, migrado, desde } = migrar({ weeklyLog: { 1: "texto viejo" } });
  assert.equal(desde, 1);
  assert.equal(migrado, true);
  assert.equal(datos.weeklyLog[1].paso, "texto viejo");
});

test("ningun otro campo se pierde ni se altera al migrar", () => {
  const entrada = {
    version: 1,
    checked: { "1-1": true }, medidas: [{ fecha: "2026-09-21", peso: 80 }],
    ritmoReal: { "1-3": "5:12" }, magiaProgress: { truco_1: true },
    bloquesHistorial: [{ numero: 1, estado: "activo" }],
  };
  const { datos } = migrar(structuredClone(entrada));
  for (const k of Object.keys(entrada)) {
    if (k === "version") continue;
    assert.deepEqual(datos[k], entrada[k], `el campo ${k} ha cambiado al migrar`);
  }
});

test("migrar no modifica el objeto que recibe", () => {
  const entrada = { version: 1, weeklyLog: { 1: "texto" } };
  migrar(entrada);
  assert.equal(entrada.weeklyLog[1], "texto");
});
