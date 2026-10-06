/**
 * Contar pasos con el acelerometro: muestras sinteticas de carrera.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { contarPasos, spmManual, veredictoCadencia } from "../src/domain/running/cadencia.js";

/** Carrera simulada: un golpe por pisada a `spm`, con gravedad, deriva y ruido. */
function carrera(spm, seg = 60, hz = 60, ruido = 0.6, semilla = 1) {
  let s = semilla; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 - 0.5; };
  const periodo = 60 / spm, out = [];
  for (let i = 0; i < seg * hz; i++) {
    const t = i / hz, fase = (t % periodo) / periodo;
    const golpe = fase < 0.18 ? 9 * Math.sin(Math.PI * fase / 0.18) : -1.2;
    out.push({ t: t * 1000, a: 9.81 + golpe + Math.sin(t * 0.7) * 1.5 + rnd() * 2 * ruido });
  }
  return out;
}

test("cuenta la cadencia de una carrera a 170, 160 y 182 pasos/min", () => {
  for (const spm of [170, 160, 182]) {
    const r = contarPasos(carrera(spm));
    assert.ok(r.fiable, spm + " fiable");
    assert.ok(Math.abs(r.spm - spm) <= 3, spm + " → " + r.spm);
  }
});

test("quieto, poco rato o pocas muestras: no da número", () => {
  const quieto = Array.from({ length: 600 }, (_, i) => ({ t: i * 16, a: 9.81 + (i % 7) * 0.01 }));
  assert.equal(contarPasos(quieto).fiable, false);
  assert.equal(contarPasos(carrera(170, 3)).fiable, false);
  assert.equal(contarPasos([]).spm, null);
});

test("golpes irregulares no se dan por buenos", () => {
  let t = 0; const ms = [];
  for (let k = 0; k < 60; k++) { const gap = k % 2 ? 250 : 900; for (let i = 0; i < gap; i += 16) ms.push({ t: t + i, a: 9.81 + (i < 60 ? 8 : -1) }); t += gap; }
  assert.equal(contarPasos(ms).fiable, false);
});

test("a mano: pasos de un pie en 15 s por 8, y el veredicto", () => {
  assert.equal(spmManual(22), 176);
  assert.equal(veredictoCadencia(174).tono, "bien");
  assert.match(veredictoCadencia(166).texto, /un poco baja/);
  assert.match(veredictoCadencia(150).texto, /baja/);
  assert.equal(veredictoCadencia(null), null);
});
