import { FLAT_DAYS } from "@/domain/plan/calendario";
import { HORAS_SESION, calendarioIcs } from "@/domain/plan/ics";

/**
 * /plan.ics?hora=17:00&desde=2026-09-24
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
  const ics = calendarioIcs(FLAT_DAYS, {
    hora: HORAS_SESION.includes(hora) ? hora : "17:00",
    desde: /^\d{4}-\d{2}-\d{2}$/.test(desde) ? desde : null,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sistema-7k.ics"',
      "Cache-Control": "no-store",
    },
  });
}
