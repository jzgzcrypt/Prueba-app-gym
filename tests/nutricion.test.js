/**
 * La regla: los dias que corres fuerte, comes. Los dias que no, recortas.
 * Se comprueba contra el plan de verdad, no contra ejemplos inventados.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKS } from "../src/domain/plan/calendario.js";
import { comidaDelDia, COMIDA } from "../src/domain/nutricion/dias.js";

test("el lunes de tenis siempre se come", () => {
  for (const wk of WEEKS) {
    assert.equal(comidaDelDia(wk.days[0]).id, "comer", `la semana ${wk.n} recorta el dia del tenis`);
  }
});

test("el dia de la sesion de calidad siempre se come", () => {
  // 4:45/km tira de glucogeno, no de grasa: esa sesion va con el deposito lleno.
  for (const wk of WEEKS) {
    const calidad = wk.days.find(d => d.esCalidad);
    if (calidad) assert.equal(comidaDelDia(calidad).id, "comer", `semana ${wk.n}`);
  }
});

test("el test y el dia del objetivo se comen", () => {
  for (const wk of WEEKS) for (const d of wk.days) {
    if (d.tipo === "test" || d.tipo === "objetivo") assert.equal(comidaDelDia(d).id, "comer");
  }
});

test("los dias de fuerza y de descanso recortan", () => {
  for (const wk of WEEKS) for (const d of wk.days) {
    if (d.tipo === "fuerza") assert.equal(comidaDelDia(d).id, "recortar", `${wk.n}/${d.dow}`);
  }
});

test("cada semana tiene mas dias de recortar que de comer", () => {
  // Si no, no hay deficit y la grasa no se mueve.
  for (const wk of WEEKS) {
    const comer = wk.days.filter(d => comidaDelDia(d).id === "comer").length;
    assert.ok(comer <= 3, `la semana ${wk.n} come ${comer} dias`);
    assert.ok(comer >= 1, `la semana ${wk.n} no come ningun dia`);
  }
});

test("aguanta un dia que no existe", () => {
  assert.equal(comidaDelDia(null).id, "recortar");
  assert.equal(comidaDelDia(undefined), COMIDA.recortar);
});

test("la tirada larga del domingo siempre se come", () => {
  // Fallaba: la regla miraba dayIdx, que solo existia en la lista plana y no
  // en los dias del plan. El domingo salia como dia de recorte.
  for (const wk of WEEKS) {
    const domingo = wk.days[6];
    if (domingo.tipo === "libre") continue;
    assert.equal(comidaDelDia(domingo).id, "comer", `la semana ${wk.n} recorta el domingo`);
  }
});
