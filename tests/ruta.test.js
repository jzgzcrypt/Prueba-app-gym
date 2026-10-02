/**
 * La ruta para el mapa: guardarla en poco, encajarla en el mapa, colorearla
 * por ritmo y sacarla en GPX.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { agregarPunto, marcarTramo, nuevoRegistro, pausar } from "../src/domain/running/gps.js";
import { aGpx, aPixel, categoria, flechas, marcasKm, proyectar, simplificar, tramosPorColor, suavizar, remuestrear, colorEn, degradado } from "../src/domain/running/ruta.js";

const M_LAT = 111195, M_LON = M_LAT * Math.cos(41.65 * Math.PI / 180);
const fix = (x, y, t, v = 3.5) => ({ lat: 41.65 + y / M_LAT, lon: -0.88 + x / M_LON, acc: 5, speed: v, t });

/** Una L: 500 m al este y 500 m al norte, a 3,5 m/s, un fix por segundo. */
function ele() {
  const out = []; let t = 0;
  for (let m = 0; m <= 500; m += 3.5) out.push(fix(m, 0, (t++) * 1000));
  for (let m = 3.5; m <= 500; m += 3.5) out.push(fix(500, m, (t++) * 1000));
  return out;
}

test("gps.js junta la traza; la pausa la corta", () => {
  let reg = ele().slice(0, 50).reduce(agregarPunto, nuevoRegistro());
  reg = pausar(reg);
  reg = ele().slice(100, 120).map(p => ({ ...p, t: p.t + 60000 })).reduce(agregarPunto, reg);
  assert.equal(reg.traza.filter(x => x === null).length, 1);
  // 50 + 20 fixes a 3,5 m/s y 1 por segundo: un punto cada 2 s (y el primero de cada tramo).
  assert.equal(reg.traza.filter(Boolean).length, 25 + 10);
});

test("simplificar: una L se queda en sus esquinas y ocupa poco", () => {
  const reg = ele().reduce(agregarPunto, nuevoRegistro());
  const r = simplificar(reg.traza);
  const pts = r.p.filter(Boolean);
  assert.ok(pts.length <= 6, "puntos " + pts.length);
  const esquina = pts.some(q => Math.abs((q[1] + 0.88) * M_LON - 500) < 8 && Math.abs((q[0] - 41.65) * M_LAT) < 8);
  assert.ok(esquina, "conserva la esquina");
  assert.ok(Math.abs(pts[0][3] - 35) <= 1, "velocidad x10");
  assert.ok(JSON.stringify(r).length < 400);
});

test("simplificar respeta series y recuperacion (k) y las pausas", () => {
  let reg = nuevoRegistro();
  const pts = ele();
  pts.forEach((p, i) => { reg = marcarTramo(reg, i < 100 ? 0 : 1); reg = agregarPunto(reg, p); });
  const r = simplificar(reg.traza);
  const ks = r.p.filter(Boolean).map(q => q[4]);
  assert.ok(ks.includes(0) && ks.includes(1));
  const cats = tramosPorColor(r, 275).map(t => t.cat);
  assert.deepEqual(cats, ["cerca", "recupera"], "3,5 m/s es 4:46: cerca de 4:35; luego recupera");
});

test("categoria por ritmo", () => {
  assert.equal(categoria([0, 0, 0, 37, 0], 285), "objetivo"); // 3,7 m/s = 4:30
  assert.equal(categoria([0, 0, 0, 33, 0], 285), "cerca");    // 5:03
  assert.equal(categoria([0, 0, 0, 25, 0], 285), "suave");
  assert.equal(categoria([0, 0, 0, 37, 1], 285), "recupera");
  assert.equal(categoria([0, 0, 0, 37, 0], null), "corre");
});

test("proyectar: la ruta cabe en el recuadro y trae sus teselas", () => {
  const r = simplificar(ele().reduce(agregarPunto, nuevoRegistro()).traza);
  const m = proyectar(r, 360, 240);
  const pts = r.p.filter(Boolean).map(m.punto);
  for (const q of pts) assert.ok(q.x >= 0 && q.x <= 360 && q.y >= 0 && q.y <= 240, JSON.stringify(q));
  assert.ok(m.z >= 14 && m.z <= 16, "zoom " + m.z);
  assert.ok(m.teselas.length >= 2 && m.teselas.length <= 9);
  const a = aPixel(0, 0, 1);
  assert.deepEqual(a, { x: 256, y: 256 }, "el ecuador y Greenwich en el centro del mundo");
});

