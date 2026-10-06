/**
 * VITAMINAS Y MINERALES, ESTIMADOS POR TU IA.
 *
 * La app no conoce alimentos: los micros llegan solo en la linea MICROS que
 * devuelve tu IA, los dias que la usas. Son estimaciones, y se dicen como
 * tal. Lo que vale es la tendencia: si la vitamina D sale baja cuatro de
 * cinco dias, eso si es informacion.
 *
 * Referencias para un hombre adulto (EFSA y OMS, redondeadas). Todas son
 * minimos salvo el sodio, que es un tope.
 *
 * Puro: sin React, se prueba sin navegador.
 */

export const REFERENCIAS = {
  fibra:  { nombre: "Fibra",       unidad: "g",  ref: 30,   idea: "legumbres, verdura y fruta con piel" },
  hierro: { nombre: "Hierro",      unidad: "mg", ref: 8,    idea: "lentejas, carne roja magra o almejas" },
  calcio: { nombre: "Calcio",      unidad: "mg", ref: 1000, idea: "yogur, queso batido o leche" },
  vitD:   { nombre: "Vitamina D",  unidad: "µg", ref: 15,   idea: "pescado azul, huevos o 15 min de sol" },
  b12:    { nombre: "B12",         unidad: "µg", ref: 2.4,  idea: "huevos, pescado o lácteos" },
  omega3: { nombre: "Omega-3",     unidad: "g",  ref: 1.6,  idea: "salmón, sardinas o nueces" },
  sodio:  { nombre: "Sodio",       unidad: "mg", ref: 2300, tope: true, idea: "menos embutido y comida preparada" },
};
export const ORDEN_MICROS = Object.keys(REFERENCIAS);

/** Los micros de un dia: la suma de los apuntes que los traen. null si ninguno. */
export function perfilDia(apuntes) {
  const con = (apuntes || []).filter(a => a && a.micros);
  if (!con.length) return null;
  const t = {};
  for (const a of con) for (const k of ORDEN_MICROS) if (Number.isFinite(a.micros[k])) t[k] = (t[k] || 0) + a.micros[k];
  return t;
}

/**
 * La media de los dias con micros. `dias`: [[apunte]] (uno por dia).
 * @returns {{ media: object|null, diasConDato: number, porDia: (object|null)[] }}
 */
export function perfilSemana(dias) {
  const porDia = (dias || []).map(perfilDia);
  const con = porDia.filter(Boolean);
  if (!con.length) return { media: null, diasConDato: 0, porDia };
  const media = {};
  for (const k of ORDEN_MICROS) {
    const vs = con.map(p => p[k]).filter(Number.isFinite);
    if (vs.length) media[k] = vs.reduce((a, b) => a + b, 0) / vs.length;
  }
  return { media, diasConDato: con.length, porDia };
}

/** Cuanto de la referencia (0-1+) y si esta bien: llega al minimo o no pasa del tope. */
export function estadoMicro(k, valor) {
  const r = REFERENCIAS[k];
  if (!r || !Number.isFinite(valor)) return null;
  const pct = valor / r.ref;
  return { pct, bien: r.tope ? pct <= 1 : pct >= 0.9 };
}

/**
 * Avisos de la tendencia, sin culpa y con una idea de comida:
 *  - un minimo por debajo del 70% en 3 o mas de los ultimos 5 dias con dato;
 *  - el sodio medio de esos dias por encima del tope.
 */
export function avisosMicros(porDia) {
  const ultimos = (porDia || []).filter(Boolean).slice(-5);
  if (ultimos.length < 3) return [];
  const out = [];
  for (const k of ORDEN_MICROS) {
    const r = REFERENCIAS[k];
    const vs = ultimos.map(p => p[k]).filter(Number.isFinite);
    if (vs.length < 3) continue;
    if (r.tope) {
      const media = vs.reduce((a, b) => a + b, 0) / vs.length;
      if (media > r.ref) out.push({ k, texto: r.nombre + " alto: " + Math.round(media) + " " + r.unidad + " de media (tope " + r.ref + ").", idea: r.idea });
    } else {
      const bajos = vs.filter(v => v < r.ref * 0.7).length;
      if (bajos >= 3) out.push({ k, texto: r.nombre + " baja " + bajos + " de " + vs.length + " días.", idea: r.idea });
    }
  }
  return out;
}
