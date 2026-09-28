/**
 * Distancia y ritmo con el GPS del movil, sin Strava ni mapas.
 *
 * El navegador da fixes { lat, lon, acc (m), speed (m/s o null), t (ms) }
 * cada ~1 s. Aqui se limpian y se convierten en metros y ritmo. Todo puro: se
 * mide con el simulador (node scripts/sim-gps.mjs), sin movil.
 *
 * Dos formas de medir, y se usa la mejor que haya en cada fix:
 *  1. Velocidad Doppler (coords.speed; Chrome en Android la da con GPS). El
 *     GPS la mide por el cambio de frecuencia de los satelites: ±0,1-0,2 m/s
 *     y sin la deriva de la posicion. La distancia es esa velocidad
 *     integrada en el tiempo, como hacen Strava y los relojes. Se descartan
 *     los picos imposibles.
 *  2. Sin Doppler, la posicion: se tiran los fixes imprecisos y los saltos
 *     (mas de 25 km/h desde el ultimo bueno), se promedian los 5 ultimos y la
 *     distancia se suma a trozos de 10 m. Sumar fix a fix con ruido infla la
 *     distancia un 25-180%.
 * (Se probo un filtro de Kalman para la posicion: con los saltos del GPS en
 * ciudad salia peor que esto. Ver CHANGELOG.)
 */
import { secondsToRitmo } from "./ritmo.js";

/** Peor precision que se acepta para la posicion. */
export const PRECISION_MAX_M = 25;
/** Mas rapido que esto (25 km/h) no se corre: es un salto del GPS. */
export const VELOCIDAD_MAX_MS = 7;
/** Cambio de velocidad creible entre fixes (m/s por segundo). */
const ACELERACION_MAX = 2.5;
/** Por debajo, parado: el Doppler de un movil quieto no es cero, es ruido. */
const PARADO_MS = 0.3;
/** Fixes que se promedian para la posicion (~5 s). */
export const SUAVIZADO = 5;
/** Trozo minimo para sumar distancia con la posicion. */
export const TRAMO_MIN_M = 10;
/** Suavizado del ritmo "de ahora" (s). */
const TAU_AHORA = 8;

const R_TIERRA = 6371000;
const rad = (g) => g * Math.PI / 180;

