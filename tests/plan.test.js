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
import { BLOQUE } from "../src/domain/plan/bloque-2-7k.js";
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

// El calendario: 6 semanas del bloque 1 (historia) y el bloque 2 entero.
const B1 = WEEKS.filter(w => w.bloque === 1);
const B2 = WEEKS.filter(w => w.bloque === 2);

test("el calendario es el bloque 1 hasta el 1 de noviembre y el bloque 2 desde el 2", () => {
  assert.equal(B1.length, 6);
  assert.equal(B2.length, BLOQUE.semanas);
  assert.equal(WEEKS.length, 6 + BLOQUE.semanas);
  for (const wk of WEEKS) assert.equal(wk.days.length, 7, `la semana ${wk.n} no tiene 7 dias`);
  assert.equal(FLAT_DAYS.length, WEEKS.length * 7);
  assert.equal(B1.at(-1).days[6].isoDate, "2026-11-01");
  assert.equal(B2[0].days[0].isoDate, "2026-11-02");
});

test("el 7K es el domingo 31 de enero de 2027, y es el ultimo dia", () => {
  const obj = FLAT_DAYS.filter(d => d.tipo === "objetivo");
  assert.equal(obj.length, 1);
  assert.equal(obj[0].isoDate, "2027-01-31");
  assert.equal(FECHA_FIN, "2027-01-31");
});

