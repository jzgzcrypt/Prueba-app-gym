/**
 * Punto unico de acceso a la persistencia.
 *
 * Las pantallas importan `storage` de aqui y nada mas. Para cambiar de backend
 * se cambia SOLO la linea que elige el adaptador.
 */

import { adaptadorLocal } from "./adaptador-local.js";

export { CLAVE_DATOS } from "./adaptador.js";
export { VERSION_ESQUEMA, migrar } from "./esquema.js";

export const storage = adaptadorLocal;
