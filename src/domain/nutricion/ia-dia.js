/**
 * TU IA LLEVA EL DIA.
 *
 * La app no cuenta comidas. Hace dos cosas:
 *   1. Por la mañana te da UN mensaje (mensajeDelDia) con el objetivo de hoy
 *      y las reglas; lo mandas a tu IA (Claude, ChatGPT) y durante el dia le
 *      cuentas lo que comes: ella lleva la cuenta y te propone la cena.
 *   2. Por la noche le devuelves a la app su respuesta, y la app lee la linea
 *      TOTAL DEL DIA (leerTotalDelDia) y guarda como acabo el dia.
 *
 * El lector no conoce ni un alimento: solo numeros y etiquetas. Por eso vale
 * para cualquier cosa que comas.
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

const esTotal = (nombre) => /^(total|suma|en total)\b/i.test(nombre.trim());
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

/** El mensaje que se manda a la IA: sirve en cualquier chat nuevo, sin configurar nada. */
export function mensajeDelDia({ comida }) {
  const m = comida.macros;
  const esComer = comida.id === "comer";
  return [
    "Hoy llevas tú mi dieta (IIFYM: solo importa el total del día).",
    "Soy hombre, 86 kg, 1,83 m; preparo 7 km a 4:45/km. La proteína es lo que más importa.",
    "Hoy toca " + (esComer ? "COMER (entreno fuerte: hidratos alrededor de la sesión)" : "RECORTAR (sin sesión intensa: déficit)") +
      ": " + m.kcal + " kcal · " + m.prot + " g proteína · " + m.hc + " g hidratos · " + m.grasa + " g grasa.",
    "",
    "Durante el día te diré o mandaré foto de lo que como. Cada vez:",
    "1. Estima sus kcal y macros (ración normal en España si no digo cantidad).",
    "2. Dime en una línea cuánto llevo y cuánto me queda.",
    "3. Cuando te lo pida, o antes de la cena, propónme merienda o cena fácil de casa, con cantidades, para cuadrar el día.",
    "Sé breve. Termina SIEMPRE con esta línea exacta, con lo que llevo en total hoy:",
    "TOTAL DEL DÍA | kcal | proteína g | hidratos g | grasa g",
  ].join("\n");
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

/**
 * Los 7 dias de la semana de `hoyIso`: { iso, estado } con estado "bien" (a
 * ±10% del objetivo), "ojo" (fuera), "abierto" (sin cerrar, ya pasado o hoy)
 * o "futuro". Y la media de proteina de los dias cerrados.
 */
export function semanaNutricion({ dias, comidasLog, objetivoDe, hoyIso, claveDe }) {
  const salida = [];
  let protSuma = 0, cerrados = 0;
  for (const d of dias) {
    const aps = (comidasLog[claveDe(d)] || []).filter(a => a && a.comida === "dia");
    if (d.isoDate > hoyIso) { salida.push({ iso: d.isoDate, estado: "futuro" }); continue; }
    if (!aps.length) { salida.push({ iso: d.isoDate, estado: "abierto" }); continue; }
    const t = aps[aps.length - 1], obj = objetivoDe(d);
    cerrados++; protSuma += t.prot;
    salida.push({ iso: d.isoDate, estado: Math.abs(t.kcal - obj.kcal) / obj.kcal <= 0.1 ? "bien" : "ojo" });
  }
  return { dias: salida, protMedia: cerrados ? Math.round(protSuma / cerrados) : null, cerrados };
}
