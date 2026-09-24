/**
 * EL PLAN EN EL CALENDARIO DEL MOVIL
 *
 * El problema no es el tiempo: es el sofa. Llega a casa a las 16:00 y el
 * movil se lo come. Una notificacion de la app necesitaria un servidor; el
 * calendario del movil ya sabe avisar, y avisa aunque la app este cerrada.
 * Asi que cada sesion del bloque va como un evento con su aviso.
 *
 *   Sesiones   a la hora elegida (por defecto 17:00), aviso 30 min antes.
 *   Tenis      20:00-21:30, aviso 45 min antes (hay que ir hasta la pista).
 *   Descanso   no se crea nada.
 *
 * Horas "flotantes" (sin zona horaria): el movil las pone en su hora local.
 * Cada evento lleva un UID fijo por fecha, para que importar otra vez
 * actualice en vez de duplicar donde el calendario lo respete.
 */

const SESION = ["run", "test", "objetivo", "fuerza"];
const AVISO_MIN = 30;
const AVISO_TENIS_MIN = 45;

const minutos = (d) => {
  const m = String(d.dur || "").match(/(\d+)/);
  return m ? Number(m[1]) : 45;
};

/** Escapa texto para iCalendar (RFC 5545). */
function esc(t) {
  return String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Parte las lineas de mas de 75 octetos, como pide el formato. */
function plegar(linea) {
  const bytes = new TextEncoder().encode(linea);
  if (bytes.length <= 75) return linea;
  const out = [];
  let actual = "", largo = 0;
  for (const ch of linea) {
    const n = new TextEncoder().encode(ch).length;
    if (largo + n > (out.length ? 74 : 75)) { out.push(actual); actual = ""; largo = 0; }
    actual += ch; largo += n;
  }
  out.push(actual);
  return out.join("\r\n ");
}

/** "2026-09-24", "17:00", +45 min -> "20260924T174500" */
function fechaHora(iso, hhmm, masMin = 0) {
  const [y, mo, d] = iso.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi + masMin));
  const p = (n) => String(n).padStart(2, "0");
  return t.getUTCFullYear() + p(t.getUTCMonth() + 1) + p(t.getUTCDate()) + "T" + p(t.getUTCHours()) + p(t.getUTCMinutes()) + "00";
}

/** Que evento lleva un dia, o null si no lleva ninguno. */
export function eventoDelDia(dia, hora) {
  if (dia.tipo === "compromiso") {
    const [ini] = String(dia.hora || "20:00").split(/\s*-\s*/);
    return { inicio: ini, min: 90, titulo: dia.titulo, aviso: AVISO_TENIS_MIN, nota: dia.notaPlan || dia.what };
  }
  if (!SESION.includes(dia.tipo)) return null;
  const titulo = dia.tipo === "objetivo" ? "EL DÍA · 7 km a 4:45" : dia.titulo;
  return { inicio: hora, min: minutos(dia), titulo, aviso: AVISO_MIN, nota: dia.what || (dia.ejercicios || []).map(e => e.nombre).join(", ") };
}

/**
 * El calendario del bloque en formato .ics.
 * @param {Array} dias   los dias del bloque, con fecha (FLAT_DAYS)
 * @param {{hora?:string, desde?:string|null}} opciones
 *        hora: hora de las sesiones ("17:00"); desde: fecha ISO, se omite lo anterior
 */
export function calendarioIcs(dias, { hora = "17:00", desde = null } = {}) {
  const lineas = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sistema 7K//Plan//ES", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:Sistema 7K",
  ];
  const sello = "20260101T000000Z";
  for (const d of dias) {
    if (desde && d.isoDate < desde) continue;
    const ev = eventoDelDia(d, hora);
    if (!ev) continue;
    lineas.push(
      "BEGIN:VEVENT",
      "UID:" + d.isoDate + "@sistema7k",
      "DTSTAMP:" + sello,
      "DTSTART:" + fechaHora(d.isoDate, ev.inicio),
      "DTEND:" + fechaHora(d.isoDate, ev.inicio, ev.min),
      "SUMMARY:" + esc("7K · " + ev.titulo),
      "DESCRIPTION:" + esc((ev.nota || "") + "\n\nÁbrela en la app y dale a empezar."),
      "BEGIN:VALARM", "ACTION:DISPLAY",
      "DESCRIPTION:" + esc("Hoy toca: " + ev.titulo),
      "TRIGGER:-PT" + ev.aviso + "M",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lineas.push("END:VCALENDAR");
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

/** Horas que se ofrecen para las sesiones. */
export const HORAS_SESION = ["17:00", "18:00", "19:00"];
