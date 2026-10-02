/**
 * Distancia y ritmo con el GPS del movil, sin Strava ni mapas.
 *
 * El navegador da fixes { lat, lon, acc (m), speed (m/s o null), t (ms) }
 * cada ~1 s (enableHighAccuracy, maximumAge 0: GNSS puro, lo maximo que da
 * Chrome; la web no deja pedir otro intervalo).
 *
 * Como se mide, igual que Strava:
 *  1. Un fix vale si su precision es de 20 m o mejor y no implica ir a mas
 *     de 40 km/h desde el ultimo punto bueno, ni bastante mas rapido de lo
 *     que el propio GPS mide que vas (eso es un salto del GPS).
 *  2. Un fix bueno entra en la traza si han pasado 2 s o se ha movido 5 m
 *     desde el ultimo punto guardado, lo que pase antes.
 *  3. La distancia es la suma haversine entre puntos consecutivos de esa
 *     traza, tal cual. Nada de promediar ni simplificar antes de sumar: eso
 *     recorta las curvas y la distancia sale corta (la version anterior se
 *     quedaba un 9% por debajo de Strava). Simplificar es solo para dibujar.
 *  4. Unica salvaguarda: parado (Doppler < 0,5 m/s y moverse menos que la
 *     precision del fix) no suma el temblor del GPS.
 * La velocidad Doppler (coords.speed) solo se usa para el ritmo "de ahora"
 * en pantalla: Chrome la da suavizada y, integrada, cuenta corto.
 *
 * Todo puro: se mide con el simulador (node scripts/sim-gps.mjs), sin movil.
 */
import { secondsToRitmo } from "./ritmo.js";

/** Peor precision que se acepta (m). */
export const PRECISION_MAX_M = 20;
/** 40 km/h: mas rapido que esto entre dos puntos es un salto del GPS. */
export const VELOCIDAD_MAX_MS = 40 / 3.6;
/** Un punto nuevo en la traza cada 2 s o cada 5 m, lo que pase antes. */
export const MUESTREO_S = 2;
export const MUESTREO_M = 5;
/** Margen sobre lo que permite el Doppler antes de llamarlo salto. */
const MARGEN_SALTO = { ms: 0.5, m: 3 };
/** Tras tantos segundos rechazando, se vuelve a fiar del GPS. */
const ATASCO_S = 20;
/** Parado: Doppler por debajo de esto (m/s). */
const PARADO_MS = 0.5;
/** Mas de esto sin fixes es un hueco (pantalla apagada, tunel). */
export const HUECO_S = 10;
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
 *  m, seg: metros (suma de la traza) y segundos con el GPS en marcha.
 *  ultimo: el ultimo fix recibido (null tras una pausa).
 *  pos: el ultimo punto guardado en la traza; pendiente: metros desde ese
 *    punto hasta el ultimo fix bueno aun no guardado (para cortar series).
 *  traza: [lat, lon, t, v, k] por punto guardado y null en cada pausa.
 *  linea: [{ t, s, m }] por punto guardado, para tiempoHasta.
 *  huecos: segundos sin fixes de cada hueco (pantalla apagada).
 */
export function nuevoRegistro() {
  return { m: 0, seg: 0, ultimo: null, pos: null, pendiente: 0, traza: [], linea: [], k: 0,
           vDoppler: null, vAhora: null, segActivo: 0, huecos: [] };
}

/** El temporizador avisa de si ahora se corre (0) o se recupera (1): el mapa lo pinta distinto. */
export function marcarTramo(reg, k) {
  return reg.k === k ? reg : { ...reg, k };
}

const precisionOk = (p) => p.lat != null && p.lon != null && p.acc != null && p.acc <= PRECISION_MAX_M;
const dopplerDe = (p) => (p.speed != null && Number.isFinite(p.speed) && p.speed >= 0 && p.speed <= VELOCIDAD_MAX_MS ? p.speed : null);

/** El ritmo de ahora sin Doppler: lo recorrido en la traza en los ultimos ~20 s. */
function velocidadDeLinea(linea) {
  if (linea.length < 2) return null;
  const fin = linea[linea.length - 1];
  let ini = fin;
  for (let i = linea.length - 1; i >= 0 && fin.t - linea[i].t <= 20000; i--) ini = linea[i];
  return fin.t - ini.t >= 8000 ? (fin.m - ini.m) / ((fin.t - ini.t) / 1000) : null;
}

/**
 * Suma un fix al registro. Devuelve un registro nuevo (o el mismo si no
 * aporta nada). El primero, o el primero tras una pausa, solo ancla.
 */
