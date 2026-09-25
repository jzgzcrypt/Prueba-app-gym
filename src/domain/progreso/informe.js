/**
 * TU MES
 *
 * El informe mensual (idea de TrueLift, con el tono de un Spotify Wrapped):
 * todo lo que hiciste en el mes, contado en grande. Se genera solo con lo que
 * ya apuntas; no hay nada que rellenar.
 *
 * Nunca inventa: si un dato no existe (no mediste la cintura, no apuntaste
 * pesos), esa parte sale vacia y la pantalla no la ensena.
 */
import { recordsDelDia, seriesDe } from "../fuerza/registro.js";
import { leerRitmo, textoTiempo } from "./libreta.js";
import { textoDiferencia, tuContraElPlan } from "./plan-vs-real.js";
import { semanasCumplidas } from "./resumen.js";

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const TIPOS = { run: "running", test: "running", objetivo: "running", fuerza: "fuerza", compromiso: "tenis" };
const CORRER = ["run", "test", "objetivo"];
const minutos = (d) => Number(((d.dur || "").match(/(\d+)/) || [0, 0])[1]);

/** "2026-09" -> { anio: 2026, mes: 8 } (mes 0-11). */
const partes = (mes) => { const [a, m] = mes.split("-").map(Number); return { anio: a, mes: m - 1 }; };
const ultimoDia = (mes) => { const { anio, mes: m } = partes(mes); return new Date(Date.UTC(anio, m + 1, 0)).getUTCDate(); };
const finDeMes = (mes) => mes + "-" + String(ultimoDia(mes)).padStart(2, "0");

/** Los meses que toca el bloque, hasta hoy: ["2026-09", "2026-10"]. */
export function mesesDelBloque(dias, hoyIso) {
  const out = [];
  for (const d of dias) {
    if (d.isoDate > hoyIso) break;
    const m = d.isoDate.slice(0, 7);
    if (out[out.length - 1] !== m) out.push(m);
  }
  return out;
}

/** "septiembre", con mayuscula si se pide. */
export function nombreMes(mes, mayuscula = false) {
  const n = MESES[partes(mes).mes];
  return mayuscula ? n[0].toUpperCase() + n.slice(1) : n;
}

/**
 * La fecha de una medida, en ISO. Las nuevas la llevan (`iso`); las viejas
 * solo tienen "24 sept" (sin ano): se toma el ano del bloque.
 */
export function fechaDeMedida(m, anio) {
  if (m.iso) return m.iso;
  const x = String(m.fecha || "").toLowerCase().match(/(\d{1,2})\s+([a-zñ]+)/);
  if (!x) return null;
  const i = MESES_CORTOS.findIndex(c => x[2].startsWith(c));
  if (i === -1) return null;
  return anio + "-" + String(i + 1).padStart(2, "0") + "-" + String(Number(x[1])).padStart(2, "0");
}

/** El primer y ultimo valor de una serie [{iso, v}] dentro del mes. */
function antesDespues(puntos) {
  if (!puntos.length) return null;
  return { antes: puntos[0].v, despues: puntos[puntos.length - 1].v, n: puntos.length };
}

/**
 * El informe de un mes.
 * @param {string} mes "2026-09"
 * @param {{ dias, semanas, checked, ritmoReal, pesos, reps, medidas, hoyIso }} datos
 */
