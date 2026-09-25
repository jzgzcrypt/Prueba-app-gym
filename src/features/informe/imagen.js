/**
 * La imagen para compartir el mes: 1080x1920, formato historia (Instagram,
 * WhatsApp). Se dibuja en un canvas, sin librerias.
 */

const FONDO = "#121212";
const TEXTO = "#FAFAF9";
const TENUE = "#9A9A96";
const ACENTOS = { running: "#E0694E", fuerza: "#5FB38A", tenis: "#4FB3AC", oro: "#E2BA4A" };

/** Las cifras que caben en la imagen, en orden, sin las que no existen. */
export function cifrasDeImagen(inf) {
  const out = [];
  out.push({ valor: inf.sesiones.hechas + "/" + inf.sesiones.total, etiqueta: "sesiones hechas", color: ACENTOS.fuerza });
  if (inf.minutosCorriendo) out.push({ valor: inf.minutosCorriendo + " min", etiqueta: "corriendo", color: ACENTOS.running });
  if (inf.series) out.push({ valor: String(inf.series), etiqueta: inf.kilos ? "series · " + inf.kilos.toLocaleString("es-ES") + " kg movidos" : "series de fuerza", color: ACENTOS.fuerza });
  if (inf.laterales && inf.laterales.despues !== inf.laterales.antes) out.push({ valor: inf.laterales.antes + " → " + inf.laterales.despues + " kg", etiqueta: "laterales", color: ACENTOS.oro });
  if (inf.cintura && inf.cintura.despues !== inf.cintura.antes) out.push({ valor: (inf.cintura.despues - inf.cintura.antes).toFixed(1).replace(".", ",") + " cm", etiqueta: "de cintura", color: ACENTOS.tenis });
  if (inf.records.length) out.push({ valor: String(inf.records.length), etiqueta: inf.records.length === 1 ? "récord nuevo" : "récords nuevos", color: ACENTOS.oro });
  return out.slice(0, 5);
}

/** Parte un texto en lineas que quepan en `ancho`. */
function lineas(ctx, texto, ancho) {
  const palabras = String(texto).split(" ");
  const out = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? actual + " " + p : p;
    if (ctx.measureText(prueba).width > ancho && actual) { out.push(actual); actual = p; }
    else actual = prueba;
  }
  if (actual) out.push(actual);
  return out;
}

/** Dibuja el mes y devuelve un Blob PNG. */
export function imagenDelMes(inf) {
  const W = 1080, H = 1920, M = 96;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const fuente = (peso, px) => peso + " " + px + "px -apple-system, 'Inter', 'Helvetica Neue', Arial, sans-serif";

  ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
  // Un brillo de color arriba: el mismo verde de la app, muy suave.
  const g = ctx.createRadialGradient(W * 0.85, 120, 40, W * 0.85, 120, 900);
  g.addColorStop(0, "rgba(95,179,138,0.35)"); g.addColorStop(1, "rgba(95,179,138,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = TENUE; ctx.font = fuente(800, 34);
  ctx.fillText("SISTEMA 7K · BASE 7K", M, 190);
  ctx.fillStyle = TEXTO; ctx.font = fuente(900, 124);
  ctx.fillText(inf.titulo, M, 330);
  ctx.fillStyle = TENUE; ctx.font = fuente(600, 42);
  ctx.fillText(inf.diasEntrenados + " días entrenando" + (inf.enCurso ? ", hasta hoy" : ""), M, 400);

  let y = 560;
  for (const x of cifrasDeImagen(inf)) {
    ctx.fillStyle = x.color; ctx.font = fuente(900, 118);
    ctx.fillText(x.valor, M, y);
    ctx.fillStyle = TEXTO; ctx.font = fuente(600, 40);
    ctx.fillText(x.etiqueta, M, y + 56);
    y += 230;
  }

  ctx.fillStyle = TEXTO; ctx.font = fuente(800, 46);
  let yf = Math.max(y + 20, H - 330);
  for (const l of lineas(ctx, inf.frase, W - 2 * M)) { ctx.fillText(l, M, yf); yf += 60; }

  ctx.fillStyle = TENUE; ctx.font = fuente(700, 34);
  ctx.fillText("Objetivo: 7 km a 4:45/km", M, H - 110);

  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

/** Comparte la imagen (menu del movil) o, si no se puede, la descarga. */
export async function compartirImagen(inf) {
  const blob = await imagenDelMes(inf);
  if (!blob) return;
  const nombre = "mi-" + inf.mes + ".png";
  try {
    const archivo = new File([blob], nombre, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: inf.titulo });
      return;
    }
  } catch { /* cancelado o sin Web Share: se descarga */ }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
