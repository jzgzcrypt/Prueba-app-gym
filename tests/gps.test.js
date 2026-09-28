/**
 * GPS: pistas inventadas (una recta hacia el norte) con ruido, saltos y
 * pausas. El ritmo que sale tiene que ser el que se corrio.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS } from "../src/domain/plan/calendario.js";
import {
  agregarPunto, comoVa, distanciaM, entre, foto, nuevoRegistro, pausar, ritmoActual, ritmoMedio,
  textoParaLibreta, tiempoHasta,
} from "../src/domain/running/gps.js";

const M_POR_GRADO = 111195; // metros por grado de latitud (R = 6371 km)
// Ruido pseudoaleatorio repetible: el test da siempre lo mismo.
let semilla = 7;
const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647 - 0.5; };

/** Puntos cada segundo a `ritmo` s/km durante `seg`, con ±`ruido` m. */
function pista({ ritmo, seg, desdeM = 0, t0 = 0, ruido = 0, acc = 5 }) {
  const v = 1000 / ritmo, out = [];
  for (let s = 0; s <= seg; s++) {
    const m = desdeM + v * s + ruido * 2 * azar();
    out.push({ lat: 41.65 + m / M_POR_GRADO, lon: -0.88 + ruido * 2 * azar() / 83000, acc, t: t0 + s * 1000 });
  }
  return out;
}
const correr = (reg, puntos) => puntos.reduce(agregarPunto, reg);

test("distancia: 1 km hacia el norte son 1000 m", () => {
  const d = distanciaM({ lat: 41.65, lon: -0.88 }, { lat: 41.65 + 1000 / M_POR_GRADO, lon: -0.88 });
  assert.ok(Math.abs(d - 1000) < 1, String(d));
});

test("pista a 4:45/km con ruido de ±4 m: da 4:45 ±3 s", () => {
  const reg = correr(nuevoRegistro(), pista({ ritmo: 285, seg: 285, ruido: 4 }));
  const r = entre({ m: 0, seg: 0 }, foto(reg)).ritmo;
  assert.ok(Math.abs(r - 285) <= 3, "ritmo medio " + r);
  assert.ok(Math.abs(foto(reg).m - 1000) < 10, "metros " + foto(reg).m);
  const ahora = ritmoActual(reg, 285000);
  assert.ok(Math.abs(ahora - 285) <= 15, "ritmo de ahora " + ahora);
});

test("salto del GPS y punto impreciso: se descartan", () => {
  const p = pista({ ritmo: 300, seg: 60 });
  p[30] = { ...p[30], lat: p[30].lat + 200 / M_POR_GRADO }; // 200 m en 1 s
  p[40] = { ...p[40], acc: 60 };
  const reg = correr(nuevoRegistro(), p);
  assert.ok(Math.abs(foto(reg).m - 200) < 5, "metros " + foto(reg).m);
});

test("quieto con temblor: no suma distancia; el ritmo de ahora desaparece", () => {
  const quieto = Array.from({ length: 30 }, (_, i) => ({ lat: 41.65 + azar() / M_POR_GRADO, lon: -0.88, acc: 5, t: i * 1000 }));
  const reg = correr(nuevoRegistro(), quieto);
  assert.ok(foto(reg).m < 5, "metros " + foto(reg).m);
  assert.equal(ritmoActual(reg, 30000), null);
});

test("una pausa no cuenta ni el tiempo ni el hueco", () => {
  let reg = correr(nuevoRegistro(), pista({ ritmo: 300, seg: 60 }));
  reg = pausar(reg);
  // Vuelve 5 minutos despues, 100 m mas alla (camino a la fuente)
  reg = correr(reg, pista({ ritmo: 300, seg: 60, desdeM: 300, t0: 360000 }));
  assert.ok(Math.abs(foto(reg).m - 400) < 5, "metros " + foto(reg).m);
  assert.ok(Math.abs(reg.seg - 120) < 2, "segundos " + reg.seg);
});

test("series: cada tramo con su ritmo y la media pesada por distancia", () => {
  let reg = nuevoRegistro();
  const tramos = [];
  let t0 = 0, desde = 0;
  for (const ritmo of [270, 275, 280]) {
    const antes = foto(reg);
    reg = correr(reg, pista({ ritmo, seg: Math.round(0.4 * ritmo), desdeM: desde, t0 }));
    tramos.push(entre(antes, foto(reg)));
    t0 += 200000; desde = reg.m + 300;
    reg = pausar(reg);
  }
  tramos.forEach((t, i) => assert.ok(Math.abs(t.ritmo - [270, 275, 280][i]) < 2, JSON.stringify(t)));
  assert.ok(Math.abs(ritmoMedio(tramos) - 275) < 2);
});

test("tiempo hasta una distancia: interpola", () => {
  const reg = correr(nuevoRegistro(), pista({ ritmo: 290, seg: 900 }));
  assert.ok(Math.abs(tiempoHasta(reg, 3000) - 870) < 2);
  assert.equal(tiempoHasta(reg, 4000), null);
});

const dia = (titulo) => FLAT_DAYS.find(d => d.titulo.startsWith(titulo));

test("a la libreta, en el formato que se escribe a mano", () => {
  const series = dia("Series 6x400m");
  assert.equal(textoParaLibreta({ day: series, tramos: [{ m: 400, seg: 110, ritmo: 275 }, { m: 400, seg: 114, ritmo: 285 }] }), "4:40/km");
  const tres = dia("Prueba 3 km");
  assert.equal(textoParaLibreta({ day: tres, tramos: [], total: { m: 3100, seg: 900 }, tiempoPrueba: 860 }), "14:20");
  assert.equal(textoParaLibreta({ day: tres, tramos: [], total: { m: 2000, seg: 600 } }), null, "no llego a 3 km");
  const partida = dia("Prueba de partida");
  assert.equal(textoParaLibreta({ day: partida, tramos: [], total: { m: 2700, seg: 1080 } }), "18 min a 6:40/km");
  const suave = dia("Tirada suave");
  assert.equal(textoParaLibreta({ day: suave, tramos: [], total: { m: 5000, seg: 1900 } }), "6:20/km");
  assert.equal(textoParaLibreta({ day: suave, tramos: [], total: { m: 100, seg: 60 } }), null);
});

test("como va contra el objetivo", () => {
  assert.equal(comoVa(283, 285), "bien");
  assert.equal(comoVa(270, 285), "rapido");
  assert.equal(comoVa(300, 285), "lento");
  assert.equal(comoVa(300, null), null);
});
