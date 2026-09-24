"use client";

import { C } from "@/design/tokens";
import { FLAT_DAYS, claveDia } from "@/domain/plan/calendario";
import { lecturaPrueba, lecturaRitmo, leerRitmo, textoTiempo } from "@/domain/progreso/libreta";
import { ritmoDelDia } from "@/domain/running/adaptar";

/** Las sesiones de series ya apuntadas, para comparar la de hoy con la anterior. */
export function seriesAnteriores(ritmoReal) {
  return FLAT_DAYS
    .filter(d => d.ritmo && ritmoReal[claveDia(d)])
    .map(d => ({ isoDate: d.isoDate, ritmo: leerRitmo(ritmoReal[claveDia(d)]) }))
    .filter(a => a.ritmo);
}

/** Lo que dice el dato apuntado de una sesion de running: el tiempo de una
 *  prueba contra el objetivo, o el ritmo de unas series contra lo pedido y
 *  contra la vez anterior. Si el dia no tiene nada que comparar, no pinta nada. */
export function LecturaSesion({ day, texto, ritmoReal }) {
  // Las series se comparan con el ritmo que tocaba hoy, que puede estar
  // ajustado a la ultima prueba, no con el del plan.
  const aj = day.prueba ? null : ritmoDelDia(day, FLAT_DAYS, ritmoReal);
  const dia = aj ? { ...day, ritmo: aj.ritmo } : day;
  const l = day.prueba ? lecturaPrueba(day.prueba, texto) : lecturaRitmo(dia, texto, seriesAnteriores(ritmoReal));
  if (!l) return null;
  if (l.error) {
    return <div style={{ fontSize: 12, color: C.amber, marginTop: 8, fontWeight: 600 }}>{l.error}</div>;
  }
  const color = l.tono === "bien" ? C.ok : l.tono === "ajuste" ? C.amber : C.text;
  return (
    <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: 10, background: C.surfaceMuted,
                  borderLeft: "3px solid " + color }}>
      <div style={{ fontSize: 14, fontWeight: 800, color }}>{l.titular}</div>
      <div style={{ fontSize: 12.5, color: "#4A4A47", marginTop: 3, lineHeight: 1.45 }}>{l.detalle}</div>
    </div>
  );
}

/** Que se pide apuntar en un dia de running: una prueba se apunta en tiempo
 *  total, lo demas en ritmo. */
export function queApuntar(day) {
  if (day.prueba && day.prueba.partida) return { label: "CUÁNTO AGUANTASTE SEGUIDO Y A QUÉ RITMO", ph: "Ej: 18 min a 6:40/km" };
  if (day.prueba && day.prueba.distKm) return { label: "TIEMPO DE LOS " + day.prueba.distKm + " KM", ph: day.prueba.distKm === 3 ? "Ej: 14:20" : day.prueba.distKm === 5 ? "Ej: 23:40" : "Ej: 33:10" };
  if (day.ritmo) return { label: "RITMO MEDIO DE LAS SERIES", ph: "Ej: 4:47/km" };
  return { label: "RITMO REAL", ph: "Ej: 6:20/km" };
}

/** Si las series de hoy van a un ritmo ajustado a la ultima prueba, se dice
 *  antes de salir: correr a 4:45 cuando te toca 5:05 es reventar en la segunda. */
export function AvisoRitmo({ day, ritmoReal }) {
  const aj = ritmoDelDia(day, FLAT_DAYS, ritmoReal);
  if (!aj || !aj.ajustado) return null;
  return (
    <div style={{ padding: "11px 13px", borderRadius: 10, background: "#FDF6E3", border: "1px solid #E8D9A8", marginBottom: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>Hoy, las series a {textoTiempo(aj.ritmo)}/km</div>
      <div style={{ fontSize: 12, color: "#4A4A47", marginTop: 2, lineHeight: 1.4 }}>
        Ajustado a tu prueba de {aj.fuente.distKm} km ({textoTiempo(aj.fuente.total)}). El plan pide {textoTiempo(aj.plan)}: se llega prueba a prueba.
      </div>
    </div>
  );
}
