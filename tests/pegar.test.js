/**
 * Leer lo que devuelve tu IA, sea cual sea el formato. No hay nombres de
 * alimentos en el lector: si estos pasan, pasa cualquier comida.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { enlacesIA, leerRespuestaIA, totalLeido } from "../src/domain/nutricion/pegar.js";

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

test("enlaces para abrir la IA con el texto puesto", () => {
  assert.equal(enlacesIA("tostada y café").claude, "https://claude.ai/new?q=tostada%20y%20caf%C3%A9");
  assert.equal(enlacesIA("").chatgpt, "https://chatgpt.com/");
});
