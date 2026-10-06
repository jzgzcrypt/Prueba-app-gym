/**
 * Lo que toca correr en un rodaje, la cuenta atras y la frase de cada km.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { avisosCuentaAtras, fraseFin, objetivoCarrera, suaveHabitual, vozDelKm } from "../src/domain/running/objetivo.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const run = (what, extra = {}) => ({ tipo: "run", cat: "runZ2", what, ...extra });

test("lee lo que hay que correr, sin el calentamiento", () => {
  assert.deepEqual(objetivoCarrera(run("16 min corriendo muy suave, pudiendo hablar.")),
    { tipo: "min", seg: 960, texto: "16 min corriendo muy suave, pudiendo hablar", resto: null });
  assert.deepEqual(objetivoCarrera(run("10 min suave + 4x100m progresivos. No hay sesión de calidad.")),
    { tipo: "min", seg: 600, texto: "10 min suave", resto: "4x100m progresivos" });
  const km = objetivoCarrera(run("5 km muy suave. Ya está todo hecho."));
  assert.equal(km.tipo, "km"); assert.equal(km.m, 5000);
  assert.equal(objetivoCarrera(run("40 min suave continuo (~6 km). Primera tirada larga.")).seg, 2400);
});

test("series y pruebas no son rodajes", () => {
  assert.equal(objetivoCarrera(run("6x[90s correr / 2min caminar].", { intervalos: [{}] })), null);
  assert.equal(objetivoCarrera({ tipo: "test", what: "15 min suave + 3 progresivos. Luego 3 km a tope", prueba: { distKm: 3 } }), null);
  assert.equal(objetivoCarrera({ tipo: "fuerza", what: "45 min" }), null);
});

test("todos los rodajes continuos del plan se entienden", () => {
  const continuos = FLAT_DAYS.filter(d => d.tipo === "run" && !d.intervalos && !d.prueba);
  assert.ok(continuos.length > 15);
  for (const d of continuos) {
    const o = objetivoCarrera(d);
    assert.ok(o, d.what);
    if (o.tipo === "min") assert.ok(o.seg >= 300 && o.seg <= 3600, d.what);
  }
});

test("cuenta atrás: mitad, último minuto, 3-2-1 y hecho, cada uno una vez", () => {
  const total = 960, dichos = [];
  for (let s = 0; s < total + 5; s++) dichos.push(...avisosCuentaAtras(total, s, s + 1).map(a => a.id));
  assert.deepEqual(dichos, ["mitad", "ultimo", "c3", "c2", "c1", "fin"]);
  assert.deepEqual(avisosCuentaAtras(960, 470, 490).map(a => a.id), ["mitad"], "un salto de varios segundos no se pierde el aviso");
  assert.deepEqual(avisosCuentaAtras(120, 0, 200).map(a => a.id), ["c3", "c2", "c1", "fin"], "en un rodaje corto no hay mitad ni último minuto");
  assert.ok(avisosCuentaAtras(960, 959, 960).find(a => a.fin));
  assert.deepEqual(avisosCuentaAtras(5000, 0, 5001, true).map(a => a.texto || a.id), ["Mitad hecha.", "Último kilómetro.", "fin"], "por distancia");
});

test("la frase del final dice lo que sigue", () => {
  assert.equal(fraseFin({ tipo: "min", seg: 960 }), "¡Hecho! 16 minutos. Ya puedes parar.");
  assert.equal(fraseFin({ tipo: "min", seg: 600, resto: "4x100m progresivos" }), "¡Hecho! 10 minutos. Ahora 4x100m progresivos.");
  assert.equal(fraseFin({ tipo: "km", m: 5000 }), "¡Hecho! 5 kilómetros. Ya puedes parar.");
});

test("la voz de cada km: con objetivo, en un día suave y sin nada", () => {
  assert.equal(vozDelKm({ km: 1, segKm: 402 }), "Kilómetro 1 en 6 42.");
  assert.equal(vozDelKm({ km: 2, segKm: 281, objetivo: 285 }), "Kilómetro 2 en 4 41. En el objetivo.");
  assert.equal(vozDelKm({ km: 3, segKm: 276, objetivo: 285 }), "Kilómetro 3 en 4 36. 9 segundos más rápido que el objetivo.");
  assert.equal(vozDelKm({ km: 3, segKm: 296, objetivo: 285 }), "Kilómetro 3 en 4 56. 11 segundos más lento que el objetivo.");
  assert.match(vozDelKm({ km: 1, segKm: 375, objetivo: 402, suave: true }), /27 segundos más rápido que tu suave: suelta un poco/);
  assert.match(vozDelKm({ km: 1, segKm: 390, objetivo: 402, suave: true }), /Algo más rápido que tu suave: bien si puedes hablar\.$/);
  assert.match(vozDelKm({ km: 1, segKm: 405, objetivo: 402, suave: true }), /Dentro de tu suave\.$/);
});

test("tu suave de siempre: media de los últimos rodajes suaves, sin series ni pruebas", () => {
  const dias = [
    { isoDate: "2026-09-27", cat: "runZ2" }, { isoDate: "2026-09-29", cat: "runZ2" },
    { isoDate: "2026-10-01", cat: "runQ" }, { isoDate: "2026-10-02", cat: "runZ2", intervalos: [{}] },
    { isoDate: "2026-10-04", cat: "runZ2" }, { isoDate: "2026-10-06", cat: "runZ2" },
  ];
  const ritmoReal = { "2026-09-27": "7:10/km", "2026-09-29": "7:08/km", "2026-10-01": "5:00/km", "2026-10-02": "6:00/km", "2026-10-04": "6:50/km", "2026-10-06": "6:40/km" };
  assert.equal(suaveHabitual({ dias, ritmoReal, antesDe: "2026-10-06" }), Math.round((410 + 428 + 430) / 3));
  assert.equal(suaveHabitual({ dias, ritmoReal: {}, antesDe: "2026-10-06" }), null);
});
