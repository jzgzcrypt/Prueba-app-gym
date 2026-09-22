// Curva de ritmo esperado, semana a semana, sacada de los ritmos planificados
// en las sesiones de calidad y test de cada semana.
// Formato: segundos por km (para poder graficar y comparar numericamente).
// Desde S6 la calidad son series AL ritmo objetivo, asi que la curva se aplana:
// lo que progresa es la longitud de los tramos (800 m -> 3 km), no el ritmo.
export const RITMO_ESPERADO = {
  4: 290,  // prueba de 3 km a tope: ~14:30 va en linea con el objetivo
  5: 275,  // series 6x400 a 4:35, algo mas rapido que el objetivo
  6: 285,  // series 5x800 a 4:45
  7: 285,  // series 4x1 km a 4:45
  8: 282,  // test de 5 km: 23:30 o menos (4:42/km) mantiene la fecha
  9: 285,  // series 3x2 km a 4:45
  10: 285, // series 2x3 km a 4:45
  11: 285, // objetivo: 4:45/km = 285s
};
export function parseRitmoToSeconds(str) {
  // acepta formatos "5:12/km", "31:20", "5:12"
  const m = str.match(/(\d+):(\d+)/);
  if (!m) return null;
  const min = parseInt(m[1], 10), sec = parseInt(m[2], 10);
  // Si el string incluye "/km" o es razonable como ritmo (menos de 10 min), es ritmo directo
  if (str.includes("/km") || min < 10) return min * 60 + sec;
  return null; // es un tiempo total, no un ritmo — no comparable directamente
}
export function secondsToRitmo(s) {
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}
