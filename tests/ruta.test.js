/**
 * La ruta para el mapa: guardarla en poco, encajarla en el mapa, colorearla
 * por ritmo y sacarla en GPX.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { agregarPunto, marcarTramo, nuevoRegistro, pausar } from "../src/domain/running/gps.js";
import { aGpx, aPixel, categoria, proyectar, simplificar, tramosPorColor } from "../src/domain/running/ruta.js";

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
