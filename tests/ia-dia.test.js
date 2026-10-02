/**
 * Leer lo que devuelve tu IA, sea cual sea el formato. No hay nombres de
 * alimentos en el lector: si estos pasan, pasa cualquier comida.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { leerRespuestaIA, leerTotalDelDia, mensajeDelDia, semanaNutricion, totalLeido, veredictoDia } from "../src/domain/nutricion/ia-dia.js";
import { COMIDA, OBJETIVO_MACROS } from "../src/domain/nutricion/dias.js";

test("el formato pedido: Nombre | kcal | P | HC | G", () => {
  const l = leerRespuestaIA("Café con leche semidesnatada | 70 | 5 | 7 | 2\nTostada de jamón con tomate | 160 | 12 | 18 | 4");
  assert.deepEqual(l.map(x => [x.nombre, x.kcal, x.prot, x.hc, x.grasa]),
    [["Café con leche semidesnatada", 70, 5, 7, 2], ["Tostada de jamón con tomate", 160, 12, 18, 4]]);
  assert.equal(totalLeido(l).kcal, 230);
});

test("tabla markdown con cabecera en otro orden, unidades y fila Total", () => {
  const t = `¡Claro! Aquí tienes la estimación:

| Alimento | Proteína (g) | Hidratos (g) | Grasa (g) | Kcal |
|---|---|---|---|---|
| **Fabada asturiana** | 28 g | 45 g | 30 g | 560 kcal |
| Merluza a la romana | 25 | 15 | 18 | 320 |
| **Total** | 53 | 60 | 48 | 880 |

¿Quieres que lo ajuste?`;
  const l = leerRespuestaIA(t);
  assert.equal(l.length, 2);
  assert.deepEqual([l[0].nombre, l[0].kcal, l[0].prot, l[0].hc, l[0].grasa], ["Fabada asturiana", 560, 28, 45, 30]);
  assert.equal(l[1].kcal, 320);
});

test("viñetas con etiquetas en cualquier orden y comas decimales", () => {
  const l = leerRespuestaIA(`- Café con leche: 70 kcal, 5 g proteína, 7 g HC, 2 g grasa
- 2 huevos revueltos: P 12 · C 1 · G 14 · 180 kcal
* Aquarius (330 ml): 85 kcal, 0 g de proteína, 21 g de hidratos, 0 g de grasa
1. Yogur griego — proteínas: 6,5 g; carbohidratos: 5 g; grasas: 10,2 g`);
  assert.deepEqual(l.map(x => x.nombre), ["Café con leche", "2 huevos revueltos", "Aquarius (330 ml)", "Yogur griego"]);
  assert.deepEqual([l[1].prot, l[1].hc, l[1].grasa, l[1].kcal], [12, 1, 14, 180]);
  assert.equal(l[2].hc, 21);
  assert.equal(l[3].prot, 6.5);
  assert.equal(l[3].kcal, Math.round(6.5 * 4 + 5 * 4 + 10.2 * 9), "sin kcal se calculan");
});

test("solo kcal: estimado; sin numeros o total: fuera", () => {
  const l = leerRespuestaIA("Menú del día en el bar: 950 kcal\nLo demás no lo sé\nTotal: 950 kcal");
  assert.equal(l.length, 1);
  assert.equal(l[0].confianza, "estimado");
  assert.ok(l[0].prot > 0 && l[0].hc > 0);
});

test("una g minuscula es cantidad, no grasa", () => {
  const l = leerRespuestaIA("Arroz 200 g: 260 kcal, 5 g proteína, 57 g hidratos, 1 g grasa");
  assert.equal(l[0].grasa, 1);
  assert.equal(l[0].kcal, 260);
});

test("nunca inventa un nombre que no esta en el texto", () => {
  const t = "Bocata de calamares | 520 | 22 | 60 | 20\nCaña | 110 | 1 | 9 | 0";
  for (const l of leerRespuestaIA(t)) assert.ok(t.includes(l.nombre), l.nombre);
});

test("el mensaje de la mañana lleva el objetivo de hoy y pide el TOTAL DEL DÍA", () => {
  const r = mensajeDelDia({ comida: COMIDA.recortar });
  assert.match(r, /RECORTAR/);
  assert.match(r, /2100 kcal · 165 g proteína · 214 g hidratos · 65 g grasa/);
  assert.match(r, /TOTAL DEL DÍA \| kcal \| proteína g \| hidratos g \| grasa g/);
  assert.match(mensajeDelDia({ comida: COMIDA.comer }), /COMER.*2500 kcal/);
});

test("lee el total del día en cualquier forma, y vale el último", () => {
  assert.deepEqual(leerTotalDelDia("Llevas 1200, te quedan 900.\nTOTAL DEL DÍA | 1200 | 80 | 130 | 35"),
    { kcal: 1200, prot: 80, hc: 130, grasa: 35, desde: "total" });
  const md = leerTotalDelDia("Cena: pollo 200 g con arroz.\n\n**Total del día:** 2080 kcal · P 160 · HC 210 · G 60");
  assert.deepEqual([md.kcal, md.prot, md.hc, md.grasa], [2080, 160, 210, 60]);
  const varias = leerTotalDelDia("TOTAL DEL DÍA | 700 | 40 | 80 | 20\n...\nTOTAL DEL DÍA | 1950 | 150 | 200 | 58");
  assert.equal(varias.kcal, 1950);
  const decimal = leerTotalDelDia("Total de hoy: 2.010 kcal; proteína 158,5 g; hidratos 190 g; grasa 70 g");
  assert.equal(decimal.kcal, 2010, "2.010 es dos mil diez");
  assert.equal(decimal.prot, 159);
});

test("sin línea de total, suma lo que haya; sin nada, null", () => {
  const s = leerTotalDelDia("Tostada | 160 | 12 | 18 | 4\nFabada | 560 | 28 | 45 | 30");
  assert.equal(s.kcal, 720); assert.equal(s.desde, "suma");
  assert.equal(leerTotalDelDia("¡Genial! Que aproveche."), null);
});

test("el veredicto, sin culpa", () => {
  const o = OBJETIVO_MACROS.recortar;
  assert.equal(veredictoDia({ kcal: 2080, prot: 160 }, o).tono, "bien");
  assert.match(veredictoDia({ kcal: 2100, prot: 120 }, o).texto, /45 g de proteína/);
  assert.match(veredictoDia({ kcal: 2500, prot: 170 }, o).texto, /^\+400 kcal\. Mañana normal, sin compensar/);
  assert.match(veredictoDia({ kcal: 1400, prot: 150 }, o).texto, /muy corto/);
});

test("la semana: bien, ojo, abierto y futuro", () => {
  const dias = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01"].map(isoDate => ({ isoDate }));
  const log = {
    "2026-09-28": [{ comida: "dia", kcal: 2090, prot: 160 }],
    "2026-09-29": [{ comida: "dia", kcal: 2600, prot: 150 }],
  };
  const s = semanaNutricion({ dias, comidasLog: log, objetivoDe: () => OBJETIVO_MACROS.recortar, hoyIso: "2026-09-30", claveDe: d => d.isoDate });
  assert.deepEqual(s.dias.map(d => d.estado), ["bien", "ojo", "abierto", "futuro"]);
  assert.equal(s.protMedia, 155);
});
