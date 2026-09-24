/**
 * La movilidad va dentro de las sesiones: nada suelto para casa, y el
 * calentamiento de running es el que dice el plan.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKS } from "../src/domain/plan/calendario.js";
import { getMovilidadDelDia } from "../src/domain/salud/movilidad.js";
import { PATRONES_POR_SESION, MOVILIDAD_PATRON_ORDEN, getPatronesDeSesion } from "../src/domain/salud/patrones.js";

const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);

test("los dias de descanso no llevan movilidad para casa", () => {
  for (const wk of WEEKS) for (const d of wk.days) {
    if (d.tipo !== "libre") continue;
    const m = getMovilidadDelDia(d);
    assert.equal(m.cal.length + m.enf.length, 0, `S${wk.n} ${d.dow}`);
  }
});

test("los cuatro patrones se trabajan cada semana en el gimnasio", () => {
  assert.deepEqual([...Object.values(PATRONES_POR_SESION).flat()].sort(), [...MOVILIDAD_PATRON_ORDEN].sort());
  for (const wk of WEEKS.slice(0, 7)) {
    const hechos = new Set(wk.days.filter(d => d.tipo === "fuerza").flatMap(d => getPatronesDeSesion(d.cat, wk.n).map(p => p.key)));
    assert.equal(hechos.size, 4, `S${wk.n}: ${[...hechos]}`);
  }
});

test("el running no lleva patron de movilidad, solo su calentamiento", () => {
  assert.deepEqual(getPatronesDeSesion("runQ", 5), []);
  assert.deepEqual(getPatronesDeSesion("runZ2", 5), []);
});

test("las series y las pruebas a tope calientan lo que pide el plan", () => {
  for (const d of [dia(4, "Jueves"), dia(6, "Jueves"), dia(8, "Domingo")]) {
    const cal = getMovilidadDelDia(d).cal;
    assert.match(cal[0].t, /15 min/, d.titulo);
    assert.match(cal.at(-1).ex, /Progresivos/, d.titulo + ": los progresivos van al final");
    assert.match(d.what, /15 min suave \+ 3 progresivos/, d.titulo);
  }
});

test("las activaciones y la prueba de partida no llevan el calentamiento largo", () => {
  for (const d of [dia(8, "Jueves"), dia(9, "Sabado"), dia(11, "Jueves"), dia(1, "Domingo"), dia(2, "Martes")]) {
    const cal = getMovilidadDelDia(d).cal;
    assert.ok(!cal.some(x => /15 min/.test(x.t)), d.titulo);
  }
});

test("el dia D calienta 10 minutos", () => {
  assert.match(getMovilidadDelDia(dia(11, "Domingo")).cal[0].t, /10 min/);
});

test("el tenis lleva su movilidad antes y despues", () => {
  const m = getMovilidadDelDia(dia(3, "Lunes"));
  assert.ok(m.cal.length && m.enf.length);
});

test("la sentadilla ATG no se repite en el calentamiento y en los ejercicios", () => {
  for (const wk of WEEKS) for (const d of wk.days) {
    if (d.cat !== "pierna" || d.tipo !== "fuerza") continue;
    assert.ok(!d.ejercicios.some(e => /ATG|Cossack/.test(e.nombre)), `S${wk.n} ${d.dow}`);
  }
});
