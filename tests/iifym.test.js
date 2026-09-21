/**
 * El sistema de macros: apuntar por encima lo que has comido y que salga una
 * cena que cuadre el dia. Lo que se prueba aqui es que las cuentas cierran,
 * porque un numero mal en la cena es un dia entero mal.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ALIMENTOS, ALIMENTO, cantidadLegible, macrosDe } from "../src/domain/nutricion/alimentos.js";
import { PLATOS_CANTINA, macrosPlato, platosDe, SECCIONES_CANTINA } from "../src/domain/nutricion/cantina.js";
import {
  COMIDAS_RAPIDAS, PLANTILLAS, TOPE_CENA, escalarPlato, estadoDelResto, generarComidas,
  macrosDelDia, repartirResto, restoDelDia,
} from "../src/domain/nutricion/iifym.js";
import { COMIDA, OBJETIVO_MACROS } from "../src/domain/nutricion/dias.js";

const MACROS = ["kcal", "prot", "hc", "grasa"];

test("los objetivos del dia cuadran con sus propios macros", () => {
  // Si las calorias declaradas no son las de los macros, todo lo demas miente.
  for (const [dia, o] of Object.entries(OBJETIVO_MACROS)) {
    const calculadas = o.prot * 4 + o.hc * 4 + o.grasa * 9;
    assert.ok(Math.abs(calculadas - o.kcal) < 30, `${dia}: ${calculadas} vs ${o.kcal}`);
  }
});

test("la proteina no cambia entre comer y recortar; el carbohidrato si", () => {
  // Es la regla entera del bloque: la palanca es el HC, nunca la proteina.
  assert.equal(OBJETIVO_MACROS.comer.prot, OBJETIVO_MACROS.recortar.prot);
  assert.ok(OBJETIVO_MACROS.comer.hc > OBJETIVO_MACROS.recortar.hc + 50);
});

test("cada regla del dia lleva sus macros colgados", () => {
  assert.deepEqual(COMIDA.comer.macros, OBJETIVO_MACROS.comer);
  assert.deepEqual(COMIDA.recortar.macros, OBJETIVO_MACROS.recortar);
});

test("ningun alimento tiene macros imposibles", () => {
  for (const a of ALIMENTOS) {
    const calculadas = a.prot * 4 + a.hc * 4 + a.grasa * 9;
    assert.ok(Math.abs(calculadas - a.kcal) <= Math.max(25, a.kcal * 0.2), `${a.id}: ${calculadas} vs ${a.kcal}`);
    assert.ok(a.paso > 0, `${a.id} sin paso de redondeo`);
  }
});

test("no hay ids repetidos", () => {
  assert.equal(new Set(ALIMENTOS.map(a => a.id)).size, ALIMENTOS.length);
  assert.equal(new Set(PLATOS_CANTINA.map(p => p.id)).size, PLATOS_CANTINA.length);
  assert.equal(new Set(PLANTILLAS.map(p => p.id)).size, PLANTILLAS.length);
  assert.equal(new Set(COMIDAS_RAPIDAS.map(c => c.id)).size, COMIDAS_RAPIDAS.length);
});

test("todas las plantillas usan alimentos que existen en casa", () => {
  // Una cena que pide algo que no tienes es una cena que acaba en pizza.
  for (const p of PLANTILLAS) {
    for (const campo of ["proteina", "carbo", "verdura", "grasa"]) {
      if (p[campo]) assert.ok(ALIMENTO[p[campo]], `${p.id}: no existe "${p[campo]}"`);
    }
    assert.ok(p.momentos.length > 0, `${p.id} sin momento`);
  }
});

test("cada seccion de la cantina tiene platos", () => {
  for (const s of SECCIONES_CANTINA) assert.ok(platosDe(s).length >= 3, s);
});

test("la racion multiplica todos los macros por igual", () => {
  const normal = macrosPlato("lentejas", "normal");
  const mucho = macrosPlato("lentejas", "mucho");
  for (const m of MACROS) assert.ok(Math.abs(mucho[m] - normal[m] * 1.5) < 0.01, m);
});

test("una racion desconocida se trata como normal en vez de romperse", () => {
  assert.deepEqual(macrosPlato("lentejas", "yo-que-se"), macrosPlato("lentejas", "normal"));
  assert.deepEqual(macrosPlato("no-existe", "normal"), { kcal: 0, prot: 0, hc: 0, grasa: 0 });
});

test("el dia sin apuntar es el objetivo entero", () => {
  for (const vacio of [[], null, undefined]) {
    assert.deepEqual(macrosDelDia(vacio), { kcal: 0, prot: 0, hc: 0, grasa: 0 });
    assert.deepEqual(restoDelDia(OBJETIVO_MACROS.comer, vacio), OBJETIVO_MACROS.comer);
  }
});

test("mezcla casa, cantina y comidas de un toque en la misma cuenta", () => {
  const total = macrosDelDia([
    { origen: "rapida", id: "porridge" },
    { origen: "cantina", id: "pollo_plancha", racion: "normal" },
    { origen: "casa", id: "arroz", gramos: 100 },
  ]);
  assert.ok(total.kcal > 1000 && total.kcal < 1200, String(total.kcal));
  assert.ok(total.prot > 80, String(total.prot));
});

test("un apunte roto no tira la cuenta abajo", () => {
  const total = macrosDelDia([null, {}, { origen: "casa", id: "no-existe", gramos: 100 }, { origen: "cantina", id: "p_fruta", racion: "normal" }]);
  assert.equal(Math.round(total.kcal), 80);
});

test("si el dia ya esta comido, no se inventa una cena", () => {
  const resto = restoDelDia(OBJETIVO_MACROS.recortar, [
    { origen: "rapida", id: "porridge" },
    { origen: "cantina", id: "pizza", racion: "mucho" },
    { origen: "cantina", id: "macarrones", racion: "mucho" },
    { origen: "cantina", id: "p_dulce", racion: "normal" },
  ]);
  assert.ok(resto.kcal < 150, String(resto.kcal));
  assert.equal(estadoDelResto(resto, OBJETIVO_MACROS.recortar).id, "pasado");
  assert.deepEqual(generarComidas(resto, { momento: "cena" }), []);
});

test("con las sobras justas tampoco se monta un plato de mentira", () => {
  // 200 kcal no son una cena: proponer un plato ahi seria fingir raciones.
  const resto = { kcal: 200, prot: 20, hc: 18, grasa: 6 };
  assert.equal(estadoDelResto(resto, OBJETIVO_MACROS.recortar).id, "justo");
  assert.deepEqual(generarComidas(resto, { momento: "cena" }), []);
});

test("cada plantilla escalada se acerca al objetivo que se le pide", () => {
  const objetivo = { kcal: 800, prot: 55, hc: 80, grasa: 28 };
  for (const p of PLANTILLAS) {
    const plato = escalarPlato(p, objetivo);
    assert.ok(plato.ingredientes.length >= 2, `${p.id} sale vacio`);
    for (const i of plato.ingredientes) assert.ok(i.gramos > 0 && i.cantidad, `${p.id}/${i.id}`);
    assert.ok(Math.abs(plato.desvio.kcal) < objetivo.kcal * 0.3, `${p.id} se desvia ${plato.desvio.kcal} kcal`);
  }
});

test("las cenas propuestas encajan de verdad en lo que queda", () => {
  // El nucleo de IIFYM: varias comidas distintas, la misma energia.
  for (const objetivo of [
    { kcal: 600, prot: 45, hc: 55, grasa: 22 },
    { kcal: 900, prot: 65, hc: 95, grasa: 30 },
    { kcal: 1200, prot: 80, hc: 130, grasa: 40 },
  ]) {
    const opciones = generarComidas(objetivo, { momento: "cena", cuantas: 3 });
    assert.equal(opciones.length, 3, `solo ${opciones.length} opciones para ${objetivo.kcal} kcal`);
    for (const o of opciones) {
      assert.ok(Math.abs(o.macros.kcal - objetivo.kcal) < objetivo.kcal * 0.15,
        `${o.nombre}: ${o.macros.kcal} para un objetivo de ${objetivo.kcal}`);
      assert.ok(o.macros.prot > objetivo.prot * 0.8, `${o.nombre} se queda corto de proteina`);
    }
  }
});

test("no propone tres veces la misma proteina", () => {
  const opciones = generarComidas({ kcal: 850, prot: 60, hc: 90, grasa: 30 }, { momento: "cena", cuantas: 3 });
  const proteinas = opciones.map(o => o.ingredientes[0].id);
  assert.equal(new Set(proteinas).size, proteinas.length, proteinas.join(", "));
});

test("se puede pedir otra ronda distinta de la anterior", () => {
  const objetivo = { kcal: 850, prot: 60, hc: 90, grasa: 30 };
  const primera = generarComidas(objetivo, { momento: "cena", cuantas: 3 });
  const segunda = generarComidas(objetivo, { momento: "cena", cuantas: 3, excluir: primera.map(o => o.id) });
  assert.equal(segunda.length, 3);
  for (const o of segunda) assert.ok(!primera.some(p => p.id === o.id), o.nombre);
});

test("las cantidades se dicen como se sirven", () => {
  assert.equal(cantidadLegible("huevo", 180), "3 huevos");
  assert.equal(cantidadLegible("huevo", 60), "1 huevo");
  assert.equal(cantidadLegible("arroz", 65), "65 g");
  assert.equal(cantidadLegible("no-existe", 50), "50 g");
  assert.equal(macrosDe("pollo", 0).kcal, 0);
});

test("una cena nunca es el día entero metido en un plato", () => {
  // Con 1.300 kcal por delante proponia 260 g de gambas: nadie cena eso.
  const resto = { kcal: 1300, prot: 110, hc: 150, grasa: 45 };
  const { objetivo, reservado } = repartirResto(resto);
  assert.ok(objetivo.kcal <= TOPE_CENA + 1, String(objetivo.kcal));
  assert.equal(reservado.kcal, Math.round(resto.kcal - objetivo.kcal));
  // El reparto es proporcional: la cena sigue equilibrada.
  for (const m of ["prot", "hc", "grasa"]) {
    assert.ok(Math.abs(objetivo[m] / resto[m] - objetivo.kcal / resto.kcal) < 0.001, m);
  }
  for (const o of generarComidas(objetivo, { momento: "cena", cuantas: 3 })) {
    assert.ok(o.macros.kcal < TOPE_CENA * 1.15, `${o.nombre}: ${o.macros.kcal} kcal`);
  }
});

test("si lo que queda ya cabe en una cena, no se aparta nada", () => {
  const resto = { kcal: 700, prot: 55, hc: 70, grasa: 24 };
  const { objetivo, reservado } = repartirResto(resto);
  assert.equal(reservado, null);
  assert.deepEqual(objetivo, resto);
});
