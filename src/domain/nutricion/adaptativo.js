/**
 * EL MOTOR ADAPTATIVO (la idea de MacroFactor).
 *
 * Las formulas de gasto (Mifflin, Harris…) aciertan "de media", pero tu gasto
 * real puede estar 300 kcal arriba o abajo. En vez de fiarse de la formula, se
 * mide: con lo que comes (el dia cerrado con tu IA) y tu peso de cada mañana.
 *
 *   gasto = lo que comes de media − lo que cambia tu peso × 7700 kcal/kg
 *
 * Si comes 2.200 y bajas 0,4 kg/semana, gastas unas 2.640. Y cada lunes las
 * calorias de la semana se ajustan para seguir bajando al ritmo previsto.
 *
 * Tres cosas lo hacen funcionar con datos de verdad:
 *  - El peso de un dia miente (agua, sal, glucogeno: ±1 kg). Se usa la
 *    TENDENCIA: media exponencial con α = 0,1, como MacroFactor y The Hacker's
 *    Diet. Un pico de agua apenas la mueve.
 *  - El cambio de peso se mide con una recta sobre los pesos de la ventana
 *    (minimos cuadrados), que aprovecha todos los dias y no solo dos.
 *  - Neutro: un dia sin apuntar no cuenta (no se asume ni que ayunaste ni que
 *    te pasaste) y un exceso es un dato, no un fallo. Con pocos datos manda la
 *    formula; con 3 semanas, mandan tus datos.
 */

export const KCAL_POR_KG = 7700;
/** Suavizado de la tendencia de peso. */
export const ALFA_TENDENCIA = 0.1;
/** Dias que se miran hacia atras para estimar el gasto. */
export const VENTANA_DIAS = 28;
/** Con estos dias de datos, los datos mandan del todo sobre la formula. */
export const DIAS_PLENOS = 21;
/** Deficit previsto: ~0,4 kg/semana, poco porque hay que proteger el 7K. */
export const DEFICIT_KCAL = 450;
/** Topes de seguridad. */
export const TOPE = { cambioSemana: 150, minimo: 1800, deficitMax: 0.25 };
/** Diferencia entre dia de COMER y de RECORTAR, como hasta ahora. */
export const DIFERENCIA_COMER_RECORTAR = 400;
export const PROTEINA_G = 165;
export const GRASA_G = { comer: 70, recortar: 65 };

const DIA_MS = 86400000;
const aDia = (iso) => Math.floor(Date.parse(iso + "T00:00:00Z") / DIA_MS);
const aIso = (n) => new Date(n * DIA_MS).toISOString().slice(0, 10);
export const sumarDiasIso = (iso, n) => aIso(aDia(iso) + n);

/** Gasto de partida con la formula (Mifflin-St Jeor x 1,55: entrenas 5-6 dias). */
export function gastoPorFormula({ peso = 86, altura = 183, edad = 35 } = {}) {
  return Math.round((10 * peso + 6.25 * altura - 5 * edad + 5) * 1.55);
}

/**
 * La tendencia de peso dia a dia: [{ iso, peso (o null), tendencia }], desde
 * el primer pesaje hasta `hastaIso` (o el ultimo). Los dias sin pesar se
 * rellenan con la recta entre los pesajes de alrededor; despues del ultimo,
 * la tendencia se queda quieta.
 */
export function tendenciaPeso(pesos, hastaIso) {
  // Solo pesajes hasta `hastaIso`: un peso posterior no puede colarse al
  // rellenar los dias sin pesar (la semana no debe cambiar al pesarte hoy).
  const dias = Object.keys(pesos || {}).filter(k => Number.isFinite(pesos[k]) && (!hastaIso || k <= hastaIso)).sort();
  if (!dias.length) return [];
  const ini = aDia(dias[0]), fin = aDia(hastaIso || dias[dias.length - 1]);
  const out = [];
  let t = pesos[dias[0]], j = 0;
  for (let n = ini; n <= fin; n++) {
    const iso = aIso(n);
    while (j < dias.length - 1 && aDia(dias[j + 1]) <= n) j++;
    let p = pesos[iso] ?? null, entrada = p;
    if (entrada == null && j < dias.length - 1) {
      const a = aDia(dias[j]), b = aDia(dias[j + 1]);
      entrada = pesos[dias[j]] + (pesos[dias[j + 1]] - pesos[dias[j]]) * (n - a) / (b - a);
    }
    if (entrada != null) t = t + ALFA_TENDENCIA * (entrada - t);
    out.push({ iso, peso: p, tendencia: Math.round(t * 100) / 100 });
  }
  return out;
}

/** Pendiente (kg/dia) de una recta por minimos cuadrados. null con menos de 2 puntos. */
function pendiente(puntos) {
  if (puntos.length < 2) return null;
  const n = puntos.length, mx = puntos.reduce((a, p) => a + p.x, 0) / n, my = puntos.reduce((a, p) => a + p.y, 0) / n;
  const sxx = puntos.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  if (!sxx) return null;
  return puntos.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / sxx;
}

