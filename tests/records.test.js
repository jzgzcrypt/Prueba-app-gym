/**
 * Records, resumen de la semana y ritmos ajustados a las pruebas.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import { mejorSerie, recordsDelDia, tablaRecords } from "../src/domain/fuerza/registro.js";
import { resumenSemana, textoResumen } from "../src/domain/progreso/resumen.js";
import { ritmoDelDia, ultimaPrueba } from "../src/domain/running/adaptar.js";

const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);
const mie1 = dia(1, "Miercoles"), mie2 = dia(2, "Miercoles"), mie3 = dia(3, "Miercoles");
// Laterales polea: indice 2 en S1, indice 0 en S2 y S3.
const LAT = mie2.ejercicios[0].nombre;

test("la mejor serie es la de mas peso, y a igual peso la de mas reps", () => {
  assert.deepEqual(mejorSerie([{ peso: 8, reps: 14 }, { peso: 9, reps: 10 }, { peso: 9, reps: 12 }]), { peso: 9, reps: 12 });
  assert.equal(mejorSerie([]), null);
});

test("record de peso, record de reps, y la primera vez no cuenta", () => {
  const pesos = { [mie1.isoDate]: { 2: { 0: "8" } }, [mie2.isoDate]: { 0: { 0: "8" } }, [mie3.isoDate]: { 0: { 0: "9" } } };
  const reps = { [mie1.isoDate]: { 2: { 0: 12 } }, [mie2.isoDate]: { 0: { 0: 14 } }, [mie3.isoDate]: { 0: { 0: 10 } } };
  assert.deepEqual(recordsDelDia(mie1, FLAT_DAYS, pesos, reps), [], "primera vez");
  assert.deepEqual(recordsDelDia(mie2, FLAT_DAYS, pesos, reps).map(r => [r.nombre, r.tipo]), [[LAT, "reps"]]);
  const r3 = recordsDelDia(mie3, FLAT_DAYS, pesos, reps);
  assert.equal(r3[0].tipo, "peso");
  assert.equal(r3[0].texto, "9 kg × 10 reps");
  const tabla = tablaRecords(FLAT_DAYS, pesos, reps).find(t => t.nombre === LAT);
  assert.deepEqual([tabla.peso, tabla.reps, tabla.isoDate], [9, 10, mie3.isoDate]);
});

test("peor que antes no es record", () => {
  const pesos = { [mie1.isoDate]: { 2: { 0: "10" } }, [mie2.isoDate]: { 0: { 0: "9" } } };
  assert.deepEqual(recordsDelDia(mie2, FLAT_DAYS, pesos, {}), []);
});

test("el resumen cuenta lo hecho, no lo planificado", () => {
  const s = WEEKS[1];
  const checked = { [dia(2, "Lunes").isoDate]: true, [dia(2, "Martes").isoDate]: true, [mie2.isoDate]: true };
  const pesos = { [mie2.isoDate]: { 0: { 0: "8", 1: "8" } } };
  const r = resumenSemana(s, { checked, ritmoReal: {}, pesos, reps: {} }, FLAT_DAYS);
  assert.equal(r.sesiones.hechas, 3);
  assert.equal(r.sesiones.total, 7);
  assert.equal(r.minutosCorriendo, 20, "solo el martes, que se hizo");
  assert.equal(r.series, 2);
  assert.equal(r.completa, false);
  assert.match(textoResumen(r, "Base 7K"), /^Semana 2 · Base 7K\n3\/7 sesiones/);
});

const s4 = dia(4, "Jueves"), s5 = dia(5, "Jueves"), s6 = dia(6, "Jueves"), s8 = dia(8, "Domingo"), s9 = dia(9, "Jueves");

test("sin prueba, las series van al ritmo del plan", () => {
  assert.deepEqual(ritmoDelDia(s6, FLAT_DAYS, {}), { ritmo: 285, plan: 285, ajustado: false, fuente: null });
});

test("si la prueba va por detras, las series se ajustan a tu ritmo de hoy", () => {
  const ritmoReal = { [s4.isoDate]: "15:30" }; // 3 km a 5:10
  const r6 = ritmoDelDia(s6, FLAT_DAYS, ritmoReal);
  assert.equal(r6.ajustado, true);
  assert.ok(r6.ritmo > 310 && r6.ritmo < 330, "ritmo de 5 km equivalente: " + r6.ritmo);
  const r5 = ritmoDelDia(s5, FLAT_DAYS, ritmoReal);
  assert.equal(r5.ritmo, 305, "400 m: ritmo de 3 km (5:10) menos 5 s");
});

test("si la prueba va por delante, se mantiene el plan: no se acelera por una cuenta", () => {
  const r = ritmoDelDia(s6, FLAT_DAYS, { [s4.isoDate]: "13:30" });
  assert.equal(r.ritmo, 285);
  assert.equal(r.ajustado, false);
});

test("manda la ultima prueba, y el dia D no se toca", () => {
  const ritmoReal = { [s4.isoDate]: "16:00", [s8.isoDate]: "23:20" };
  assert.equal(ultimaPrueba(s9.isoDate, FLAT_DAYS, ritmoReal).isoDate, s8.isoDate);
  assert.equal(ritmoDelDia(s9, FLAT_DAYS, ritmoReal).ajustado, false, "23:20 en 5 km ya es 4:40/km");
  const diaD = dia(11, "Domingo");
  assert.equal(ritmoDelDia(diaD, FLAT_DAYS, { [s8.isoDate]: "26:00" }).ritmo, 285);
});

import { semanasCumplidas } from "../src/domain/progreso/resumen.js";

test("semanas cumplidas: jueves y domingo, sin castigar la semana en curso", () => {
  const j = (n) => WEEKS[n - 1].days[3].isoDate, d = (n) => WEEKS[n - 1].days[6].isoDate;
  const hoyS4 = WEEKS[3].days[1].isoDate; // martes de S4
  const ch = { [j(1)]: true, [d(1)]: true, [j(2)]: true, [d(2)]: true, [j(3)]: true, [d(3)]: true };
  assert.equal(semanasCumplidas(WEEKS, ch, hoyS4), 3, "S4 en curso no corta la cuenta");
  assert.equal(semanasCumplidas(WEEKS, { ...ch, [d(2)]: false }, hoyS4), 1, "S2 incompleta corta");
  assert.equal(semanasCumplidas(WEEKS, { ...ch, [j(4)]: true, [d(4)]: true }, WEEKS[3].days[6].isoDate), 4);
  assert.equal(semanasCumplidas(WEEKS, {}, hoyS4), 0);
});
