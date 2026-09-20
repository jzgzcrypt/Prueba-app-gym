/**
 * Contrato de persistencia de la app.
 *
 * Toda la app guarda y lee SOLO a traves de este contrato. Ninguna pantalla
 * sabe donde acaban los datos. Eso es lo que permite cambiar el backend
 * (localStorage -> Postgres/Neon -> sync multi-dispositivo) sin tocar UI.
 *
 * Un adaptador debe implementar:
 *   get(clave)          -> Promise<{ value: string } | null>
 *   set(clave, valor)   -> Promise<boolean>
 *   list(prefijo)       -> Promise<{ keys: string[] }>
 *   borrar(clave)       -> Promise<boolean>
 *
 * El valor siempre es un string (JSON serializado). Serializar/deserializar
 * es responsabilidad de la capa de estado, no del adaptador.
 */

/** @typedef {{ get:Function, set:Function, list:Function, borrar:Function, nombre:string }} Adaptador */

export const CLAVE_DATOS = "programa7k:datos";
