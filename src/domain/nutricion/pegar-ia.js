/**
 * PEGAR DE TU IA.
 *
 * Para los dias que se salen de lo normal (una comida fuera, un cumpleaños):
 * le cuentas a tu IA (Claude, ChatGPT) lo que has comido y pegas aqui su
 * respuesta. La app no conoce ni un alimento: lee solo numeros y etiquetas,
 * y se queda con la linea TOTAL. Por eso vale para cualquier cosa que comas.
 *
 *   · mensajeDelDia: el mensaje que copias para la IA, con el objetivo de hoy
 *     y lo que ya llevas apuntado.
 *   · leerTotalDelDia: lo que hay que sumar de lo que pegas.
 */

const NUM = "(\\d{1,3}\\.\\d{3}(?![\\d.,])|\\d+(?:[.,]\\d+)?)";
// "2.010" con tres cifras tras el punto es un millar a la española, no 2,01.
const aNum = (s) => {
  const t = String(s);
  if (/^\d{1,3}\.\d{3}$/.test(t)) return Number(t.replace(".", ""));
  return Number(t.replace(",", "."));
};

// Etiquetas largas (sin ambiguedad) y cortas (P, C, G, F: solo en mayuscula,
// porque "5 g" en minuscula es una cantidad, no grasa).
const LARGAS = [
  ["kcal", "kilocalor[ií]as?|kcals?|calor[ií]as?|cal"],
  ["prot", "prote[ií]nas?|prots?"],
  ["hc", "hidratos(?:\\s+de\\s+carbono)?|carbohidratos|carbos?|carbs?|hc|ch"],
  ["grasa", "grasas?|l[ií]pidos|fat"],
];
const CORTAS = [["prot", "P"], ["hc", "C"], ["grasa", "G"], ["grasa", "F"]];

/** Que macro nombra una cabecera de columna ("Proteína (g)" → prot). */
function macroDeCabecera(celda) {
  const t = celda.toLowerCase();
  for (const [k, re] of LARGAS) if (new RegExp("(^|[^a-z])(" + re + ")([^a-z]|$)", "i").test(t)) return k;
  const c = celda.trim().replace(/[()]/g, "").trim();
  for (const [k, l] of CORTAS) if (c === l || c.startsWith(l + " ")) return k;
  return null;
}