test("GPX: un trkseg por tramo sin pausa, con tiempos ISO", () => {
  let reg = ele().slice(0, 30).reduce(agregarPunto, nuevoRegistro());
  reg = pausar(reg);
  reg = ele().slice(60, 90).map(p => ({ ...p, t: p.t + 60000 })).reduce(agregarPunto, reg);
  const g = aGpx({ ...simplificar(reg.traza), t0: Date.UTC(2026, 9, 22, 16) }, "Series <6x400>");
  assert.equal((g.match(/<trkseg>/g) || []).length, 2);
  assert.match(g, /<time>2026-10-22T16:00:00\.000Z<\/time>/);
  assert.match(g, /Series &lt;6x400&gt;/);
});

const recta = (metros) => ({ t0: 0, p: Array.from({ length: 51 }, (_, i) => [41.65 + (metros * i / 50) / 111195, -0.88, i * 6, 35, 0]) });

test("marcas de km: en una recta de 2,5 km, en el 1000 y el 2000", () => {
  const m = marcasKm(recta(2500), 2500);
  assert.deepEqual(m.map(x => x.n), [1, 2]);
  assert.ok(Math.abs((m[0].lat - 41.65) * 111195 - 1000) < 1);
  assert.ok(Math.abs((m[1].lat - 41.65) * 111195 - 2000) < 1);
});

test("marcas de km: si la app midió más que el trazado, se reparten en proporción", () => {
  const m = marcasKm(recta(2000), 2200); // trazado 2000, medido 2200: el km 1 cae al 45%
  assert.deepEqual(m.map(x => x.n), [1, 2]);
  assert.ok(Math.abs((m[0].lat - 41.65) * 111195 - 1000 * 2000 / 2200) < 1);
});

test("flechas: repartidas y orientadas según el tramo en que caen", () => {
  const M_LON = 111195 * Math.cos(41.65 * Math.PI / 180);
  const ele = { t0: 0, p: [[41.65, -0.88, 0, 30, 0], [41.65, -0.88 + 500 / M_LON, 100, 30, 0], [41.65 + 500 / 111195, -0.88 + 500 / M_LON, 200, 30, 0]] };
  const f = flechas(ele, 3);
  assert.equal(f.length, 3);
  assert.equal(f[0].b[1] > f[0].a[1], true, "la primera va hacia el este");
  assert.equal(f[2].b[0] > f[2].a[0], true, "la última va hacia el norte");
});

test("proyectar deja sitio arriba para la franja de datos", () => {
  const m = proyectar(recta(1000), 360, 250, 18, 54);
  const ys = recta(1000).p.map(q => m.punto(q).y);
  assert.ok(Math.min(...ys) >= 54 - 0.5 && Math.max(...ys) <= 250 - 18 + 0.5, Math.min(...ys) + " " + Math.max(...ys));
});

test("suavizar: redondea la esquina y conserva inicio y final", () => {
  const p = suavizar([[0, 0], [100, 0], [100, 100]], 3);
  assert.deepEqual(p[0], [0, 0]);
  assert.deepEqual(p[p.length - 1], [100, 100]);
  assert.ok(p.length > 10);
  // La esquina (100, 0) ya no se toca: la curva pasa por dentro.
  assert.ok(p.every(q => !(q[0] === 100 && q[1] === 0)));
  assert.ok(p.some(q => q[0] > 80 && q[1] > 5 && q[1] < 20), "pasa por la curva");
});

test("colorEn: extremos y punto medio", () => {
  assert.equal(colorEn(["#000000", "#FFFFFF"], 0), "#000000");
  assert.equal(colorEn(["#000000", "#FFFFFF"], 1), "#ffffff");
  assert.equal(colorEn(["#000000", "#FFFFFF"], 0.5), "#808080");
  assert.equal(colorEn(["#FF0000", "#00FF00", "#0000FF"], 0.5), "#00ff00");
});

test("degradado: va por distancia recorrida, también en un circuito cerrado y con pausas", () => {
  const ida = [[0, 0], [100, 0]], vuelta = [[100, 0], [100, 100], [0, 100], [0, 0]];
  const t = degradado([ida, vuelta], ["#000000", "#FFFFFF"], 4);
  assert.equal(t.length, 4);
  assert.equal(t[0].color, colorEn(["#000000", "#FFFFFF"], 0.125));
  assert.equal(t[3].color, colorEn(["#000000", "#FFFFFF"], 0.875));
  // Los trozos se tocan: el final de uno es el principio del siguiente (dentro de cada linea).
  assert.deepEqual(t[1].puntos[t[1].puntos.length - 1], t[2].puntos[0]);
  assert.deepEqual(degradado([], ["#000000", "#FFFFFF"]), []);
});

