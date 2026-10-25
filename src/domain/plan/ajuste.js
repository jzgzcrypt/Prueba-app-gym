/**
 * EL PLAN SE AJUSTA A LO QUE DE VERDAD CORRES.
 *
 * El plan es fijo: semana a semana sube. Pero si paras dos semanas, volver
 * con la tirada que tocaba es como acaban las lesiones o el abandono. Aqui se
 * mira lo que has corrido de verdad (marcado o con GPS) y se calcula cuanto
 * te toca, con reglas generales, no para un caso:
 *
 *  1. Paron: dias desde tu ultima carrera hecha.
 *     - Menos de 7: nada.
 *     - 7 o mas: vuelta progresiva. Salidas de vuelta = una por cada 5 dias
 *       (entre 2 y 6). La primera, al 1 - 2,5 % por dia parado (minimo 40 %);
 *       cada una sube hasta llegar al 100 % despues de la ultima.
 *       Primera mitad: sin series (suave + progresivos). Segunda: series con
 *       menos repeticiones. Una prueba no se hace en la vuelta.
 *  2. Constancia baja sin paron (menos de la mitad de las salidas de las 2
 *     ultimas semanas): las series de los 7 dias siguientes, mas cortas, y la
 *     tirada no crece respecto a la anterior.
 *
 * Todo se recalcula cada dia con lo hecho: nada se guarda a mano. Es una
 * capa encima del plan, como la prueba de 2 semanas. El dia del objetivo no
 * se toca nunca.
 *
 * Puro: sin React, se prueba sin navegador.
 */

const DIA = 86400000;
const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / DIA);
const masDias = (iso, n) => new Date(new Date(iso + "T12:00:00").getTime() + n * DIA).toISOString().slice(0, 10);

const esCarrera = (d) => d && (d.tipo === "run" || d.tipo === "test");
const esSeries = (d) => !!(d && (d.intervalos || d.esCalidad));
const esTirada = (d) => d && d.tipo === "run" && d.dayIdx === 6 && !esSeries(d);
/** "45 min" → 45; el primer "N min" de un texto. */
const minutos = (txt) => { const m = /(\d+)\s*min/.exec(String(txt || "")); return m ? Number(m[1]) : null; };

/**
 * @param {object} p
 * @param {object[]} p.dias   FLAT_DAYS
 * @param {object} p.checked  { iso: true }
 * @param {object} [p.gps]    { iso: { m } }
 * @param {object} [p.ritmoReal] { iso: "texto de la libreta" } (lo apuntado de Strava cuenta como hecho)
 * @param {string} p.hoyIso
 * @returns {{ paro:number, vuelta:Object<string,{n:number,de:number,factor:number,sinSeries:boolean,paro:number}>,
 *             constancia:null|{hechas:number,de:number}, suavizar:Object<string,"series"|"tirada"> }}
 */
export function estadoCarga({ dias, checked, gps, ritmoReal, hoyIso }) {
  const ch = checked || {}, g = gps || {}, rr = ritmoReal || {};
  const hecha = (d) => !!ch[d.isoDate] || !!(g[d.isoDate] && g[d.isoDate].m > 0) || !!String(rr[d.isoDate] || "").trim();
  const carreras = (dias || []).filter(esCarrera);
  const hechas = carreras.filter(d => d.isoDate <= hoyIso && hecha(d)).map(d => d.isoDate).sort();
  // Sin ninguna carrera apuntada, se cuenta desde la primera del plan: si el
  // plan ya lleva 7 dias o mas, se vuelve como tras un paron.
  const primera = carreras.length ? carreras[0].isoDate : null;
  if (!hechas.length && (!primera || primera >= hoyIso)) return { paro: 0, vuelta: {}, constancia: null, suavizar: {}, dias };

  // El ultimo paron de 7 dias o mas: entre dos carreras hechas, o desde la
  // ultima hasta hoy si aun no has vuelto.
  let inicio = null, paro = 0;
  const sinNada = !hechas.length;
  const ultima = sinNada ? primera : hechas[hechas.length - 1];
  if (ultima < hoyIso && diasEntre(ultima, hoyIso) >= 7) { inicio = hoyIso; paro = diasEntre(ultima, hoyIso); }
  else {
    for (let i = hechas.length - 1; i > 0; i--) {
      const dd = diasEntre(hechas[i - 1], hechas[i]);
      if (dd >= 7) { inicio = hechas[i]; paro = dd; break; }
    }
  }

  const vuelta = {};
  if (inicio) {
    const de = Math.min(6, Math.max(2, Math.ceil(paro / 5)));
    const f0 = Math.max(0.4, 1 - paro * 0.025);
    // Las salidas de vuelta: las hechas desde que volviste y las que vienen
    // (las que se pasaron sin hacer no cuentan).
    const salidas = carreras.filter(d => d.isoDate >= inicio && (d.isoDate >= hoyIso || hecha(d))).slice(0, de);
    salidas.forEach((d, k) => {
      vuelta[d.isoDate] = { n: k + 1, de, paro, sinNada, factor: Math.round((f0 + (1 - f0) * k / de) * 100) / 100, sinSeries: k < de / 2 };
    });
  }

  // Constancia de las 2 ultimas semanas, si no hay vuelta en marcha.
  let constancia = null;
  const suavizar = {};
  const vueltaPorDelante = Object.keys(vuelta).some(iso => iso >= hoyIso);
  if (!vueltaPorDelante) {
    const desde = masDias(hoyIso, -14);
    const tocaban = carreras.filter(d => d.isoDate >= desde && d.isoDate < hoyIso && !d.vispera);
    const hechasRec = tocaban.filter(hecha).length;
    if (tocaban.length >= 3 && hechasRec / tocaban.length < 0.5) {
      constancia = { hechas: hechasRec, de: tocaban.length };
      const hasta = masDias(hoyIso, 7);
      for (const d of carreras) {
        if (d.isoDate < hoyIso || d.isoDate > hasta) continue;
        if (esSeries(d) && d.intervalos) suavizar[d.isoDate] = "series";
        else if (esTirada(d)) suavizar[d.isoDate] = "tirada";
      }
    }
  }
  return { paro, vuelta, constancia, suavizar, dias };
}