/**
 * Tu gasto real estimado con los datos hasta el dia anterior a `hoyIso`.
 * `ingestas`: { iso: kcal } de los dias cerrados. `previo`: el de la formula.
 * Devuelve { gasto, deDatos (o null), dias, pesajes, confianza 0-1, kgSemana }.
 */
export function estimarGasto({ pesos, ingestas, hoyIso, previo }) {
  const desde = sumarDiasIso(hoyIso, -VENTANA_DIAS), hasta = sumarDiasIso(hoyIso, -1);
  const enVentana = (iso) => iso >= desde && iso <= hasta;
  const comidos = Object.keys(ingestas || {}).filter(k => enVentana(k) && ingestas[k] > 0);
  const pesados = Object.keys(pesos || {}).filter(k => enVentana(k) && Number.isFinite(pesos[k]));
  const ritmo = pendiente(pesados.map(iso => ({ x: aDia(iso), y: pesos[iso] })));
  const base = { gasto: previo, deDatos: null, dias: comidos.length, pesajes: pesados.length, confianza: 0,
                 kgSemana: ritmo == null ? null : Math.round(ritmo * 7 * 100) / 100 };
  // Hacen falta una semana de comidas y unos cuantos pesajes repartidos.
  if (comidos.length < 7 || pesados.length < 5 || ritmo == null) return base;
  const media = comidos.reduce((a, k) => a + ingestas[k], 0) / comidos.length;
  const deDatos = media - ritmo * KCAL_POR_KG;
  const confianza = Math.min(1, comidos.length / DIAS_PLENOS);
  return { ...base, gasto: Math.round(previo * (1 - confianza) + deDatos * confianza), deDatos: Math.round(deDatos), confianza };
}

/** Los macros de un dia con esas kcal: proteina fija, grasa fija, el hidrato rellena. */
export function macrosDe(kcal, tipo) {
  const grasa = GRASA_G[tipo];
  return { kcal: Math.round(kcal), prot: PROTEINA_G, hc: Math.max(0, Math.round((kcal - PROTEINA_G * 4 - grasa * 9) / 4)), grasa };
}

/**
 * Las calorias de la semana a partir del gasto.
 * `dias`: los 7 dias con su tipo ("comer" | "recortar"). `anterior`: la media
 * de la semana pasada (para no dar saltos), o null. `sinDeficit`: ultimas
 * semanas, a mantenimiento.
 * Devuelve { media, objetivos: { comer, recortar }, cambio }.
 */
export function programaSemanal({ gasto, dias, anterior = null, sinDeficit = false }) {
  let media = sinDeficit ? gasto : gasto - DEFICIT_KCAL;
  media = Math.max(media, gasto * (1 - TOPE.deficitMax), TOPE.minimo);
  if (anterior != null) media = Math.min(anterior + TOPE.cambioSemana, Math.max(anterior - TOPE.cambioSemana, media));
  media = Math.round(media / 10) * 10;
  // COMER y RECORTAR se separan 400 kcal y la media de la semana da `media`.
  const nRecortar = dias.filter(d => d === "recortar").length;
  const comer = media + DIFERENCIA_COMER_RECORTAR * nRecortar / 7;
  const recortar = comer - DIFERENCIA_COMER_RECORTAR;
  const redondea = (x) => Math.round(x / 10) * 10;
  return {
    media,
    objetivos: { comer: macrosDe(redondea(comer), "comer"), recortar: macrosDe(Math.max(TOPE.minimo, redondea(recortar)), "recortar") },
    cambio: anterior == null ? 0 : media - anterior,
  };
}

/**
 * Todo junto, para la semana que empieza el lunes `lunesIso`: el gasto con los
 * datos hasta el domingo, el de la semana anterior (para el tope de cambio) y
 * el programa. `tiposDe(lunesIso)` da los 7 tipos de dia de esa semana.
 */
export function programaDeLaSemana({ pesos, ingestas, lunesIso, tiposDe, sinDeficitDe = () => false, previo }) {
  const g = estimarGasto({ pesos, ingestas, hoyIso: lunesIso, previo });
  const lunesAntes = sumarDiasIso(lunesIso, -7);
  const gAntes = estimarGasto({ pesos, ingestas, hoyIso: lunesAntes, previo });
  const progAntes = gAntes.confianza > 0 ? programaSemanal({ gasto: gAntes.gasto, dias: tiposDe(lunesAntes), sinDeficit: sinDeficitDe(lunesAntes) }) : null;
  const prog = programaSemanal({ gasto: g.gasto, dias: tiposDe(lunesIso), anterior: progAntes ? progAntes.media : null, sinDeficit: sinDeficitDe(lunesIso) });
  return { ...prog, gasto: g, ajustado: g.confianza > 0 };
}