/** Quita markdown y viñetas: "**1. Café**" → "Café". */
function limpiar(s) {
  return String(s)
    .replace(/[*_`~]/g, "")
    .replace(/^\s*(?:[-•·>]+|\d+[.)])\s+/, "")
    .trim();
}

// Ni el total ni la linea de micros son una comida.
const esTotal = (nombre) => /^(total|suma|en total|micros?)\b/i.test(nombre.trim());
const tieneLetras = (s) => /[a-záéíóúñü]/i.test(s);

/** Una celda que es solo un numero con su unidad: "12", "12 g", "70 kcal", "~5". */
const soloNumero = (celda) => new RegExp("^[~≈]?\\s*" + NUM + "\\s*(?:g|gr|kcal|cal)?\\.?$", "i").test(celda.trim());

/** Las etiquetas que haya en un texto: { kcal, prot, hc, grasa } (las que salgan). */
function porEtiquetas(texto) {
  const out = {};
  let resto = " " + texto + " ";
  const poner = (k, v) => { if (out[k] === undefined && Number.isFinite(v)) out[k] = v; return " "; };
  for (const [k, re] of LARGAS) {
    // "5 g de proteína", "70 kcal"
    resto = resto.replace(new RegExp(NUM + "\\s*(?:g|gr|gramos)?\\s*(?:de\\s+)?(?:" + re + ")(?![a-záéíóú])", "gi"), (_, n) => poner(k, aNum(n)));
    // "proteína: 5 g", "kcal 70"
    resto = resto.replace(new RegExp("(?<![a-záéíóú])(?:" + re + ")\\s*[:=]?\\s*" + NUM, "gi"), (_, n) => poner(k, aNum(n)));
  }
  for (const [k, l] of CORTAS) {
    // "P 12", "P: 12g", "12P", "12 P" — solo en mayuscula.
    resto = resto.replace(new RegExp("(?<![A-Za-z])" + l + "\\s*[:=]?\\s*" + NUM + "\\s*g?(?![a-z])", "g"), (_, n) => poner(k, aNum(n)));
    resto = resto.replace(new RegExp(NUM + "\\s*g?\\s*" + l + "(?![A-Za-z])", "g"), (_, n) => poner(k, aNum(n)));
  }
  return out;
}

/** Donde empieza el primer numero con etiqueta de macro, o -1. */
function inicioMacros(linea) {
  const patrones = [];
  for (const [, re] of LARGAS) {
    patrones.push(new RegExp(NUM + "\\s*(?:g|gr|gramos)?\\s*(?:de\\s+)?(?:" + re + ")(?![a-záéíóú])", "i"));
    patrones.push(new RegExp("(?<![a-záéíóú])(?:" + re + ")\\s*[:=]?\\s*" + NUM, "i"));
  }
  for (const [, l] of CORTAS) {
    patrones.push(new RegExp("(?<![A-Za-z])" + l + "\\s*[:=]?\\s*" + NUM));
    patrones.push(new RegExp(NUM + "\\s*g?\\s*" + l + "(?![A-Za-z])"));
  }
  let min = -1;
  for (const re of patrones) { const m = re.exec(linea); if (m && (min < 0 || m.index < min)) min = m.index; }
  return min;
}

/** Completa lo que falte: kcal desde los macros, o macros desde las kcal. */
function completar(nombre, m) {
  const tieneMacros = m.prot !== undefined || m.hc !== undefined || m.grasa !== undefined;
  if (!tieneMacros && m.kcal === undefined) return null;
  if (!tieneMacros) {
    // Solo kcal: reparto de plato mixto, y se dice que es estimado.
    return { nombre, kcal: m.kcal, prot: Math.round(m.kcal * 0.22 / 4), hc: Math.round(m.kcal * 0.45 / 4),
             grasa: Math.round(m.kcal * 0.33 / 9), confianza: "estimado" };
  }
  const prot = m.prot || 0, hc = m.hc || 0, grasa = m.grasa || 0;
  const kcal = m.kcal !== undefined ? m.kcal : Math.round(prot * 4 + hc * 4 + grasa * 9);
  return { nombre, kcal, prot, hc, grasa, confianza: "escrito" };
}

/**
 * Lee la respuesta de la IA. Devuelve una linea por cosa comida:
 * [{ nombre, kcal, prot, hc, grasa, confianza }]. Lo que no tenga numeros o
 * sea un total no sale.
 */
export function leerRespuestaIA(texto) {
  const salida = [];
  let columnas = null; // de la cabecera de una tabla: indice → macro
  for (const bruta of String(texto || "").split(/\r?\n/)) {
    const linea = limpiar(bruta);
    if (!linea || /^[\s|:\-–—=+]+$/.test(linea)) continue; // vacia o separador de tabla
    const conSeparador = /[|;\t]/.test(linea);

    if (conSeparador) {
      const celdas = linea.split(/[|;\t]/).map(c => limpiar(c)).filter(c => c !== "");
      if (!/\d/.test(linea)) {
        // Cabecera: se apunta que macro hay en cada columna.
        const mapa = celdas.map(macroDeCabecera);
        if (mapa.filter(Boolean).length >= 2) columnas = mapa;
        continue;
      }
      // La celda del nombre: la primera con letras que no sea solo un macro.
      // Puede traer macros detras ("Yogur — proteínas: 6 g"): se corta ahi.
      const iNombre = celdas.findIndex(c => tieneLetras(c) && !soloNumero(c) && (!macroDeCabecera(c) || inicioMacros(c) > 0));
      if (iNombre < 0) continue;
      const corteNombre = inicioMacros(celdas[iNombre]);
      const nombre = (corteNombre > 0 ? celdas[iNombre].slice(0, corteNombre) : celdas[iNombre]).replace(/[\s:\-–—,(≈~]+$/, "").trim();
      if (esTotal(nombre)) continue;
      const m = {};
      const posicional = ["kcal", "prot", "hc", "grasa"];
      let pos = 0;
      if (corteNombre > 0) Object.assign(m, porEtiquetas(celdas[iNombre].slice(corteNombre)));
      celdas.forEach((c, i) => {
        if (i === iNombre) return;
        const etiquetas = porEtiquetas(c);
        if (Object.keys(etiquetas).length) { for (const k of Object.keys(etiquetas)) if (m[k] === undefined) m[k] = etiquetas[k]; return; }
        const n = new RegExp(NUM).exec(c);
        if (!n || !soloNumero(c)) return;
        // Con cabecera, manda la cabecera; sin ella, el orden pedido.
        const k = columnas && columnas[i] ? columnas[i] : posicional[pos++];
        if (k && m[k] === undefined) m[k] = aNum(n[1]);
      });
      const l = completar(nombre, m);
      if (l) salida.push(l);
      continue;
    }

    if (!/\d/.test(linea)) continue; // "¡Claro! Aquí tienes…"
    // Sin separadores: el nombre es lo de antes del primer macro con su
    // etiqueta ("2 huevos revueltos: 180 kcal…" se llama "2 huevos revueltos").
    const corte = inicioMacros(linea);
    if (corte < 0) continue;
    const nombre = linea.slice(0, corte).replace(/[\s:\-–—,(≈~]+$/, "").trim();
    if (!nombre || !tieneLetras(nombre) || esTotal(nombre)) continue;
    const l = completar(nombre, porEtiquetas(linea.slice(corte)));
    if (l) salida.push(l);
  }
  return salida;
}

/** El total de lo leido. */
export function totalLeido(lineas) {
  return lineas.reduce((t, l) => ({ kcal: t.kcal + l.kcal, prot: t.prot + l.prot, hc: t.hc + l.hc, grasa: t.grasa + l.grasa }),
                       { kcal: 0, prot: 0, hc: 0, grasa: 0 });
}

// ─── EL MENSAJE DE LA MAÑANA ───────────────────────────────────────────

/**
 * El mensaje que se manda a la IA: sirve en cualquier chat nuevo, sin
 * configurar nada. Con `llevas` (lo ya apuntado hoy) la IA sabe de donde
 * parte y pide solo lo nuevo en la linea TOTAL.
 */
export function mensajeDelDia({ comida, llevas, favoritas = [] }) {
  const m = comida.macros;
  const esComer = comida.id === "comer";
  const yaHay = llevas && llevas.kcal > 0;
  const favs = textoFavoritas(favoritas);
  return [
    "Ayúdame a cuadrar mi dieta de hoy (IIFYM: solo importa el total del día).",
    "Soy hombre, 86 kg, 1,83 m; preparo 7 km a 4:45/km. La proteína es lo que más importa.",
    "Hoy toca " + (esComer ? "COMER (entreno fuerte: hidratos alrededor de la sesión)" : "RECORTAR (sin sesión intensa: déficit)") +
      ": " + m.kcal + " kcal · " + m.prot + " g proteína · " + m.hc + " g hidratos · " + m.grasa + " g grasa.",
    ...(yaHay ? ["Ya tengo apuntado " + Math.round(llevas.kcal) + " kcal · " + Math.round(llevas.prot) + " g proteína; " +
      "me quedan " + Math.max(0, Math.round(m.kcal - llevas.kcal)) + " kcal · " + Math.max(0, Math.round(m.prot - llevas.prot)) + " g proteína."] : []),
    ...(favs.length ? ["", "Mis comidas guardadas (si te digo su nombre, usa estos números tal cual; y si me propones algo, mejor de aquí):", ...favs] : []),
    "",
    "Te diré o mandaré foto de lo que he comido" + (yaHay ? " que no tengo apuntado" : "") + ". Cada vez:",
    "1. Estima sus kcal, macros y micros (ración normal en España si no digo cantidad).",
    "2. Si aún me falta alguna comida, propónme 2 opciones fáciles de casa, con cantidades, para cuadrar el día (proteína primero).",
    "3. Si me paso, sin dramas: dime cómo dejar ligera la siguiente comida.",
    "Sé breve. Al final, SIEMPRE, una línea por cada comida que te he contado" + (yaHay ? " (sin lo que ya tenía apuntado)" : "") + ", con este formato exacto:",
    "COMIDA | nombre corto | kcal | proteína g | hidratos g | grasa g | fibra g | hierro mg | calcio mg | vitamina D µg | B12 µg | omega-3 g | sodio mg",
    "Y debajo, el total de esas comidas:",
    "TOTAL DEL DÍA | kcal | proteína g | hidratos g | grasa g",
    "MICROS DEL DÍA | fibra g | hierro mg | calcio mg | vitamina D µg | B12 µg | omega-3 g | sodio mg",
  ].join("\n");
}

/** Las favoritas para el mensaje: las mas usadas primero, como mucho 25. */
export function textoFavoritas(favoritas, max = 25) {
  const r1 = (x) => Math.round(x * 10) / 10;
  return [...(favoritas || [])].filter(f => f && f.nombre && f.kcal > 0)
    .sort((a, b) => (b.usos || 0) - (a.usos || 0))
    .slice(0, max)
    .map(f => "- " + f.nombre + ": " + Math.round(f.kcal) + " kcal · P " + Math.round(f.prot || 0) + " · HC " + Math.round(f.hc || 0) + " · G " + Math.round(f.grasa || 0) +
      (f.micros ? " · " + MICROS.filter(k => Number.isFinite(f.micros[k])).map(k => k + " " + r1(f.micros[k])).join(", ") : ""));
}

// ─── LA RESPUESTA DE LA NOCHE ─────────────────────────────────────────────

const ES_TOTAL_DIA = /total\s+(?:del|de\s+hoy|d[ií]a|acumulado|hoy)|llevas?\s+(?:en\s+)?total|^\s*total\b/i;

/** Los macros de una linea de total, con "|" en orden o con etiquetas. */
function macrosDeTotal(linea) {
  const limpia = limpiar(linea).replace(/^[^|:]*?(total[^|:\d]*)[:\-–—]?\s*/i, "");
  const et = porEtiquetas(limpia);
  if (et.kcal !== undefined && (et.prot !== undefined || et.hc !== undefined || et.grasa !== undefined)) return completar("total", et);
  const nums = (limpia.match(new RegExp(NUM, "g")) || []).map(aNum);
  if (nums.length >= 4) return completar("total", { kcal: nums[0], prot: nums[1], hc: nums[2], grasa: nums[3] });
  if (et.kcal !== undefined) return completar("total", et);
  return null;
}

/**
 * El total del dia en lo que devuelve la IA. Vale la ULTIMA linea de total
 * (si pegas varias respuestas, la ultima es la buena). Si no hay ninguna, se
 * suman las lineas de alimentos. null si no hay nada que leer.
 */
export function leerTotalDelDia(texto) {
  const lineas = String(texto || "").split(/\r?\n/);
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (!ES_TOTAL_DIA.test(limpiar(lineas[i]))) continue;
    const m = macrosDeTotal(lineas[i]);
    if (m && m.kcal > 0) return { kcal: Math.round(m.kcal), prot: Math.round(m.prot), hc: Math.round(m.hc), grasa: Math.round(m.grasa), desde: "total" };
  }
  const items = leerRespuestaIA(texto);
  if (!items.length) return null;
  const t = totalLeido(items);
  return { kcal: Math.round(t.kcal), prot: Math.round(t.prot), hc: Math.round(t.hc), grasa: Math.round(t.grasa), desde: "suma" };
}

/** Como cerraste el dia, dicho por un coach: nunca culpa. */
export function veredictoDia(total, objetivo) {
  const dif = total.kcal - objetivo.kcal;
  const pct = dif / objetivo.kcal;
  const faltaProt = objetivo.prot - total.prot;
  if (pct > 0.1) return { tono: "ojo", texto: "+" + Math.round(dif) + " kcal. Mañana normal, sin compensar: un día no cambia nada." };
  if (pct < -0.2) return { tono: "ojo", texto: "Te quedaste muy corto. Comer poco también frena: mañana, completo." };
  if (faltaProt > 25) return { tono: "ojo", texto: "Calorías bien, pero faltaron " + Math.round(faltaProt) + " g de proteína. Mañana, proteína en cada comida." };
  return { tono: "bien", texto: "Clavado. Así se baja la panza sin perder piernas." };
}

/** Lo que suman los apuntes de un dia (de Mis comidas, de tu IA o de antes). */
export function sumaDelDia(apuntes) {
  const t = { kcal: 0, prot: 0, hc: 0, grasa: 0 };
  for (const a of apuntes || []) if (a) for (const k of Object.keys(t)) t[k] += Number(a[k]) || 0;
  return t;
}

/**
 * Los dias de la semana de `hoyIso`: { iso, kcal, objetivo, estado } con estado
 * "bien" (a ±10% del objetivo), "ojo" (fuera), "abierto" (sin apuntes, ya
 * pasado o hoy) o "futuro". Y la media de proteina de los dias con apuntes.
 */
export function semanaNutricion({ dias, comidasLog, objetivoDe, hoyIso, claveDe }) {
  const salida = [];
  let protSuma = 0, cerrados = 0;
  for (const d of dias) {
    const obj = objetivoDe(d);
    const aps = (comidasLog[claveDe(d)] || []).filter(Boolean);
    if (d.isoDate > hoyIso) { salida.push({ iso: d.isoDate, kcal: 0, objetivo: obj.kcal, estado: "futuro" }); continue; }
    if (!aps.length) { salida.push({ iso: d.isoDate, kcal: 0, objetivo: obj.kcal, estado: "abierto" }); continue; }
    const t = sumaDelDia(aps);
    cerrados++; protSuma += t.prot;
    salida.push({ iso: d.isoDate, kcal: Math.round(t.kcal), objetivo: obj.kcal, estado: Math.abs(t.kcal - obj.kcal) / obj.kcal <= 0.1 ? "bien" : "ojo" });
  }
  return { dias: salida, protMedia: cerrados ? Math.round(protSuma / cerrados) : null, cerrados };
}

// ─── LOS MICROS ───────────────────────────────────────────────────────────

/** Los micros en el orden en que se piden en la linea MICROS. */
export const MICROS = ["fibra", "hierro", "calcio", "vitD", "b12", "omega3", "sodio"];
const ETIQUETAS_MICRO = {
  fibra: "fibra",
  hierro: "hierro",
  calcio: "calcio",
  vitD: "vitamina\\s*d|vit\\.?\\s*d",
  b12: "(?:vitamina\\s*|vit\\.?\\s*)?b\\s*-?\\s*12",
  omega3: "omega\\s*-?\\s*3",
  sodio: "sodio|sal\\b",
};

/**
 * La linea MICROS que devuelve la IA: { fibra, hierro, calcio, vitD, b12,
 * omega3, sodio } (los que salgan). Vale la ultima; por posicion si viene
 * con "|" en el orden pedido, o por etiquetas si la escribe a su manera.
 * null si no hay linea de micros.
 */
export function leerMicros(texto) {
  const lineas = String(texto || "").split(/\r?\n/).map(limpiar);
  for (let i = lineas.length - 1; i >= 0; i--) {
    if (!/micro/i.test(lineas[i])) continue;
    const resto = lineas[i].replace(/^[^|:]*micro[^|:]*[|:]?/i, "");
    const out = {};
    // Por etiquetas: "fibra 28 g", "vitamina D: 4 µg", "12 mg de hierro".
    for (const k of MICROS) {
      const re = ETIQUETAS_MICRO[k];
      const m = new RegExp("(?:" + re + ")\\s*[:=]?\\s*" + NUM, "i").exec(resto)
        || new RegExp(NUM + "\\s*(?:g|mg|µg|mcg|ug)?\\s*(?:de\\s+)?(?:" + re + ")", "i").exec(resto);
      if (m) out[k] = aNum(m[1]);
    }
    if (Object.keys(out).length >= 3) return out;
    // Por posicion: los 7 numeros en el orden pedido.
    const nums = (resto.match(new RegExp(NUM, "g")) || []).map(aNum);
    if (nums.length >= MICROS.length) return Object.fromEntries(MICROS.map((k, j) => [k, nums[j]]));
    if (Object.keys(out).length) return out;
  }
  return null;
}

/**
 * Las comidas de lo que pega tu IA, cada una con sus macros y, si vienen,
 * sus micros: [{ nombre, kcal, prot, hc, grasa, micros?, microsRepartidos? }].
 *  1. Las lineas "COMIDA | nombre | kcal | P | HC | G | 7 micros" (el formato pedido).
 *  2. Si no hay, las lineas con nombre y numeros que se entiendan (solo macros).
 *  3. Si las comidas no traen micros y hay linea MICROS DEL DIA, se reparten
 *     en proporcion a las kcal de cada comida (y se marcan como repartidos).
 * Vacio si no hay ninguna comida legible (entonces vale el TOTAL).
 */
export function leerComidas(texto) {
  const salida = [];
  for (const bruta of String(texto || "").split(/\r?\n/)) {
    const linea = limpiar(bruta);
    if (!/^comida\s*[|:]/i.test(linea)) continue;
    const celdas = linea.split("|").map(c => limpiar(c)).slice(1);
    if (celdas.length < 3) continue;
    const nombre = celdas[0].replace(/[\s:\-–—,]+$/, "").trim();
    if (!nombre || !tieneLetras(nombre) || esTotal(nombre) || /^nombre/i.test(nombre)) continue;
    const nums = celdas.slice(1).map(c => { const m = new RegExp(NUM).exec(c); return m ? aNum(m[1]) : null; });
    if (nums[0] == null) continue;
    const l = { nombre, kcal: Math.round(nums[0]), prot: Math.round(nums[1] || 0), hc: Math.round(nums[2] || 0), grasa: Math.round(nums[3] || 0) };
    const mic = nums.slice(4, 4 + MICROS.length);
    if (mic.filter(v => v != null).length >= 3) l.micros = Object.fromEntries(MICROS.map((k, j) => [k, mic[j]]).filter(([, v]) => v != null));
    salida.push(l);
  }
  const comidas = salida.length ? salida
    : leerRespuestaIA(texto).filter(l => !/^comida$/i.test(l.nombre)).map(({ nombre, kcal, prot, hc, grasa }) =>
        ({ nombre, kcal: Math.round(kcal), prot: Math.round(prot), hc: Math.round(hc), grasa: Math.round(grasa) }));
  const delDia = leerMicros(texto);
  const total = comidas.reduce((s, c) => s + c.kcal, 0);
  if (delDia && total > 0 && comidas.every(c => !c.micros)) {
    for (const c of comidas) {
      const f = c.kcal / total;
      c.micros = Object.fromEntries(Object.entries(delDia).map(([k, v]) => [k, Math.round(v * f * 10) / 10]));
      c.microsRepartidos = true;
    }
  }
  return comidas;
}