test("suavizar con paso máximo: la curva se queda cerca de la esquina", () => {
  const libre = suavizar([[0, 0], [200, 0], [200, 200]], 3);
  const corta = suavizar([[0, 0], [200, 0], [200, 200]], 3, 14);
  const cerca = (p) => Math.min(...p.map(q => Math.hypot(q[0] - 200, q[1])));
  assert.ok(cerca(corta) < 6, "con paso: " + cerca(corta).toFixed(1));
  assert.ok(cerca(libre) > 20, "sin paso: " + cerca(libre).toFixed(1));
});

test("remuestrear: un punto cada paso, con el inicio y el final", () => {
  const r = remuestrear([[0, 0], [25, 0], [25, 3], [25, 30]], 10);
  assert.deepEqual(r[0], [0, 0]);
  assert.deepEqual(r[r.length - 1], [25, 30]);
  for (let i = 1; i < r.length - 1; i++) assert.ok(Math.abs(Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]) - 10) < 3.5);
  assert.equal(r.length, 7); // 0, 10, 20, (25,5), (25,15), (25,25), final
});

test("proyectar ajustado: teselas al 60-95 %, sin huecos, y la ruta llena el recuadro", () => {
  const util = { x: 360 - 40, y: 260 - 20 - 62 };
  for (const metros of [400, 2000, 7000]) {
    // Una ruta en diagonal: ocupa ancho y alto.
    const ruta = { t0: 0, p: Array.from({ length: 41 }, (_, i) => [41.65 + metros * 0.6 * i / 40 / 111195, -0.88 + metros * 0.8 * i / 40 / 83000, i * 6, 3, 0]) };
    const m = proyectar(ruta, 360, 260, 20, 62, true);
    const k = m.teselas[0].size / 256;
    assert.ok(k >= 0.6 - 1e-9 && k <= 0.95 + 1e-9, metros + " m: escala " + k);
    assert.ok(m.teselas.every(t => t.size === m.teselas[0].size && t.z === m.teselas[0].z));
    // Cubren el recuadro, sin huecos.
    const lefts = [...new Set(m.teselas.map(t => t.left))].sort((a, b) => a - b);
    const tops = [...new Set(m.teselas.map(t => t.top))].sort((a, b) => a - b);
    for (let i = 1; i < lefts.length; i++) assert.ok(Math.abs(lefts[i] - lefts[i - 1] - k * 256) < 1e-6);
    for (let i = 1; i < tops.length; i++) assert.ok(Math.abs(tops[i] - tops[i - 1] - k * 256) < 1e-6);
    assert.ok(lefts[0] <= 0 && tops[0] <= 0 && lefts[lefts.length - 1] + k * 256 >= 360 && tops[tops.length - 1] + k * 256 >= 260);
    // La ruta llena el recuadro (como mucho un 26 % por debajo del ajuste perfecto).
    const ps = ruta.p.map(q => m.punto(q));
    const w = Math.max(...ps.map(p => p.x)) - Math.min(...ps.map(p => p.x)), h = Math.max(...ps.map(p => p.y)) - Math.min(...ps.map(p => p.y));
    assert.ok(Math.max(w / util.x, h / util.y) >= 0.79 && w <= util.x + 1e-6 && h <= util.y + 1e-6, metros + " m: " + w.toFixed(0) + "x" + h.toFixed(0));
    // Cada punto cae en el mismo pixel que en su tesela.
    const q = ruta.p[13], zt = m.teselas[0].z, px = aPixel(q[0], q[1], zt);
    const t = m.teselas.find(t => t.x === Math.floor(px.x / 256) && t.y === Math.floor(px.y / 256));
    const aMano = { x: t.left + (px.x - t.x * 256) * k, y: t.top + (px.y - t.y * 256) * k };
    const p = m.punto(q);
    assert.ok(Math.abs(p.x - aMano.x) < 1e-6 && Math.abs(p.y - aMano.y) < 1e-6);
  }
  // Sin ajustar, como siempre: teselas enteras de 256.
  assert.ok(proyectar(recta(1000), 360, 260, 20, 62).teselas.every(t => t.size === 256));
});
