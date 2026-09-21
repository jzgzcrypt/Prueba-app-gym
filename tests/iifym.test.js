/**
 * El sistema de macros: apuntar por encima lo que has comido y que salga una
 * cena que cuadre el dia. Lo que se prueba aqui es que las cuentas cierran,
 * porque un numero mal en la cena es un dia entero mal.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ALIMENTOS, ALIMENTO, cambiarPor, cantidadLegible, equivalentesDe, macrosDe } from "../src/domain/nutricion/alimentos.js";
import { PLATOS_CANTINA, macrosPlato, platosDe, SECCIONES_CANTINA } from "../src/domain/nutricion/cantina.js";
import { COMIDAS_RAPIDAS, macrosDelDia, restoDelDia } from "../src/domain/nutricion/iifym.js";
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
  assert.equal(new Set(COMIDAS_RAPIDAS.map(c => c.id)).size, COMIDAS_RAPIDAS.length);
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







test("las cantidades se dicen como se sirven", () => {
  assert.equal(cantidadLegible("huevo", 180), "3 huevos");
  assert.equal(cantidadLegible("huevo", 60), "1 huevo");
  assert.equal(cantidadLegible("arroz", 65), "65 g");
  assert.equal(cantidadLegible("no-existe", 50), "50 g");
  assert.equal(macrosDe("pollo", 0).kcal, 0);
});

test("cambiar un alimento por otro iguala el macro que lo define", () => {
  // Es la tabla de equivalencias del dietista, pero calculada en vez de a ojo.
  for (const [de, a, macro] of [["pollo", "pavo", "prot"], ["arroz", "pasta", "hc"], ["aceite", "aguacate", "grasa"]]) {
    const g = cambiarPor(de, 150, a);
    const antes = macrosDe(de, 150)[macro], despues = macrosDe(a, g)[macro];
    assert.ok(Math.abs(antes - despues) < antes * 0.12, `${de}->${a}: ${antes} vs ${despues}`);
  }
});

test("la verdura y la fruta se cambian a igualdad de gramos", () => {
  assert.equal(cambiarPor("verdura", 300, "brocoli"), 300);
  assert.equal(cambiarPor("fruta", 150, "frutos_rojos"), 150);
});

test("solo se ofrece cambiar por cosas del mismo grupo", () => {
  for (const id of ["pollo", "arroz", "verdura"]) {
    const grupo = ALIMENTO[id].grupo;
    const eq = equivalentesDe(id);
    assert.ok(eq.length > 0, id);
    for (const o of eq) { assert.equal(o.grupo, grupo); assert.notEqual(o.id, id); }
  }
});

test("cambiar por algo que no existe deja la cantidad como estaba", () => {
  assert.equal(cambiarPor("pollo", 170, "unicornio"), 170);
  assert.equal(cambiarPor("unicornio", 170, "pollo"), 170);
});

test("las calorías de cada plato cuadran con sus macros", () => {
  // Si un plato declara 130 kcal y sus macros suman 48, el día se descuadra en
  // silencio y nadie entiende por qué. Le pasaba a la caña: el alcohol no es
  // proteína, ni hidrato, ni grasa, pero sus calorías cuentan igual.
  for (const p of [...PLATOS_CANTINA, ...COMIDAS_RAPIDAS]) {
    const calculadas = p.prot * 4 + p.hc * 4 + p.grasa * 9;
    assert.ok(Math.abs(calculadas - p.kcal) <= Math.max(30, p.kcal * 0.12),
      `${p.id}: declara ${p.kcal} kcal y sus macros dan ${Math.round(calculadas)}`);
  }
});
