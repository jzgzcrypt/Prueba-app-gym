/**
 * La ruta de una salida: guardarla en poco, pintarla en un mapa de
 * OpenStreetMap y sacarla en GPX. Todo puro.
 *
 * Traza (lo que junta gps.js mientras corres): [lat, lon, t (ms), v (m/s o
 * null), k] por fix, con `null` donde hubo una pausa. k: 0 corriendo, 1
 * recuperando (trote o caminar entre series).
 *
 * Ruta guardada: { t0, p: [[lat, lon, s, v10, k] | null] } con lat/lon a 5
 * decimales (~1 m), s en segundos desde t0 y la velocidad x10. Una hora de
 * carrera queda en unos 4-6 KB.
 */

const M_LAT = 111195;
const rad = (g) => g * Math.PI / 180;

/** Distancia de un punto a un segmento, en metros (plano local). */
function distASegmento(p, a, b, kLon) {
  const ax = a[1] * kLon, ay = a[0] * M_LAT, bx = b[1] * kLon, by = b[0] * M_LAT, px = p[1] * kLon, py = p[0] * M_LAT;
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  const f = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + f * dx), py - (ay + f * dy));
}

/** Douglas-Peucker: los indices que se quedan (siempre el primero y el ultimo). */
function dp(pts, tol, kLon) {
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const pila = [[0, pts.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop();
    let max = 0, idx = -1;
    for (let k = i + 1; k < j; k++) {
      const d = distASegmento(pts[k], pts[i], pts[j], kLon);
      if (d > max) { max = d; idx = k; }
    }
    if (max > tol) { keep[idx] = true; pila.push([i, idx], [idx, j]); }
  }
  return keep;
}

/**
 * De la traza a la ruta guardada: se quitan los puntos que no cambian el
 * dibujo (a menos de `tolM` metros de la linea) y a cada punto que queda se
 * le pone la velocidad media del trozo que representa, para colorear bien.
 * Los cambios de serie a recuperacion y las pausas se respetan.
 */
/**
 * La traza entera, sin quitar ni un punto, en el mismo formato que la ruta
 * guardada: para el "GPX completo" con el que comparar con Strava.
 */
export function sinSimplificar(traza) {
  const puntos = (traza || []).filter(Boolean);
  if (puntos.length < 2) return null;
  const t0 = puntos[0][2];
  const r5 = (x) => Math.round(x * 1e6) / 1e6;
  return { t0, p: traza.map(q => q ? [r5(q[0]), r5(q[1]), Math.round((q[2] - t0) / 1000), q[3] == null ? null : Math.round(q[3] * 10), q[4] || 0] : null) };
}

export function simplificar(traza, tolM = 2) {
  const puntos = (traza || []).filter(Boolean);
  if (puntos.length < 2) return null;
  const t0 = puntos[0][2];
  const kLon = M_LAT * Math.cos(rad(puntos[0][0]));
  // Trozos seguidos sin pausa y con el mismo k.
  const trozos = [];
  let actual = [];
  for (const p of traza) {
    if (!p) { if (actual.length) trozos.push(actual); actual = []; trozos.push(null); continue; }
    if (actual.length && actual[actual.length - 1][4] !== p[4]) {
      trozos.push(actual);
      // El nuevo trozo empieza donde acabo el otro (sin hueco en el dibujo),
      // pero sin su velocidad: si no, cada serie empezaria pintada de trote.
      const u = actual[actual.length - 1];
      actual = [[u[0], u[1], u[2], null, p[4]]];
    }
    actual.push(p);
  }
  if (actual.length) trozos.push(actual);

  const p = [];
  const redondea = (x) => Math.round(x * 1e5) / 1e5;
  for (const tr of trozos) {
    if (!tr) { if (p.length && p[p.length - 1] !== null) p.push(null); continue; }
    const keep = tr.length > 2 ? dp(tr, tolM, kLon) : tr.map(() => true);
    let suma = 0, n = 0;
    tr.forEach((q, i) => {
      if (q[3] != null) { suma += q[3]; n++; }
      if (!keep[i]) return;
      const v = n ? suma / n : q[3];
      p.push([redondea(q[0]), redondea(q[1]), Math.round((q[2] - t0) / 1000), v == null ? null : Math.round(v * 10), q[4] || 0]);
      suma = 0; n = 0;
    });
  }
  while (p.length && p[p.length - 1] === null) p.pop();
  return { t0, p };
}

// ── Web Mercator (lo que usan las teselas de OpenStreetMap) ───────────────
const TESELA = 256;
export function aPixel(lat, lon, z) {
  const n = TESELA * 2 ** z;
  const s = Math.sin(rad(lat));
  return { x: (lon + 180) / 360 * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}

/**
 * Encaja la ruta en `ancho` x `alto` px: el zoom mas cercano que cabe (hasta
 * 17), donde cae cada punto y que teselas hacen falta.
 */
export function proyectar(ruta, ancho, alto, margen = 18, margenSup = margen, retina = false) {
  const pts = ruta && ruta.p ? ruta.p.filter(Boolean) : [];
  if (!pts.length) return null;
  const lats = pts.map(q => q[0]), lons = pts.map(q => q[1]);
  const n = Math.max(...lats), s = Math.min(...lats), e = Math.max(...lons), o = Math.min(...lons);
  let z = 17;
  for (; z > 2; z--) {
    const a = aPixel(n, o, z), b = aPixel(s, e, z);
    if (b.x - a.x <= ancho - 2 * margen && b.y - a.y <= alto - margen - margenSup) break;
  }
  const a = aPixel(n, o, z), b = aPixel(s, e, z);
  // Esquina superior izquierda del recuadro, con la ruta centrada.
  const x0 = (a.x + b.x) / 2 - ancho / 2, y0 = (a.y + b.y) / 2 - (margenSup + (alto - margen - margenSup) / 2);
  const punto = (q) => { const px = aPixel(q[0], q[1], z); return { x: px.x - x0, y: px.y - y0 }; };
  // Con `retina`, teselas del zoom siguiente dibujadas a la mitad: la misma zona
  // con el doble de detalle, y los nombres de las calles a la mitad de tamaño.
  const f = retina && z < 19 ? 2 : 1, zt = z + (f === 2 ? 1 : 0), lado = TESELA / f;
  const teselas = [];
  const max = 2 ** zt;
  for (let tx = Math.floor(x0 * f / TESELA); tx <= Math.floor((x0 + ancho) * f / TESELA); tx++) {
    for (let ty = Math.floor(y0 * f / TESELA); ty <= Math.floor((y0 + alto) * f / TESELA); ty++) {
      if (ty < 0 || ty >= max) continue;
      teselas.push({ z: zt, x: ((tx % max) + max) % max, y: ty, left: tx * lado - x0, top: ty * lado - y0, size: lado });
    }
  }
  return { z, punto, teselas, inicio: punto(pts[0]), fin: punto(pts[pts.length - 1]) };
}

/**
 * La categoria de ritmo de un trozo, para el color:
 *  "recupera": trote o caminar entre series (k = 1);
 *  "objetivo": a tu ritmo objetivo o mas rapido (+5 s de margen);
 *  "cerca": hasta 30 s/km mas lento que el objetivo;
 *  "suave": mas lento;
 *  "corre": sin objetivo (rodaje), o sin velocidad.
 */
export function categoria(q, objetivo) {
  if (q[4] === 1) return "recupera";
  if (!objetivo || q[3] == null || q[3] <= 0) return "corre";
  const ritmo = 1000 / (q[3] / 10);
  if (ritmo <= objetivo + 5) return "objetivo";
  if (ritmo <= objetivo + 30) return "cerca";
  return "suave";
}

/**
 * La ruta partida en lineas de un solo color: [{ cat, puntos: [q...] }].
 * Cada punto colorea el trozo que llega hasta el (su velocidad es la media
 * de ese trozo). Las pausas cortan la linea.
 */
export function tramosPorColor(ruta, objetivo) {
  const out = [];
  let prev = null, actual = null;
  for (const q of (ruta && ruta.p) || []) {
    if (!q) { prev = null; actual = null; continue; }
    if (!prev) { prev = q; continue; }
    // El punto de union entre trozos repite posicion: no dibuja nada.
    if (q[0] === prev[0] && q[1] === prev[1]) { prev = q; continue; }
    const cat = categoria(q, objetivo);
    if (!actual || actual.cat !== cat) { actual = { cat, puntos: [prev] }; out.push(actual); }
    actual.puntos.push(q);
    prev = q;
  }
  return out;
}

const escapa = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** GPX 1.1, para Google Earth, Strava o cualquier app de mapas. */
export function aGpx(ruta, titulo) {
  const segmentos = [];
  let seg = [];
  for (const q of (ruta && ruta.p) || []) {
    if (!q) { if (seg.length) segmentos.push(seg); seg = []; continue; }
    const t = new Date(ruta.t0 + q[2] * 1000).toISOString();
    seg.push(`      <trkpt lat="${q[0]}" lon="${q[1]}"><time>${t}</time></trkpt>`);
  }
  if (seg.length) segmentos.push(seg);
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Sistema 7K" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapa(titulo || "Carrera")}</name>
    <type>running</type>
${segmentos.map(s => "    <trkseg>\n" + s.join("\n") + "\n    </trkseg>").join("\n")}
  </trk>
</gpx>
`;
}

// ─── A LO LARGO DE LA RUTA ────────────────────────────────────────────────

const distLL = (a, b) => {
  const kLon = M_LAT * Math.cos(rad((a[0] + b[0]) / 2));
  return Math.hypot((b[0] - a[0]) * M_LAT, (b[1] - a[1]) * kLon);
};

/** Los tramos seguidos de la ruta (cortados en cada pausa), con su distancia acumulada. */
function recorrido(ruta) {
  const segs = [];
  let prev = null, acum = 0;
  for (const q of (ruta && ruta.p) || []) {
    if (!q) { prev = null; continue; }
    if (prev) { const d = distLL(prev, q); segs.push({ a: prev, b: q, desde: acum, d }); acum += d; }
    prev = q;
  }
  return { segs, total: acum };
}

/** El punto a `metros` del inicio, y el tramo en el que cae. */
function puntoA({ segs }, metros) {
  for (const s of segs) {
    if (metros <= s.desde + s.d) {
      const f = s.d ? (metros - s.desde) / s.d : 0;
      return { lat: s.a[0] + f * (s.b[0] - s.a[0]), lon: s.a[1] + f * (s.b[1] - s.a[1]), a: s.a, b: s.b };
    }
  }
  return null;
}

/**
 * Las marcas de cada km: [{ n, lat, lon }]. Se reparten en proporcion a la
 * distancia MEDIDA (`metrosMedidos`), no a la del trazado simplificado, para
 * que el "2" caiga donde la app conto 2 km.
 */
export function marcasKm(ruta, metrosMedidos) {
  const r = recorrido(ruta);
  if (!r.total) return [];
  const escala = metrosMedidos > 0 ? r.total / metrosMedidos : 1;
  const out = [];
  for (let n = 1; n * 1000 * escala < r.total; n++) {
    const p = puntoA(r, n * 1000 * escala);
    if (p) out.push({ n, lat: p.lat, lon: p.lon });
  }
  return out;
}

/**
 * Donde poner las flechas de sentido: `n` puntos repartidos por la ruta, con
 * el tramo (a → b) en el que caen para orientarlas.
 */
export function flechas(ruta, n = 3) {
  const r = recorrido(ruta);
  if (!r.total) return [];
  const out = [];
  for (let i = 1; i <= n; i++) {
    const p = puntoA(r, r.total * i / (n + 1));
    if (p) out.push(p);
  }
  return out;
}

// ─── DIBUJO SUAVE (estilo Niebla) ─────────────────────────────────────────

/**
 * Redondea las esquinas de una linea [[x, y]...] cortando cada vertice
 * (Chaikin): la ruta fluye en curvas en vez de ir en angulos. Conserva el
 * primer y el ultimo punto. `maxPaso`: antes se parten los tramos mas largos,
 * para que la curva no se coma una esquina entera y la ruta siga por su calle.
 */
export function suavizar(puntos, vueltas = 3, maxPaso = Infinity) {
  let p = [];
  for (let i = 0; i < puntos.length; i++) {
    if (i > 0) {
      const a = puntos[i - 1], b = puntos[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxPaso);
      for (let k = 1; k < n; k++) p.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    p.push(puntos[i]);
  }
  for (let k = 0; k < vueltas && p.length > 2; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
}

/**
 * La misma linea con un punto cada `paso` px (mas el ultimo). Asi el
 * suavizado redondea igual las esquinas con puntos GPS juntos o separados.
 */
export function remuestrear(puntos, paso) {
  if (puntos.length < 2) return puntos.slice();
  const out = [puntos[0]];
  let falta = paso;
  for (let i = 1; i < puntos.length; i++) {
    let a = puntos[i - 1];
    const b = puntos[i];
    let d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    while (d >= falta) {
      const f = falta / d;
      a = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      out.push(a);
      d -= falta; falta = paso;
    }
    falta -= d;
  }
  const u = puntos[puntos.length - 1], ult = out[out.length - 1];
  if (ult[0] !== u[0] || ult[1] !== u[1]) out.push(u);
  return out;
}

const hexARgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
/** El color a una fraccion `f` (0-1) de una escala de colores hex. */
export function colorEn(colores, f) {
  const x = Math.min(1, Math.max(0, f)) * (colores.length - 1);
  const i = Math.min(colores.length - 2, Math.floor(x)), t = x - i;
  const a = hexARgb(colores[i]), b = hexARgb(colores[i + 1]);
  return "#" + a.map((v, k) => Math.round(v + (b[k] - v) * t).toString(16).padStart(2, "0")).join("");
}

/**
 * Varias lineas [[x, y]...] (la ruta cortada en pausas) pintadas con un
 * degradado del inicio al final de la salida: [{ color, puntos }]. El color
 * va por distancia recorrida, no por posicion en el mapa, asi que en un
 * circuito que acaba donde empezo tambien se ve el avance. `pasos` colores.
 */
export function degradado(lineas, colores, pasos = 32) {
  const largo = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const total = lineas.reduce((s, l) => s + l.slice(1).reduce((t, q, i) => t + largo(l[i], q), 0), 0);
  if (!total) return [];
  const out = [];
  let acum = 0;
  for (const l of lineas) {
    let actual = null;
    for (let i = 1; i < l.length; i++) {
      const d = largo(l[i - 1], l[i]);
      const paso = Math.min(pasos - 1, Math.floor((acum + d / 2) / total * pasos));
      if (!actual || actual.paso !== paso) { actual = { paso, color: colorEn(colores, (paso + 0.5) / pasos), puntos: [l[i - 1]] }; out.push(actual); }
      actual.puntos.push(l[i]);
      acum += d;
    }
  }
  return out.map(({ color, puntos }) => ({ color, puntos }));
}
