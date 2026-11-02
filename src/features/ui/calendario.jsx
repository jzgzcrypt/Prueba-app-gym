"use client";

import { useEffect, useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { IconoCaja, Segmentado } from "@/features/ui/aire";
import { FECHA_OBJETIVO_TXT, SEMANAS_MOVIDAS, todayLocalIso } from "@/domain/plan/calendario";
import { HORAS_SESION } from "@/domain/plan/ics";
import { DIAS_CARRERA, HORAS_POR_DEFECTO, horasAParam, limpiarHoras } from "@/domain/hoy/cita";

const CLAVE = "programa7k:calendario";
function leer() { try { return JSON.parse(window.localStorage.getItem(CLAVE) || "null"); } catch { return null; } }
function guardar(v) { try { window.localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* sin storage */ } }

/**
 * LAS CARRERAS SON CITAS: a que hora sales el martes, el jueves y el domingo.
 *
 * Las horas se guardan con tus datos (`horasCarrera`, entran en la copia) y
 * con ellas el plan va al calendario del movil: cada carrera a su hora con un
 * aviso 15 min antes, que suena aunque la app este cerrada. La fuerza va a la
 * hora general, con aviso 30 min antes.
 *
 * `modo`: "hoy" (sale arriba hasta que eliges las horas) o "ajustes" (siempre).
 */
export function TarjetaCalendario({ modo = "hoy", horasCarrera, setHorasCarrera }) {
  const [estado, setEstado] = useState(undefined);
  const [hora, setHora] = useState("17:00");
  const [horas, setHoras] = useState(() => limpiarHoras(horasCarrera) || HORAS_POR_DEFECTO);
  useEffect(() => { const e = leer(); setEstado(e); if (e && e.hora) setHora(e.hora); }, []);
  useEffect(() => { const h = limpiarHoras(horasCarrera); if (h) setHoras({ ...HORAS_POR_DEFECTO, ...h }); }, [horasCarrera]);
  if (estado === undefined) return null;
  // El 5 km movio la fecha despues de poner los avisos: hay que actualizarlos.
  const movida = !!(estado && estado.anadido && (estado.extra || 0) !== SEMANAS_MOVIDAS);
  if (modo === "hoy" && !movida && (limpiarHoras(horasCarrera) || (estado && estado.descartado))) return null;

  const href = "/plan.ics?hora=" + encodeURIComponent(hora) + "&desde=" + todayLocalIso() + "&carreras=" + encodeURIComponent(horasAParam(horas))
    + (SEMANAS_MOVIDAS ? "&extra=" + SEMANAS_MOVIDAS : "");
  const anadir = () => {
    const v = { anadido: todayLocalIso(), hora, extra: SEMANAS_MOVIDAS }; guardar(v); setEstado(v);
    if (setHorasCarrera) setHorasCarrera(limpiarHoras(horas));
  };
  const descartar = () => { const v = { descartado: true }; guardar(v); setEstado(v); };

  return (
    <div data-horas-carrera style={{ ...CARD, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <IconoCaja nombre="campana" tono="naranja" />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>{movida ? "Tu 7K se ha movido al " + FECHA_OBJETIVO_TXT : "Tus carreras, con hora fija"}</div>
      </div>
      <div style={{ fontSize: 13, color: C.textDim, marginTop: 8, lineHeight: 1.45 }}>
        {movida
          ? "Lo decidió tu 5 km. Actualiza los avisos para que el móvil siga las fechas nuevas: las horas ya están puestas."
          : "Como el tenis: lo que tiene hora sale. Elige a qué hora sales y el móvil te avisa 15 min antes, aunque la app esté cerrada."}
      </div>
      {DIAS_CARRERA.map(d => (
        <div key={d.idx} style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>{d.dow}</div>
          <Segmentado opciones={d.opciones.map(h => [h, h])} valor={horas[d.idx]} cambiar={(v) => setHoras(p => ({ ...p, [d.idx]: v }))} />
        </div>
      ))}
      {modo === "ajustes" && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Hombro (miércoles y viernes)</div>
          <Segmentado opciones={HORAS_SESION.map(h => [h, h])} valor={hora} cambiar={setHora} />
        </div>
      )}
      <a href={href} target="_blank" rel="noopener" onClick={anadir} className="btn" style={{
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, marginTop: 12,
        borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
      }}>{movida ? "Actualizar los avisos" : "Guardar y poner los avisos"}</a>
      <div style={{ fontSize: 12, color: C.textDim, marginTop: 8, lineHeight: 1.4 }}>
        En el iPhone se abre la lista de eventos: pulsa «Añadir todo». El tenis va a las 20:00 con su aviso.
        {movida ? " Si luego ves avisos repetidos, borra los de antes del calendario «Sistema 7K»." : estado && estado.anadido ? " Avisos puestos el " + estado.anadido + "." : ""}
      </div>
      {modo === "hoy" && !movida && (
        <button className="btn" onClick={descartar} style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: A.azul, minHeight: 36 }}>
          Ahora no
        </button>
      )}
    </div>
  );
}
