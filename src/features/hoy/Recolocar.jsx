"use client";

import { useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { FLAT_DAYS, todayLocalIso } from "@/domain/plan/calendario";
import { claseDe, dejarPasar, diaHablado, esClave, nombreDe, proponerHueco, recolocar } from "@/domain/plan/reprogramar";
import { Boton, Icono } from "@/features/ui/aire";

/**
 * Una sesion clave saltada (o que no vas a poder hacer hoy): la app propone
 * el mejor hueco con su motivo, y tu dices Vale, eliges otra o la dejas pasar.
 * `ayer`: la tarjeta sale sola en HOY porque ayer falto. Si no, es "¿No
 * puedes hoy?" desde la sesion del dia. Un suave no se recoloca: de ayer se
 * pregunta si lo hiciste (`onHecha`); de hoy, se deja pasar o se mueve con lo
 * que llegue en `children`. `onCerrar`: abierta desde "Ahora toca".
 */
export function Recolocar({ dia, movidas, setMovidas, checked, ayer = false, abiertaInicial = false, dias = FLAT_DAYS, titulo, onCerrar, onHecha, children }) {
  const [abierta, setAbiertaEstado] = useState(ayer || abiertaInicial);
  const setAbierta = (v) => { setAbiertaEstado(v); if (!v && onCerrar) onCerrar(); };
  const clave = esClave(dia);
  const [otras, setOtras] = useState(false);
  const hoyIso = todayLocalIso();
  const p = proponerHueco({ dia, dias, movidas, checked, hoyIso });
  const aplicar = (o) => setMovidas(recolocar(movidas, dia.isoDate, o.dia.isoDate, o.cede));
  const quien = nombreDe(dia);
  const clase = claseDe(dia);
  const motivo = clase === "tenis" ? (onHecha ? "Si no, se deja pasar. Sin drama." : "El tenis no se recoloca: se deja pasar y sigues.")
    : !onHecha ? p.motivo
    : clase === "suave" ? "Si no, se deja pasar: un suave no se recupera."
    : "Si no: " + p.motivo.charAt(0).toLowerCase() + p.motivo.slice(1);

  if (!abierta) {
    return (
      <button className="btn" data-no-puedo onClick={() => setAbierta(true)} style={{ padding: "6px 4px", fontSize: 13, fontWeight: 600, color: A.azul }}>
        ¿No puedes hoy? Recolócala ›
      </button>
    );
  }
  return (
    <div data-recolocar style={{ ...CARD, padding: "14px 16px", background: A.fondo.naranja, boxShadow: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: C.text }}>
        <span style={{ color: A.naranja, display: "flex" }}><Icono nombre="calendario" tam={18} /></span>
        {titulo || (clase === "tenis" ? (ayer ? "¿Ayer fuiste al tenis?" : "Si hoy no vas al tenis")
          : ayer ? (clave ? "Ayer faltó " + quien : "¿Ayer hiciste " + quien + "?") : "Si hoy no puedes con " + quien)}
      </div>
      <div data-motivo style={{ fontSize: 14.5, color: C.text, lineHeight: 1.45, marginTop: 6 }}>{motivo}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
        {onHecha && (
          <Boton tipo="color" color={A.verde} data-la-hice onClick={onHecha} style={{ minHeight: 44, fontSize: 15 }}>Sí, la hice</Boton>
        )}
        {p.mejor && (
          <Boton tipo="color" color={A.naranja} data-vale onClick={() => aplicar(p.mejor)} style={{ minHeight: 44, fontSize: 15 }}>
            Vale: {diaHablado(p.mejor.dia)}
          </Boton>
        )}
        {p.opciones.length > 1 && (
          <button className="btn" onClick={() => setOtras(!otras)} style={{ fontSize: 14, fontWeight: 600, color: A.azul, minHeight: 34 }}>
            {otras ? "Ocultar otras opciones" : "Otras opciones (" + (p.opciones.length - 1) + ")"}
          </button>
        )}
        {otras && p.opciones.slice(1).map(o => (
          <button key={o.dia.isoDate} className="btn" data-opcion onClick={() => aplicar(o)}
            style={{ textAlign: "left", padding: "10px 12px", background: "#fff", borderRadius: 12, fontSize: 14, color: C.text }}>{o.texto}</button>
        ))}
        <button className="btn" data-dejar onClick={() => setMovidas(dejarPasar(movidas, dia.isoDate))}
          style={{ fontSize: 14, fontWeight: 600, color: C.textDim, minHeight: 34 }}>{onHecha ? "No, dejarla pasar" : "Dejarla pasar"}</button>
        {children}
        {!ayer && <button className="btn" onClick={() => setAbierta(false)} style={{ fontSize: 13, color: C.textFaint, minHeight: 30 }}>Cancelar</button>}
      </div>
    </div>
  );
}
