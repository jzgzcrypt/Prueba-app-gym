/**
 * Compara la distancia de dos GPX: el "GPX completo" de la app y el de Strava
 * de la misma salida.
 *
 *   node scripts/comparar-gpx.mjs app.gpx strava.gpx
 *
 * Para cada uno da tres numeros:
 *   - suma bruta: haversine punto a punto, sin filtrar nada;
 *   - con el analizador de la app (gps.js): lo que la app habria medido con
 *     esos puntos (sin precision ni Doppler en el GPX: se toman como buenos);
 *   - y la diferencia entre los dos ficheros, que es lo que hay que mirar:
 *     dentro de ±2% es que la app mide como Strava.
 */
import { readFileSync } from "node:fs";
import { agregarPunto, distanciaM, foto, nuevoRegistro } from "../src/domain/running/gps.js";

function leerGpx(ruta) {
  const xml = readFileSync(ruta, "utf8");
  const puntos = [];
  const re = /<trkpt\b[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>|<trkpt\b[^>]*\blon="([-\d.]+)"[^>]*\blat="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let m;
  while ((m = re.exec(xml))) {
    const lat = Number(m[1] ?? m[5]), lon = Number(m[2] ?? m[4]), dentro = m[3] ?? m[6] ?? "";
    const t = /<time>([^<]+)<\/time>/.exec(dentro);
    puntos.push({ lat, lon, t: t ? Date.parse(t[1]) : null });
  }
  return puntos;
}

function medir(puntos) {
  let bruta = 0;
  for (let i = 1; i < puntos.length; i++) bruta += distanciaM(puntos[i - 1], puntos[i]);
  let reg = nuevoRegistro();
  puntos.forEach((p, i) => { reg = agregarPunto(reg, { ...p, acc: 5, speed: null, t: p.t ?? i * 1000 }); });
  return { puntos: puntos.length, bruta, app: foto(reg).m };
}

const [a, b] = process.argv.slice(2);
if (!a) { console.log("Uso: node scripts/comparar-gpx.mjs app.gpx [strava.gpx]"); process.exit(1); }
const km = (m) => (m / 1000).toFixed(3) + " km";
const ra = medir(leerGpx(a));
console.log(a + ": " + ra.puntos + " puntos · suma bruta " + km(ra.bruta) + " · con el analizador " + km(ra.app));
if (b) {
  const rb = medir(leerGpx(b));
  console.log(b + ": " + rb.puntos + " puntos · suma bruta " + km(rb.bruta) + " · con el analizador " + km(rb.app));
  const dif = (ra.bruta - rb.bruta) / rb.bruta * 100;
  console.log("Diferencia (suma bruta): " + (dif >= 0 ? "+" : "") + dif.toFixed(1) + "% " + (Math.abs(dif) <= 2 ? "✓ dentro de ±2%" : "✗ fuera de ±2%"));
}
