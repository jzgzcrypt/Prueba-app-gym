/**
 * Simulador del GPS de un movil, para medir el error del analizador.
 *
 * Genera una ruta urbana con giros y la recorre a un ritmo conocido. Encima
 * pone los errores que tiene un GPS de verdad:
 *   - deriva lenta (el error se mueve despacio, correlado en el tiempo);
 *   - ruido de cada punto;
 *   - saltos de 20-60 m que duran 2-8 s (rebotes en edificios) y que a veces
 *     dicen tener buena precision;
 *   - puntos perdidos;
 *   - velocidad Doppler (coords.speed) con ±0,15 m/s y algun pico absurdo,
 *     o sin ella (movil que no la da).
 *
 * Uso: node scripts/sim-gps.mjs            -> tabla con el analizador actual
 *      node scripts/sim-gps.mjs ruta/gps.js -> la misma tabla con otro analizador
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const M_LAT = 111195;
const M_LON = M_LAT * Math.cos(41.65 * Math.PI / 180);

export const ESCENARIOS = {
  abierto: { nombre: "Cielo abierto", sig: 3, tau: 20, blanco: 1.5, pSalto: 0, pPerdida: 0.02 },
  ciudad: { nombre: "Ciudad con saltos", sig: 5, tau: 15, blanco: 3, pSalto: 0.01, pPerdida: 0.05 },
  malo: { nombre: "Señal mala", sig: 8, tau: 10, blanco: 4, pSalto: 0.03, pPerdida: 0.1 },
  // Lo que da de verdad un movil: el chip GNSS ya filtra la posicion, asi que
  // el error es casi todo deriva lenta y suave y muy poco ruido de un fix a
  // otro. Los tres de arriba son GPS "crudo" (sin filtro de chip): sirven de
  // caso extremo, pero no es lo que entrega un Android.
  movil: { nombre: "Móvil real", chip: true, tau: 30, sigV: 0.15, blanco: 0.3, pSalto: 0.004, pPerdida: 0.02 },
  movilCiudad: { nombre: "Móvil real, ciudad", chip: true, tau: 20, sigV: 0.25, blanco: 0.5, pSalto: 0.01, pPerdida: 0.05 },
};

/** Generador repetible (misma semilla, mismos numeros). */
export function azar(semilla) {
  let s = semilla;
  const u = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const g = () => { const a = u() || 1e-9, b = u(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); };
  return { u, g };
}

/** Ruta de `largo` m, tramos rectos de 100-300 m con giros de hasta 90º. Un punto por metro. */
function ruta(largo, r) {
  const pts = [{ x: 0, y: 0 }];
  let h = 0, x = 0, y = 0, d = 0;
  while (d < largo + 600) {
    const tramo = 100 + r.u() * 200;
    h += (r.u() - 0.5) * Math.PI;
    for (let s = 0; s < tramo; s++) { x += Math.cos(h); y += Math.sin(h); pts.push({ x, y }); }
    d += tramo;
  }
  return pts;
}

/**
 * Una sesion: `plan` es una lista de trozos { seg, v } (v en m/s). Devuelve
 * los fixes del GPS y, para cada trozo, el instante y los metros reales al
 * empezar y acabar.
 */
export function simular(plan, esc, { semilla = 1, doppler = true } = {}) {
  const r = azar(semilla);
  const total = plan.reduce((a, p) => a + p.seg * p.v, 0);
  const camino = ruta(total, r);
  const a = Math.exp(-1 / esc.tau);
  const k = Math.sqrt(1 - a * a) * esc.sig;
  // Chip (movil real): el error de posicion es SUAVE. El chip integra la
  // velocidad Doppler en un filtro, asi que de un segundo a otro el error
  // solo cambia lo que se equivoca esa velocidad (~0,15 m/s), y a la larga
  // vuelve a su sitio (deriva de unos metros que tarda ~tau en cambiar).
  let vx = 0, vy = 0;
  const av = Math.exp(-1 / 5), kv = Math.sqrt(1 - av * av) * (esc.sigV || 0.15);
  let ex = 0, ey = 0, salto = 0, sx = 0, sy = 0, m = 0, t = 0;
  const fixes = [], trozos = [];
  const punto = (mm) => {
    const i = Math.min(camino.length - 2, Math.floor(mm));
    const f = mm - i, p = camino[i], q = camino[i + 1];
    return { x: p.x + f * (q.x - p.x), y: p.y + f * (q.y - p.y) };
  };
  const fix = (v) => {
    if (esc.chip) {
      vx = av * vx + kv * r.g(); vy = av * vy + kv * r.g();
      ex += vx - ex / esc.tau; ey += vy - ey / esc.tau;
    } else { ex = a * ex + k * r.g(); ey = a * ey + k * r.g(); }
    if (salto > 0) salto--;
    else if (r.u() < esc.pSalto) { salto = 2 + Math.floor(r.u() * 7); const ang = r.u() * 2 * Math.PI, mag = 20 + r.u() * 40; sx = Math.cos(ang) * mag; sy = Math.sin(ang) * mag; }
    if (r.u() < esc.pPerdida) return;
    const p = punto(m);
    const jx = salto > 0 ? sx : 0, jy = salto > 0 ? sy : 0;
    const x = p.x + ex + esc.blanco * r.g() + jx, y = p.y + ey + esc.blanco * r.g() + jy;
    // La precision que dice el movil: casi siempre 4-8 m; en un salto, la mitad de las veces miente.
    const acc = salto > 0 ? (r.u() < 0.5 ? 6 + r.u() * 4 : 20 + r.u() * 20) : 4 + r.u() * 4;
    let speed = null;
    if (doppler) {
      speed = Math.max(0, v + 0.15 * r.g());
      if (r.u() < 0.005) speed += 2 + r.u() * 4; // pico absurdo
    }
    fixes.push({ lat: 41.65 + y / M_LAT, lon: -0.88 + x / M_LON, acc, speed, t: Math.round(t * 1000) });
  };
  for (const p of plan) {
    const ini = { t: t * 1000, m };
    for (let s = 0; s < p.seg; s++) { fix(p.v); t += 1; m += p.v; }
    trozos.push({ ...p, ini, fin: { t: t * 1000, m } });
  }
  fix(plan.length ? plan[plan.length - 1].v : 0);
  return { fixes, trozos };
}

