import { diasDelCalendario } from "@/domain/plan/calendario";
import { HORAS_SESION, calendarioIcs } from "@/domain/plan/ics";
import { horasDeParam } from "@/domain/hoy/cita";

/**
 * /plan.ics?hora=17:00&desde=2026-09-24&carreras=1-17:30,3-17:30,6-10:00&extra=4
 *
 * extra: las semanas que movio el 5 km (de -1 a 8). El servidor no ve tus
 * datos, asi que la app se lo dice; sin el, salen las fechas originales.
 *
 * El plan como calendario. Se sirve desde el servidor y no como descarga de
 * la app porque asi el iPhone lo abre con su propio "Añadir todo", que es un
 * toque, en vez de guardarlo como un fichero que luego hay que buscar.
 */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const url = new URL(req.url);
  const hora = url.searchParams.get("hora") || "";
  const desde = url.searchParams.get("desde") || "";
  const n = Number(url.searchParams.get("extra"));
  const extra = Number.isInteger(n) && n >= -1 && n <= 8 ? n : 0;
  const ics = calendarioIcs(diasDelCalendario(extra), {
    original: extra ? diasDelCalendario(0) : null,
    hora: HORAS_SESION.includes(hora) ? hora : "17:00",
    desde: /^\d{4}-\d{2}-\d{2}$/.test(desde) ? desde : null,
    horasCarrera: horasDeParam(url.searchParams.get("carreras")),
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sistema-7k.ics"',
      "Cache-Control": "no-store",
    },
  });
}
