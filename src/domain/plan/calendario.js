import { WEEKS } from "@/domain/plan/bloque-1-base-7k";
export const DATE_MAP = {};
(() => {
  const months = { "Ago":8, "Sep":9, "Oct":10, "Nov":11 };
  WEEKS.forEach(wk => wk.days.forEach(d => {
    const parts = d.date.split(" ");
    const dd = parts[0]; const mm = parts[1];
    DATE_MAP[d.date] = "2026-" + String(months[mm]).padStart(2,"0") + "-" + dd;
  }));
})();

export const FLAT_DAYS = [];
WEEKS.forEach((wk, wi) => wk.days.forEach((d, di) => FLAT_DAYS.push(Object.assign({}, d, { weekIdx: wi, dayIdx: di, weekN: wk.n, isoDate: DATE_MAP[d.date] }))));

// Devuelve la fecha LOCAL de hoy en formato "YYYY-MM-DD", sin pasar por UTC.
// new Date().toISOString() convierte a UTC y puede devolver el dia equivocado
// en las ultimas horas del dia segun la zona horaria del dispositivo.
export function todayLocalIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function findTodayIndex() {
  const todayIso = todayLocalIso();
  let idx = FLAT_DAYS.findIndex(d => d.isoDate === todayIso);
  if (idx === -1) { idx = FLAT_DAYS.findIndex(d => d.isoDate > todayIso); if (idx === -1) idx = FLAT_DAYS.length - 1; }
  return idx;
}

export const TIPO_LABEL = { run: "RUNNING", fuerza: "FUERZA", test: "TEST", libre: "DESCANSO", objetivo: "OBJETIVO" };