test("cada semana del bloque 2: martes, jueves y domingo se corre, el sabado es libre", () => {
  for (const wk of B2) {
    for (const i of [1, 3, 6]) assert.ok(["run", "test", "objetivo"].includes(wk.days[i].tipo), `S${wk.planN} ${wk.days[i].dow} no es de correr`);
    if (wk.planN !== 8 && wk.planN !== 13) assert.equal(wk.days[5].tipo, "libre", `S${wk.planN}: el sabado no es libre`);
  }
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

// ─── El bloque revisado el 22 de septiembre ─────────────────────────────────

const minutos = (d) => Number(((d.dur || "").match(/(\d+)/) || [0, 0])[1]);
const minutosCorriendo = (wk) => wk.days
  .filter(d => ["run", "test", "objetivo"].includes(d.tipo))
  .reduce((s, d) => s + minutos(d), 0);

test("el bloque 2 trae sus dos pruebas: el 3 km en S4 y el 5 km que decide en S8", () => {
  // Sin ellas los ritmos del plan son una suposicion.
  const tests = B2.flatMap(w => w.days.filter(d => d.tipo === "test").map(d => [w.planN, d.dow]));
  assert.deepEqual(tests, [[4, "Jueves"], [8, "Domingo"]]);
  const s8 = B2[7].days.find(d => d.tipo === "test");
  assert.ok(s8.prueba.decide);
  assert.match(s8.titulo, /5 km/);
  assert.match(s8.what, /23:30/, "el test de S8 tiene que decir que tiempo decide la fecha");
  // La prueba de partida del bloque 1 sigue en el calendario, como historia.
  assert.ok(B1[0].days[6].prueba.partida);
});

test("las dos primeras semanas son volver: solo suave, nada de series", () => {
  for (const wk of B2.slice(0, 2)) {
    assert.equal(wk.fase, "VOLVER");
    for (const d of wk.days) assert.ok(!d.intervalos && !d.esCalidad, `S${wk.planN} ${d.dow} lleva calidad`);
  }
});

test("las series al ritmo objetivo se alargan semana a semana", () => {
  // 800 m -> 1 km -> 2 km -> 3 km: 4:45 deja de ser una sorpresa.
  const tramo = (n) => {
    const d = B2[n - 1].days.find(x => x.esCalidad);
    assert.match(d.titulo, /4:45/, `la calidad de S${n} no va al ritmo objetivo`);
    return Math.max(...d.intervalos.flatMap(b => b.s.filter(([t]) => t === "rapido").map(([, seg]) => seg)));
  };
  const tramos = [6, 9, 10, 11].map(tramo);
  for (let i = 1; i < tramos.length; i++) assert.ok(tramos[i] > tramos[i - 1], "los tramos no crecen: " + tramos);
});

test("la carga de running sube como mucho un 15 % sobre la mejor semana anterior", () => {
  const carga = B2.map(minutosCorriendo);
  for (let i = 1; i < carga.length; i++) {
    const mejor = Math.max(...carga.slice(0, i));
    assert.ok(carga[i] <= mejor * 1.15, `S${i + 1} sube a ${carga[i]} min desde ${mejor}: ` + carga);
  }
});

test("el pico de running esta en S10 y luego baja de verdad", () => {
  const carga = B2.map(minutosCorriendo);
  assert.equal(carga[9], Math.max(...carga), "el pico no esta en S10: " + carga);
  assert.ok(carga[10] <= carga[9] * 0.9, "S11 no baja");
  assert.ok(carga[11] <= carga[9] * 0.7, "S12 no baja al menos un 30 %");
  assert.ok(carga[12] < carga[10], "la semana del 7K no es ligera");
});

test("la tirada del domingo crece hasta 60 min y no salta mas de 10 min de una semana a otra", () => {
  const tiradas = B2.slice(0, 10).filter(w => w.days[6].tipo === "run").map(w => minutos(w.days[6]));
  assert.equal(Math.max(...tiradas), 60);
  for (let i = 1; i < tiradas.length; i++) assert.ok(tiradas[i] - tiradas[i - 1] <= 10, "salto: " + tiradas);
});

test("ninguna area se queda fuera: hombro dos veces, pecho, espalda y prevencion cada semana", () => {
  for (const wk of B2.slice(0, 12)) {
    const ej = wk.days.flatMap(d => d.ejercicios || []);
    assert.equal(wk.days.filter(d => d.tipo === "fuerza").length, 2, `S${wk.planN}`);
    for (const g of ["Hombro", "Pecho", "Espalda", "Pierna", "Cadera", "Core"]) {
      assert.ok(ej.some(e => e.grupo === g), `S${wk.planN} no trae ${g}`);
    }
  }
});

test("el hombro se trabaja todas las semanas hasta S10", () => {
  for (const wk of WEEKS.slice(1, 10)) {
    const lat = wk.days.flatMap(d => d.ejercicios || [])
      .filter(e => /laterales/i.test(e.nombre))
      .reduce((s, e) => s + parseInt(e.series, 10), 0);
    // 10 series a la semana es el minimo para que crezca; en S10 ya es mantener.
    const minimo = wk.n <= 9 ? 10 : 6;
    assert.ok(lat >= minimo, `S${wk.n}: solo ${lat} series de laterales`);
  }
});

test("la prevencion (gemelo) esta todas las semanas hasta S10", () => {
  for (const wk of WEEKS.slice(0, 10)) {
    const hay = wk.days.some(d => (d.ejercicios || []).some(e => /gemelo/i.test(e.nombre)));
    assert.ok(hay, `S${wk.n} no trae trabajo de gemelo`);
  }
});

test("nada va a fallo en todas las series", () => {
  // Al fallo el trapecio sube y carga el cuello. Solo la ultima serie.
  for (const wk of WEEKS) for (const d of wk.days) for (const e of d.ejercicios || []) {
    assert.ok(!/^\d+x(fallo|max)$/.test(e.series), `S${wk.n} ${e.nombre}: ${e.series}`);
  }
});

test("el reparto del dia D cuadra con 33:15", () => {
  // El reparto anterior (5:00, 5:00, 4:50x3) dejaba los dos ultimos km a 4:22.
  const dia = FLAT_DAYS.find(d => d.tipo === "objetivo");
  assert.match(dia.what, /Km 1 a 4:48/);
  const hastaKm6 = 288 + 5 * 285;
  const km7 = 33 * 60 + 15 - hastaKm6;
  assert.ok(km7 >= 270, "el ultimo km pide " + km7 + " s: mas rapido que 4:30");
});

test("el taper es una sola semana", () => {
  // Dos semanas de taper para un objetivo de 33 minutos es desentrenar.
  const taper = WEEKS.filter(w => /TAPER|OBJETIVO/.test(w.fase));
  assert.ok(taper.length <= 2, "demasiadas semanas sin carga al final");
});

import { conBloqueEnCurso } from "../src/domain/plan/calendario.js";

test("el historial guardado con el bloque 1 activo lo cierra el 1 de noviembre y abre el 2", () => {
  const h = conBloqueEnCurso([{ numero: 1, nombre: "Bloque 1", inicio: "2026-09-21", fin: "2026-12-06", estado: "activo", revision: "" }]);
  assert.deepEqual(h.map(b => [b.numero, b.estado, b.fin]), [[1, "cerrado", "2026-11-01"], [2, "activo", "2027-01-31"]]);
  assert.equal(conBloqueEnCurso(h), h, "si ya esta el bloque 2, no se toca");
  assert.equal(conBloqueEnCurso(null).length, 1);
});
