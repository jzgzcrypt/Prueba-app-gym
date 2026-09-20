
// Curva de ritmo objetivo esperado, semana a semana, sacada de los ritmos
// planificados reales en las sesiones de calidad/test de cada semana.
// Formato: segundos por km (para poder graficar y comparar numericamente).
export const RITMO_ESPERADO = {
  4: 355,  // fartlek ~5:55/km (RPE7 en zona ~5:50-6:00)
  5: 350,  // fartlek progresando
  6: 327,  // ritmo especifico 5:20-5:35 -> ~5:27 promedio
  7: 310,  // ritmo 4km 5:05-5:15 -> ~5:10
  8: 297,  // 5km a 4:55-5:00 -> ~4:57
  9: 285,  // 3km exacto a 4:45
  10: 285, // taper, mantener
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
