/**
 * ESCRIBIR LO QUE HAS COMIDO.
 *
 * La unica forma de apuntar que funciona: escribes lo que has comido, en tus
 * palabras, y ya esta.
 *
 *   macarrones con tomate 450 kcal
 *   filete de ternera, un panecillo
 *   pizza 800 kcal, 30 p, 90 c, 35 g de grasa
 *
 * Elegir de una lista no sirve: la lista nunca tiene lo que has comido, y
 * buscar en ella cuesta mas que escribirlo. Y si ya usas una app que hace una
 * foto y te dice las calorias, lo que quieres es copiar ese numero aqui, no
 * volver a describir el plato.
 *
 * Por eso manda lo que escribes: si pones un numero de calorias, ese es el
 * numero, sin discutir. Las tablas de alimentos y de cantina que hay en esta
 * carpeta dejan de ser pantallas y pasan a ser VOCABULARIO — sirven para
 * reconocer "pollo" o "lentejas" y poner los macros cuando tu no los das.
 *
 * Tres niveles de confianza, y la pantalla los dice siempre:
 *
 *   · escrito   — los numeros son tuyos. No se tocan.
 *   · tabla     — reconocido y calculado con su ficha (pollo 200 g).
 *   · estimado  — no se ha reconocido; con tus calorias se reparten los
 *                 macros como un plato mixto normal. Aproximado, y se avisa.
 *
 * Nunca se inventa una caloria: si no hay numero ni se reconoce nada, se dice
 * que no se ha entendido en vez de colar un cero.
 */

import { ALIMENTOS, ALIMENTO, macrosDe } from "./alimentos.js";
import { PLATOS_CANTINA } from "./cantina.js";
import { COMIDAS_RAPIDAS } from "./iifym.js";

/** Sin tildes, sin signos, en minuscula: como se compara todo aqui. */
export const normalizar = (s) => String(s || "")
  .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9\s.,]/g, " ").replace(/\s+/g, " ").trim();

// ─── VOCABULARIO ──────────────────────────────────────────────────────────
//
// Palabras que no estan en ninguna tabla pero que dices todos los dias. Sin
// esto, "un filete" o "una caña" no se reconocen y acaban de estimacion.

const SINONIMOS = {
  pollo: "pollo", pechuga: "pollo", pavo: "pavo",
  filete: "ternera", ternera: "ternera", carne: "ternera", solomillo: "ternera",
  cerdo: "lomo", lomo: "lomo", secreto: "lomo",
  merluza: "merluza", pescado: "merluza", bacalao: "merluza", lubina: "merluza",
  salmon: "salmon", atun: "atun_lata", bonito: "atun_lata",
  gambas: "gambas", langostinos: "gambas", marisco: "gambas",
  huevo: "huevo", huevos: "huevo", tortilla: "huevo", revuelto: "huevo",
  jamon: "jamon_serrano", queso: "queso_batido", yogur: "yogur_proteico",
  batido: "whey", proteina: "whey", whey: "whey", tofu: "tofu",
  arroz: "arroz", paella: "arroz", risotto: "arroz",
  pasta: "pasta", macarrones: "pasta", espaguetis: "pasta", fideos: "pasta",
  quinoa: "quinoa", cuscus: "cuscus",
  patata: "patata", patatas: "patata", papas: "patata", pure: "patata",
  boniato: "boniato",
  lentejas: "legumbres", garbanzos: "legumbres", alubias: "legumbres",
  judias: "legumbres", legumbres: "legumbres", potaje: "legumbres", cocido: "legumbres",
  pan: "pan", panecillo: "pan", barra: "pan", bocadillo: "pan", tostada: "pan_molde",
  avena: "avena", cereales: "avena",
  verdura: "verdura", verduras: "verdura", menestra: "verdura", pisto: "verdura",
  ensalada: "ensalada", lechuga: "ensalada",
  brocoli: "brocoli", calabacin: "calabacin", champinones: "champinones",
  setas: "champinones", pimiento: "pimiento", tomate: "tomate",
  fruta: "fruta", manzana: "fruta", naranja: "fruta", pera: "fruta",
  platano: "platano", frutos: "frutos_secos", almendras: "frutos_secos",
  nueces: "frutos_secos", cacahuete: "crema_cacahuete",
  aceite: "aceite", aguacate: "aguacate", leche: "leche_desnatada",
};

