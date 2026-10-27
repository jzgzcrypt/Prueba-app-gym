/**
 * Recolocar una sesion saltada con reglas de entrenador.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { claseDe, deshacer, dejarPasar, pendienteDeRecolocar, proponerHueco, recolocar } from "../src/domain/plan/reprogramar.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const dia = (iso) => FLAT_DAYS.find(d => d.isoDate === iso);

test("clases de la semana 3: tenis, suave, fuerza, calidad, fuerza, fuerza, tirada", () => {
  const sem = FLAT_DAYS.filter(d => d.weekN === 3);
  assert.deepEqual(sem.map(claseDe), ["tenis", "suave", "fuerza", "calidad", "fuerza", "fuerza", "tirada"]);
});

test("te saltas la tirada del domingo: el martes, en el sitio del suave (el lunes es tenis)", () => {
  const domingo = dia("2026-10-11");
  assert.equal(claseDe(domingo), "tirada");
  const p = proponerHueco({ dia: domingo, dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-12" });
  assert.equal(p.mejor.dia.isoDate, "2026-10-13");
  assert.equal(claseDe(p.mejor.cede), "suave");
  assert.match(p.motivo, /^Mejor el martes 13: la tirada ocupa el sitio del suave, que se queda fuera\.$/);
  assert.ok(!p.opciones.some(o => o.dia.isoDate === "2026-10-12"), "nunca el día de tenis");
  assert.ok(!p.opciones.some(o => o.dia.isoDate === "2026-10-14"), "nunca el día antes de la prueba del jueves");
});

test("te saltas la calidad del jueves: no al lado de otra intensa, y la fuerza puede ceder", () => {
  const jueves = FLAT_DAYS.find(d => d.weekN === 5 && claseDe(d) === "calidad");
  const p = proponerHueco({ dia: jueves, dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: jueves.isoDate });
  assert.ok(p.mejor, p.motivo);
  const i = FLAT_DAYS.indexOf(p.mejor.dia);
  for (const v of [FLAT_DAYS[i - 1], FLAT_DAYS[i + 1]]) assert.ok(!["prueba", "calidad", "tenis"].includes(claseDe(v)) || v === jueves, "sin intensa al lado");
});

test("un suave saltado se deja pasar; si no cabe, también", () => {
  const martes = dia("2026-10-13");
  assert.match(proponerHueco({ dia: martes, dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-14" }).motivo, /se deja pasar/);
  const domingo = dia("2026-10-11");
  const todoHecho = { "2026-10-13": true, "2026-10-14": true };
  const p = proponerHueco({ dia: domingo, dias: FLAT_DAYS, movidas: {}, checked: todoHecho, hoyIso: "2026-10-13" });
  assert.equal(p.mejor, null);
  assert.match(p.motivo, /Mejor dejarla pasar/);
});

test("recolocar, dejar pasar y deshacer", () => {
  let m = recolocar({}, "2026-10-11", "2026-10-13", dia("2026-10-13"));
  assert.deepEqual(m, { "2026-10-11": "2026-10-13", "2026-10-13": "cede:2026-10-11" });
  assert.deepEqual(deshacer(m, "2026-10-11"), {});
  m = dejarPasar({}, "2026-10-11");
  assert.equal(m["2026-10-11"], "pasa");
  assert.deepEqual(deshacer(m, "2026-10-11"), {});
});

test("lo pendiente: la clave de ayer sin hacer ni resolver", () => {
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-12" }).isoDate, "2026-10-11");
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: {}, checked: { "2026-10-11": true }, hoyIso: "2026-10-12" }), null);
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: { "2026-10-11": "pasa" }, checked: {}, hoyIso: "2026-10-12" }), null);
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-14" }).isoDate, "2026-10-13", "un suave sin marcar tambien pregunta");
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: { "2026-10-13": "pasa" }, checked: {}, hoyIso: "2026-10-14" }), null);
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-13" }).isoDate, "2026-10-12", "ayer fue tenis");
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-15" }).isoDate, "2026-10-14", "ayer fue fuerza");
  const libre = FLAT_DAYS.map(d => d.isoDate === "2026-10-14" ? { ...d, tipo: "libre" } : d);
  assert.equal(pendienteDeRecolocar({ dias: libre, movidas: {}, checked: {}, hoyIso: "2026-10-15" }), null, "un dia libre no pregunta");
});

test("la fuerza sin dia libre cerca: se deja pasar, con su motivo; en la prueba el sabado libre la recoge", async () => {
  const { diaEnPrueba, PRUEBA_DEFECTO } = await import("../src/domain/hoy/prueba.js");
  const mie = dia("2026-10-14");
  const r = proponerHueco({ dia: mie, dias: FLAT_DAYS, movidas: {}, checked: {}, hoyIso: "2026-10-14" });
  assert.equal(r.mejor, null);
  assert.match(r.motivo, /^La fuerza solo va a un día libre/);
  const enPrueba = FLAT_DAYS.map(d => diaEnPrueba(d, PRUEBA_DEFECTO));
  const r2 = proponerHueco({ dia: mie, dias: enPrueba, movidas: {}, checked: {}, hoyIso: "2026-10-14" });
  assert.equal(r2.mejor.dia.isoDate, "2026-10-17");
});

test("devolver una sesion movida deshace tambien el cede; recolocar una ya movida no deja restos", async () => {
  const { moverSesion } = await import("../src/lib/estado/mover-sesion.js");
  const m = { "2026-10-11": "2026-10-13", "2026-10-13": "cede:2026-10-11" };
  assert.deepEqual(moverSesion(m, "2026-10-11", null).movidas, {});
  // La tirada recibida el 13 tampoco se hizo: recolocarla al 14 limpia lo anterior.
  assert.deepEqual(recolocar(m, "2026-10-11", "2026-10-14", null), { "2026-10-11": "2026-10-14" });
  assert.deepEqual(dejarPasar(m, "2026-10-11"), { "2026-10-11": "pasa" });
  // Se puede mover a un dia cuya sesion se dejo pasar.
  assert.equal(moverSesion({ "2026-10-17": "pasa" }, "2026-10-16", "2026-10-17").ok, true);
});

test("una sesion recibida ayer y no hecha tambien se pregunta", () => {
  const m = { "2026-10-11": "2026-10-13", "2026-10-13": "cede:2026-10-11" };
  const p = pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: m, checked: {}, hoyIso: "2026-10-14" });
  assert.equal(p.isoDate, "2026-10-11");
  assert.equal(pendienteDeRecolocar({ dias: FLAT_DAYS, movidas: m, checked: { "2026-10-11": true }, hoyIso: "2026-10-14" }), null);
});
