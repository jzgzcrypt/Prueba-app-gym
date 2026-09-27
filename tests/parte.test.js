/**
 * El parte del coach: constancia, objetivos, alarmas, lo que viene y el
 * veredicto. Sin datos no inventa; con datos, dice lo justo.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FECHA_INICIO, FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import { alarmas, constancia, objetivos, parteDelCoach, proximo } from "../src/domain/progreso/parte.js";

const base = { dias: FLAT_DAYS, semanas: WEEKS, checked: {}, cuelloChecks: {}, painLog: {}, ritmoReal: {}, pesos: {}, reps: {}, medidas: [], fechaInicio: FECHA_INICIO };
const dia = (n, dow) => WEEKS[n - 1].days.find(d => d.dow === dow);

test("sin nada apuntado: punto de partida, todo gris y sin alarmas", () => {
  const p = parteDelCoach({ ...base, hoyIso: "2026-09-22" });
  assert.equal(p.veredicto.tono, "neutro");
  assert.match(p.veredicto.texto, /^Semana 1\. Lo que hagas ahora es tu punto de partida/);
  assert.equal(p.alarmas.length, 0);
  for (const o of p.objetivos.filter(x => x.id !== "cuello")) {
    assert.equal(o.valor, null, o.id);
    assert.ok(o.accion, o.id + " dice qué hacer");
  }
});

test("la tira de constancia distingue hecho, falta, descanso, hoy y futuro", () => {
  const hoy = dia(1, "Jueves").isoDate;
  const c = constancia(WEEKS, { [dia(1, "Lunes").isoDate]: true, [dia(1, "Miercoles").isoDate]: true }, hoy);
  assert.deepEqual(c.tira[0].slice(0, 5), ["hecho", "falta", "hecho", "hoy", "futuro"]);
  assert.equal(c.hechas, 2);
  assert.equal(c.pct, 67, "2 de 3 pasadas");
  const s11 = constancia(WEEKS, {}, "2026-12-10").tira[10];
  assert.ok(s11.includes("descanso"), "los descansos de S11");
});

test("los cuatro objetivos con datos: valor y tendencia", () => {
  const mie3 = dia(3, "Miercoles"), mie6 = dia(6, "Miercoles");
  const o = objetivos({
    ...base, hoyIso: "2026-11-02",
    ritmoReal: { [dia(4, "Jueves").isoDate]: "14:00" },
    pesos: { [mie3.isoDate]: { 0: { 0: "8" } }, [mie6.isoDate]: { 0: { 0: "10" } } },
    medidas: [{ fecha: "05 oct", cintura: 96 }, { iso: "2026-10-26", cintura: 94.5 }],
    cuelloChecks: { "2026-11-02-m": true, "2026-11-01-t": true, "2026-10-31-n": true },
  }).lista;
  const por = Object.fromEntries(o.map(x => [x.id, x]));
  assert.equal(por["7k"].tono, "bien");
  assert.match(por["7k"].tendencia, /por delante/);
  assert.equal(por.panza.valor, "94,5 cm");
  assert.match(por.panza.tendencia, /^−1,5 cm en 3 semanas/);
  assert.equal(por.hombro.valor, "10 kg");
  assert.match(por.hombro.tendencia, /\+2 kg/);
  assert.equal(por.cuello.valor, "3/7 días");
  assert.equal(por.cuello.tono, "ojo");
});

test("alarma: falta el jueves de esta semana", () => {
  const hoy = dia(3, "Viernes").isoDate;
  const a = alarmas({ semanas: WEEKS, checked: {}, painLog: {}, historial: {}, cintura: [], hoyIso: hoy });
  assert.equal(a[0].tipo, "clave");
  assert.match(a[0].accion, /viernes o al sábado/);
  const hecho = alarmas({ semanas: WEEKS, checked: { [dia(3, "Jueves").isoDate]: true }, painLog: {}, historial: {}, cintura: [], hoyIso: hoy });
  assert.equal(hecho.length, 0);
});

test("alarma: molestia de 3 o mas en los ultimos 7 dias", () => {
  const hoy = "2026-10-10";
  const a = alarmas({ semanas: WEEKS, checked: { "2026-10-08": true }, painLog: { "2026-10-06": { rodilla: 3, cuello: 1 } }, historial: {}, cintura: [], hoyIso: hoy });
  assert.ok(a.some(x => x.tipo === "molestia" && /Rodilla 3\/5 el martes/.test(x.texto)));
  const vieja = alarmas({ semanas: WEEKS, checked: { "2026-10-08": true }, painLog: { "2026-09-20": { rodilla: 4 } }, historial: {}, cintura: [], hoyIso: hoy });
  assert.ok(!vieja.some(x => x.tipo === "molestia"), "de hace más de 7 días no");
});

test("alarma: ejercicio estancado y cintura que no baja en 3 semanas", () => {
  const hist = { "Elevaciones laterales mancuerna": [{ iso: "2026-10-01", v: 10 }, { iso: "2026-10-08", v: 10 }, { iso: "2026-10-15", v: 10 }] };
  const cint = [{ iso: "2026-09-28", v: 95 }, { iso: "2026-10-19", v: 95 }];
  const a = alarmas({ semanas: WEEKS, checked: { "2026-10-15": true, "2026-10-18": true }, painLog: {}, historial: hist, cintura: cint, hoyIso: "2026-10-20" });
  assert.ok(a.some(x => x.tipo === "estancado"));
  assert.ok(a.some(x => x.tipo === "cintura" && /150 kcal/.test(x.accion)));
  const baja = alarmas({ semanas: WEEKS, checked: {}, painLog: {}, historial: {}, cintura: [{ iso: "2026-09-28", v: 95 }, { iso: "2026-10-19", v: 94 }], hoyIso: "2026-10-20" });
  assert.ok(!baja.some(x => x.tipo === "cintura"));
});

test("lo que viene: la proxima prueba y la proxima medicion", () => {
  const p = proximo({ ...base, hoyIso: "2026-09-25" });
  assert.equal(p.prueba.texto, "Prueba de partida");
  assert.match(p.prueba.cuando, /^dom/);
  assert.equal(p.medicion.cuando, "5 Oct");
  assert.equal(proximo({ ...base, hoyIso: "2026-10-05" }).medicion.cuando, "hoy");
});

test("veredicto: vas bien, o vigila, o falta la clave", () => {
  const todo = {};
  for (const d of FLAT_DAYS) if (d.isoDate < "2026-10-09" && d.tipo !== "libre") todo[d.isoDate] = true;
  assert.equal(parteDelCoach({ ...base, checked: todo, hoyIso: "2026-10-09" }).veredicto.tono, "bien");
  const sinJueves = { ...todo }; delete sinJueves["2026-10-08"];
  assert.match(parteDelCoach({ ...base, checked: sinJueves, hoyIso: "2026-10-09" }).veredicto.texto, /falta el jueves/);
  const conMolestia = parteDelCoach({ ...base, checked: todo, painLog: { "2026-10-07": { hombro: 3 } }, hoyIso: "2026-10-09" });
  assert.match(conMolestia.veredicto.texto, /^Vas bien, pero vigila hombro/);
});

test("cintura sin cambios: dice igual, no -0", () => {
  const o = objetivos({ ...base, hoyIso: "2026-10-20", medidas: [{ iso: "2026-09-28", cintura: 95 }, { iso: "2026-10-19", cintura: 95 }] }).lista;
  assert.equal(o.find(x => x.id === "panza").tendencia, "igual en 3 semanas");
});
