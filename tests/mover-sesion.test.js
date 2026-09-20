/**
 * Mover una sesion tiene que MOVERLA. Antes solo escribia una nota que nadie
 * leia, asi que estos tests existen sobre todo para que eso no vuelva a pasar.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { moverSesion, sesionesDelDia, destinoDe, llegadasA } from "../src/lib/estado/mover-sesion.js";

const dias = ["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24"]
  .map((isoDate, i) => ({ isoDate, titulo: "Sesión " + i }));
const [lun, mar, mie, jue] = dias;

test("el dia de destino muestra la sesion que ha recibido", () => {
  const { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  const enJueves = sesionesDelDia(jue, movidas, dias);
  assert.equal(enJueves.llegadas.length, 1);
  assert.equal(enJueves.llegadas[0].titulo, "Sesión 1");
  assert.equal(enJueves.propia.titulo, "Sesión 3", "el jueves pierde lo suyo");
});

test("el dia de origen se queda vacio", () => {
  const { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  const enMartes = sesionesDelDia(mar, movidas, dias);
  assert.equal(enMartes.propia, null);
  assert.equal(enMartes.movidaA, jue.isoDate);
});

test("los dias que no participan no cambian", () => {
  const { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  const enMiercoles = sesionesDelDia(mie, movidas, dias);
  assert.equal(enMiercoles.propia.titulo, "Sesión 2");
  assert.deepEqual(enMiercoles.llegadas, []);
  assert.equal(enMiercoles.movidaA, null);
});

test("deshacer el traslado devuelve la sesion a su dia", () => {
  let { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  ({ movidas } = moverSesion(movidas, mar.isoDate, null));
  assert.equal(sesionesDelDia(mar, movidas, dias).propia.titulo, "Sesión 1");
  assert.deepEqual(sesionesDelDia(jue, movidas, dias).llegadas, []);
});

test("no se amontonan dos sesiones en el mismo dia", () => {
  // Juntar dos sesiones en un dia es lo que hace que no se haga ninguna.
  let { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  const segundo = moverSesion(movidas, mie.isoDate, jue.isoDate);
  assert.equal(segundo.ok, false);
  assert.match(segundo.motivo, /ya ha recibido/);
  assert.deepEqual(segundo.movidas, movidas, "no debe cambiar nada si se rechaza");
});

test("no se encadenan traslados", () => {
  let { movidas } = moverSesion({}, mie.isoDate, jue.isoDate);
  const encadenado = moverSesion(movidas, mar.isoDate, mie.isoDate);
  assert.equal(encadenado.ok, false);
  assert.match(encadenado.motivo, /ya movió lo suyo/);
});

test("no se mueve un dia a si mismo", () => {
  const r = moverSesion({}, mar.isoDate, mar.isoDate);
  assert.equal(r.ok, false);
});

test("mover otra vez el mismo dia cambia el destino", () => {
  let { movidas } = moverSesion({}, mar.isoDate, jue.isoDate);
  const r = moverSesion(movidas, mar.isoDate, mie.isoDate);
  assert.equal(r.ok, true);
  assert.equal(destinoDe(r.movidas, mar.isoDate), mie.isoDate);
  assert.deepEqual(llegadasA(r.movidas, jue.isoDate), [], "el destino viejo se libera");
});

test("no muta el mapa que recibe", () => {
  const antes = {};
  moverSesion(antes, mar.isoDate, jue.isoDate);
  assert.deepEqual(antes, {});
});

test("aguanta un mapa vacio o ausente", () => {
  assert.deepEqual(sesionesDelDia(mar, null, dias).propia, mar);
  assert.deepEqual(llegadasA(undefined, mar.isoDate), []);
  assert.equal(destinoDe(null, mar.isoDate), null);
});