/** Metros entre dos puntos (haversine). */
export function distanciaM(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TIERRA * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Un registro vacio.
 *  m, seg: metros y segundos en movimiento (sin pausas).
 *  linea: [{ t, s, m }] un punto por fix, para tiempoHasta.
 *  ultimo: el ultimo fix (null tras una pausa: el siguiente solo ancla).
 *  pos: el ultimo fix de posicion bueno; buf, suave, ancla: la posicion promediada.
 *  vDoppler: la ultima velocidad Doppler buena; vAhora: la suavizada para mostrar.
 */
export function nuevoRegistro() {
  return { m: 0, seg: 0, ultimo: null, pos: null, buf: [], suave: null, ancla: null, linea: [],
           vDoppler: null, rechazosV: 0, vAhora: null, segActivo: 0, modo: null };
}

function promedio(buf) {
  const n = buf.length;
  // La posicion promediada es la de hace ~2 s: lleva ese tiempo (la media).
  return { lat: buf.reduce((a, p) => a + p.lat, 0) / n, lon: buf.reduce((a, p) => a + p.lon, 0) / n,
           t: buf.reduce((a, p) => a + p.t, 0) / n };
}

/** Velocidad Doppler creible, o null. */
function dopplerValido(reg, p, dt) {
  const s = p.speed;
  if (s == null || !Number.isFinite(s) || s < 0 || s > VELOCIDAD_MAX_MS) return null;
  // Un pico: cambio imposible respecto a la ultima buena. Tras 3 seguidos,
  // el cambio era de verdad (arrancar tras un semaforo) y se acepta.
  if (reg.vDoppler != null && Math.abs(s - reg.vDoppler) > ACELERACION_MAX * Math.max(1, dt) && reg.rechazosV < 3) return null;
  return s < PARADO_MS ? 0 : s;
}

/** ¿Vale este fix para la posicion? */
function posicionValida(reg, p) {
  if (p.lat == null || p.acc == null || p.acc > PRECISION_MAX_M) return false;
  if (!reg.pos) return true;
  const dt = (p.t - reg.pos.t) / 1000;
  return dt > 0 && distanciaM(reg.pos, p) / dt <= VELOCIDAD_MAX_MS;
}

/**
 * Suma un fix al registro. Devuelve un registro nuevo (o el mismo si el fix
 * no aporta nada). El primero, o el primero tras una pausa, solo ancla.
 */
export function agregarPunto(reg, p) {
  if (!p || p.t == null) return reg;
  if (!reg.ultimo) {
    const okPos = posicionValida({ pos: null }, p);
    const vd = dopplerValido({ vDoppler: null }, p, 1);
    if (!okPos && vd == null) return reg;
    const buf = okPos ? [p] : [];
    const suave = okPos ? promedio(buf) : null;
    return { ...reg, ultimo: p, pos: okPos ? p : null, buf, suave, ancla: suave, vDoppler: vd, rechazosV: 0,
             vAhora: null, segActivo: 0, modo: null,
             linea: reg.linea.length ? reg.linea : [{ t: p.t, s: reg.seg, m: reg.m }] };
  }
  const dt = (p.t - reg.ultimo.t) / 1000;
  if (dt <= 0) return reg;

  // Posicion: promedio de los ultimos fixes buenos.
  let { pos, buf, suave, ancla } = reg;
  let dPos = 0;
  if (posicionValida(reg, p)) {
    pos = p;
    buf = [...buf, p].slice(-SUAVIZADO);
    suave = promedio(buf);
    if (!ancla) ancla = suave;
    const d = distanciaM(ancla, suave);
    if (d >= TRAMO_MIN_M) { dPos = d; ancla = suave; }
  }

  // Distancia: Doppler si lo hay; si no, la posicion.
  const vd = dopplerValido(reg, p, dt);
  const rechazosV = p.speed != null && vd == null ? reg.rechazosV + 1 : 0;
  let m = reg.m, modo, vMedida;
  if (vd != null || (p.speed != null && reg.vDoppler != null)) {
    // Con un pico descartado se sigue con la ultima velocidad buena.
    const v = vd != null ? vd : reg.vDoppler;
    const vPrev = reg.vDoppler != null ? reg.vDoppler : v;
    m += (vPrev + v) / 2 * dt;
    if (suave) ancla = suave; // la posicion queda al dia por si el Doppler falta luego
    modo = "doppler"; vMedida = v;
  } else {
    m += dPos;
    modo = "posicion";
    vMedida = null;
  }
  const seg = reg.seg + dt;
  // La linea (para tiempoHasta): con Doppler, un punto por fix; con posicion,
  // uno por trozo, con el tiempo de la posicion promediada (va ~2 s por detras).
  let linea = reg.linea;
  if (modo === "doppler") linea = [...linea, { t: p.t, s: seg, m }];
  else if (dPos > 0) linea = [...linea, { t: suave.t, s: seg - (p.t - suave.t) / 1000, m }];
  if (vMedida == null) {
    // Sin Doppler, la velocidad sale de la linea de los ultimos ~20 s.
    const l = linea, fin = l[l.length - 1];
    // (callado mas de 10 s: no se inventa)
    let ini = l[l.length - 1];
    for (let i = l.length - 1; i >= 0 && fin.t - l[i].t <= 20000; i--) ini = l[i];
    vMedida = fin.t - ini.t >= 8000 ? (fin.m - ini.m) / ((fin.t - ini.t) / 1000) : null;
  }
  const w = 1 - Math.exp(-dt / TAU_AHORA);
  const vAhora = vMedida == null ? reg.vAhora : reg.vAhora == null ? vMedida : reg.vAhora + w * (vMedida - reg.vAhora);
  return { ...reg, ultimo: p, pos, buf, suave, ancla, vDoppler: vd != null ? vd : reg.vDoppler, rechazosV,
           m, seg, modo, vAhora, segActivo: reg.segActivo + dt, linea };
}

/**
 * Foto del registro para medir un tramo: { m, seg }.
 * Sin Doppler suma lo que va desde el ultimo trozo hasta el ultimo fix bueno
 * (no el promediado, que va ~2 s por detras). Con `ahoraT` estira hasta ese
 * instante con la ultima velocidad (hasta 3 s): el temporizador corta entre
 * dos fixes, y a 4:35 un segundo son 3,6 m.
 */
export function foto(reg, ahoraT) {
  let m = reg.m, seg = reg.seg;
  if (reg.ultimo && reg.modo === "posicion" && reg.ancla && reg.pos) m += distanciaM(reg.ancla, reg.pos);
  if (reg.ultimo && ahoraT != null) {
    const extra = Math.min(3, Math.max(0, (ahoraT - reg.ultimo.t) / 1000));
    const v = reg.modo === "doppler" ? reg.vDoppler : reg.vAhora;
    m += (v || 0) * extra; seg += extra;
  }
  return { m, seg };
}

/** Pausa: el siguiente fix vuelve a anclar, asi no se cuenta el hueco. */
export function pausar(reg) {
  const f = foto(reg);
  return { ...reg, m: f.m, ultimo: null, pos: null, buf: [], suave: null, ancla: null, vDoppler: null, vAhora: null, modo: null };
}

/**
 * Ritmo de ahora (s/km), suavizado unos 8 s. null si aun no hay 8 s de
 * carrera, si vas parado o casi (menos de 1 m/s) o si el GPS lleva callado
 * mas de 10 s.
 */
export function ritmoActual(reg, ahoraT) {
  if (!reg.ultimo || reg.vAhora == null || reg.segActivo < 8) return null;
  if (ahoraT != null && ahoraT - reg.ultimo.t > 10000) return null;
  if (reg.vAhora < 1) return null;
  return 1000 / reg.vAhora;
}

/** Lo recorrido entre dos fotos del registro: { m, seg, ritmo }. */
export function entre(antes, despues) {
  const m = despues.m - antes.m, seg = despues.seg - antes.seg;
  return { m: Math.round(m), seg: Math.round(seg), ritmo: m >= 50 ? seg / m * 1000 : null };
}

/** Segundos en movimiento (sin pausas) hasta llegar a `metros`, interpolando. null si no se llego. */
export function tiempoHasta(reg, metros) {
  const l = reg.linea;
  if (!l.length || l[l.length - 1].m < metros) return null;
  for (let i = 1; i < l.length; i++) {
    if (l[i].m >= metros) {
      const a = l[i - 1], b = l[i];
      const f = b.m === a.m ? 1 : (metros - a.m) / (b.m - a.m);
      return a.s + f * (b.s - a.s);
    }
  }
  return null;
}

/** "14:20" o "1:02:05". */
export function textoTiempo(seg) {
  const s = Math.round(seg), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const ss = String(r).padStart(2, "0");
  return h ? h + ":" + String(m).padStart(2, "0") + ":" + ss : m + ":" + ss;
}

/** Media de los tramos, pesada por distancia (una serie corta no cuenta igual que una larga). */
export function ritmoMedio(tramos) {
  const v = (tramos || []).filter(t => t && t.ritmo && t.m >= 50);
  const m = v.reduce((a, t) => a + t.m, 0);
  if (!m) return null;
  return v.reduce((a, t) => a + t.seg, 0) / m * 1000;
}

/**
 * Lo que va a la libreta, en el mismo formato que se escribe a mano (ver
 * queApuntar): "14:20" en una prueba de distancia, "18 min a 6:40/km" en la
 * de partida, "4:40/km" en series o rodajes. null si no hay dato fiable.
 *
 * `tramos`: los tramos corridos (series rapidas o "correr"), `total`: toda la
 * sesion { m, seg }, `tiempoPrueba`: segundos al cruzar la distancia de la prueba.
 */
export function textoParaLibreta({ day, tramos, total, tiempoPrueba }) {
  if (day.prueba && day.prueba.distKm) {
    if (tiempoPrueba) return textoTiempo(tiempoPrueba);
    if (total && total.m >= day.prueba.distKm * 1000 * 0.97) return textoTiempo(total.seg * day.prueba.distKm * 1000 / total.m);
    return null;
  }
  const medio = ritmoMedio(tramos);
  if (medio) return secondsToRitmo(medio) + "/km";
  if (!total || total.m < 500) return null;
  const r = secondsToRitmo(total.seg / total.m * 1000) + "/km";
  if (day.prueba && day.prueba.partida) return Math.round(total.seg / 60) + " min a " + r;
  return r;
}

/**
 * Como va respecto al objetivo: "bien" dentro de ±`margen` s/km, "rapido"
 * o "lento" fuera. null sin objetivo o sin ritmo.
 */
export function comoVa(ritmo, objetivo, margen = 5) {
  if (!ritmo || !objetivo) return null;
  if (ritmo < objetivo - margen) return "rapido";
  if (ritmo > objetivo + margen) return "lento";
  return "bien";
}
