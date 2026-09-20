/**
 * Punto unico de acceso a la persistencia.
 *
 * Las pantallas importan `storage` de aqui y nada mas. Para cambiar de backend
 * se cambia SOLO la linea que elige el adaptador.
 */

import { adaptadorLocal } from "./adaptador-local";

export { CLAVE_DATOS } from "./adaptador";
export { VERSION_ESQUEMA, migrar } from "./esquema";

export const storage = adaptadorLocal;
