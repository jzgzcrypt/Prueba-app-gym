/**
 * El motor adaptativo, con datos inventados donde se sabe la verdad: un gasto
 * real conocido, comidas con su ruido y un peso que baja con agua por encima.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { estimarGasto, gastoPorFormula, programaDeLaSemana, programaSemanal, sumarDiasIso, tendenciaPeso, TOPE } from "../src/domain/nutricion/adaptativo.js";

let semilla = 1;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
const gauss = () => { const a = azar() || 1e-9, b = azar(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); };

/** `dias` dias desde `inicio` con gasto real `gasto`, comiendo ~`come` (±250) y pesandose casi a diario. */
function historia({ inicio = "2026-09-01", dias = 28, gasto = 2650, come = 2200, agua = 0.4, pesoIni = 86, saltaComida = 0, saltaPeso = 0.15, sem = 1 }) {
  semilla = sem;
  const pesos = {}, ingestas = {};
  let real = pesoIni;
  for (let i = 0; i < dias; i++) {
    const iso = sumarDiasIso(inicio, i);
    const kcal = come + 250 * gauss();
    if (azar() >= saltaComida) ingestas[iso] = Math.round(kcal);
    if (azar() >= saltaPeso) pesos[iso] = Math.round((real + agua * gauss()) * 10) / 10;
    real += (kcal - gasto) / 7700;
  }
  return { pesos, ingestas, hoyIso: sumarDiasIso(inicio, dias) };
}

test("con 4 semanas de datos, el gasto real se estima a ±150 kcal (10 historias distintas)", () => {
  const errores = [];
  for (let s = 1; s <= 10; s++) {
    const h = historia({ sem: s * 7919 });
    const g = estimarGasto({ ...h, previo: 2900 });
    errores.push(g.gasto - 2650);
  }
  const media = errores.reduce((a, b) => a + b, 0) / errores.length;
  assert.ok(Math.abs(media) <= 60, "sesgo " + media.toFixed(0));
  for (const e of errores) assert.ok(Math.abs(e) <= 150, "error " + e);
});

test("un pico de agua de 1,5 kg apenas mueve la tendencia", () => {
  const pesos = {};
  for (let i = 0; i < 20; i++) pesos[sumarDiasIso("2026-09-01", i)] = 86;
  pesos["2026-09-15"] = 87.5; // cena salada
  const t = tendenciaPeso(pesos);
  const max = Math.max(...t.map(x => x.tendencia));
  assert.ok(max - 86 <= 0.2, "la tendencia sube " + (max - 86).toFixed(2));
});

test("días sin apuntar: no sesgan el gasto (no se asume que ayunaste)", () => {
  const llena = estimarGasto({ ...historia({ sem: 5 }), previo: 2650 });
  const conHuecos = estimarGasto({ ...historia({ sem: 5, saltaComida: 0.4 }), previo: 2650 });
  assert.ok(Math.abs(conHuecos.gasto - llena.gasto) <= 120, llena.gasto + " vs " + conHuecos.gasto);
});

test("con pocos datos manda la fórmula", () => {
  const h = historia({ dias: 4 });
  const g = estimarGasto({ ...h, previo: 2800 });
  assert.equal(g.gasto, 2800);
  assert.equal(g.confianza, 0);
  assert.ok(gastoPorFormula() > 2500 && gastoPorFormula() < 3100);
});

test("programa: déficit de 450, COMER y RECORTAR separados 400, y la media cuadra", () => {
  const dias = ["comer", "recortar", "recortar", "comer", "recortar", "recortar", "comer"];
  const p = programaSemanal({ gasto: 2650, dias });
  assert.equal(p.media, 2200);
  assert.equal(p.objetivos.comer.kcal - p.objetivos.recortar.kcal, 400);
  const mediaReal = dias.reduce((a, d) => a + p.objetivos[d].kcal, 0) / 7;
  assert.ok(Math.abs(mediaReal - 2200) <= 10, "media " + mediaReal);
  assert.equal(p.objetivos.recortar.prot, 165);
  assert.ok(p.objetivos.recortar.hc > 150);
});

test("topes: no cambia más de 150 por semana, ni baja de 1800, ni más del 25% de déficit", () => {
  const dias = Array(7).fill("recortar");
  assert.equal(programaSemanal({ gasto: 2000, dias, anterior: 2400 }).media, 2250, "de 2400 baja como mucho a 2250");
  assert.equal(programaSemanal({ gasto: 1900, dias }).media, 1800);
  assert.ok(programaSemanal({ gasto: 2600, dias }).media >= 2600 * 0.75);
  assert.equal(programaSemanal({ gasto: 2650, dias, sinDeficit: true }).media, 2650, "últimas semanas: mantenimiento");
});

test("la semana: usa solo datos hasta el domingo y dice si está ajustada", () => {
  const h = historia({ inicio: "2026-08-31", dias: 28 });
  const p = programaDeLaSemana({ ...h, lunesIso: "2026-09-28", tiposDe: () => ["comer", "recortar", "recortar", "comer", "recortar", "recortar", "comer"], previo: 2900 });
  assert.equal(p.ajustado, true);
  assert.ok(Math.abs(p.gasto.gasto - 2650) <= 150, "gasto " + p.gasto.gasto);
  assert.ok(p.gasto.kgSemana < -0.2 && p.gasto.kgSemana > -0.6, "kg/sem " + p.gasto.kgSemana);
});

test("la tendencia hasta un día no usa pesos posteriores", () => {
  const pesos = { "2026-09-01": 86, "2026-09-05": 85.6, "2026-09-10": 80 };
  const hasta7 = tendenciaPeso(pesos, "2026-09-07");
  const sinElUltimo = tendenciaPeso({ "2026-09-01": 86, "2026-09-05": 85.6 }, "2026-09-07");
  assert.deepEqual(hasta7, sinElUltimo);
});

test("sumar días a una fecha", () => {
  assert.equal(sumarDiasIso("2026-10-05", -1), "2026-10-04");
  assert.equal(sumarDiasIso("2026-10-31", 1), "2026-11-01");
  assert.equal(sumarDiasIso("2026-09-01", 28), "2026-09-29");
});