/** El diccionario contra el que se reconoce: alimentos, platos de cantina y
 *  las palabras de arriba. Los platos van primero porque son mas especificos
 *  ("macarrones con tomate" gana a "pasta"). */
function construirDiccionario() {
  const entradas = [];
  for (const c of COMIDAS_RAPIDAS) {
    entradas.push({ tipo: "plato", id: c.id, nombre: c.nombre, tokens: normalizar(c.nombre).split(" "),
                    macros: { kcal: c.kcal, prot: c.prot, hc: c.hc, grasa: c.grasa } });
  }
  for (const p of PLATOS_CANTINA) {
    entradas.push({ tipo: "plato", id: p.id, nombre: p.nombre, tokens: normalizar(p.nombre).split(" "),
                    macros: { kcal: p.kcal, prot: p.prot, hc: p.hc, grasa: p.grasa } });
  }
  for (const a of ALIMENTOS) {
    entradas.push({ tipo: "alimento", id: a.id, nombre: a.nombre, tokens: normalizar(a.nombre).split(" ") });
  }
  return entradas;
}

const DICCIONARIO = construirDiccionario();

/** Palabras que no aportan nada al reconocer. */
const VACIAS = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
                        "con", "y", "a", "al", "en", "sin", "mi", "me", "he", "comido", "tomado",
                        "he", "para", "por", "plancha", "horno", "cocido", "cocida"]);

// ─── UNIDADES ─────────────────────────────────────────────────────────────

const UNIDADES = {
  g: 1, gr: 1, gramo: 1, gramos: 1, kg: 1000, ml: 1, l: 1000, cl: 10,
  huevo: 60, huevos: 60, rebanada: 30, rebanadas: 30, lata: 52, latas: 52,
  cucharada: 15, cucharadas: 15, vaso: 200, vasos: 200, cacito: 25, cacitos: 25,
  yogur: 125, yogures: 125, pieza: 150, piezas: 150, filete: 150, filetes: 150,
};

const NUMEROS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
                  seis: 6, medio: 0.5, media: 0.5 };

const MACRO_PALABRA = [
  [/\b(kcal|cal|calorias|calorias)\b/, "kcal"],
  [/\b(p|prot|proteina|proteinas)\b/, "prot"],
  [/\b(c|hc|carbos|carbohidratos|hidratos)\b/, "hc"],
  [/\b(f|grasa|grasas)\b/, "grasa"],
];