/**
 * Pasa los fixes por el analizador y mide cada trozo con `foto` en los
 * instantes reales de inicio y fin (como hace el temporizador).
 */
export function medir(gps, { fixes, trozos }) {
  const cortes = new Map();
  for (const tr of trozos) { cortes.set(tr.ini.t, true); cortes.set(tr.fin.t, true); }
  let reg = gps.nuevoRegistro();
  const fotos = new Map();
  let i = 0;
  const instantes = [...cortes.keys()].sort((x, y) => x - y);
  for (const tc of instantes) {
    while (i < fixes.length && fixes[i].t <= tc) reg = gps.agregarPunto(reg, fixes[i++]);
    fotos.set(tc, gps.foto(reg, tc));
  }
  while (i < fixes.length) reg = gps.agregarPunto(reg, fixes[i++]);
  return trozos.map(tr => {
    const a = fotos.get(tr.ini.t), b = fotos.get(tr.fin.t);
    const mReal = tr.fin.m - tr.ini.m, mMedido = b.m - a.m, seg = (tr.fin.t - tr.ini.t) / 1000;
    return { ...tr, mReal, mMedido, errPct: (mMedido - mReal) / mReal * 100,
             ritmoReal: seg / mReal * 1000, ritmoMedido: seg / mMedido * 1000 };
  });
}

const RITMO = 285;
/** Carrera continua de `largo` m a 4:45. */
export const continua = (largo) => [{ seg: Math.round(largo / (1000 / RITMO)), v: 1000 / RITMO }];
/** Series: calentamiento, 6 x (400 m a 4:35 + 90 s trote), vuelta a la calma. */
export const series = (metros = 400, ritmo = 275, n = 6) => {
  const p = [{ seg: 300, v: 2.6 }];
  for (let i = 0; i < n; i++) p.push({ seg: Math.round(metros / (1000 / ritmo)), v: 1000 / ritmo, serie: true }, { seg: 90, v: 2.3 });
  p.push({ seg: 120, v: 2.3 });
  return p;
};

const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const p90 = (a) => [...a].map(Math.abs).sort((x, y) => x - y)[Math.floor(a.length * 0.9)];

/** Error (%) de distancia en carreras continuas y (s/km) en series, para un escenario. */
export function evaluar(gps, esc, { vueltas = 40, doppler = true } = {}) {
  const out = {};
  for (const largo of [400, 1000, 2000, 7000]) {
    const e = [];
    for (let k = 0; k < vueltas; k++) e.push(medir(gps, simular(continua(largo), esc, { semilla: 11 + k * 7919, doppler }))[0].errPct);
    out[largo] = { sesgo: media(e), p90: p90(e) };
  }
  const es = [];
  for (let k = 0; k < Math.ceil(vueltas / 4); k++) {
    for (const s of medir(gps, simular(series(), esc, { semilla: 5 + k * 104729, doppler })).filter(s => s.serie)) es.push(s.ritmoMedido - s.ritmoReal);
  }
  out.series = { sesgo: media(es), p90: p90(es) };
  return out;
}

async function main() {
  const ruta = process.argv[2] ? resolve(process.argv[2]) : resolve("src/domain/running/gps.js");
  const gps = await import(pathToFileURL(ruta).href);
  const f = (x) => (x >= 0 ? " " : "") + x.toFixed(1);
  console.log("Analizador:", ruta);
  console.log("Error de distancia: p90 (sesgo), en %.  Series 6x400 a 4:35: p90 del error de ritmo en s/km.\n");
  for (const doppler of [true, false]) {
    console.log(doppler ? "── Con velocidad Doppler (Android normal)" : "── Sin velocidad Doppler");
    console.log("Escenario            |    400 m    |    1 km     |    2 km     |    7 km     | series 400 m");
    for (const esc of Object.values(ESCENARIOS)) {
      const r = evaluar(gps, esc, { doppler });
      const c = (k) => (r[k].p90.toFixed(1) + "% (" + f(r[k].sesgo) + ")").padStart(11);
      console.log(esc.nombre.padEnd(20), "|", c(400), "|", c(1000), "|", c(2000), "|", c(7000), "|",
        ("±" + r.series.p90.toFixed(1) + " s/km (" + f(r.series.sesgo) + ")").padStart(18));
    }
    console.log();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
