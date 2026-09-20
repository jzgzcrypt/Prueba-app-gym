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

export const VERSION_ESQUEMA = 2;

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
