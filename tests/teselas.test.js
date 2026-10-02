/**
 * Repintar teselas de OSM: cada color de su paleta se reconoce y pasa al de
 * la paleta del estilo.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { PALETAS, recolorear, tipoDePixel } from "../src/domain/running/teselas.js";

const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const tipo = (hex) => tipoDePixel(...rgb(hex));

test("colores de OSM: cada uno es lo que es", () => {
  const casos = {
    "#C8FACC": "parque", "#ADD19E": "parque", "#CDEBB0": "parque", "#AAE0CB": "parque", "#DFFCE2": "parque",
    "#AAD3DF": "agua",
    "#D9D0C9": "edificio", "#C4B6AB": "edificio",
    "#F2EFE9": "fondo", "#E0DFDF": "fondo", "#F2DAD9": "fondo",
    "#FFFFFF": "calle",
    "#F7FABF": "carretera", "#FCD6A4": "carretera",
    "#333333": "texto", "#555555": "texto",
  };
  for (const [hex, t] of Object.entries(casos)) assert.equal(tipo(hex), t, hex);
});

test("recolorear: los colores de referencia de OSM dan los de la paleta, y el alfa se queda", () => {
  for (const nombre of Object.keys(PALETAS)) {
    const P = PALETAS[nombre];
    const pares = [["#FFFFFF", P.calle], ["#AAD3DF", P.agua]];
    const datos = new Uint8ClampedArray(pares.length * 4);
    pares.forEach(([hex], i) => { datos.set([...rgb(hex), 200], i * 4); });
    recolorear(datos, P);
    pares.forEach(([hex, esperado], i) => {
      const r = rgb(esperado);
      for (let k = 0; k < 3; k++) assert.ok(Math.abs(datos[i * 4 + k] - r[k]) <= 8, nombre + " " + hex + " → " + [...datos.slice(i * 4, i * 4 + 3)]);
      assert.equal(datos[i * 4 + 3], 200);
    });
  }
});

test("recolorear: el parque sigue verde, el agua azul y el fondo crema", () => {
  const datos = new Uint8ClampedArray([...rgb("#C8FACC"), 255, ...rgb("#AAD3DF"), 255, ...rgb("#F2EFE9"), 255]);
  recolorear(datos, PALETAS.arena);
  const [pr, pg, pb] = datos.slice(0, 3), [ar, ag, ab] = datos.slice(4, 7), [fr, fg, fb] = datos.slice(8, 11);
  assert.ok(pg > pr && pg > pb, "parque verde");
  assert.ok(ab > ar && ab >= ag, "agua azul");
  assert.ok(fr >= fg && fg >= fb && fr - fb <= 14, "fondo crema");
});

test("las letras oscuras de OSM salen suaves: claras, pero más oscuras que el fondo", () => {
  const datos = new Uint8ClampedArray([0x33, 0x33, 0x33, 255, 0x66, 0x66, 0x66, 255]);
  recolorear(datos, PALETAS.arena);
  for (const i of [0, 4]) {
    const l = (Math.max(datos[i], datos[i + 1], datos[i + 2]) + Math.min(datos[i], datos[i + 1], datos[i + 2])) / 2 / 255;
    assert.ok(l > 0.55 && l < 0.88, "luz " + l.toFixed(2));
  }
});
