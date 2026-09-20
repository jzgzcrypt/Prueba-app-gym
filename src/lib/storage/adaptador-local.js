/**
 * Adaptador de persistencia sobre localStorage del navegador.
 *
 * Es el adaptador por defecto de la Fase 0: funciona sin servidor, sin cuenta
 * y sin red. Su limite conocido es que los datos viven en UN dispositivo y un
 * navegador. Cuando llegue la Fase 2 (cuenta + Postgres) este fichero se
 * sustituye por adaptador-remoto.js y NADA mas de la app cambia.
 */

const disponible = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const t = "__probe__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
};

export const adaptadorLocal = {
  nombre: "local",

  async get(clave) {
    if (!disponible()) return null;
    const value = window.localStorage.getItem(clave);
    return value == null ? null : { value };
  },

  async set(clave, valor) {
    if (!disponible()) return false;
    try {
      window.localStorage.setItem(clave, valor);
      return true;
    } catch {
      // Cuota llena o modo privado: fallar de forma visible, no silenciosa.
      return false;
    }
  },

  async list(prefijo) {
    if (!disponible()) return { keys: [] };
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefijo)) keys.push(k);
    }
    return { keys };
  },

  async borrar(clave) {
    if (!disponible()) return false;
    window.localStorage.removeItem(clave);
    return true;
  },
};
