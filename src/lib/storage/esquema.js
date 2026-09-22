/**
 * Version y migracion del estado guardado.
 *
 * Esta app esta pensada para durar anos. Eso significa que la forma de los
 * datos VA a cambiar, y que los datos ya guardados no se pueden perder cuando
 * cambie. La regla es:
 *
 *   1. Nunca se renombra ni se borra un campo guardado sin escribir su migracion.
 *   2. Cada cambio de forma sube VERSION_ESQUEMA en 1 y anade su paso en MIGRACIONES.
 *   3. migrar() se aplica SIEMPRE al cargar, aunque el dato ya este al dia.
 *
 * Cada migracion recibe el objeto de datos de la version anterior y devuelve
 * el objeto en la version siguiente. Son funciones puras y no lanzan.
 */

export const VERSION_ESQUEMA = 4;

// ─── v3: del numero de semana a la fecha real ────────────────────────────────
//
// Hasta la v2 todo el registro se indexaba por "semana-dia del bloque": la
// clave "1-3" era el jueves de la semana 1. Eso tenia dos problemas graves:
//
//   1. No existia el dia 20 de septiembre, existia "semana 1, dia 3". Un dia
//      fuera del bloque no tenia donde vivir, asi que no podia haber diario.
//   2. Al empezar el Bloque 2 la numeracion vuelve a 1, y "1-3" del bloque 2
//      habria escrito encima de "1-3" del bloque 1. Perdida de historial con
//      fecha de caducidad.
//
// Desde la v3 la clave es la fecha ISO: "2026-09-24", y los sufijos se
// conservan igual ("2026-09-24-m" para el cuello de la mañana).

const MS_DIA = 86400000;

/** Fecha de inicio del bloque con la que se escribieron esas claves.
 *  NO se importa del plan a proposito: una migracion es un documento
 *  historico y tiene que dar siempre el mismo resultado. Si mañana se mueve
 *  FECHA_INICIO, los datos ya migrados no pueden cambiar de fecha. */
const INICIO_POR_DEFECTO = "2026-09-21";

function sumarDias(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const r = new Date(Date.UTC(y, m - 1, d, 12) + n * MS_DIA);
  return r.getUTCFullYear() + "-" + String(r.getUTCMonth() + 1).padStart(2, "0") + "-" + String(r.getUTCDate()).padStart(2, "0");
}

const esFechaIso = (k) => /^\d{4}-\d{2}-\d{2}/.test(k);

/** "1-3" -> "2026-09-24"  ·  "1-3-m" -> "2026-09-24-m" */
function claveAFecha(clave, inicio) {
  if (esFechaIso(clave)) return clave; // ya migrada
  const m = /^(\d+)-(\d+)(-.*)?$/.exec(clave);
  if (!m) return clave; // forma desconocida: se deja como esta antes que perderla
  const semana = Number(m[1]), dia = Number(m[2]), sufijo = m[3] || "";
  if (semana < 1 || dia < 0 || dia > 6) return clave;
  return sumarDias(inicio, (semana - 1) * 7 + dia) + sufijo;
}

function reindexar(mapa, inicio) {
  if (!mapa || typeof mapa !== "object") return mapa;
  const fuera = {};
  for (const k of Object.keys(mapa)) fuera[claveAFecha(k, inicio)] = mapa[k];
  return fuera;
}

const MIGRACIONES = {
  // v2 — La bitacora semanal deja de ser un texto libre y pasa a tener las tres
  // partes que de verdad sirven para decidir: que paso, por que, y que se
  // ajusta. El texto que ya hubiera escrito se conserva entero en "paso":
  // nunca se reparte a ojo entre los tres campos, porque eso seria inventar.
  2: (d) => {
    const log = d.weeklyLog || {};
    const migrado = {};
    for (const n of Object.keys(log)) {
      const v = log[n];
      migrado[n] = typeof v === "string"
        ? { paso: v, porque: "", ajuste: "" }
        : v; // ya tenia la forma nueva
    }
    return { ...d, weeklyLog: migrado };
  },
  // v3 — Todo el registro pasa de "semana-dia" a fecha real. Ver arriba.
  3: (d) => {
    // La fecha de inicio se saca del propio historial guardado siempre que se
    // pueda. Asi, una copia importada de la version antigua —cuyo bloque
    // empezaba el 31 de agosto— cae en sus fechas de verdad y no tres semanas
    // desplazada.
    const inicio = d.bloquesHistorial?.[0]?.inicio || INICIO_POR_DEFECTO;

    const porDia = ["checked", "cuelloChecks", "notes", "painLog", "magiaLog", "guerreroLog",
                    "workoutWeights", "ritmoReal", "ritmoTramos", "sensaciones", "postponed"];
    const salida = { ...d };
    for (const k of porDia) salida[k] = reindexar(d[k], inicio);

    // La bitacora iba por numero de semana: pasa al lunes de esa semana.
    if (d.weeklyLog && typeof d.weeklyLog === "object") {
      const log = {};
      for (const k of Object.keys(d.weeklyLog)) {
        const n = Number(k);
        log[esFechaIso(k) || !Number.isFinite(n) ? k : sumarDias(inicio, (n - 1) * 7)] = d.weeklyLog[k];
      }
      salida.weeklyLog = log;
    }

    // Los rangos en pausa guardan listas de claves de dia.
    if (Array.isArray(d.pausedRanges)) {
      salida.pausedRanges = d.pausedRanges.map(r =>
        Array.isArray(r?.days) ? { ...r, days: r.days.map(k => claveAFecha(k, inicio)) } : r);
    }

    return salida;
  },

  // v4 — La magia deja de ir por semanas y pasa a repaso espaciado.
  //
  // Antes un truco solo podia estar "dominado" o no, y cual tocaba lo decidia
  // el numero de semana del bloque. Ahora cada truco dominado lleva su propia
  // escalera de repaso. Lo que ya habia marcado como dominado NO se pierde:
  // entra en la cola, y para no soltarle de golpe diez repasos el primer dia,
  // se reparten a lo largo de los siguientes dias, uno por dia.
  //
  // magiaProgress se conserva tal cual: una migracion no borra lo que habia.
  4: (d) => {
    if (d.magiaRepaso) return d; // ya migrado
    const dominados = Object.keys(d.magiaProgress || {}).filter(id => d.magiaProgress[id]);
    if (!dominados.length) return { ...d, magiaRepaso: {} };

    const desde = d.bloquesHistorial?.[0]?.inicio || INICIO_POR_DEFECTO;
    const repaso = {};
    dominados.forEach((id, i) => {
      repaso[id] = { escalon: 0, proximo: sumarDias(desde, i + 1), ultimo: desde, aciertos: 0, fallos: 0 };
    });
    return { ...d, magiaRepaso: repaso };
  },
};

/**
 * Lleva un objeto de datos guardado a la version actual del esquema.
 * @param {object} datos objeto deserializado tal cual estaba guardado
 * @returns {{ datos: object, migrado: boolean, desde: number }}
 */
export function migrar(datos) {
  if (!datos || typeof datos !== "object") {
    return { datos: { version: VERSION_ESQUEMA }, migrado: false, desde: VERSION_ESQUEMA };
  }
  const desde = typeof datos.version === "number" ? datos.version : 1;
  let actual = datos;
  let migrado = false;

  for (let v = desde; v < VERSION_ESQUEMA; v++) {
    const paso = MIGRACIONES[v + 1];
    if (!paso) continue;
    actual = paso(actual);
    migrado = true;
  }

  return { datos: { ...actual, version: VERSION_ESQUEMA }, migrado, desde };
}
