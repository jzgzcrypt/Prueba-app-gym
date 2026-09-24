import { CAT } from "../../design/tokens.js";
import { semanaHabito } from "./cuello.js";
// ─── MOVILIDAD — sistema de 4 patrones en paralelo, cada uno con test propio ──
export const MOVILIDAD_PATRONES = {
  hombro: {
    nombre: "Hombro — rotación", color: CAT.cuello,
    objetivo: "Manos detrás de la espalda (Apley scratch test) — 0cm = rango normal.",
    test: [
      "De pie, un brazo por encima del hombro con el codo doblado, la mano baja por la espalda desde arriba.",
      "El otro brazo por detrás de la zona lumbar, con la mano sube por la espalda desde abajo.",
      "Mide con una cinta la distancia entre la punta de los dedos. Repite con el brazo contrario arriba.",
    ],
    niveles: [
      { nivel: 1, nombre: "Retracción escapular activa", pasos: ["De pie, brazos relajados.", "Junta los omóplatos atrás y abajo, como guardándolos en los bolsillos traseros.", "Mantén 3s sin subir los hombros. Suelta. 8 repeticiones."],
        verificable: "Los hombros deben bajar, no subir. Si notas tensión en el cuello o trapecio, el gesto es incorrecto — corrige antes de subir repeticiones." },
      { nivel: 2, nombre: "Retracción con banda elástica", pasos: ["Banda con ambas manos, brazos al frente a la altura del pecho.", "Junta los omóplatos mientras separas las manos, estirando la banda.", "2s en máxima contracción, vuelve controlado. 10 repeticiones."],
        verificable: "Debes notar trabajo muscular real en la espalda alta, no solo el gesto — si la banda no ofrece resistencia perceptible, usa una más dura." },
      { nivel: 3, nombre: "Retracción dinámica + apertura de pecho", pasos: ["Brazos extendidos al frente, palmas hacia dentro.", "Abre en cruz hacia atrás mientras juntas los omóplatos, girando las palmas arriba.", "1s en máxima apertura, vuelve controlado. 10 repeticiones."],
        verificable: "El rango de apertura debe ser mayor cada semana — compáralo contra tu test de hombro en Progreso, la distancia debe ir bajando." },
    ] },
  cadenaPosterior: {
    nombre: "Cadena posterior — tocar el suelo", color: "#3A6EA5",
    objetivo: "Tocar el suelo con las piernas rectas, palmas completas — hoy mides la distancia de tus dedos al suelo.",
    test: [
      "De pie, piernas rectas (sin bloquear del todo la rodilla), pies juntos.",
      "Baja el torso hacia el suelo sin doblar rodillas, dejando caer los brazos.",
      "Mide la distancia entre la punta de los dedos y el suelo. Negativo si las palmas apoyan completas.",
    ],
    niveles: [
      { nivel: 1, nombre: "Estiramiento de isquios asistido", pasos: ["Sentado, una pierna extendida, la otra flexionada hacia dentro.", "Inclina el torso hacia el pie de la pierna extendida, espalda recta.", "Mantén 30s sin rebotar. Cambia de pierna."],
        verificable: "El estiramiento debe sentirse en el isquiotibial, nunca como un pinchazo en la rodilla — si duele la rodilla, flexiónala ligeramente." },
      { nivel: 2, nombre: "Bisagra de cadera con peso ligero", pasos: ["De pie, mancuerna ligera o botella de agua en las manos.", "Empuja la cadera atrás manteniendo la espalda recta, baja el peso pegado a las piernas.", "Sube apretando glúteo e isquios. 10 repeticiones controladas."],
        verificable: "La espalda debe permanecer recta durante todo el movimiento — si se redondea, baja el peso o reduce el rango." },
      { nivel: 3, nombre: "Toe touch progresivo con pausa", pasos: ["De pie, piernas rectas, baja hacia el suelo en 3 tiempos (muslo, rodilla, tobillo).", "En cada tiempo, mantén 5s respirando, sin rebotar ni forzar.", "El objetivo es ganar rango en cada pausa semana a semana."],
        verificable: "La distancia dedos-suelo del test en Progreso debe bajar respecto a la medición anterior — si se estanca 2+ mediciones seguidas, añade más tiempo de pausa en el tercer tiempo." },
    ] },
  columna: {
    nombre: "Columna — puente", color: "#6B4C8A",
    objetivo: "Puente completo (wheel pose) con extensión total de brazos y piernas.",
    test: [
      "Tumbado, intenta el puente completo (ver nivel 3) o su progresión más avanzada que domines.",
      "Anota qué nivel de progresión alcanzas limpio: puente de glúteo, puente con manos, o puente completo.",
      "El objetivo es subir de nivel, no repetir siempre el mismo.",
    ],
    niveles: [
      { nivel: 1, nombre: "Puente de glúteo con extensión de hombro", pasos: ["Tumbado, rodillas flexionadas, brazos extendidos por encima de la cabeza en el suelo.", "Eleva la cadera manteniendo los brazos extendidos y pegados al suelo.", "5 respiraciones arriba, baja controlado."],
        verificable: "Los brazos deben permanecer pegados al suelo durante toda la elevación — si se despegan, la movilidad de hombro aún limita el rango." },
      { nivel: 2, nombre: "Puente con manos (bridge assist)", pasos: ["Tumbado, manos junto a las orejas, dedos hacia los hombros, pies cerca de los glúteos.", "Empuja con piernas elevando la cadera, sin despegar la cabeza del suelo todavía.", "Mantén 5-10s, baja controlado."],
        verificable: "Debes sostener 5-10s sin que tiemblen los brazos de forma descontrolada — si no llegas a 5s, practica más tiempo en este nivel antes de avanzar." },
      { nivel: 3, nombre: "Puente completo (wheel pose)", pasos: ["Misma posición, ahora empuja también con los brazos elevando cabeza y pecho.", "Extiende codos y rodillas lo máximo que puedas sin dolor.", "Mantén 10-15s, baja controlado y despacio."],
        verificable: "Codos y rodillas deben extenderse cada vez más — registra en Progreso qué nivel alcanzas limpio cada 2 semanas para ver la progresión real." },
    ] },
  cadera: {
    nombre: "Cadera — ATG y Cossack", color: CAT.movilidad,
    objetivo: "Sentadilla ATG con talones en el suelo + Cossack squat limpio a cada lado.",
    test: [
      "Sentadilla ATG: baja lo máximo posible. ¿Talones en el suelo, sí o no?",
      "Cossack squat: lleva el peso a un lado. ¿Talón de la pierna flexionada apoyado, sí o no?",
      "Anota en qué lado/patrón tienes más limitación — suele ser asimétrico.",
    ],
    niveles: [
      { nivel: 1, nombre: "ATG y Cossack sin peso, rango parcial", pasos: ["Sentadilla ATG: baja lo que puedas manteniendo talones en el suelo, sube.", "Cossack: lleva el peso a un lado sin forzar el talón trasero.", "8-10 repeticiones de cada, prioriza técnica sobre profundidad."],
        verificable: "Los talones no deben despegarse del suelo en ningún momento — si se levantan, reduce la profundidad hasta que se mantengan apoyados." },
      { nivel: 2, nombre: "ATG y Cossack con pausa en el fondo", pasos: ["Mismos movimientos, pero mantén 3-5s en la posición más baja que controles.", "Respira en la posición baja, no aguantes el aire.", "8 repeticiones de cada, aumentando rango poco a poco."],
        verificable: "Debes poder respirar con normalidad en la posición baja — si contienes el aire por tensión, el rango es demasiado exigente todavía." },
      { nivel: 3, nombre: "ATG y Cossack con carga ligera", pasos: ["Añade una mancuerna ligera sujeta al pecho (goblet) para lastrar el rango.", "El peso ayuda a profundizar manteniendo el equilibrio.", "8 repeticiones de cada, buscando rango completo con talones apoyados."],
        verificable: "Con el peso añadido, sigues manteniendo talones apoyados y equilibrio — si pierdes la forma, vuelve al nivel 2 sin peso una temporada." },
    ] },
};
export const MOVILIDAD_PATRON_ORDEN = ["hombro", "cadenaPosterior", "columna", "cadera"];
/**
 * Que patron de movilidad se trabaja en cada sesion de gimnasio. Antes
 * rotaban por dia de la semana y el del lunes (tenis) no se hacia nunca.
 * Ahora cada patron va con la sesion que ya lo calienta: hombro con el
 * empuje, columna con el tiron, y cadera y cadena posterior con la pierna.
 */
export const PATRONES_POR_SESION = {
  empuje: ["hombro"],
  tiron: ["columna"],
  pierna: ["cadera", "cadenaPosterior"],
};

/** Los patrones de una sesion, con el nivel que toca por semana. */
export function getPatronesDeSesion(cat, weekN) {
  const nivel = (() => { const w = semanaHabito(weekN); return w <= 4 ? 1 : w <= 8 ? 2 : 3; })();
  return (PATRONES_POR_SESION[cat] || []).map(key => {
    const patron = MOVILIDAD_PATRONES[key];
    const nivelData = patron.niveles.find(n => n.nivel === nivel);
    return { key, nombre: patron.nombre, color: patron.color, objetivo: patron.objetivo, test: patron.test, nivel, nivelNombre: nivelData.nombre, pasos: nivelData.pasos, verificable: nivelData.verificable };
  });
}
