"use client";

import { useEffect, useState } from "react";
import { C, CAT, TAP_MIN } from "@/design/tokens";
import { todayLocalIso } from "@/domain/plan/calendario";
import { HORAS_SESION } from "@/domain/plan/ics";

const CLAVE = "programa7k:calendario";
function leer() { try { return JSON.parse(window.localStorage.getItem(CLAVE) || "null"); } catch { return null; } }
function guardar(v) { try { window.localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* sin storage */ } }

/**
 * Meter el plan en el calendario del movil, con aviso antes de cada sesion.
 * Es la alarma contra el sofa: suena aunque la app este cerrada.
 * `modo`: "hoy" (tarjeta que se va cuando ya esta hecho) o "ajustes" (siempre).
 */
export function TarjetaCalendario({ modo = "hoy" }) {
  const [estado, setEstado] = useState(undefined);
  const [hora, setHora] = useState("17:00");
  useEffect(() => { const e = leer(); setEstado(e); if (e && e.hora) setHora(e.hora); }, []);
  if (estado === undefined) return null;
  if (modo === "hoy" && estado && (estado.anadido || estado.descartado)) return null;

  const href = "/plan.ics?hora=" + encodeURIComponent(hora) + "&desde=" + todayLocalIso();
  const anadir = () => { const v = { anadido: todayLocalIso(), hora }; guardar(v); setEstado(v); };
  const descartar = () => { const v = { descartado: true }; guardar(v); setEstado(v); };

  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + CAT.running,
                  borderRadius: modo === "hoy" ? 12 : 14, padding: "13px 14px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>Que el móvil te avise de cada sesión</div>
      <div style={{ fontSize: 12, color: C.textDim, marginTop: 3, lineHeight: 1.45 }}>
        El plan entero en tu calendario, con un aviso 30 min antes. Suena aunque la app esté cerrada. ¿A qué hora entrenas?
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {HORAS_SESION.map(h => (
          <button key={h} className="btn" onClick={() => setHora(h)} style={{
            flex: 1, minHeight: 40, borderRadius: 10, fontSize: 13, fontWeight: 800,
            background: hora === h ? C.accent : C.surfaceMuted, color: hora === h ? "#FAFAF9" : C.text,
          }}>{h}</button>
        ))}
      </div>
      <a href={href} target="_blank" rel="noopener" onClick={anadir} className="btn" style={{
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: TAP_MIN, marginTop: 8,
        borderRadius: 10, background: CAT.running, color: "#FAFAF9", fontSize: 13, fontWeight: 900, textDecoration: "none",
      }}>AÑADIR AL CALENDARIO</a>
      <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, lineHeight: 1.4 }}>
        En el iPhone se abre la lista de eventos: pulsa «Añadir todo». El tenis va a las 20:00 con su aviso.
        {estado && estado.anadido ? " Añadido el " + estado.anadido + "." : ""}
      </div>
      {modo === "hoy" && (
        <button className="btn" onClick={descartar} style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: C.textDim, minHeight: 32 }}>
          Ahora no
        </button>
      )}
    </div>
  );
}
