/**
 * EL PARTE DEL COACH
 *
 * Lo que mira un coach cuando revisa a su atleta, en este orden:
 *   1. ¿Esta haciendo el trabajo?   constancia (lo unico que depende de el)
 *   2. ¿Esta funcionando?           sus 4 objetivos: 7K, panza, hombro, cuello
 *   3. ¿Hay algo que tocar?         alarmas, cada una con su accion
 *   4. ¿Que viene?                  la proxima prueba y la proxima medicion
 * y encima, una frase que lo resume. Nunca culpa (regla 13 de EL-OBJETIVO).
 *
 * Puro: recibe los datos, devuelve lo que se pinta.
 */
import { seriesDe } from "../fuerza/registro.js";
import { fechaDeMedida } from "./informe.js";
import { diasParaMedir, textoTiempo } from "./libreta.js";
import { textoDiferencia, tuContraElPlan } from "./plan-vs-real.js";
import { semanasCumplidas } from "./resumen.js";

const SESION = ["run", "test", "objetivo", "fuerza", "compromiso"];
const CORRER = ["run", "test", "objetivo"];
const ZONAS = { cuello: "Cuello", hombro: "Hombro", rodilla: "Rodilla" };
const DIA_SEMANA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const dias7 = (hoyIso) => {
  const out = [];
  const [y, m, d] = hoyIso.split("-").map(Number);
  for (let i = 0; i < 7; i++) {
    const t = new Date(Date.UTC(y, m - 1, d - i));
    out.push(t.toISOString().slice(0, 10));
  }
  return out;
};
const sumarDias = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const distanciaDias = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
const coma = (n) => String(Math.round(n * 10) / 10).replace(".", ",");

/** 1. Constancia: la tira del bloque, semana a semana. */
export function constancia(semanas, checked, hoyIso) {
  const ch = checked || {};
  let hechas = 0, pasadas = 0;
  const tira = semanas.map(s => s.days.map(d => {
    const esSesion = SESION.includes(d.tipo);
    const futuro = d.isoDate > hoyIso;
    const hoy = d.isoDate === hoyIso;
    if (!esSesion) return futuro ? "futuro-descanso" : "descanso";
    if (ch[d.isoDate]) { hechas++; pasadas++; return "hecho"; }
    if (futuro) return "futuro";
    if (hoy) return "hoy";
    pasadas++;
    return "falta";
  }));
  return {
    tira, hechas, pasadas,
    pct: pasadas ? Math.round(hechas / pasadas * 100) : null,
    cumplidas: semanasCumplidas(semanas, ch, hoyIso),
  };
}

/** Maximo peso por sesion de cada ejercicio, en orden de fecha. */
function historialPesos(dias, pesos, reps, hoyIso) {
  const h = {};
  for (const d of dias) {
    if (!d.ejercicios || d.isoDate > hoyIso) continue;
    d.ejercicios.forEach((ej, idx) => {
      const ss = seriesDe(d.isoDate, idx, pesos, reps).filter(s => s.peso);
      if (!ss.length) return;
      (h[ej.nombre] = h[ej.nombre] || []).push({ iso: d.isoDate, v: Math.max(...ss.map(s => s.peso)) });
    });
  }
  return h;
}

