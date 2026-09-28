/**
 * PEGAR LO QUE DICE TU IA.
 *
 * Reconocer comida con una lista de palabras nunca llega a todo: siempre
 * falta un plato, una marca, un restaurante. Una IA (Claude, ChatGPT) si lo
 * entiende todo, fotos incluidas. Asi que el trabajo se reparte:
 *   - la IA dice QUE has comido y sus macros;
 *   - la app solo LEE numeros y etiquetas de lo que pegas.
 * Aqui no hay ni un nombre de alimento: por eso vale para cualquier comida.
 *
 * Se pide un formato (INSTRUCCIONES_IA), pero las IAs no siempre obedecen, asi
 * que se acepta cualquier forma razonable:
 *   Tostada de jamón | 160 | 12 | 18 | 4                (lo pedido)
 *   | Alimento | kcal | Proteína (g) | HC (g) | Grasa (g) |   (tabla markdown)
 *   - Café con leche: 70 kcal, 5 g proteína, 7 g HC, 2 g grasa
 *   Macarrones — P 14 · C 70 · G 12 · 450 kcal
 * Se ignoran cabeceras, separadores, filas de "Total" y el texto de cortesia.
 */

/** Lo que se copia una vez en un chat nuevo de tu IA. */
export const INSTRUCCIONES_IA = `Eres mi contador de macros. En este chat te diré (o te mandaré foto de) lo que he comido.
Responde SOLO con una línea por alimento o plato, con este formato exacto:
Nombre | kcal | proteína g | hidratos g | grasa g
Ejemplo:
Tostada de jamón con tomate | 160 | 12 | 18 | 4
Si no digo cantidad, usa una ración normal en España. Sin totales, sin explicaciones, sin texto extra.`;

const NUM = "(\\d+(?:[.,]\\d+)?)";
const aNum = (s) => Number(String(s).replace(",", "."));

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

/** Enlaces para abrir tu IA con lo que hayas escrito ya puesto. */
export function enlacesIA(texto) {
  const q = encodeURIComponent(texto || "");
  return {
    claude: "https://claude.ai/new" + (q ? "?q=" + q : ""),
    chatgpt: "https://chatgpt.com/" + (q ? "?q=" + q : ""),
  };
}
