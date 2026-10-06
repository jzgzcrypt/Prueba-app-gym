/**
 * Mis comidas de partida y lo que se recomienda con lo que queda del dia.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { habitualesIniciales, recomendar } from "../src/domain/nutricion/recomendar.js";

const h = (id, kcal, prot) => ({ id, nombre: id, kcal, prot });

test("las comidas de partida salen del menu de casa, con macros y sin repetir", () => {
  const l = habitualesIniciales();
  assert.ok(l.length >= 8, "hay " + l.length);
  assert.equal(new Set(l.map(x => x.nombre)).size, l.length);
  const pollo = l.find(x => x.nombre === "Pollo con arroz y verdura");
  assert.ok(pollo && pollo.kcal > 500 && pollo.kcal < 1000 && pollo.prot > 35, JSON.stringify(pollo));
  for (const x of l) assert.ok(x.id && x.kcal > 0 && x.prot >= 0, x.nombre);
});

test("recomienda lo que cierra el día sin pasarse, proteína primero", () => {
  const mias = [h("pollo", 780, 55), h("pasta", 850, 25), h("batido", 300, 30), h("queso", 180, 25), h("pizza", 1400, 50)];
  const r = recomendar({ habituales: mias, quedan: { kcal: 900, prot: 60 } });
  assert.equal(r.length, 2);
  assert.ok(r[0].comidas.some(c => c.id === "pollo"), "la mejor lleva el pollo, que llega a la proteína");
  assert.ok(r[0].prot >= 55);
  for (const o of r) assert.ok(o.kcal <= 990, "no pasa de lo que queda +10 %");
  assert.ok(!r.some(o => o.comidas.some(c => c.id === "pizza")));
  const ids = r.flatMap(o => o.comidas.map(c => c.id));
  assert.equal(new Set(ids).size, ids.length, "las dos opciones no repiten comida");
});

test("si queda mucho, junta dos comidas", () => {
  const r = recomendar({ habituales: [h("pollo", 780, 55), h("batido", 300, 30), h("queso", 180, 25)], quedan: { kcal: 1100, prot: 85 } });
  assert.deepEqual(r[0].comidas.map(c => c.id).sort(), ["batido", "pollo"]);
});

test("queda poco o nada cabe: no recomienda", () => {
  assert.deepEqual(recomendar({ habituales: [h("pollo", 780, 55)], quedan: { kcal: 100, prot: 10 } }), []);
  assert.deepEqual(recomendar({ habituales: [h("pollo", 780, 55)], quedan: { kcal: 400, prot: 30 } }), []);
  assert.deepEqual(recomendar({ habituales: [], quedan: { kcal: 900, prot: 60 } }), []);
});

test("no junta dos comidas del mismo momento del menú", () => {
  const mias = [{ id: "comer-comida", kcal: 760, prot: 53 }, { id: "recortar-comida", kcal: 650, prot: 60 }, { id: "comer-precama", kcal: 118, prot: 20 }];
  const r = recomendar({ habituales: mias, quedan: { kcal: 1450, prot: 115 } });
  for (const o of r) assert.ok(!(o.comidas.length === 2 && o.comidas.every(c => c.id.endsWith("-comida"))), JSON.stringify(o.comidas));
});

test("si ya has desayunado, no propone otro desayuno", () => {
  const mias = [{ id: "comer-desayuno", kcal: 500, prot: 32 }, { id: "recortar-desayuno", kcal: 630, prot: 45 }, { id: "comer-cena", kcal: 640, prot: 31 }];
  const r = recomendar({ habituales: mias, quedan: { kcal: 700, prot: 50 }, yaComidas: ["comer-desayuno"] });
  assert.ok(r.length > 0);
  for (const o of r) assert.ok(!o.comidas.some(c => c.id.endsWith("-desayuno")), JSON.stringify(o.comidas));
});
