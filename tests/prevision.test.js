/**
 * La prevision del coach: frase, numero, por que, riesgos e hitos.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { hitos, porQue, prevision, riesgos, veredictoCoach } from "../src/domain/coach/prevision.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const s4 = FLAT_DAYS.find(d => d.prueba && d.prueba.enLinea);

test("sin pruebas no hay previsión, y la frase dice cuándo la habrá", () => {
  assert.equal(prevision(FLAT_DAYS, {}), null);
  const v = veredictoCoach(null, s4);
  assert.match(v.texto, /El 3 km del .* da la primera previsión/);
});

test("el 3 km en línea (14:30): previsión en el objetivo", () => {
  const p = prevision(FLAT_DAYS, { [s4.isoDate]: "14:30" });
  assert.ok(Math.abs(p.diferencia) <= 5, "dif " + p.diferencia);
  assert.equal(p.base, "prueba");
  assert.match(veredictoCoach(p).texto, /^Vas en el plan/);
});

test("un 3 km en 15:30: por detrás, con la cuenta explicada", () => {
  const p = prevision(FLAT_DAYS, { [s4.isoDate]: "15:30" });
  assert.ok(p.diferencia > 60, "dif " + p.diferencia);
  assert.ok(p.seg > 33 * 60 + 15);
  const v = veredictoCoach(p);
  assert.equal(v.tono, "ojo");
  assert.match(v.texto, /Por detrás del plan/);
  const pq = porQue(p);
  assert.match(pq[0], /prueba de 3 km en 15:30/);
  assert.match(pq[1], /33:15 \+ .* = /);
  assert.ok(riesgos({ alarmas: [], prev: p }).some(r => /previsión va/.test(r.texto)));
});

test("un 3 km rápido: por delante", () => {
  const p = prevision(FLAT_DAYS, { [s4.isoDate]: "14:00" });
  assert.ok(p.diferencia < -5);
  assert.match(veredictoCoach(p).texto, /por delante del plan/);
  assert.equal(riesgos({ alarmas: [{ texto: "Falta el jueves", accion: "Muévelo" }], prev: p }).length, 1);
});

test("hitos: hecho, el próximo y los futuros, con su meta", () => {
  const partida = FLAT_DAYS.find(d => d.prueba && d.prueba.partida);
  const h = hitos(FLAT_DAYS, { [partida.isoDate]: "25 min a 6:50/km" }, "2026-10-08");
  assert.deepEqual(h.map(x => x.estado), ["hecho", "proximo", "futuro", "futuro"]);
  assert.match(h[1].meta, /14:30/);
  assert.match(h[2].meta, /23:30/);
  assert.equal(h[3].nombre, "El día: 7 km");
});

test("antes de la primera prueba, una estimación por tus rodajes", async () => {
  const { estimacionPorRodajes, porQueEstimacion } = await import("../src/domain/coach/prevision.js");
  const suave = FLAT_DAYS.find(d => d.cat === "runZ2" && !d.intervalos && d.isoDate === "2026-10-06");
  const e = estimacionPorRodajes({ dias: FLAT_DAYS, ritmoReal: { [suave.isoDate]: "6:40/km" }, hoyIso: "2026-10-09" });
  assert.equal(e.suave, 400);
  assert.equal(e.fuente, "tus rodajes suaves");
  assert.ok(e.tres[0] > 860 && e.tres[0] < 885 && e.tres[1] > 935 && e.tres[1] < 955, JSON.stringify(e.tres));
  assert.ok(e.siete[0] > 2130 && e.siete[1] < 2330, JSON.stringify(e.siete));
  assert.match(porQueEstimacion(e)[2], /la línea del jueves es 14:30/);
  const partida = FLAT_DAYS.find(d => d.prueba && d.prueba.partida);
  const p = estimacionPorRodajes({ dias: FLAT_DAYS, ritmoReal: { [partida.isoDate]: "25:03 · 3,45 km" }, hoyIso: "2026-10-09" });
  assert.equal(p.fuente, "tu prueba de partida");
  assert.equal(p.suave, 436);
  assert.equal(estimacionPorRodajes({ dias: FLAT_DAYS, ritmoReal: { [s4.isoDate]: "14:50", [suave.isoDate]: "6:40/km" }, hoyIso: "2026-10-16" }), null, "con prueba manda la previsión");
  assert.equal(estimacionPorRodajes({ dias: FLAT_DAYS, ritmoReal: {}, hoyIso: "2026-10-09" }), null);
});
