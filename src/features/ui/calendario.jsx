"use client";

import { useEffect, useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { IconoCaja, Segmentado } from "@/features/ui/aire";
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
    <div style={{ ...CARD, padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <IconoCaja nombre="campana" tono="naranja" />
        <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text }}>Que el móvil te avise de cada sesión</div>
      </div>
      <div style={{ fontSize: 13, color: C.textDim, marginTop: 8, lineHeight: 1.45 }}>
        El plan entero en tu calendario, con un aviso 30 min antes. Suena aunque la app esté cerrada. ¿A qué hora entrenas?
      </div>
      <Segmentado opciones={HORAS_SESION.map(h => [h, h])} valor={hora} cambiar={setHora} style={{ marginTop: 12 }} />
      <a href={href} target="_blank" rel="noopener" onClick={anadir} className="btn" style={{
        display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, marginTop: 10,
        borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
      }}>Añadir al calendario</a>
      <div style={{ fontSize: 12, color: C.textDim, marginTop: 8, lineHeight: 1.4 }}>
        En el iPhone se abre la lista de eventos: pulsa «Añadir todo». El tenis va a las 20:00 con su aviso.
        {estado && estado.anadido ? " Añadido el " + estado.anadido + "." : ""}
      </div>
      {modo === "hoy" && (
        <button className="btn" onClick={descartar} style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: A.azul, minHeight: 36 }}>
          Ahora no
        </button>
      )}
    </div>
  );
}