export function agregarPunto(reg, p) {
  if (!p || p.t == null) return reg;
  const vd = dopplerDe(p);
  if (!reg.ultimo) {
    if (!precisionOk(p)) return reg;
    return { ...reg, ultimo: p, pos: p, pendiente: 0, vDoppler: vd, vAhora: null, segActivo: 0,
             traza: [...reg.traza, [p.lat, p.lon, p.t, vd, reg.k || 0]],
             linea: [...reg.linea, { t: p.t, s: reg.seg, m: reg.m }] };
  }
  const dt = (p.t - reg.ultimo.t) / 1000;
  if (dt <= 0) return reg;
  const seg = reg.seg + dt;
  const huecos = dt > HUECO_S ? [...reg.huecos, Math.round(dt)] : reg.huecos;
  let { m, pos, pendiente, traza, linea } = reg;

  if (precisionOk(p)) {
    const d = distanciaM(pos, p);
    const dtp = (p.t - pos.t) / 1000;
    // Un salto: mas de 40 km/h, o avanzar mas de lo que permite la velocidad
    // que el propio GPS mide (Doppler), con margen. Lo segundo pilla los
    // rebotes en edificios de 20-40 m, que a 40 km/h aun colarian. Si lleva
    // 20 s rechazando, el que se equivoca es el filtro: se vuelve a fiar.
    // Sin Doppler, la referencia es la velocidad de la propia traza (8 s).
    const vRef = vd != null ? vd : reg.vDoppler != null ? reg.vDoppler : reg.vAhora;
    const atascado = dtp > ATASCO_S;
    const salto = dtp > 0 && (d / dtp > VELOCIDAD_MAX_MS ||
      (!atascado && vRef != null && d > vRef * dtp + MARGEN_SALTO.ms * dtp + MARGEN_SALTO.m));
    // Parado: no se suma el temblor. El punto guardado no se mueve, asi que
    // si en realidad avanzas, esa distancia entra entera con el siguiente.
    const parado = vd != null ? vd < PARADO_MS && d < Math.max(p.acc, MUESTREO_M) : d < p.acc / 2;
    if (!salto && !parado) {
      if (dtp >= MUESTREO_S || d >= MUESTREO_M) {
        m += d; pos = p; pendiente = 0;
        traza = [...traza, [p.lat, p.lon, p.t, vd != null ? vd : d / dtp, reg.k || 0]];
        linea = [...linea, { t: p.t, s: seg, m }];
      } else {
        pendiente = d;
      }
    } else if (parado) {
      pendiente = 0;
    }
  }

  // Ritmo de ahora: con Doppler si lo hay; si no, con la traza.
  const vMedida = vd != null ? vd : velocidadDeLinea(linea);
  const w = 1 - Math.exp(-dt / TAU_AHORA);
  const vAhora = vMedida == null ? reg.vAhora : reg.vAhora == null ? vMedida : reg.vAhora + w * (vMedida - reg.vAhora);
  return { ...reg, ultimo: p, m, seg, pos, pendiente, traza, linea, huecos,
           vDoppler: vd != null ? vd : reg.vDoppler, vAhora, segActivo: reg.segActivo + dt };
}

/**
 * Foto del registro para medir un tramo: { m, seg }. Suma lo que va del
 * ultimo punto guardado al ultimo fix bueno y, con `ahoraT`, estira hasta
 * ese instante con la velocidad de ahora (hasta 2 s): el temporizador corta
 * entre dos fixes, y a 4:35 un segundo son 3,6 m.
 */
export function foto(reg, ahoraT) {
  let m = reg.m + (reg.pendiente || 0), seg = reg.seg;
  if (reg.ultimo && ahoraT != null) {
    const extra = Math.min(2, Math.max(0, (ahoraT - reg.ultimo.t) / 1000));
    const v = reg.vDoppler != null ? reg.vDoppler : reg.vAhora;
    m += (v || 0) * extra; seg += extra;
  }
  return { m, seg };
}

/** Pausa: el siguiente fix vuelve a anclar, asi no se cuenta el hueco. */
export function pausar(reg) {
  const f = foto(reg);
  const traza = reg.traza.length && reg.traza[reg.traza.length - 1] !== null ? [...reg.traza, null] : reg.traza;
  return { ...reg, m: f.m, pendiente: 0, ultimo: null, pos: null, vDoppler: null, vAhora: null, traza };
}

/** Segundos perdidos en huecos (pantalla apagada). */
export const segundosEnHuecos = (reg) => (reg.huecos || []).reduce((a, b) => a + b, 0);

/**
 * Ritmo de ahora (s/km), suavizado unos 8 s. null si aun no hay 8 s de
 * carrera, si vas parado o casi (menos de 1 m/s) o si el GPS lleva callado
 * mas de 10 s.
 */
export function ritmoActual(reg, ahoraT) {
  if (!reg.ultimo || reg.vAhora == null || reg.segActivo < 8) return null;
  if (ahoraT != null && ahoraT - reg.ultimo.t > HUECO_S * 1000) return null;
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
