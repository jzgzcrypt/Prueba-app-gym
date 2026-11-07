/**
 * Cada ejercicio de fuerza del plan tiene su ficha: si no, en la sesion no
 * habria «Cómo se hace».
 */
import test from "node:test";
import assert from "node:assert/strict";
import { fichaDe } from "../src/domain/fuerza/catalogo.js";
import { WEEKS } from "../src/domain/plan/bloque-2-7k.js";

test("todo ejercicio de fuerza del bloque 2 tiene ficha con pasos", () => {
  const nombres = [...new Set(WEEKS.flatMap(w => w.days.flatMap(d => (d.ejercicios || []).map(e => e.nombre))))];
  for (const n of nombres) {
    const f = fichaDe(n);
    assert.ok(f && f.pasos && f.pasos.length, "sin ficha: " + n);
  }
});

test("la ficha se encuentra sin acentos ni mayusculas", () => {
  assert.equal(fichaDe("clamshells CON banda").nombre, "Clamshells con banda");
  assert.equal(fichaDe("no existe"), null);
});
