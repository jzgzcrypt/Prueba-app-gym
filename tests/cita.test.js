import test from "node:test";
import assert from "node:assert/strict";
import { citaCarrera, horasAParam, horasDeParam, limpiarHoras } from "../src/domain/hoy/cita.js";

const martes = { tipo: "run", dayIdx: 1, titulo: "Suave 20 min" };
const horas = { 1: "17:30", 3: "17:30", 6: "10:00" };

test("la carrera con hora dice como salir; antes y despues de la hora", () => {
  assert.equal(citaCarrera({ day: martes, horas, hecha: false, ahoraMin: 17 * 60 + 15 }), "Ropa puesta · móvil en la entrada · sales a las 17:30");
  assert.match(citaCarrera({ day: martes, horas, hecha: false, ahoraMin: 18 * 60 }), /^Era a las 17:30/);
  assert.equal(citaCarrera({ day: martes, horas, hecha: true, ahoraMin: 0 }), null, "hecha: nada que decir");
  assert.equal(citaCarrera({ day: martes, horas: null, hecha: false, ahoraMin: 0 }), null, "sin horas elegidas");
  assert.equal(citaCarrera({ day: { tipo: "fuerza", dayIdx: 2 }, horas, hecha: false, ahoraMin: 0 }), null);
});

test("las horas se limpian y viajan en el enlace del calendario", () => {
  assert.deepEqual(limpiarHoras({ 1: "17:30", 2: "18:00", 6: "99:00" }), { 1: "17:30" });
  assert.equal(limpiarHoras({}), null);
  assert.equal(horasAParam(horas), "1-17:30,3-17:30,6-10:00");
  assert.deepEqual(horasDeParam("1-17:30,3-17:30,6-10:00"), horas);
  assert.equal(horasDeParam("x"), null);
});
