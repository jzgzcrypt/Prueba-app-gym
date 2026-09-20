// ─── CUELLO — protocolo de fisio (Neck Specific Exercise, Peterson/Peolsson), base diaria no negociable ──
export const CUELLO_PARTE_1 = {
  nombre: "Activación visual",
  reps: "5 repeticiones",
  necesitas: "Nada, solo un sitio para tumbarte.",
  contexto: "Tras un latigazo cervical (whiplash), el cuerpo pierde la coordinación fina entre ojos, cuello y equilibrio. Esta fase reeduca esa conexión sin mover el cuello en absoluto — es el primer paso antes de cualquier trabajo de fuerza real.",
  pasos: [
    "Túmbate boca arriba, cabeza en posición neutra (ni hacia delante ni hacia atrás).",
    "Mandíbula relajada, labios juntos, dientes separados.",
    "Sin mover el cuello, visualiza que extiendes la cabeza hacia atrás y sigue ese movimiento imaginario con los ojos, mirando arriba/atrás.",
    "Mantén 5 segundos. Repite visualizando flexión (mirar hacia el pecho) y luego rotación a cada lado.",
  ],
  sensacion: "Debes notar una activación muy suave en la parte profunda del cuello, nunca dolor. Si no sientes nada, es normal al principio — es un ejercicio de activación neuromuscular, no de fuerza.",
  aplicacion: "Esta reconexión ojo-cuello es la que usas sin pensar al conducir, girarte al oír tu nombre, o comprobar el tráfico antes de cruzar — justo los gestos que un latigazo cervical deja torpes.",
};
export const CUELLO_PARTE_2 = {
  nombre: "Isométrico suave",
  reps: "5 repeticiones",
  necesitas: "Nada, solo un sitio para tumbarte.",
  contexto: "Ya tienes reconectada la coordinación básica. Ahora introduces la primera carga real, pero controlada al mínimo — sin llegar nunca a mover el cuello, solo a tensarlo.",
  pasos: [
    "Misma posición tumbada, cabeza neutra, mandíbula relajada.",
    "Coloca la mano como resistencia (en la frente para flexión, detrás de la cabeza para extensión, en la sien para rotación).",
    "Empuja suavemente contra tu mano sin que la cabeza llegue a moverse — es una contracción isométrica, no un movimiento real.",
    "Mantén 5 segundos, respira con normalidad. Cambia de dirección cada ronda.",
  ],
  sensacion: "Tensión controlada y suave en el cuello. Debe sentirse como un esfuerzo del 20-30%, no al máximo. Nunca debe reproducir el dolor original.",
  aplicacion: "Este nivel de fuerza controlada es el que estabiliza tu cuello cuando corres, cuando cargas peso en fuerza, o simplemente cuando pasas horas sentado en el trabajo — sostiene la cabeza sin fatigarse.",
};
export const CUELLO_PARTE_3 = {
  nombre: "Isométrico con mayor resistencia y rango funcional",
  reps: "6 repeticiones",
  necesitas: "Nada, de pie o sentado (ya no hace falta tumbarse).",
  contexto: "Con la base neuromuscular y la fuerza controlada ya asentadas, esta fase te devuelve al mundo real: de pie, con más resistencia, en las posiciones que de verdad usas al vivir.",
  pasos: [
    "De pie o sentado, espalda recta, cabeza en posición neutra.",
    "Empuja con más firmeza contra tu mano que en la fase anterior (60-70% de tu fuerza, no al máximo), en las 4 direcciones: flexión, extensión, rotación izquierda y derecha.",
    "Mantén 6 segundos cada dirección, respirando con normalidad.",
    "Añade una variante funcional: gira la cabeza lentamente de lado a lado con control total, sin resistencia, para comprobar que el rango de movimiento se mantiene libre de dolor.",
  ],
  sensacion: "Trabajo muscular notorio pero sin tensión en hombros ni mandíbula. Si aparece dolor agudo (distinto a la fatiga muscular normal), vuelve a la Parte 2 esa sesión.",
  aplicacion: "Este es el nivel de cuello fuerte y funcional que necesitas para correr sin fatiga cervical al final de una sesión larga, y para que el trabajo de hombro (dominadas, press) no te resienta el cuello.",
};
// Los habitos arrancan de verdad en la semana 2 del plan (la semana 1 solo se sostuvo el running).
// Este desfase hace que la semana 2 se comporte como "semana 1" para la progresion de niveles.
export const HABITOS_INICIO_SEMANA = 2;
export function semanaHabito(weekN) { return Math.max(1, weekN - (HABITOS_INICIO_SEMANA - 1)); }
// Hoy ningun habito se pausa: solo se ajusta lo que genera fatiga real (pierna,
// running), nunca las habilidades ni la salud. Se mantiene como funcion, y no
// como constante, porque la decision de pausar depende de la semana en cuanto
// haya reglas de descarga reales.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function habitoEnPausa(weekN) { return false; }

export function getCuelloEj(weekN) { const w = semanaHabito(weekN); return w <= 2 ? CUELLO_PARTE_1 : w <= 6 ? CUELLO_PARTE_2 : CUELLO_PARTE_3; }
