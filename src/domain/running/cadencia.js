/**
 * MEDIR LA CADENCIA CON EL MOVIL.
 *
 * Con el movil en la mano o en el brazo, cada pisada es un golpe de
 * aceleracion. Se toma la magnitud de la aceleracion (con gravedad, que es lo
 * que dan todos los moviles), se le quita la media movil de ~1 s (asi da igual
 * como lo lleves) y se cuentan los picos, con al menos 0,25 s entre uno y otro
 * (240 pasos/min es mas de lo que se corre). Si los pasos no salen regulares
 * no se da por buena: mejor contar a mano que un numero inventado.
 *
 * Puro: sin React, se prueba sin navegador.
 */

export const CADENCIA_MIN = 170;
export const CADENCIA_MAX = 180;
const SEPARACION_MIN_MS = 250;

/**
 * Pasos en una serie de muestras [{ t (ms), a (m/s², magnitud) }].
 * @returns {{ pasos:number, spm:number|null, fiable:boolean }}
 */
export function contarPasos(muestras) {
  const ms = (muestras || []).filter(x => x && Number.isFinite(x.t) && Number.isFinite(x.a));
  if (ms.length < 20) return { pasos: 0, spm: null, fiable: false };
  const dur = (ms[ms.length - 1].t - ms[0].t) / 1000;
  if (dur < 5) return { pasos: 0, spm: null, fiable: false };
  // Quitar la media movil de 1 s: queda solo el golpe de cada pisada.
  const det = [];
  let j0 = 0, suma = 0;
  for (let i = 0; i < ms.length; i++) {
    suma += ms[i].a;
    while (ms[i].t - ms[j0].t > 1000) { suma -= ms[j0].a; j0++; }
    det.push(ms[i].a - suma / (i - j0 + 1));
  }
  const desv = Math.sqrt(det.reduce((s, v) => s + v * v, 0) / det.length);
  if (desv < 0.4) return { pasos: 0, spm: null, fiable: false }; // quieto o casi
  const umbral = desv * 0.6;
  const picos = [];
  for (let i = 1; i < det.length - 1; i++) {
    if (det[i] < umbral || det[i] < det[i - 1] || det[i] < det[i + 1]) continue;
    const ult = picos[picos.length - 1];
    if (ult != null && ms[i].t - ms[ult].t < SEPARACION_MIN_MS) {
      if (det[i] > det[ult]) picos[picos.length - 1] = i; // el mas alto del golpe
      continue;
    }
    picos.push(i);
  }
  const pasos = picos.length;
  const spm = Math.round(pasos / dur * 60);
  // Regularidad: los intervalos entre pisadas no pueden bailar mucho.
  const ints = picos.slice(1).map((p, k) => ms[p].t - ms[picos[k]].t);
  const media = ints.reduce((s, v) => s + v, 0) / (ints.length || 1);
  const cv = ints.length ? Math.sqrt(ints.reduce((s, v) => s + (v - media) ** 2, 0) / ints.length) / media : 1;
  const fiable = pasos >= 10 && spm >= 120 && spm <= 230 && cv < 0.3;
  return { pasos, spm, fiable };
}

/** Pasos de un pie en 15 s → pasos por minuto. */
export const spmManual = (pasosUnPie15s) => Math.round(Number(pasosUnPie15s) * 8);

/** Lo que se dice de una cadencia: { tono, texto }. */
export function veredictoCadencia(spm) {
  if (!spm) return null;
  if (spm < 160) return { tono: "ojo", texto: "Cadencia " + spm + ": baja. Pasos más cortos y más rápidos, sin correr más." };
  if (spm < CADENCIA_MIN) return { tono: "ojo", texto: "Cadencia " + spm + ": un poco baja. Acorta un poco la zancada." };
  if (spm <= CADENCIA_MAX + 5) return { tono: "bien", texto: "Cadencia " + spm + ": perfecta." };
  return { tono: "bien", texto: "Cadencia " + spm + ": alta. No hace falta tanto, puedes soltar." };
}
