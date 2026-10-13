/**
 * La prueba de 2 semanas y "ahora toca".
 */
import test from "node:test";
import assert from "node:assert/strict";
import { PRUEBA_DEFECTO, compararPrueba, cumplido, diaEnPrueba, enPrueba, lunesDe, pruebaDe } from "../src/domain/hoy/prueba.js";
import { ahoraToca } from "../src/domain/hoy/ahora.js";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";

const dia = (iso) => FLAT_DAYS.find(d => d.isoDate === iso);

test("en la prueba el sábado de pierna es libre y la pierna va detrás de los rodajes de martes y domingo", () => {
  const p = pruebaDe(undefined);
  assert.equal(diaEnPrueba(dia("2026-10-17"), p).tipo, "libre");
  assert.equal(diaEnPrueba(dia("2026-10-13"), p).pierna10.length, 3);
  assert.equal(diaEnPrueba(dia("2026-10-14"), p).tipo, "fuerza", "el empuje se queda");
  assert.equal(diaEnPrueba(dia("2026-10-31"), p).tipo, "fuerza", "fuera de la prueba, el plan de siempre");
  assert.equal(diaEnPrueba(dia("2026-10-17"), null).tipo, "fuerza", "sin prueba, el plan de siempre");
  assert.equal(enPrueba({ ...PRUEBA_DEFECTO, volver: true }, "2026-10-14"), false);
});

test("un día cumplido: lo principal (o libre) y el cuello una vez", () => {
  const d = dia("2026-10-13");
  assert.equal(cumplido(d, { checked: { "2026-10-13": true }, cuelloChecks: { "2026-10-13-t": true } }), true);
  assert.equal(cumplido(d, { checked: { "2026-10-13": true }, cuelloChecks: {} }), false);
  assert.equal(cumplido(diaEnPrueba(dia("2026-10-17"), PRUEBA_DEFECTO), { checked: {}, cuelloChecks: { "2026-10-17-m": true } }), true);
});

test("la comparación: 2 semanas de prueba contra las 2 de antes", () => {
  const checked = { "2026-09-29": true, "2026-10-13": true, "2026-10-14": true };
  const r = compararPrueba({ dias: FLAT_DAYS, prueba: PRUEBA_DEFECTO, checked, cuelloChecks: { "2026-10-13-m": true }, sentir: { "2026-10-12": { nota: 4 } },
    aplicar: (d) => diaEnPrueba(d, PRUEBA_DEFECTO) });
  assert.equal(r.antes.hechas, 1);
  assert.equal(r.durante.hechas, 2);
  assert.equal(r.durante.sesiones, 12, "6 por semana");
  assert.equal(r.antes.sesiones, 14);
  assert.equal(r.durante.sentir, 4);
  assert.equal(lunesDe("2026-10-18"), "2026-10-12");
});

test("ahora toca: por la mañana el cuello, por la tarde las zapatillas, de noche apuntar y cuello", () => {
  const martes = dia("2026-10-13");
  const base = { day: martes, sesionHecha: false, cuello: {}, pesado: false, comidaApuntada: false };
  assert.equal(ahoraToca({ ...base, hora: 8 }).ahora.id, "cuello-m");
  const tarde = ahoraToca({ ...base, hora: 17, cuello: { m: true }, pesado: true });
  assert.equal(tarde.ahora.titulo, "Zapatillas puestas");
  assert.equal(tarde.despues[0].id, "cuello-t");
  const tras = ahoraToca({ ...base, hora: 18, sesionHecha: true, cuello: { m: true }, pesado: true });
  assert.equal(tras.ahora.id, "cuello-t");
  const noche = ahoraToca({ ...base, hora: 22, sesionHecha: true, cuello: { m: true, t: true }, pesado: true });
  assert.equal(noche.ahora.id, "comida");
  const todo = ahoraToca({ ...base, hora: 23, sesionHecha: true, cuello: { m: true, t: true, n: true }, pesado: true, comidaApuntada: true });
  assert.equal(todo.ahora.id, "extras");
  assert.equal(ahoraToca({ ...base, day: dia("2026-10-12"), hora: 17, cuello: { m: true }, pesado: true }).ahora.titulo, "Tenis a las 20:00");
});

test("al acabar: toca decidir; quedarse alarga la prueba y volver la apaga", async () => {
  const { tocaDecidir, quedarse, volverAlPlan, diaDePrueba } = await import("../src/domain/hoy/prueba.js");
  assert.equal(tocaDecidir(PRUEBA_DEFECTO, "2026-10-25"), false);
  assert.equal(tocaDecidir(PRUEBA_DEFECTO, "2026-10-26"), true);
  const q = quedarse(PRUEBA_DEFECTO, "2026-12-06");
  assert.equal(enPrueba(q, "2026-11-20"), true);
  assert.equal(tocaDecidir(q, "2026-10-26"), false);
  const v = volverAlPlan(PRUEBA_DEFECTO);
  assert.equal(enPrueba(v, "2026-10-14"), false);
  assert.equal(diaDePrueba(PRUEBA_DEFECTO, "2026-10-13"), 2);
});
