/**
 * Apuntar en la app: a ojo, por kcal, lo de siempre, el resumen del dia y lo
 * que se le pasa al motor adaptativo. Y las ideas de que comer.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { apunteAOjo, apunteKcal, ingestaDelDia, loDeSiempre, repetir, resumenDia } from "../src/domain/nutricion/apuntar.js";
import { IDEAS, ideasPara, platoPara } from "../src/domain/nutricion/ideas.js";

const OBJ = { kcal: 2200, prot: 165, hc: 220, grasa: 70 };

test("a ojo: suma las manos y los extras, y lo describe", () => {
  const a = apunteAOjo("comida", { prot: 1, hc: 1, verdura: 2, grasa: 0 }, { pan: 1, bebida: 2 });
  assert.equal(a.kcal, 150 + 140 + 60 + 150 + 300);
  assert.equal(a.prot, 25 + 4 + 4 + 5 + 2);
  assert.match(a.texto, /1 palma · 1 puño · 2 puños · pan · 2 × bebida o cerveza/);
  assert.equal(apunteAOjo("cena", {}, {}), null, "nada no es un apunte");
});

test("por kcal: manda tu número; sin proteína, reparto de plato mixto", () => {
  const a = apunteKcal("merienda", 320, 25);
  assert.equal(a.kcal, 320);
  assert.equal(a.prot, 25);
  const b = apunteKcal("cena", 600);
  assert.equal(b.kcal, 600);
  assert.ok(b.prot > 20 && b.prot < 40);
  assert.equal(apunteKcal("cena", 0), null);
});

test("lo de siempre: lo más apuntado en esa comida, sin repetir, y la versión más reciente", () => {
  const porridge = { comida: "desayuno", origen: "ojo", texto: "porridge", kcal: 430, prot: 30, hc: 50, grasa: 9 };
  const log = {
    "2026-10-01": [porridge, { comida: "cena", texto: "tortilla", kcal: 500 }],
    "2026-10-02": [{ ...porridge }],
    "2026-10-03": [{ comida: "desayuno", texto: "tostadas", kcal: 380 }],
    "2026-10-04": [{ ...porridge, kcal: 440 }],
  };
  const s = loDeSiempre(log, "desayuno");
  assert.deepEqual(s.map(a => a.texto), ["porridge", "tostadas"]);
  assert.equal(s[0].kcal, 440);
  assert.deepEqual(loDeSiempre(log, "merienda"), []);
  const r = repetir(s[0], "desayuno");
  assert.equal(r.origen, "siempre");
  assert.equal(r.kcal, 440);
});

test("resumen del día: llevas, quedan y la siguiente comida", () => {
  const ap = [apunteKcal("desayuno", 400, 30), apunteKcal("comida", 800, 50)];
  const res = resumenDia(ap, OBJ);
  assert.equal(res.llevas.kcal, 1200);
  assert.equal(res.quedan.kcal, 1000);
  assert.equal(res.quedan.prot, 85);
  assert.equal(res.hechas, 2);
  assert.equal(res.siguiente, "merienda");
  assert.equal(res.porComida.cena, null);
  // Un apunte antiguo (escrito o de la tabla) también suma.
  const antiguo = resumenDia([{ comida: "comida", origen: "texto", texto: "x", kcal: 500, prot: 30, hc: 50, grasa: 15 }], OBJ);
  assert.equal(antiguo.llevas.kcal, 500);
});

test("al motor: el día cuenta con 3 comidas o con el cierre antiguo; a medias, no", () => {
  const dos = [apunteKcal("desayuno", 400), apunteKcal("comida", 800)];
  assert.equal(ingestaDelDia(dos), null);
  assert.equal(ingestaDelDia([...dos, apunteKcal("cena", 700)]), 1900);
  assert.equal(ingestaDelDia([{ comida: "dia", kcal: 2100 }]), 2100);
  assert.equal(ingestaDelDia([]), null);
});

test("ideas: una cena con mucha proteína pendiente da platos con proteína de verdad", () => {
  const plato = platoPara("cena", { kcal: 750, prot: 60, hc: 50, grasa: 20 });
  const ideas = ideasPara(plato.porciones, "cena");
  assert.equal(ideas.length, 3);
  for (const i of ideas) assert.ok(i.porciones.prot >= 1.5, i.nombre);
});

test("ideas: la merienda solo da meriendas, y si no queda nada, cosas ligeras", () => {
  const plato = platoPara("merienda", { kcal: 1000, prot: 80, hc: 100, grasa: 30 });
  const ideas = ideasPara(plato.porciones, "merienda");
  for (const i of ideas) assert.ok(i.momentos.includes("merienda"), i.nombre);
  const pasado = platoPara("cena", { kcal: 50, prot: 30, hc: 0, grasa: 0 });
  assert.equal(pasado.aviso, "pasado");
  for (const i of ideasPara(pasado.porciones, "cena")) assert.ok(i.macros.kcal <= 400, i.nombre + " " + i.macros.kcal);
  // Todas las ideas tienen momento y raciones.
  for (const i of IDEAS) assert.ok(i.momentos.length && i.porciones.prot != null);
});

test("ideas: se ajustan a lo que toca, para no dejar medio día sin comer", () => {
  const plato = platoPara("cena", { kcal: 950, prot: 44, hc: 120, grasa: 25 });
  for (const i of ideasPara(plato.porciones, "cena")) {
    assert.ok(Math.abs(i.macros.kcal - plato.macros.kcal) <= 220, i.nombre + ": " + i.macros.kcal + " frente a " + plato.macros.kcal);
  }
});
