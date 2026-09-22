/**
 * Escribir lo que has comido.
 *
 * La regla que gobierna todo esto: MANDA LO QUE ESCRIBES. Si pones un número
 * de calorías, ese es el número. Las tablas solo rellenan lo que tú no dices.
 * Y si no se entiende nada, se dice — nunca se cuela un cero.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { interpretar, normalizar, reconocer, reconocerTodos, totalDe, trocear } from "../src/domain/nutricion/escribir.js";
import { macrosDelDia } from "../src/domain/nutricion/iifym.js";

const una = (t) => interpretar(t)[0];

test("las calorías que escribes mandan sobre cualquier tabla", () => {
  const l = una("macarrones con tomate 450 kcal");
  assert.equal(l.macros.kcal, 450);
  assert.equal(l.confianza, "escrito");
  // Y los macros salen de la ficha del plato, ajustados a ESAS calorías.
  assert.ok(l.macros.hc > l.macros.prot, JSON.stringify(l.macros));
});

test("si escribes los macros enteros, no se toca ninguno", () => {
  const l = una("pizza 800 kcal, 30 p, 90 c, 35 g de grasa");
  assert.deepEqual(l.macros, { kcal: 800, prot: 30, hc: 90, grasa: 35 });
  assert.equal(l.confianza, "escrito");
});

test("sin calorías, se calcula con la tabla", () => {
  const l = una("200 g de pollo");
  assert.equal(l.confianza, "tabla");
  assert.equal(l.gramos, 200);
  assert.ok(l.macros.prot > 40, String(l.macros.prot));
});

test('"200 g de pollo" es pechuga pesada, no el plato del comedor', () => {
  // Si dices cuánto, estás pesando un ingrediente. Confundirlo con la ración
  // del comedor daba 149 kcal para 200 g de pollo.
  const l = una("200 g de pollo");
  assert.ok(l.macros.kcal > 190 && l.macros.kcal < 250, String(l.macros.kcal));
  // Y "pollo" a secas sí es una ración de algo.
  assert.ok(una("pollo").macros.kcal > 200);
});

test("un número con g a secas es cantidad, nunca grasa", () => {
  // El error que haría que 200 g de pollo contaran como 200 g de grasa.
  const l = una("200 g de pollo");
  assert.ok(l.macros.grasa < 15, String(l.macros.grasa));
});

test("las unidades que también son comida cuentan dos veces", () => {
  // "2 huevos" dice cuánto Y qué. Si la unidad se borra del texto al leer la
  // cantidad, no queda nada que reconocer.
  const huevos = una("2 huevos");
  assert.notEqual(huevos.confianza, "sin-entender");
  assert.equal(huevos.gramos, 120);
  assert.ok(huevos.macros.prot > 10, String(huevos.macros.prot));

  const yogur = una("1 yogur");
  assert.ok(yogur.macros.kcal > 50, "un yogur no puede ser un tercio de yogur: " + yogur.macros.kcal);
});

test("varias cosas en una frase se cuentan todas", () => {
  // Contar solo las patatas de "merluza con patatas" es peor que no contar.
  const l = una("merluza a la plancha con patatas");
  assert.ok(l.nombre.includes("+"), l.nombre);
  assert.ok(l.macros.prot > 12, String(l.macros.prot));
  assert.equal(reconocerTodos("merluza a la plancha con patatas").length, 2);
});

test("una línea por cosa, y las comas también separan", () => {
  assert.equal(interpretar("filete de ternera, un panecillo").length, 2);
  assert.equal(interpretar("lentejas\npollo\nfruta").length, 3);
  assert.equal(interpretar("lentejas y un filete").length, 2);
});

test("un número suelto detrás no es otra comida", () => {
  // "macarrones, 450 kcal, 12 p" es un plato, no tres.
  assert.equal(interpretar("macarrones con tomate, 450 kcal, 12 p").length, 1);
  assert.deepEqual(trocear("pollo, 300 kcal"), ["pollo, 300 kcal"]);
});

test("lo que no se reconoce, con calorías, se estima y se avisa", () => {
  const l = una("chuletillas de cordero 600 kcal");
  assert.equal(l.macros.kcal, 600);
  assert.equal(l.confianza, "estimado");
  assert.ok(l.aviso, "estima sin decirlo");
  // El reparto tiene que sumar aproximadamente esas calorías.
  const suman = l.macros.prot * 4 + l.macros.hc * 4 + l.macros.grasa * 9;
  assert.ok(Math.abs(suman - 600) < 60, String(suman));
});

test("lo que no se entiende no cuela un cero: lo dice", () => {
  const l = una("un poco de lo que hizo mi madre");
  assert.equal(l.confianza, "sin-entender");
  assert.equal(l.macros.kcal, 0);
  assert.ok(l.aviso.includes("calorías"), l.aviso);
});

test("el nombre que se enseña no arrastra el 'me he comido'", () => {
  assert.equal(una("me he comido un donut 300 kcal").nombre, "donut");
});

test("un texto vacío no da líneas ni rompe", () => {
  for (const vacio of ["", "   ", "\n\n", null, undefined]) {
    assert.deepEqual(interpretar(vacio), []);
  }
  assert.deepEqual(totalDe([]), { kcal: 0, prot: 0, hc: 0, grasa: 0 });
});

test("el total es la suma de lo escrito", () => {
  const lineas = interpretar("macarrones con tomate 450 kcal\nfilete de ternera\nun panecillo");
  const total = totalDe(lineas);
  assert.equal(total.kcal, lineas.reduce((t, l) => t + l.macros.kcal, 0));
  assert.ok(total.kcal > 800, String(total.kcal));
});

test("lo apuntado a mano guarda sus propios números", () => {
  // Se guardan tal y como se entendieron: si mañana cambio el intérprete, lo
  // que apuntaste en marzo tiene que seguir diciendo lo mismo.
  const m = macrosDelDia([
    { origen: "texto", texto: "macarrones", kcal: 450, prot: 14, hc: 70, grasa: 12 },
    { origen: "texto", texto: "filete", kcal: 320, prot: 40, hc: 0, grasa: 17 },
  ]);
  assert.deepEqual(m, { kcal: 770, prot: 54, hc: 70, grasa: 29 });
});

test("un apunte escrito a medias no rompe la cuenta del día", () => {
  const m = macrosDelDia([{ origen: "texto", texto: "algo" }, { origen: "texto", kcal: 100 }]);
  assert.equal(m.kcal, 100);
  assert.ok(Number.isFinite(m.prot));
});

test("mayúsculas, tildes y comas decimales dan igual", () => {
  assert.equal(normalizar("Macarrones CON Tomate"), "macarrones con tomate");
  assert.equal(una("PLÁTANO").confianza, "tabla");
  assert.equal(una("Tarta 350,5 kcal").macros.kcal, 351);
});

test("reconocer devuelve null cuando no hay nada que reconocer", () => {
  assert.equal(reconocer(""), null);
  assert.equal(reconocer("   de la y "), null);
  assert.deepEqual(reconocerTodos(""), []);
});
