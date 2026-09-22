/**
 * El repaso espaciado de la magia: las cartas de estudio.
 *
 * Lo que se prueba aquí es la regla entera: le das caña a UNO, cuando lo
 * dominas pasa a la cola y el siguiente ocupa su sitio, y lo dominado vuelve
 * cada vez más tarde. Se avanza dominando, nunca esperando.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ESCALERA, ESCALON_ASENTADO, colaDeHoy, diasEntre, dominar, faltanDias,
  progresoDe, responder, sumarDias, tocaHoy,
} from "../src/domain/habilidades/repaso.js";
import { MAGIA_TRUCOS, magiaDeHoy, progresoMagia } from "../src/domain/habilidades/magia.js";
import { migrar, VERSION_ESQUEMA } from "../src/lib/storage/esquema.js";

const HOY = "2026-09-22";
const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("la escalera solo crece", () => {
  // Si un escalón no tardara más que el anterior, esto no sería repaso
  // espaciado: sería una alarma.
  for (let i = 1; i < ESCALERA.length; i++) assert.ok(ESCALERA[i] > ESCALERA[i - 1], String(i));
  assert.ok(ESCALERA[0] >= 2, "el primer repaso no puede ser mañana");
});

test("el actual es el primero sin dominar, no el que toca por calendario", () => {
  assert.equal(colaDeHoy(items, {}, HOY).actual.id, "a");
  assert.equal(colaDeHoy(items, { a: dominar(HOY) }, HOY).actual.id, "b");
  assert.equal(colaDeHoy(items, { a: dominar(HOY), b: dominar(HOY) }, HOY).actual.id, "c");
});

test("dominar uno libera el sitio el mismo día", () => {
  // "Cuando dominas una pasa a la siguiente": no hay que esperar a mañana ni
  // a la semana que viene.
  const r = { a: dominar(HOY) };
  const dia = colaDeHoy(items, r, HOY);
  assert.equal(dia.actual.id, "b");
  assert.deepEqual(dia.repasos, [], "el que acabas de dominar no se repasa el mismo día");
  assert.equal(faltanDias(r.a, HOY), ESCALERA[0]);
});

test("lo dominado vuelve, y el día que toca", () => {
  const r = { a: dominar(HOY) };
  const vuelve = sumarDias(HOY, ESCALERA[0]);
  assert.equal(colaDeHoy(items, r, sumarDias(vuelve, -1)).repasos.length, 0);
  assert.deepEqual(colaDeHoy(items, r, vuelve).repasos.map(t => t.id), ["a"]);
});

test("un repaso atrasado no se pierde", () => {
  // Si no abres la app tres días, el repaso sigue ahí esperándote.
  const r = { a: dominar(HOY) };
  assert.deepEqual(colaDeHoy(items, r, sumarDias(HOY, 30)).repasos.map(t => t.id), ["a"]);
});

test("si sale, tarda más en volver; si no, vuelve pronto", () => {
  let e = dominar(HOY);
  const primero = faltanDias(e, HOY);
  e = responder(e, "bien", HOY);
  assert.ok(faltanDias(e, HOY) > primero, "acertar no alargó el intervalo");
  const tras2 = faltanDias(e, HOY);
  e = responder(e, "regular", HOY);
  assert.equal(faltanDias(e, HOY), tras2, "a medias debería dejarlo donde estaba");
  e = responder(e, "mal", HOY);
  assert.equal(e.escalon, 0);
  assert.equal(faltanDias(e, HOY), ESCALERA[0]);
});

test("acertando siempre se llega a asentado y ahí se queda", () => {
  let e = dominar(HOY);
  for (let i = 0; i < 20; i++) e = responder(e, "bien", HOY);
  assert.equal(e.escalon, ESCALON_ASENTADO);
  assert.equal(faltanDias(e, HOY), ESCALERA[ESCALON_ASENTADO]);
});

test("tres fallos seguidos y vuelve a ser el truco al que darle caña", () => {
  // Repasar algo que no te sale no es repasar: es aprenderlo otra vez.
  let e = dominar(HOY);
  e = responder(e, "mal", HOY);
  e = responder(e, "mal", HOY);
  assert.ok(!e.reaprender, "dos fallos no deberían sacarlo de la cola");
  e = responder(e, "mal", HOY);
  assert.equal(e.reaprender, true);

  const dia = colaDeHoy(items, { a: e }, HOY);
  assert.equal(dia.actual.id, "a", "el fallado debería volver a la mesa de trabajo");
  assert.ok(!dia.repasos.some(t => t.id === "a"), "y no estar además en repasos");
});

test("un acierto limpia los fallos acumulados", () => {
  let e = responder(responder(dominar(HOY), "mal", HOY), "mal", HOY);
  assert.equal(e.fallos, 2);
  e = responder(e, "bien", HOY);
  assert.equal(e.fallos, 0);
});

test("responder a algo que no estaba en la cola no rompe nada", () => {
  const e = responder(undefined, "bien", HOY);
  assert.ok(Number.isFinite(e.escalon));
  assert.ok(e.proximo > HOY);
});

test("lo que viene después sale ordenado por fecha de vuelta", () => {
  const r = {
    a: { escalon: 3, proximo: sumarDias(HOY, 20), ultimo: HOY },
    b: { escalon: 0, proximo: sumarDias(HOY, 2), ultimo: HOY },
    c: { escalon: 1, proximo: sumarDias(HOY, 9), ultimo: HOY },
  };
  assert.deepEqual(colaDeHoy(items, r, HOY).luego.map(t => t.id), ["b", "c", "a"]);
});

test("cuando no queda ninguno por aprender, solo hay repasos", () => {
  const r = { a: dominar(HOY), b: dominar(HOY), c: dominar(HOY) };
  const dia = colaDeHoy(items, r, HOY);
  assert.equal(dia.actual, null);
  assert.deepEqual(dia.nuevos, []);
  assert.equal(progresoDe(items, r).dominados, 3);
  assert.equal(progresoDe(items, r).quedan, 0);
});

test("el progreso no cuenta como dominado lo que hay que reaprender", () => {
  const r = { a: dominar(HOY), b: { escalon: 0, proximo: HOY, reaprender: true } };
  assert.equal(progresoDe(items, r).dominados, 1);
  assert.equal(progresoDe(items, r).quedan, 2);
});

test("las fechas se suman sin que las mueva un cambio de hora", () => {
  // El último domingo de octubre, cuando España cambia la hora.
  assert.equal(sumarDias("2026-10-24", 1), "2026-10-25");
  assert.equal(sumarDias("2026-10-25", 1), "2026-10-26");
  assert.equal(diasEntre("2026-10-24", "2026-10-26"), 2);
  assert.equal(sumarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(diasEntre("2026-02-28", "2026-03-01"), 1); // 2026 no es bisiesto
});

test("un estado vacío o roto no da un repaso fantasma", () => {
  assert.equal(tocaHoy(null, HOY), false);
  assert.equal(tocaHoy(undefined, HOY), false);
  assert.equal(faltanDias(null, HOY), null);
  assert.deepEqual(colaDeHoy([], {}, HOY).repasos, []);
  assert.equal(colaDeHoy([], {}, HOY).actual, null);
});

// ─── La magia de verdad ───────────────────────────────────────────────────

test("los trucos de magia van en el orden en que se aprenden", () => {
  const ordenes = MAGIA_TRUCOS.map(t => t.semana);
  assert.deepEqual(ordenes, [...ordenes].sort((a, b) => a - b));
  assert.equal(new Set(MAGIA_TRUCOS.map(t => t.id)).size, MAGIA_TRUCOS.length);
});

test("el primer día se empieza por el primer truco, no por el de la semana", () => {
  const dia = magiaDeHoy({}, HOY);
  assert.equal(dia.actual.id, MAGIA_TRUCOS[0].id);
  assert.equal(progresoMagia({}).dominados, 0);
  assert.equal(progresoMagia({}).total, MAGIA_TRUCOS.length);
});

test("dominando de seguido se llega al final sin esperar once semanas", () => {
  // El fallo del modelo viejo: el calendario mandaba sobre ti.
  let r = {};
  for (let i = 0; i < MAGIA_TRUCOS.length; i++) {
    const actual = magiaDeHoy(r, HOY).actual;
    assert.ok(actual, "se quedó sin trucos en el paso " + i);
    r = Object.assign({}, r, { [actual.id]: dominar(HOY) });
  }
  assert.equal(magiaDeHoy(r, HOY).actual, null);
  assert.equal(progresoMagia(r).dominados, MAGIA_TRUCOS.length);
});

test("lo que ya tenías marcado como dominado entra en la cola, sin perderse", () => {
  const { datos, migrado } = migrar({
    version: 3, magiaProgress: { t1: true, t2: true, t3: false },
    bloquesHistorial: [{ inicio: "2026-09-21" }],
  });
  assert.equal(migrado, true);
  assert.equal(datos.version, VERSION_ESQUEMA);
  assert.deepEqual(Object.keys(datos.magiaRepaso).sort(), ["t1", "t2"]);
  // Y no caen todos el mismo día: se reparten, uno por día.
  assert.notEqual(datos.magiaRepaso.t1.proximo, datos.magiaRepaso.t2.proximo);
  // Lo viejo se conserva: una migración no borra lo que había.
  assert.deepEqual(datos.magiaProgress, { t1: true, t2: true, t3: false });
});

test("migrar dos veces no duplica ni mueve nada", () => {
  const una = migrar({ version: 3, magiaProgress: { t1: true } }).datos;
  const dos = migrar(una).datos;
  assert.deepEqual(dos.magiaRepaso, una.magiaRepaso);
});

test("sin magia guardada, la migración deja la cola vacía y no falla", () => {
  assert.deepEqual(migrar({ version: 3 }).datos.magiaRepaso, {});
  assert.deepEqual(migrar({ version: 3, magiaProgress: {} }).datos.magiaRepaso, {});
});