const num = (t) => {
  if (NUMEROS[t] !== undefined) return NUMEROS[t];
  const n = Number(String(t).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/**
 * Los macros que hayas escrito tu, y el texto que queda sin ellos.
 *
 * Reconoce "450 kcal", "30 g de proteina", "proteina 30", "P30". Un numero
 * con "g" a secas NO es grasa: es cantidad. Confundir las dos cosas es el
 * error que haria que 200 g de pollo contaran como 200 g de grasa.
 */
function sacarMacros(texto) {
  const macros = {};
  let resto = " " + texto + " ";

  // "450 kcal" · "30 g de proteina" · "90 hc"
  for (const [re, campo] of MACRO_PALABRA) {
    const patron = new RegExp("(\\d+(?:[.,]\\d+)?)\\s*(?:g|gr|gramos)?\\s*(?:de\\s+)?" + re.source, "g");
    resto = resto.replace(patron, (todo, n) => {
      if (macros[campo] === undefined) macros[campo] = Number(String(n).replace(",", "."));
      return " ";
    });
  }
  // "proteina 30" · "kcal 450"
  for (const [re, campo] of MACRO_PALABRA) {
    const patron = new RegExp(re.source + "\\s*:?\\s*(\\d+(?:[.,]\\d+)?)", "g");
    resto = resto.replace(patron, (todo, _g, n) => {
      const valor = Number(String(n === undefined ? _g : n).replace(",", "."));
      if (macros[campo] === undefined && Number.isFinite(valor)) macros[campo] = valor;
      return " ";
    });
  }
  return { macros, resto: resto.replace(/\s+/g, " ").trim() };
}

/** Unidades que ademas son comida: "2 huevos" dice cuanto Y que. Si se
 *  quitaran del texto al leer la cantidad, no quedaria nada que reconocer. */
const UNIDAD_ES_COMIDA = new Set(["huevo", "huevos", "yogur", "yogures", "filete", "filetes",
                                  "lata", "latas", "rebanada", "rebanadas"]);

/** La cantidad, en gramos, y el texto sin ella. */
function sacarCantidad(texto) {
  const palabras = texto.split(" ");
  for (let i = 0; i < palabras.length; i++) {
    const n = num(palabras[i]);
    if (n === null) continue;
    // "200 g" / "2 huevos" — la unidad puede ir pegada ("200g") o detras.
    const sig = normalizar(palabras[i + 1] || "");
    if (UNIDADES[sig] !== undefined) {
      palabras.splice(i, UNIDAD_ES_COMIDA.has(sig) ? 1 : 2);
      return { gramos: n * UNIDADES[sig], unidad: sig, cuenta: UNIDAD_ES_COMIDA.has(sig),
               resto: palabras.join(" ").trim() };
    }
    const pegado = /^(\d+(?:[.,]\d+)?)\s*([a-z]+)$/.exec(palabras[i]);
    if (pegado && UNIDADES[pegado[2]] !== undefined) {
      palabras.splice(i, 1);
      return { gramos: num(pegado[1]) * UNIDADES[pegado[2]], unidad: pegado[2],
               cuenta: UNIDAD_ES_COMIDA.has(pegado[2]), resto: palabras.join(" ").trim() };
    }
  }
  return { gramos: null, unidad: null, cuenta: false, resto: texto };
}

/**
 * Busca en el diccionario lo que mejor encaje con lo escrito.
 *
 * `pesado` cambia el criterio y no es un detalle: si dices "200 g de pollo"
 * estas pesando un ingrediente, no describiendo el plato del comedor, asi que
 * gana la pechuga cruda y no "pollo a la plancha". Si dices "pollo" a secas,
 * es una racion de algo, y gana el plato.
 */
export function reconocer(texto, pesado) {
  return reconocerEntre(normalizar(texto).split(" ").filter(t => t && !VACIAS.has(t) && num(t) === null), pesado);
}

function reconocerEntre(tokens, pesado) {
  if (!tokens.length) return null;

  let mejor = null, mejorPunto = 0, mejorUsados = [];
  for (const e of DICCIONARIO) {
    let aciertos = 0;
    const usados = [];
    for (const t of e.tokens) {
      if (VACIAS.has(t)) continue;
      const q = tokens.find(x => x === t || (x.length >= 4 && t.startsWith(x.slice(0, 4))));
      if (q) { aciertos++; usados.push(q); }
    }
    if (!aciertos) continue;
    // Se premia cubrir la entrada entera: "macarrones con tomate" gana a "pasta".
    const utiles = e.tokens.filter(t => !VACIAS.has(t)).length || 1;
    const punto = aciertos / utiles + aciertos * 0.35 + (e.tipo === "plato" ? (pesado ? -0.7 : 0.15) : 0);
    if (punto > mejorPunto) { mejorPunto = punto; mejor = e; mejorUsados = usados; }
  }
  if (mejor && mejorPunto >= 0.7) return Object.assign({}, mejor, { usados: mejorUsados });

  // Y si no, las palabras de todos los dias.
  for (const t of tokens) {
    if (SINONIMOS[t] && ALIMENTO[SINONIMOS[t]]) {
      const a = ALIMENTO[SINONIMOS[t]];
      return { tipo: "alimento", id: a.id, nombre: a.nombre, usados: [t],
               tokens: normalizar(a.nombre).split(" ") };
    }
  }
  return null;
}

/**
 * Todo lo que se reconozca en un trozo, no solo lo primero.
 *
 * "Merluza a la plancha con patatas" son dos cosas, y contar solo las patatas
 * seria peor que no contar nada. Se busca, se quitan las palabras ya usadas y
 * se vuelve a buscar en lo que queda.
 */
export function reconocerTodos(texto, pesado) {
  let quedan = normalizar(texto).split(" ").filter(t => t && !VACIAS.has(t) && num(t) === null);
  const salida = [];
  for (let vuelta = 0; vuelta < 3 && quedan.length; vuelta++) {
    const e = reconocerEntre(quedan, pesado);
    if (!e || !e.usados || !e.usados.length) break;
    salida.push(e);
    quedan = quedan.filter(t => !e.usados.includes(t));
  }
  return salida;
}

/** Reparto de un plato mixto normal, para cuando solo hay calorias. */
const REPARTO_MIXTO = { prot: 0.22, hc: 0.45, grasa: 0.33 };

const estimarDesdeKcal = (kcal) => ({
  kcal,
  prot: Math.round((kcal * REPARTO_MIXTO.prot) / 4),
  hc: Math.round((kcal * REPARTO_MIXTO.hc) / 4),
  grasa: Math.round((kcal * REPARTO_MIXTO.grasa) / 9),
});

/** Escala unos macros para que sumen las calorias que has dicho tu. */
function escalarA(macros, kcal) {
  if (!macros.kcal) return estimarDesdeKcal(kcal);
  const f = kcal / macros.kcal;
  return { kcal, prot: macros.prot * f, hc: macros.hc * f, grasa: macros.grasa * f };
}

/** Un trozo de texto es solo medida si, quitando numeros y unidades, no queda
 *  nada que nombre una comida. Sirve para no partir "450 kcal, 30 p" en dos. */
function soloMedida(trozo) {
  const { resto } = sacarMacros(normalizar(trozo));
  const { resto: sinCantidad } = sacarCantidad(resto);
  // Ojo: "filete" o "huevos" son unidades, pero tambien son comida. Un trozo
  // que solo diga "un filete" es una cosa comida, no la medida de la anterior.
  return !sinCantidad.split(" ").some(t =>
    t && num(t) === null && !VACIAS.has(t) && (!UNIDADES[t] || UNIDAD_ES_COMIDA.has(t)));
}

/** Parte el texto en cosas comidas. Una por línea, o separadas por comas. */
export function trocear(texto) {
  const trozos = [];
  for (const linea of String(texto || "").split(/[\n;]+/)) {
    // La coma separa cosas comidas, pero NO cuando es la coma decimal de un
    // numero: "350,5 kcal" es un numero, no dos comidas.
    for (const trozo of linea.split(/,(?!\d)|\s+y\s+|\s\+\s/)) {
      const t = trozo.trim();
      if (!t) continue;
      // "450 kcal" detras de "macarrones" es del mismo plato, no otro plato.
      if (trozos.length && soloMedida(t)) trozos[trozos.length - 1] += ", " + t;
      else trozos.push(t);
    }
  }
  return trozos;
}

/**
 * Lo que has escrito, entendido.
 *
 * Devuelve una linea por cosa comida, cada una con lo que se ha entendido y
 * de donde sale el numero. La pantalla lo enseña y lo puedes corregir: es la
 * diferencia entre fiarte de esto y no fiarte.
 */
export function interpretar(texto) {
  return trocear(texto).map(crudo => {
    const limpio = normalizar(crudo);
    const { macros: escritos, resto: sinMacros } = sacarMacros(limpio);
    const { gramos, cuenta, resto: nombreCrudo } = sacarCantidad(sinMacros);
    // Si has dicho cuanto —en gramos o en huevos— estas hablando de un
    // ingrediente, no del plato del comedor.
    const encontrado = reconocer(nombreCrudo, gramos !== null);
    // Un plato de cantina solo se escala si lo has PESADO. "1 yogur" no es
    // "una tercera parte del yogur de postre".
    const escala = (m) => (gramos !== null && !cuenta ? escalarPlato(m, gramos) : m);

    const tieneMacros = escritos.prot !== undefined && escritos.hc !== undefined && escritos.grasa !== undefined;

    // 1. Lo has escrito todo: se usa tal cual y no se discute.
    if (tieneMacros) {
      const kcal = escritos.kcal !== undefined ? escritos.kcal
        : escritos.prot * 4 + escritos.hc * 4 + escritos.grasa * 9;
      return linea(crudo, encontrado, { kcal, prot: escritos.prot, hc: escritos.hc, grasa: escritos.grasa }, "escrito", gramos);
    }

    // 2. Has dado las calorias: mandan ellas. Si ademas se reconoce el plato,
    //    los macros salen de su ficha ajustada a tus calorias.
    if (escritos.kcal !== undefined) {
      const base = encontrado
        ? (encontrado.macros ? escala(encontrado.macros)
                             : macrosDe(encontrado.id, gramos || porDefecto(encontrado.id)))
        : null;
      const macros = base ? escalarA(base, escritos.kcal) : estimarDesdeKcal(escritos.kcal);
      return linea(crudo, encontrado || { nombre: limpiarNombre(nombreCrudo || crudo), id: null },
                   macros, base ? "escrito" : "estimado", cuenta ? null : gramos);
    }

    // 3. No hay numeros: se calcula con la ficha de lo que se haya reconocido.
    if (encontrado) {
      // Sin cantidad dicha, un trozo puede llevar varias cosas: "merluza con
      // patatas". Con cantidad no, porque esos gramos son de una sola cosa.
      const todos = gramos === null ? reconocerTodos(nombreCrudo, false) : [encontrado];
      if (todos.length > 1) {
        const macros = todos.reduce((t, e) => {
          const m = e.macros || macrosDe(e.id, porDefecto(e.id));
          return { kcal: t.kcal + m.kcal, prot: t.prot + m.prot, hc: t.hc + m.hc, grasa: t.grasa + m.grasa };
        }, { kcal: 0, prot: 0, hc: 0, grasa: 0 });
        return linea(crudo, { nombre: todos.map(e => e.nombre).join(" + "), id: null }, macros, "tabla", null);
      }
      if (encontrado.macros) return linea(crudo, encontrado, escala(encontrado.macros), "tabla", cuenta ? null : gramos);
      const g = gramos || porDefecto(encontrado.id);
      return linea(crudo, encontrado, macrosDe(encontrado.id, g), "tabla", g);
    }

    // 4. Ni numeros ni nombre conocido. Antes colar un cero, se dice.
    return {
      crudo, nombre: limpiarNombre(nombreCrudo || crudo), gramos: null, confianza: "sin-entender",
      macros: { kcal: 0, prot: 0, hc: 0, grasa: 0 },
      aviso: "No sé qué es. Escribe las calorías y lo apunto igual.",
    };
  });
}

/** Una racion normal de ese alimento cuando no dices cuanto. */
function porDefecto(id) {
  const a = ALIMENTO[id];
  if (!a) return 100;
  if (a.unidad) return a.unidad.g;
  if (a.grupo === "verdura") return 250;
  if (a.grupo === "grasa") return 15;
  return 100;
}

/** Un plato de cantina viene por racion; si dices gramos, se ajusta a ojo
 *  tomando 350 g como el plato de referencia. */
function escalarPlato(macros, gramos) {
  if (!gramos) return macros;
  const f = gramos / 350;
  return { kcal: macros.kcal * f, prot: macros.prot * f, hc: macros.hc * f, grasa: macros.grasa * f };
}

/** El texto tal cual, quitando el "me he comido" de delante. Solo de delante:
 *  "pollo con arroz" tiene que seguir diciendo "con". */
function limpiarNombre(t) {
  const palabras = String(t || "").trim().split(" ").filter(Boolean);
  while (palabras.length > 1 && VACIAS.has(normalizar(palabras[0]))) palabras.shift();
  return palabras.join(" ") || String(t || "").trim();
}

function linea(crudo, encontrado, macros, confianza, gramos) {
  return {
    crudo,
    nombre: encontrado ? encontrado.nombre : limpiarNombre(crudo),
    id: encontrado ? encontrado.id : null,
    gramos: gramos || null,
    confianza,
    macros: {
      kcal: Math.round(macros.kcal), prot: Math.round(macros.prot),
      hc: Math.round(macros.hc), grasa: Math.round(macros.grasa),
    },
    aviso: confianza === "estimado"
      ? "Con tus calorías; los macros son un reparto normal de plato mixto."
      : null,
  };
}

/** El total de lo escrito, para enseñarlo antes de apuntarlo. */
export function totalDe(lineas) {
  return lineas.reduce((t, l) => ({
    kcal: t.kcal + l.macros.kcal, prot: t.prot + l.macros.prot,
    hc: t.hc + l.macros.hc, grasa: t.grasa + l.macros.grasa,
  }), { kcal: 0, prot: 0, hc: 0, grasa: 0 });
}
