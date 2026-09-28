/**
 * La cena a ojo: lo que queda del dia, en palmas, puños y pulgares.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { OBJETIVO_MACROS } from "../src/domain/nutricion/dias.js";
import { macrosDelDia, restoDelDia } from "../src/domain/nutricion/iifym.js";
import { apunteDePlato, enGramos, platoCena, textoPorcion } from "../src/domain/nutricion/plato.js";

const texto = (kcal, prot, hc, grasa, comida) => ({ comida, origen: "texto", texto: "x", kcal, prot, hc, grasa });
const desayuno = texto(430, 34, 45, 9, "desayuno");          // porridge
const cantinaFuerte = texto(1100, 45, 120, 45, "comida");     // macarrones + filete + pan + postre
const cantinaNormal = texto(750, 45, 75, 25, "comida");
const merienda = texto(175, 11, 24, 1, "merienda");

test("dia COMER, desayuno + comida normal + merienda: cena grande con hidrato", () => {
  const resto = restoDelDia(OBJETIVO_MACROS.comer, [desayuno, cantinaNormal, merienda]);
  const p = platoCena(resto);
  assert.ok(p.porciones.hc >= 2, "puños de hidrato " + p.porciones.hc);
  assert.ok(p.porciones.prot >= 2, "palmas " + p.porciones.prot);
  assert.equal(p.aviso, null);
  assert.ok(Math.abs(p.macros.kcal - resto.kcal) <= 160, p.macros.kcal + " vs " + resto.kcal);
});

test("dia RECORTAR tras una cantina fuerte: poco o nada de hidrato en la cena", () => {
  const resto = restoDelDia(OBJETIVO_MACROS.recortar, [desayuno, cantinaFuerte, merienda]);
  const p = platoCena(resto);
  assert.ok(p.porciones.hc <= 0.5, "puños de hidrato " + p.porciones.hc);
  assert.ok(p.porciones.prot >= 1.5, "la proteina no se negocia: " + p.porciones.prot);
  assert.equal(p.porciones.verdura, 2);
  assert.ok(p.macros.kcal <= resto.kcal + 60, p.macros.kcal + " vs " + resto.kcal);
});

test("te has pasado: solo proteina y verdura, sin culpa", () => {
  const resto = restoDelDia(OBJETIVO_MACROS.recortar, [desayuno, texto(1800, 60, 200, 80, "comida")]);
  const p = platoCena(resto);
  assert.equal(p.aviso, "pasado");
  assert.equal(p.porciones.hc, 0);
  assert.equal(p.porciones.grasa, 0);
  assert.ok(p.porciones.prot > 0);
});

test("queda poco: cena ligera", () => {
  const p = platoCena({ kcal: 280, prot: 30, hc: 10, grasa: 5 });
  assert.equal(p.aviso, "ligera");
  assert.equal(p.porciones.hc, 0);
});

test("proteina muy corta: pide un extra", () => {
  const p = platoCena({ kcal: 900, prot: 110, hc: 60, grasa: 20 });
  assert.equal(p.porciones.prot, 3);
  assert.equal(p.extraProteina, true);
});

test("cené esto: el apunte suma con el resto del dia y el dia cierra cerca del objetivo", () => {
  const apuntes = [desayuno, cantinaNormal, merienda];
  const resto = restoDelDia(OBJETIVO_MACROS.comer, apuntes);
  const ap = apunteDePlato(platoCena(resto));
  assert.equal(ap.comida, "cena");
  assert.match(ap.texto, /palma/);
  const total = macrosDelDia([...apuntes, ap]);
  assert.ok(Math.abs(total.kcal - OBJETIVO_MACROS.comer.kcal) <= 160, "dia en " + total.kcal);
  assert.ok(total.prot >= OBJETIVO_MACROS.comer.prot - 25, "proteina " + total.prot);
});

test("textos de porciones y gramos", () => {
  assert.equal(textoPorcion(1.5, "prot"), "1½ palmas");
  assert.equal(textoPorcion(0.5, "hc"), "½ puño");
  assert.equal(textoPorcion(2, "grasa"), "2 pulgares");
  const g = enGramos({ prot: 2, hc: 1, verdura: 2, grasa: 1 });
  assert.match(g[0].texto, /pollo o pavo \(crudo\) 260 g/);
  assert.match(g[0].texto, /6 huevos/);
  assert.match(g[1].texto, /arroz o pasta \(en crudo\) 40 g/);
});
