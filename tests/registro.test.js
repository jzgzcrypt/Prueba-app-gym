/**
 * Apuntar una serie tiene que ser un toque: lo que se propone sale de hoy, de
 * la ultima vez o del plan, en ese orden.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import {
  objetivoSerie, pasoPeso, sinCargaPorDefecto, descansoEntreSeries,
  ultimaVez, textoSeries, propuestaSerie, progresion,
} from "../src/domain/fuerza/registro.js";

test("lee lo que pide el plan en cada serie", () => {
  assert.deepEqual(objetivoSerie("3x12-15 (última al fallo)").reps, 12);
  assert.equal(objetivoSerie("3x10").reps, 10);
  assert.equal(objetivoSerie("3x15/lado").porLado, true);
  assert.equal(objetivoSerie("2x30s/lado").unidad, "s");
  assert.equal(objetivoSerie("2x30s/lado").reps, 30);
  assert.equal(objetivoSerie("3x5 (sin llegar al límite)").reps, 5);
  assert.equal(objetivoSerie("2xmax").reps, null);
});

test("todas las series del plan se pueden leer", () => {
  for (const wk of WEEKS) for (const d of wk.days) for (const e of d.ejercicios || []) {
    const o = objetivoSerie(e.series);
    assert.ok(o.reps != null, `S${wk.n} ${e.nombre}: "${e.series}"`);
  }
});

test("la barra sube de 2,5 en 2,5 y lo demas de 1 en 1", () => {
  assert.equal(pasoPeso("Press banca con barra"), 2.5);
  assert.equal(pasoPeso("Elevaciones laterales mancuerna"), 1);
});

test("lo que se hace sin carga no propone peso", () => {
  assert.ok(sinCargaPorDefecto("Sentadilla ATG sin peso"));
  assert.ok(sinCargaPorDefecto("Plancha lateral"));
  assert.ok(!sinCargaPorDefecto("Face pull en polea"));
  assert.equal(descansoEntreSeries({ grupo: "Core", nombre: "Plancha lateral" }), 60);
  assert.equal(descansoEntreSeries({ grupo: "Pecho", nombre: "Press banca con barra" }), 120);
});

const mie1 = WEEKS[0].days[2], mie2 = WEEKS[1].days[2];

test("la ultima vez se lee serie a serie, con peso y reps", () => {
  // S1 miercoles: laterales polea en el indice 2
  const pesos = { [mie1.isoDate]: { 2: { 0: "8", 1: "8", 2: "8" } } };
  const reps = { [mie1.isoDate]: { 2: { 0: 14, 1: 13, 2: 12 } } };
  const u = ultimaVez(mie2.ejercicios[0].nombre, mie2.isoDate, FLAT_DAYS, pesos, reps);
  assert.equal(u.isoDate, mie1.isoDate);
  assert.deepEqual(u.series.map(s => [s.peso, s.reps]), [[8, 14], [8, 13], [8, 12]]);
  assert.equal(textoSeries(u.series), "8 kg × 14, 13, 12");
  assert.equal(ultimaVez(mie2.ejercicios[0].nombre, mie1.isoDate, FLAT_DAYS, pesos, reps), null, "solo cuentan dias anteriores");
});

test("los pesos antiguos, sin reps, siguen contando", () => {
  const pesos = { [mie1.isoDate]: { 2: { 0: "8" } } };
  const u = ultimaVez(mie2.ejercicios[0].nombre, mie2.isoDate, FLAT_DAYS, pesos, {});
  assert.deepEqual(u.series, [{ peso: 8, reps: null }]);
  assert.equal(textoSeries(u.series), "8 kg × ?");
});

test("la propuesta sale de hoy, luego de la ultima vez, luego del plan", () => {
  const ultima = { series: [{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }] };
  const objetivo = { reps: 12 };
  assert.deepEqual(propuestaSerie({ si: 0, ultima, objetivo }), { peso: 8, reps: 14 });
  assert.deepEqual(propuestaSerie({ si: 1, pesosHoy: { 0: "9" }, repsHoy: { 0: 13 }, ultima, objetivo }), { peso: 9, reps: 12 });
  assert.deepEqual(propuestaSerie({ si: 0, pesosHoy: { 0: "10" }, repsHoy: { 0: 15 }, ultima, objetivo }), { peso: 10, reps: 15 });
  assert.deepEqual(propuestaSerie({ si: 0, objetivo }), { peso: null, reps: 12 });
  assert.deepEqual(propuestaSerie({ si: 4, ultima, objetivo }), { peso: 8, reps: 12 }, "mas series que la ultima vez: se repite la ultima");
});

test("progresar es mas peso, o el mismo peso con mas reps", () => {
  const antes = [{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }];
  assert.deepEqual(progresion([{ peso: 9, reps: 12 }], antes), { tipo: "peso", valor: 1 });
  assert.deepEqual(progresion([{ peso: 8, reps: 15 }, { peso: 8, reps: 13 }], antes), { tipo: "reps", valor: 2 });
  assert.equal(progresion([{ peso: 7, reps: 15 }], antes).tipo, "baja");
  assert.equal(progresion([{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }], antes).tipo, "igual");
  assert.equal(progresion([], antes), null);
});