export function informeMensual(mes, { dias, semanas, checked, ritmoReal, pesos, reps, medidas, hoyIso }) {
  const ch = checked || {}, rr = ritmoReal || {};
  const fin = finDeMes(mes);
  const hasta = hoyIso < fin ? hoyIso : fin;
  const enCurso = hoyIso <= fin;
  const delMes = dias.filter(d => d.isoDate.startsWith(mes) && d.isoDate <= hasta);

  // Sesiones: lo planificado del mes hasta hoy, y lo hecho.
  const sesiones = delMes.filter(d => TIPOS[d.tipo]);
  const hechas = sesiones.filter(d => ch[d.isoDate]);
  const porTipo = {};
  for (const d of sesiones) {
    const t = TIPOS[d.tipo];
    porTipo[t] = porTipo[t] || { hechas: 0, total: 0 };
    porTipo[t].total++;
    if (ch[d.isoDate]) porTipo[t].hechas++;
  }

  // Corriendo.
  const minutosCorriendo = hechas.filter(d => CORRER.includes(d.tipo)).reduce((n, d) => n + minutos(d), 0);
  const ritmosSeries = delMes.filter(d => d.ritmo).map(d => leerRitmo(rr[d.isoDate])).filter(Boolean);
  const mejorRitmoSeries = ritmosSeries.length ? Math.min(...ritmosSeries) : null;

  // Fuerza: series, kilos movidos y records.
  let series = 0, kilos = 0;
  const laterales = {};
  for (const d of delMes) {
    (d.ejercicios || []).forEach((ej, idx) => {
      const ss = seriesDe(d.isoDate, idx, pesos, reps);
      series += ss.length;
      for (const s of ss) if (s.peso && s.reps) kilos += s.peso * s.reps;
      if (/laterales/i.test(ej.nombre) && ss.some(s => s.peso)) {
        const max = Math.max(...ss.map(s => s.peso || 0));
        (laterales[ej.nombre] = laterales[ej.nombre] || []).push({ iso: d.isoDate, v: max });
      }
    });
  }
  const records = delMes.flatMap(d => recordsDelDia(d, dias, pesos, reps).map(r => ({ ...r, fecha: d.date })));
  // De los ejercicios de laterales, el que mas se ha registrado.
  const lat = Object.entries(laterales).sort((a, b) => b[1].length - a[1].length)[0];
  const lateralesMes = lat ? { nombre: lat[0], ...antesDespues(lat[1]) } : null;

  // Cuerpo: la cintura del mes (primera y ultima medida).
  const anio = partes(mes).anio;
  const cinturas = (medidas || [])
    .map(m => ({ iso: fechaDeMedida(m, anio), v: m.cintura }))
    .filter(x => x.iso && x.iso.startsWith(mes) && x.v != null)
    .sort((a, b) => a.iso < b.iso ? -1 : 1);
  const cintura = antesDespues(cinturas);

  // Tu contra el plan, con lo apuntado hasta el final del mes.
  const rrMes = Object.fromEntries(Object.entries(rr).filter(([k]) => k <= hasta));
  const pvr = tuContraElPlan(dias, rrMes);
  const planVsReal = pvr.ultimo
    ? { texto: textoDiferencia(pvr.diferencia), diferencia: pvr.diferencia, sieteK: textoTiempo(pvr.ultimo.seg) }
    : null;

  const cumplidas = semanas ? semanasCumplidas(semanas, ch, hasta) : 0;
  const diasEntrenados = new Set(hechas.map(d => d.isoDate)).size;

  const informe = {
    mes, titulo: "Tu " + nombreMes(mes), enCurso, hasta,
    diasEntrenados,
    sesiones: { hechas: hechas.length, total: sesiones.length, porTipo },
    minutosCorriendo, mejorRitmoSeries: mejorRitmoSeries ? textoTiempo(mejorRitmoSeries) + "/km" : null,
    series, kilos: Math.round(kilos), records,
    laterales: lateralesMes, cintura, planVsReal, semanasCumplidas: cumplidas,
  };
  informe.frase = fraseDelMes(informe);
  return informe;
}

/** La frase final. Nunca culpa: un mes flojo se cierra mirando al siguiente. */
export function fraseDelMes(inf) {
  const { hechas, total } = inf.sesiones;
  if (!total) return "Todavía no hay nada que contar. El primer entreno lo cambia todo.";
  const ratio = hechas / total;
  const logro = inf.laterales && inf.laterales.despues > inf.laterales.antes
    ? "el hombro ha subido " + (inf.laterales.despues - inf.laterales.antes) + " kg"
    : inf.records.length ? inf.records.length + (inf.records.length === 1 ? " récord nuevo" : " récords nuevos")
    : inf.cintura && inf.cintura.despues < inf.cintura.antes ? "la cintura ha bajado " + (inf.cintura.antes - inf.cintura.despues).toFixed(1) + " cm"
    : null;
  if (inf.enCurso) {
    return ratio >= 0.8 ? "Vas bien, y el mes aún no ha acabado." : "El mes aún no ha acabado: jueves y domingo, y lo demás sale.";
  }
  const siguiente = nombreMes(siguienteMes(inf.mes), true);
  if (ratio >= 0.9) return "Mes redondo" + (logro ? ": " + logro + "." : ".");
  if (ratio >= 0.6) return "Buen mes" + (logro ? ": " + logro + "." : ".") + " " + siguiente + ", a por más.";
  return siguiente + " empieza de cero. Jueves y domingo, y lo demás sale.";
}

function siguienteMes(mes) {
  const { anio, mes: m } = partes(mes);
  const d = new Date(Date.UTC(anio, m + 1, 1));
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

/** El informe a ensenar en HOY: el del mes anterior, los 5 primeros dias. */
export function informePendiente(dias, hoyIso) {
  const dia = Number(hoyIso.slice(8, 10));
  if (dia > 5) return null;
  const meses = mesesDelBloque(dias, hoyIso);
  const anterior = meses.filter(m => m < hoyIso.slice(0, 7)).at(-1);
  return anterior || null;
}
