/**
 * Apuntar una serie tiene que ser un toque: lo que se propone sale de hoy, de
 * la ultima vez o del plan, en ese orden.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import {
  objetivoSerie, pasoPeso, sinCargaPorDefecto, descansoEntreSeries,
  ultimaVez, textoSeries, propuestaSerie, progresion, sugerenciaCarga,
} from "../src/domain/fuerza/registro.js";

test("lee lo que pide el plan en cada serie", () => {
  assert.deepEqual(objetivoSerie("3x12-15 (última al fallo)").reps, 12);
  assert.equal(objetivoSerie("3x10").reps, 10);
  assert.equal(objetivoSerie("3x15/lado").porLado, true);
  assert.equal(objetivoSerie("2x30s/lado").unidad, "s");
  assert.equal(objetivoSerie("2x30s/lado").reps, 30);
  assert.equal(objetivoSerie("3x5 (sin llegar al límite)").reps, 5);
  assert.equal(objetivoSerie("2xmax").reps, null);
  assert.equal(objetivoSerie("3x12-15 (última al fallo)").repsMax, 15);
  assert.equal(objetivoSerie("3x10").repsMax, 10);
  assert.equal(objetivoSerie("2x30s/lado").repsMax, 30);
});

test("todas las series del plan se pueden leer", () => {
  for (const wk of WEEKS) for (const d of wk.days) for (const e of d.ejercicios || []) {
    const o = objetivoSerie(e.series);
    assert.ok(o.reps != null, `S${wk.n} ${e.nombre}: "${e.series}"`);
  }
});

test("la barra sube de 2,5 en 2,5 y lo demas de 1 en 1", () => {
  assert.equal(pasoPeso("Press banca con barra"), 2.5);
  assert.equal(pasoPeso("Elevaciones laterales mancuerna"), 2, "mancuernas de 2 en 2 en su gimnasio");
  assert.equal(pasoPeso("Elevaciones laterales polea muñequera cruzadas"), 1);
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

test("la primera serie trae lo que decide la app; las demas siguen el peso de hoy", () => {
  const objetivo = { reps: 12, repsMax: 15 };
  const ultima = { series: [{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }] };
  assert.deepEqual(propuestaSerie({ si: 0, ultima, objetivo, nombre: "Laterales mancuerna" }), { peso: 8, reps: 15 }, "mantiene, a por una mas");
  assert.deepEqual(propuestaSerie({ si: 1, pesosHoy: { 0: "10" }, repsHoy: { 0: 13 }, ultima, objetivo }), { peso: 10, reps: 15 }, "si cambio el peso en la 1a, las demas lo siguen");
  assert.deepEqual(propuestaSerie({ si: 0, pesosHoy: { 0: "10" }, repsHoy: { 0: 15 }, ultima, objetivo }), { peso: 10, reps: 15 }, "lo ya apuntado manda");
  assert.deepEqual(propuestaSerie({ si: 0, objetivo }), { peso: null, reps: 12 });
});

const OBJ = { reps: 12, repsMax: 15, unidad: "rep" };
const sug = (series, nombre = "Elevaciones laterales mancuerna", objetivo = OBJ) =>
  sugerenciaCarga({ ultima: { series }, objetivo, nombre });

test("sube un escalon cuando llega al tope en todas, y vuelve al minimo", () => {
  const s = sug([{ peso: 8, reps: 15 }, { peso: 8, reps: 15 }, { peso: 8, reps: 16 }]);
  assert.equal(s.decision, "sube");
  assert.deepEqual([s.peso, s.reps], [10, 12], "mancuerna: +2 kg");
  assert.match(s.porque, /8 kg × 15, 15, 16/);
  assert.equal(sug([{ peso: 40, reps: 10 }], "Press banca con barra", { reps: 10, repsMax: 10 }).peso, 42.5);
  assert.equal(sug([{ peso: 20, reps: 15 }], "Face pull en polea", { reps: 15, repsMax: 15 }).peso, 21);
});

test("mantiene si no llega al tope en todas, a por una rep mas", () => {
  const s = sug([{ peso: 8, reps: 15 }, { peso: 8, reps: 13 }, { peso: 8, reps: 12 }]);
  assert.equal(s.decision, "mantiene");
  assert.deepEqual([s.peso, s.reps], [8, 15]);
  const t = sug([{ peso: 8, reps: 12 }, { peso: 8, reps: 12 }]);
  assert.equal(t.reps, 13);
});

test("baja si la mayoria no llega al minimo, pero nunca por debajo de un escalon", () => {
  const s = sug([{ peso: 10, reps: 9 }, { peso: 10, reps: 8 }, { peso: 10, reps: 12 }]);
  assert.equal(s.decision, "baja");
  assert.equal(s.peso, 8);
  assert.equal(sug([{ peso: 2, reps: 5 }, { peso: 2, reps: 5 }]).decision, "mantiene", "de 2 kg no se baja a 0");
});

test("primera vez, sin carga y sin reps apuntadas", () => {
  const p = sugerenciaCarga({ ultima: null, objetivo: OBJ, nombre: "x" });
  assert.equal(p.decision, "primera");
  assert.equal(p.reps, 12);
  const sc = sug([{ peso: null, reps: 10 }, { peso: null, reps: 9 }], "Sentadilla bulgara", { reps: 8, repsMax: 8 });
  assert.equal(sc.decision, "sin-carga");
  assert.equal(sc.reps, 11);
  const viejo = sug([{ peso: 8, reps: null }]);
  assert.equal(viejo.decision, "mantiene");
  assert.match(viejo.porque, /apunta/i);
});

test("progresar es mas peso, o el mismo peso con mas reps", () => {
  const antes = [{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }];
  assert.deepEqual(progresion([{ peso: 9, reps: 12 }], antes), { tipo: "peso", valor: 1 });
  assert.deepEqual(progresion([{ peso: 8, reps: 15 }, { peso: 8, reps: 13 }], antes), { tipo: "reps", valor: 2 });
  assert.equal(progresion([{ peso: 7, reps: 15 }], antes).tipo, "baja");
  assert.equal(progresion([{ peso: 8, reps: 14 }, { peso: 8, reps: 12 }], antes).tipo, "igual");
  assert.equal(progresion([], antes), null);
});
