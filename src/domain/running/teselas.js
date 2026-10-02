/**
 * REPINTAR LAS TESELAS DE OSM CON OTRA PALETA, RESPETANDO QUE ES CADA COSA.
 *
 * Un filtro CSS (gris, sepia) tiñe todo igual: los parques dejan de ser
 * verdes y el agua azul. Pero las teselas de OpenStreetMap usan una paleta
 * fija, asi que por el color de cada pixel se sabe que es (parque, agua,
 * edificio, calle, carretera, letras o fondo) y se cambia al color de ese
 * tipo en la paleta del estilo. La diferencia de luz con el color de OSM de
 * referencia se conserva: bordes, contornos y letras siguen suaves.
 */

export const PALETAS = {
  niebla: { fondo: "#EEEFF1", edificio: "#E2E4E8", calle: "#FFFFFF", carretera: "#FFFFFF",
            parque: "#D9E8D6", agua: "#D3E2EE", texto: "#8A9099" },
  arena: { fondo: "#F5F1EA", edificio: "#E9E3D8", calle: "#FFFFFF", carretera: "#FFF8EC",
           parque: "#D6E9C9", agua: "#CFE4EE", texto: "#8C8378" },
};

/** Luz de referencia (0-1) de cada tipo en las teselas de OSM. */
const LUZ_OSM = { parque: 0.86, agua: 0.77, edificio: 0.82, calle: 1, carretera: 0.86, fondo: 0.93 };
/** Cuanto de la diferencia de luz se conserva (menos de 1: mas suave que OSM). En
 *  los verdes, poco: bosque y cesped casi iguales, sin manchas oscuras. */
const CONTRASTE = { parque: 0.3, otro: 0.6 };

/** Tono (0-360), saturacion y luz (0-1) de un color RGB 0-255. */
export function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s, l };
}

/** Que es un pixel de una tesela de OSM. */
export function tipoDePixel(r, g, b) {
  const { h, s, l } = hsl(r, g, b);
  if (l < 0.55) return "texto";
  if (s > 0.18 && h >= 70 && h <= 170) return "parque";       // parques, cesped, bosque, campos
  if (s > 0.18 && h > 170 && h <= 235) return "agua";          // rios, fuentes, piscinas
  if (l >= 0.985) return "calle";                              // calles blancas
  if (s > 0.45 && h >= 25 && h <= 65 && l > 0.7) return "carretera"; // amarillas y naranjas
  if (s < 0.3 && h >= 10 && h <= 50 && s > 0.08 && l >= 0.68 && l <= 0.86) return "edificio"; // beige de edificios
  return "fondo";
}

const aRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/**
 * Repinta en el sitio un bufer RGBA (el de un canvas) con la paleta. El alfa
 * no se toca. Devuelve el mismo bufer.
 */
export function recolorear(datos, paleta) {
  const colores = {};
  for (const k of Object.keys(paleta)) colores[k] = aRgb(paleta[k]);
  const textoRgb = colores.texto, fondoRgb = colores.fondo;
  for (let i = 0; i < datos.length; i += 4) {
    const r = datos[i], g = datos[i + 1], b = datos[i + 2];
    const tipo = tipoDePixel(r, g, b);
    let out;
    if (tipo === "texto") {
      // Letras y lineas oscuras: del color de texto (si es muy oscuro) al fondo.
      const l = hsl(r, g, b).l / 0.55;
      out = textoRgb.map((v, k) => v + (fondoRgb[k] - v) * l * 0.5);
    } else {
      const delta = (hsl(r, g, b).l - LUZ_OSM[tipo]) * 255 * (CONTRASTE[tipo] ?? CONTRASTE.otro);
      out = colores[tipo].map(v => v + delta);
    }
    datos[i] = out[0]; datos[i + 1] = out[1]; datos[i + 2] = out[2];
  }
  return datos;
}
