/**
 * Invariantes del bloque de entrenamiento.
 *
 * El plan es datos escritos a mano, y ya ha fallado una vez de la peor forma
 * posible: el tenis de los lunes estaba en 3 de 11 semanas y nadie lo detecto
 * durante semanas. Estos tests son el detector.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKS, FLAT_DAYS, FECHA_INICIO, FECHA_FIN, colisiones } from "../src/domain/plan/calendario.js";
import { BLOQUE } from "../src/domain/plan/bloque-1-base-7k.js";
import { COMPROMISOS } from "../src/domain/compromisos.js";

/** El RPE viene como "3/10", "7-8/10" o "2-3/10": el esfuerzo es lo que va
 *  ANTES de la barra, y de un rango se toma el extremo alto. */
function rpeMaximo(rpe) {
  const antesDeLaBarra = String(rpe || "0").split("/")[0];
  const numeros = antesDeLaBarra.match(/\d+/g) || ["0"];
  return Math.max(...numeros.map(Number));
}

const diaSemana = (iso) =>
  ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][new Date(iso + "T12:00:00Z").getUTCDay()];

test("el bloque tiene las semanas que dice tener, de 7 dias cada una", () => {
  assert.equal(WEEKS.length, BLOQUE.semanas);
  for (const wk of WEEKS) assert.equal(wk.days.length, 7, `la semana ${wk.n} no tiene 7 dias`);
  assert.equal(FLAT_DAYS.length, BLOQUE.semanas * 7);
});

test("todas las semanas van de lunes a domingo", () => {
  for (const wk of WEEKS) {
    assert.equal(diaSemana(wk.days[0].isoDate), "Lunes", `la semana ${wk.n} no empieza en lunes`);
    assert.equal(diaSemana(wk.days[6].isoDate), "Domingo", `la semana ${wk.n} no acaba en domingo`);
  }
});

test("los dias van correlativos, sin huecos ni repeticiones", () => {
  for (let i = 1; i < FLAT_DAYS.length; i++) {
    const salto = (new Date(FLAT_DAYS[i].isoDate) - new Date(FLAT_DAYS[i - 1].isoDate)) / 86400000;
    assert.equal(salto, 1, `salto de ${salto} dias antes de ${FLAT_DAYS[i].isoDate}`);
  }
  assert.equal(FLAT_DAYS[0].isoDate, FECHA_INICIO);
  assert.equal(FLAT_DAYS.at(-1).isoDate, FECHA_FIN);
});

test("ningun plan pisa un compromiso fijo", () => {
  // Este es el fallo que tuvo el plan de origen. Si vuelve, falla aqui.
  assert.deepEqual(colisiones, [], "hay sesiones programadas encima de un compromiso");
});

test("el compromiso aparece en su dia en TODAS las semanas", () => {
  for (const c of COMPROMISOS) {
    for (const wk of WEEKS) {
      const dia = wk.days[c.dow];
      assert.equal(dia.compromiso, c.id, `falta "${c.id}" en la semana ${wk.n}`);
      assert.equal(dia.tipo, "compromiso");
    }
  }
});

test("el dia despues del tenis nunca lleva intensidad alta", () => {
  // Las piernas vienen cargadas: es la regla que el plan tiene que respetar.
  for (const wk of WEEKS) {
    const martes = wk.days[2 - 1];
    if (martes.tipo !== "run") continue;
    const rpeMax = rpeMaximo(martes.rpe);
    assert.ok(rpeMax <= 5, `la semana ${wk.n} pone RPE ${martes.rpe} el dia despues del tenis`);
    assert.ok(!martes.esCalidad, `la semana ${wk.n} pone la sesion de calidad justo despues del tenis`);
  }
});

test("como mucho un dia de pierna por semana", () => {
  // La pierna compite en directo con el tenis: es el unico grupo recortado.
  for (const wk of WEEKS) {
    const n = wk.days.filter(d => d.cat === "pierna").length;
    assert.ok(n <= 1, `la semana ${wk.n} tiene ${n} dias de pierna`);
  }
});

test("la sesion de calidad, cuando la hay, cae 3 dias despues del tenis", () => {
  for (const wk of WEEKS) {
    const calidad = wk.days.filter(d => d.esCalidad);
    assert.ok(calidad.length <= 1, `la semana ${wk.n} tiene ${calidad.length} sesiones de calidad`);
    if (calidad.length) assert.equal(wk.days.indexOf(calidad[0]), 3, `en la semana ${wk.n} la calidad no cae en jueves`);
  }
});

test("todo dia de fuerza trae ejercicios, y todo dia de correr trae que hacer", () => {
  for (const wk of WEEKS) for (const d of wk.days) {
    if (d.tipo === "fuerza") assert.ok(d.ejercicios?.length, `${wk.n}/${d.dow}: dia de fuerza sin ejercicios`);
    if (d.tipo === "run") assert.ok(d.what, `${wk.n}/${d.dow}: dia de correr sin indicaciones`);
  }
});

test("el lector de RPE toma el esfuerzo, no el denominador", () => {
  // Un fallo aqui hace que el test de intensidad no detecte nada: leeria
  // siempre 10 y nunca saltaria. El detector tambien se comprueba.
  assert.equal(rpeMaximo("3/10"), 3);
  assert.equal(rpeMaximo("7-8/10"), 8);
  assert.equal(rpeMaximo("2-3/10"), 3);
  assert.equal(rpeMaximo(undefined), 0);
});