/** 2. Los 4 objetivos. */
export function objetivos({ dias, ritmoReal, pesos, reps, medidas, cuelloChecks, hoyIso }) {
  const out = [];

  // 7K
  const pvr = tuContraElPlan(dias, ritmoReal || {});
  const prox = dias.find(d => d.prueba && d.prueba.distKm && d.prueba.distKm !== 7 && d.isoDate >= hoyIso && !(ritmoReal || {})[d.isoDate]);
  out.push(pvr.ultimo
    ? { id: "7k", nombre: "7K", valor: textoTiempo(pvr.ultimo.seg), tendencia: textoDiferencia(pvr.diferencia),
        flecha: pvr.diferencia <= 5 ? "▲" : "▼", tono: pvr.diferencia <= 5 ? "bien" : "ojo", seccion: "running" }
    : { id: "7k", nombre: "7K", valor: null, accion: prox ? "Primer dato: " + prox.prueba.distKm + " km, " + prox.date : "Sin pruebas aún", tono: "gris", seccion: "running" });

  // Panza: cintura
  const anio = Number(hoyIso.slice(0, 4));
  const cint = (medidas || []).map(m => ({ iso: fechaDeMedida(m, anio), v: m.cintura }))
    .filter(x => x.iso && x.v != null && x.iso <= hoyIso).sort((a, b) => a.iso < b.iso ? -1 : 1);
  if (cint.length >= 2) {
    const d = cint.at(-1).v - cint[0].v;
    const sem = Math.max(1, Math.round(distanciaDias(cint[0].iso, cint.at(-1).iso) / 7));
    out.push({ id: "panza", nombre: "Panza", valor: coma(cint.at(-1).v) + " cm",
      tendencia: (d === 0 ? "igual" : (d < 0 ? "−" : "+") + coma(Math.abs(d)) + " cm") + " en " + sem + (sem === 1 ? " semana" : " semanas"),
      flecha: d < 0 ? "▼" : d > 0 ? "▲" : "=", tono: d < 0 ? "bien" : "ojo", seccion: "cuerpo" });
  } else if (cint.length === 1) {
    out.push({ id: "panza", nombre: "Panza", valor: coma(cint[0].v) + " cm", tendencia: "punto de partida", flecha: "", tono: "gris", seccion: "cuerpo" });
  } else {
    out.push({ id: "panza", nombre: "Panza", valor: null, accion: "Mide la cintura", tono: "gris", seccion: "cuerpo" });
  }

  // Hombro: laterales
  const hist = historialPesos(dias, pesos, reps, hoyIso);
  const lat = Object.entries(hist).filter(([n]) => /laterales/i.test(n)).sort((a, b) => b[1].length - a[1].length)[0];
  if (lat) {
    const s = lat[1], d = s.at(-1).v - s[0].v;
    out.push({ id: "hombro", nombre: "Hombro", valor: coma(s.at(-1).v) + " kg",
      tendencia: s.length > 1 ? (d > 0 ? "+" + coma(d) + " kg" : d < 0 ? "−" + coma(-d) + " kg" : "igual") + " en laterales" : "laterales, primer registro",
      flecha: d > 0 ? "▲" : d < 0 ? "▼" : "=", tono: d > 0 ? "bien" : s.length > 1 ? "ojo" : "gris", seccion: "fuerza" });
  } else {
    out.push({ id: "hombro", nombre: "Hombro", valor: null, accion: "Apunta el peso de las laterales", tono: "gris", seccion: "fuerza" });
  }

  // Cuello: dias con protocolo en los ultimos 7
  const semana = dias7(hoyIso);
  const hechos = semana.filter(iso => ["m", "t", "n"].some(k => (cuelloChecks || {})[iso + "-" + k])).length;
  out.push({ id: "cuello", nombre: "Cuello", valor: hechos + "/7 días", tendencia: "últimos 7 días",
    flecha: "", tono: hechos >= 6 ? "bien" : hechos >= 4 ? "gris" : "ojo", seccion: null });

  return { lista: out, historial: hist, cintura: cint };
}

/** 3. Alarmas: solo lo que pide tocar algo, cada una con su accion. Max 3. */
export function alarmas({ semanas, checked, painLog, historial, cintura, hoyIso }) {
  const out = [];
  const ch = checked || {};

  // Jueves o domingo de esta semana, ya pasados y sin hacer.
  const actual = semanas.find(s => s.days[0].isoDate <= hoyIso && s.days[6].isoDate >= hoyIso);
  if (actual) {
    for (const d of actual.days) {
      if ((d.dayIdx === 3 || d.dayIdx === 6) && CORRER.includes(d.tipo) && d.isoDate < hoyIso && !ch[d.isoDate]) {
        out.push({ tipo: "clave", tema: "el " + DIA_SEMANA[d.dayIdx],
          texto: "Falta el " + DIA_SEMANA[d.dayIdx] + ": " + d.titulo.toLowerCase() + ".",
          accion: d.dayIdx === 3 ? "Pásalo al viernes o al sábado; nunca el día antes de la tirada." : "Si puedes, hoy o mañana suave. Si no, se pierde y se sigue." });
      }
    }
  }

  // Molestias >= 3 en los ultimos 7 dias.
  for (const iso of dias7(hoyIso)) {
    const p = (painLog || {})[iso];
    if (!p) continue;
    const [zona, nivel] = Object.entries(p).filter(([, v]) => v >= 3).sort((a, b) => b[1] - a[1])[0] || [];
    if (zona) {
      out.push({ tipo: "molestia", tema: ZONAS[zona] ? ZONAS[zona].toLowerCase() : zona,
        texto: (ZONAS[zona] || zona) + " " + nivel + "/5 el " + DIA_SEMANA[(new Date(iso + "T12:00:00Z").getUTCDay() + 6) % 7] + ".",
        accion: nivel >= 4 ? "Para lo que la carga y díselo a tu fisio." : "Si se repite, cambia el ejercicio que la carga." });
      break;
    }
  }

  // Ejercicio estancado: las 2 ultimas sesiones sin superar el maximo de antes.
  for (const [nombre, s] of Object.entries(historial || {})) {
    if (s.length < 3) continue;
    const antes = Math.max(...s.slice(0, -2).map(x => x.v));
    if (s.slice(-2).every(x => x.v <= antes) && distanciaDias(s.at(-3).iso, hoyIso) <= 28) {
      out.push({ tipo: "estancado", tema: nombre.split(" ").slice(0, 2).join(" ").toLowerCase(),
        texto: nombre + ": 2 sesiones sin subir de " + coma(antes) + " kg.",
        accion: "Baja un escalón, llega al tope de repeticiones y vuelve a subir." });
      break;
    }
  }

  // Cintura que no baja en 3 semanas.
  if (cintura && cintura.length >= 2) {
    const ultima = cintura.at(-1);
    const hace3 = [...cintura].reverse().find(x => distanciaDias(x.iso, ultima.iso) >= 21);
    if (hace3 && ultima.v >= hace3.v) {
      out.push({ tipo: "cintura", tema: "la cintura",
        texto: "La cintura no ha bajado en 3 semanas.",
        accion: "Baja 150 kcal de hidratos los días de RECORTAR." });
    }
  }

  return out.slice(0, 3);
}

