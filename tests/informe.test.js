/**
 * Tu mes: el informe mensual cuenta lo hecho, no lo planificado, y no inventa
 * lo que no se apunto.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import { fechaDeMedida, informeMensual, informePendiente, mesesDelBloque, nombreMes } from "../src/domain/progreso/informe.js";

const base = { dias: FLAT_DAYS, semanas: WEEKS, checked: {}, ritmoReal: {}, pesos: {}, reps: {}, medidas: [] };
const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);

test("los meses del bloque, hasta hoy", () => {
  assert.deepEqual(mesesDelBloque(FLAT_DAYS, "2026-09-25"), ["2026-09"]);
  assert.deepEqual(mesesDelBloque(FLAT_DAYS, "2026-11-02"), ["2026-09", "2026-10", "2026-11"]);
  assert.equal(nombreMes("2026-10", true), "Octubre");
});

test("cuenta lo hecho del mes: sesiones, minutos, series y kilos", () => {
  const mar = dia(1, "Martes"), mie = dia(1, "Miercoles"), jue = dia(1, "Jueves");
  const inf = informeMensual("2026-09", {
    ...base, hoyIso: "2026-10-10",
    checked: { [mar.isoDate]: true, [mie.isoDate]: true, [jue.isoDate]: true },
    pesos: { [mie.isoDate]: { 0: { 0: "8", 1: "8" } } },
    reps: { [mie.isoDate]: { 0: { 0: 12, 1: 10 } } },
  });
  assert.equal(inf.enCurso, false);
  assert.equal(inf.sesiones.hechas, 3);
  assert.equal(inf.sesiones.total, WEEKS[0].days.concat(WEEKS[1].days).filter(d => d.isoDate <= "2026-09-30" && d.tipo !== "libre").length);
  assert.equal(inf.minutosCorriendo, 25 + 25, "martes y jueves de S1, 25 min cada uno");
  assert.equal(inf.series, 2);
  assert.equal(inf.kilos, 8 * 12 + 8 * 10);
  assert.equal(inf.diasEntrenados, 3);
});

test("el mes en curso solo cuenta hasta hoy", () => {
  const inf = informeMensual("2026-09", { ...base, hoyIso: "2026-09-23" });
  assert.equal(inf.enCurso, true);
  assert.equal(inf.sesiones.total, 3, "lunes, martes y miercoles");
  assert.match(inf.frase, /aún no ha acabado/);
});

test("laterales: el peso al empezar y al acabar el mes", () => {
  const mie2 = dia(2, "Miercoles"), mie3 = dia(3, "Miercoles");
  const inf = informeMensual("2026-10", {
    ...base, hoyIso: "2026-11-02",
    pesos: { [dia(3, "Miercoles").isoDate]: { 0: { 0: "8" } }, [dia(6, "Miercoles").isoDate]: { 0: { 0: "10" } } },
  });
  assert.ok(mie2.isoDate < "2026-10-01" && mie3.isoDate < "2026-10-08");
  assert.deepEqual([inf.laterales.antes, inf.laterales.despues], [8, 10]);
  assert.match(inf.laterales.nombre, /laterales/i);
});

test("la cintura sale de las medidas del mes, nuevas (iso) o viejas (\"24 sept\")", () => {
  assert.equal(fechaDeMedida({ fecha: "24 sept" }, 2026), "2026-09-24");
  assert.equal(fechaDeMedida({ fecha: "03 oct" }, 2026), "2026-10-03");
  assert.equal(fechaDeMedida({ iso: "2026-10-05", fecha: "x" }, 2026), "2026-10-05");
  const inf = informeMensual("2026-10", {
    ...base, hoyIso: "2026-11-02",
    medidas: [{ fecha: "05 oct", cintura: 95 }, { iso: "2026-10-19", cintura: 93.5 }, { fecha: "24 sept", cintura: 96 }],
  });
  assert.deepEqual([inf.cintura.antes, inf.cintura.despues], [95, 93.5]);
});

test("sin datos no inventa nada", () => {
  const inf = informeMensual("2026-10", { ...base, hoyIso: "2026-11-02" });
  assert.equal(inf.laterales, null);
  assert.equal(inf.cintura, null);
  assert.equal(inf.planVsReal, null);
  assert.equal(inf.records.length, 0);
  assert.equal(inf.mejorRitmoSeries, null);
});

test("la frase cierra el mes sin culpar", () => {
  const todo = {};
  for (const d of FLAT_DAYS) if (d.isoDate.startsWith("2026-10") && d.tipo !== "libre") todo[d.isoDate] = true;
  assert.match(informeMensual("2026-10", { ...base, hoyIso: "2026-11-02", checked: todo }).frase, /^Mes redondo/);
  assert.match(informeMensual("2026-10", { ...base, hoyIso: "2026-11-02" }).frase, /^Noviembre empieza de cero/);
});

test("el informe del mes pasado se ofrece los 5 primeros dias", () => {
  assert.equal(informePendiente(FLAT_DAYS, "2026-10-03"), "2026-09");
  assert.equal(informePendiente(FLAT_DAYS, "2026-10-06"), null);
  assert.equal(informePendiente(FLAT_DAYS, "2026-09-03"), null, "antes del bloque no hay mes anterior");
});