const escalar = (min, f) => Math.max(10, Math.round(min * f));
const conMin = (txt, n) => String(txt || "").replace(/(\d+)(\s*min)/, n + "$2");

/** Una carrera continua mas corta: los minutos de lo que corres, del titulo y del total. */
function acortar(day, f) {
  const corre = minutos(day.what);
  const total = minutos(day.dur);
  const out = { ...day };
  if (corre != null && /^\s*\d+\s*min/.test(day.what || "")) {
    const n = escalar(corre, f);
    out.what = conMin(day.what, n).replace(/\s*\(~[^)]*km\)/, ""); // los km del plan ya no valen
    if (minutos(day.titulo) === corre) out.titulo = conMin(day.titulo, n);
  } else if (total != null) {
    out.what = "Hoy, " + escalar(total, f) + " min en total. " + (day.what || "");
  }
  if (total != null) out.dur = escalar(total, f) + " min";
  return out;
}

/** Series y pruebas, en la primera mitad de la vuelta: suave con progresivos. */
function aSuave(day, f) {
  const n = escalar(Math.max(20, (minutos(day.dur) || 30) - 10), f);
  const { intervalos, ritmo, tramoM, prueba, esCalidad, ...resto } = day;
  return { ...resto, tipo: "run", cat: "runZ2", titulo: "Suave + progresivos", dur: n + " min",
           what: n + " min suave continuo + 4 progresivos de 15 s al final. Hoy no toca " + (prueba ? "prueba" : "series") + ".", original: day };
}

/** Menos repeticiones: el numero del titulo y de los intervalos. */
function menosSeries(day, f) {
  if (!day.intervalos) return day;
  const r0 = day.intervalos[0].r;
  const r = Math.max(2, Math.round(r0 * f));
  if (r >= r0) return day;
  return { ...day,
    intervalos: day.intervalos.map((b, i) => (i === 0 ? { ...b, r } : b)),
    titulo: String(day.titulo || "").replace(new RegExp("\\b" + r0 + "x"), r + "x"),
    what: "Hoy solo " + r + " series, no " + r0 + ". " + (day.what || "") };
}

/**
 * El dia con el ajuste aplicado (o el mismo si no toca). El ajustado lleva
 * `ajuste: { motivo }` para decir por que.
 */
export function diaAjustado(day, estado) {
  if (!day || !estado || day.tipo === "objetivo" || !esCarrera(day)) return day;
  const v = estado.vuelta[day.isoDate];
  if (v) {
    const pct = Math.round(v.factor * 100);
    const motivo = v.sinNada
      ? "No hay ninguna carrera apuntada: salida " + v.n + " de " + v.de + " de vuelta, al " + pct + " %. Si corriste, márcalo en su día y se recalcula."
      : v.paro + " días sin correr: salida " + v.n + " de " + v.de + " de vuelta, al " + pct + " %. Sin drama: así se vuelve bien.";
    const out = esSeries(day) || day.prueba
      ? (v.sinSeries || day.prueba ? aSuave(day, v.factor) : menosSeries(day, v.factor))
      : acortar(day, v.factor);
    return { ...out, ajuste: { motivo } };
  }
  const s = estado.suavizar[day.isoDate];
  if (s && estado.constancia) {
    const c = estado.constancia;
    const base = "Últimas 2 semanas: " + c.hechas + " de " + c.de + " salidas.";
    if (s === "series") return { ...menosSeries(day, 0.6), ajuste: { motivo: base + " Hoy, menos series: la carga sube cuando cumples." } };
    return { ...tiradaSinCrecer(day, estado.dias), ajuste: { motivo: base + " La tirada, como la anterior: crecerá cuando cumplas." } };
  }
  return day;
}

/** La tirada que no crece: la misma duracion que la tirada anterior del plan. */
function tiradaSinCrecer(day, dias) {
  if (!esTirada(day)) return day;
  const antes = (dias || []).filter(d => esTirada(d) && d.isoDate < day.isoDate).pop();
  const m0 = minutos(day.what), m1 = antes ? minutos(antes.what) : null;
  if (m0 == null || m1 == null || m1 >= m0) return day;
  return acortar(day, m1 / m0);
}