/** 4. Lo que viene. */
export function proximo({ dias, ritmoReal, fechaInicio, hoyIso }) {
  const rr = ritmoReal || {};
  const prueba = dias.find(d => d.prueba && d.isoDate >= hoyIso && !rr[d.isoDate]);
  const faltan = diasParaMedir(fechaInicio, hoyIso);
  const med = sumarDias(hoyIso, faltan);
  const corta = (iso) => { const x = dias.find(d => d.isoDate === iso); return x ? x.date : iso.slice(8) + "/" + iso.slice(5, 7); };
  return {
    prueba: prueba ? { texto: prueba.prueba.partida ? "Prueba de partida" : prueba.tipo === "objetivo" ? "EL DÍA · 7 km" : prueba.prueba.distKm + " km a tope",
      cuando: prueba.isoDate === hoyIso ? "hoy" : DIA_SEMANA[prueba.dayIdx].slice(0, 3) + " " + prueba.date } : null,
    medicion: { cuando: faltan === 0 ? "hoy" : corta(med) },
  };
}

/** El veredicto: una frase, como la diria el coach. */
export function veredicto({ c, objs, alarmasLista, semanaN }) {
  const siete = objs.find(o => o.id === "7k");
  if (!c.hechas) return { texto: "Semana " + semanaN + ". Lo que hagas ahora es tu punto de partida.", tono: "neutro" };
  const clave = alarmasLista.find(a => a.tipo === "clave");
  if (clave) return { texto: "Esta semana falta " + clave.tema + ": es la sesión que más pesa.", tono: "ojo" };
  const bien = c.pct == null || c.pct >= 80;
  const otra = alarmasLista[0];
  if (bien && otra) return { texto: "Vas bien, pero vigila " + otra.tema + ".", tono: "ojo" };
  if (!bien) return { texto: "Te faltan sesiones. Jueves y domingo primero; lo demás, si puedes.", tono: "ojo" };
  const extra = siete && siete.valor && siete.tono === "bien" ? " y el 7K va " + siete.tendencia.replace(" del plan", "") + "." : ".";
  return { texto: "Vas bien. Cumples" + extra, tono: "bien" };
}

/** Todo el parte. */
export function parteDelCoach({ dias, semanas, checked, cuelloChecks, painLog, ritmoReal, pesos, reps, medidas, fechaInicio, hoyIso }) {
  const c = constancia(semanas, checked, hoyIso);
  const o = objetivos({ dias, ritmoReal, pesos, reps, medidas, cuelloChecks, hoyIso });
  const a = alarmas({ semanas, checked, painLog, historial: o.historial, cintura: o.cintura, hoyIso });
  const actual = semanas.find(s => s.days[0].isoDate <= hoyIso && s.days[6].isoDate >= hoyIso);
  return {
    veredicto: veredicto({ c, objs: o.lista, alarmasLista: a, semanaN: actual ? actual.n : 1 }),
    constancia: c,
    objetivos: o.lista,
    alarmas: a,
    proximo: proximo({ dias, ritmoReal, fechaInicio, hoyIso }),
  };
}
