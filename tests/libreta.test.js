/**
 * La libreta: comparar lo de hoy con lo de la ultima vez, y las pruebas con
 * el objetivo. Si estas cuentas mienten, la app dice "vas bien" cuando no.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS, FECHA_INICIO } from "../src/domain/plan/calendario.js";
import {
  OBJETIVO_7K, textoTiempo, leerRitmo, leerTiempo, equivalente7k,
  lecturaPrueba, lecturaRitmo, comparativaFuerza, copiaPendiente, diasParaMedir,
} from "../src/domain/progreso/libreta.js";

const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);

test("el objetivo son 33:15", () => {
  assert.equal(textoTiempo(OBJETIVO_7K), "33:15");
  assert.equal(textoTiempo(4000), "1:06:40");
});

test("distingue un ritmo de un tiempo total", () => {
  assert.equal(leerRitmo("4:47/km"), 287);
  assert.equal(leerRitmo("4:47"), 287);
  assert.equal(leerRitmo("14:20"), null, "14:20 es un tiempo, no un ritmo");
  assert.equal(leerTiempo("14:20", 3), 860);
  assert.equal(leerTiempo("4:50/km", 3), 870, "el ritmo de Strava se convierte en tiempo");
  assert.equal(leerTiempo("1:02:10", 10), 3730);
  assert.equal(leerTiempo("rápido", 3), null);
});

test("el 7K equivalente sale mas lento por km que la prueba corta", () => {
  // Riegel: 23:15 en 5 km es mas o menos el objetivo.
  const eq = equivalente7k(5, 23 * 60 + 15);
  assert.ok(Math.abs(eq - OBJETIVO_7K) < 20, textoTiempo(eq));
  assert.ok(equivalente7k(3, 870) / 7 > 870 / 3);
});

test("el 3 km de S4 dice si vas en linea", () => {
  const p = dia(4, "Jueves").prueba;
  assert.equal(lecturaPrueba(p, "14:20").enLinea, true);
  assert.equal(lecturaPrueba(p, "15:30").enLinea, false);
  assert.match(lecturaPrueba(p, "15:30").detalle, /S8 decide/);
});

test("el 5 km de S8 decide la fecha con los umbrales escritos en el plan", () => {
  const p = dia(8, "Domingo").prueba;
  assert.equal(lecturaPrueba(p, "23:30").semanasExtra, 0);
  assert.equal(lecturaPrueba(p, "23:31").semanasExtra, 4);
  assert.equal(lecturaPrueba(p, "25:00").semanasExtra, 4);
  assert.equal(lecturaPrueba(p, "25:01").semanasExtra, 8);
  assert.match(dia(8, "Domingo").what, /23:30/, "el texto del plan y la cuenta tienen que decir lo mismo");
});

test("el dia D dice si se consiguio", () => {
  const p = dia(11, "Domingo").prueba;
  assert.equal(lecturaPrueba(p, "33:15").tono, "bien");
  assert.equal(lecturaPrueba(p, "33:40").tono, "ajuste");
});

test("la prueba de partida no se cronometra, y lo ilegible se dice", () => {
  assert.equal(lecturaPrueba(dia(1, "Domingo").prueba, "25:00"), null);
  assert.ok(lecturaPrueba(dia(4, "Jueves").prueba, "no sé").error);
});

test("el ritmo de las series se compara con lo pedido y con la vez anterior", () => {
  const s6 = dia(6, "Jueves"), s7 = dia(7, "Jueves");
  const primera = lecturaRitmo(s6, "4:50", []);
  assert.equal(primera.dif, 5);
  assert.match(primera.detalle, /Primera sesión/);
  const segunda = lecturaRitmo(s7, "4:44/km", [{ isoDate: s6.isoDate, ritmo: 290 }]);
  assert.equal(segunda.tono, "bien");
  assert.match(segunda.detalle, /0:06\/km más rápido/);
  assert.equal(lecturaRitmo(dia(2, "Martes"), "6:30", []), null, "un rodaje suave no tiene ritmo que comparar");
});

test("cada ejercicio se compara con la ultima vez que se hizo", () => {
  const s2mie = dia(2, "Miercoles"), s3mie = dia(3, "Miercoles");
  const pesos = {
    [s2mie.isoDate]: { 0: { 0: "8", 1: "9" } },   // laterales polea
    [s3mie.isoDate]: { 0: { 0: "10" } },
  };
  const c = comparativaFuerza(s3mie, pesos, FLAT_DAYS);
  assert.equal(c[0].nombre, s2mie.ejercicios[0].nombre);
  assert.equal(c[0].hoy, 10);
  assert.equal(c[0].antes.v, 9);
  assert.equal(c[1].hoy, null, "sin peso apuntado hoy no se inventa nada");
});

test("la copia toca cada 7 dias, y no si no hay nada que perder", () => {
  assert.deepEqual(copiaPendiente(null, "2026-09-22", false), { toca: false, dias: null });
  assert.equal(copiaPendiente(null, "2026-09-22", true).toca, true);
  assert.equal(copiaPendiente("2026-09-20", "2026-09-26", true).toca, false);
  assert.equal(copiaPendiente("2026-09-20", "2026-09-27", true).toca, true);
});

test("la medicion toca cada 14 dias desde el inicio", () => {
  assert.equal(diasParaMedir(FECHA_INICIO, FECHA_INICIO), 0);
  assert.equal(diasParaMedir(FECHA_INICIO, "2026-09-22"), 13);
  assert.equal(diasParaMedir(FECHA_INICIO, "2026-10-05"), 0);
  assert.equal(diasParaMedir(FECHA_INICIO, "2026-09-20"), 1);
});
