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

test("v1 → v3: la bitacora de texto libre pasa a las tres preguntas", () => {
  // La cadena completa reindexa ademas por fecha, asi que las claves son el
  // lunes de cada semana.
  const { datos } = migrar({ version: 1, weeklyLog: { 1: "la semana fue bien", 2: "se cayo entera" } });
  assert.deepEqual(datos.weeklyLog["2026-09-21"], { paso: "la semana fue bien", porque: "", ajuste: "" });
  assert.deepEqual(datos.weeklyLog["2026-09-28"], { paso: "se cayo entera", porque: "", ajuste: "" });
});

test("el texto escrito se conserva entero, sin repartirlo a ojo", () => {
  const original = "Running 3/3. Motivo real: pereza. Ajuste: anclar a una hora fija.";
  const { datos } = migrar({ version: 1, weeklyLog: { 4: original } });
  const semana4 = datos.weeklyLog["2026-10-12"];
  assert.equal(semana4.paso, original);
  // Repartirlo entre los tres campos seria inventar lo que no se escribio.
  assert.equal(semana4.porque, "");
  assert.equal(semana4.ajuste, "");
});

test("una bitacora ya migrada no se vuelve a tocar", () => {
  const ya = { paso: "a", porque: "b", ajuste: "c" };
  const { datos } = migrar({ version: 2, weeklyLog: { 1: ya } });
  assert.deepEqual(datos.weeklyLog["2026-09-21"], ya);
});

test("los datos sin version se tratan como v1 y se migran", () => {
  const { datos, migrado, desde } = migrar({ weeklyLog: { 1: "texto viejo" } });
  assert.equal(desde, 1);
  assert.equal(migrado, true);
  assert.equal(datos.weeklyLog["2026-09-21"].paso, "texto viejo");
});

test("ningun valor se pierde al migrar, aunque cambie la clave", () => {
  const entrada = {
    version: 1,
    checked: { "1-1": true }, medidas: [{ fecha: "2026-09-21", peso: 80 }],
    ritmoReal: { "1-3": "5:12" }, magiaProgress: { truco_1: true },
    bloquesHistorial: [{ numero: 1, estado: "activo" }],
  };
  const { datos } = migrar(structuredClone(entrada));
  // Los campos que no van por dia quedan intactos.
  assert.deepEqual(datos.medidas, entrada.medidas);
  assert.deepEqual(datos.magiaProgress, entrada.magiaProgress);
  assert.deepEqual(datos.bloquesHistorial, entrada.bloquesHistorial);
  // Los que van por dia conservan su valor, en su fecha.
  assert.equal(datos.checked["2026-09-22"], true);   // S1 martes
  assert.equal(datos.ritmoReal["2026-09-24"], "5:12"); // S1 jueves
  // Y no se pierde ni se duplica nada.
  assert.equal(Object.keys(datos.checked).length, 1);
  assert.equal(Object.keys(datos.ritmoReal).length, 1);
});

test("migrar no modifica el objeto que recibe", () => {
  const entrada = { version: 1, weeklyLog: { 1: "texto" } };
  migrar(entrada);
  assert.equal(entrada.weeklyLog[1], "texto");
});

// ─── v3: del numero de semana a la fecha real ────────────────────────────────

test("v2 → v3: las claves de dia pasan a fecha, con sus sufijos", () => {
  const { datos } = migrar({ version: 2, checked: { "1-0": true, "1-3": true, "1-3-movenf": true },
                             cuelloChecks: { "1-3-m": true, "1-3-t": true } });
  assert.equal(datos.checked["2026-09-21"], true);          // S1 lunes = 21 sep
  assert.equal(datos.checked["2026-09-24"], true);          // S1 jueves
  assert.equal(datos.checked["2026-09-24-movenf"], true);   // el sufijo se conserva
  assert.equal(datos.cuelloChecks["2026-09-24-m"], true);
  assert.equal(datos.cuelloChecks["2026-09-24-t"], true);
});

test("el ultimo dia del bloque cae en el dia del objetivo", () => {
  const { datos } = migrar({ version: 2, checked: { "11-6": true } });
  assert.equal(datos.checked["2026-12-06"], true);
});

test("la bitacora semanal pasa al lunes de su semana", () => {
  const { datos } = migrar({ version: 2, weeklyLog: { 1: { paso: "a" }, 3: { paso: "c" } } });
  assert.deepEqual(datos.weeklyLog["2026-09-21"], { paso: "a" });
  assert.deepEqual(datos.weeklyLog["2026-10-05"], { paso: "c" });
});

test("los rangos en pausa se reindexan tambien", () => {
  const { datos } = migrar({ version: 2, pausedRanges: [{ days: ["1-4", "1-5"], label: "Pausa" }] });
  assert.deepEqual(datos.pausedRanges[0].days, ["2026-09-25", "2026-09-26"]);
  assert.equal(datos.pausedRanges[0].label, "Pausa");
});

test("una copia de la version antigua cae en SUS fechas, no en las de ahora", () => {
  // El bloque del artifact empezaba el 31 de agosto. Si la migracion usara la
  // fecha de inicio actual, ese historial aparecería tres semanas desplazado.
  const { datos } = migrar({
    version: 1,
    bloquesHistorial: [{ numero: 1, inicio: "2026-08-31", fin: "2026-11-15" }],
    checked: { "1-0": true, "1-3": true },
    weeklyLog: { 1: "la primera semana" },
  });
  assert.equal(datos.checked["2026-08-31"], true, "el lunes de la S1 no es el 31 de agosto");
  assert.equal(datos.checked["2026-09-03"], true);
  assert.deepEqual(datos.weeklyLog["2026-08-31"], { paso: "la primera semana", porque: "", ajuste: "" });
});

test("migrar de la v1 a la actual aplica todos los pasos de una vez", () => {
  const { datos } = migrar({ version: 1, weeklyLog: { 1: "texto libre" }, checked: { "1-3": true } });
  assert.deepEqual(datos.weeklyLog["2026-09-21"], { paso: "texto libre", porque: "", ajuste: "" });
  assert.equal(datos.checked["2026-09-24"], true);
  // Se comprueba contra la constante, no contra un número escrito a mano: si
  // no, cada versión nueva rompe esta prueba sin que nada esté mal.
  assert.equal(datos.version, VERSION_ESQUEMA);
});

test("una clave que ya es fecha no se vuelve a convertir", () => {
  const { datos } = migrar({ version: 2, checked: { "2026-09-24": true, "2026-09-24-m": true } });
  assert.equal(datos.checked["2026-09-24"], true);
  assert.equal(datos.checked["2026-09-24-m"], true);
  assert.equal(Object.keys(datos.checked).length, 2);
});

test("una clave con forma desconocida se conserva antes que perderla", () => {
  const { datos } = migrar({ version: 2, checked: { "algo-raro": true, "": true } });
  assert.equal(datos.checked["algo-raro"], true);
  assert.equal(datos.checked[""], true);
});
