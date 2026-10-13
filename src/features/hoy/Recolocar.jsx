"use client";

import { useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { FLAT_DAYS, todayLocalIso } from "@/domain/plan/calendario";
import { dejarPasar, diaHablado, nombreDe, proponerHueco, recolocar } from "@/domain/plan/reprogramar";
import { Boton, Icono } from "@/features/ui/aire";

/**
 * Una sesion clave saltada (o que no vas a poder hacer hoy): la app propone
 * el mejor hueco con su motivo, y tu dices Vale, eliges otra o la dejas pasar.
 * `ayer`: la tarjeta sale sola en HOY porque ayer falto. Si no, es "¿No
 * puedes hoy?" desde la sesion del dia.
 */
export function Recolocar({ dia, movidas, setMovidas, checked, ayer = false }) {
  const [abierta, setAbierta] = useState(ayer);
  const [otras, setOtras] = useState(false);
  const hoyIso = todayLocalIso();
  const p = proponerHueco({ dia, dias: FLAT_DAYS, movidas, checked, hoyIso });
  const aplicar = (o) => setMovidas(recolocar(movidas, dia.isoDate, o.dia.isoDate, o.cede));
  const quien = nombreDe(dia);

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
        {ayer ? "Ayer faltó " + quien : "Si hoy no puedes con " + quien}
      </div>
      <div data-motivo style={{ fontSize: 14.5, color: C.text, lineHeight: 1.45, marginTop: 6 }}>{p.motivo}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
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
          style={{ fontSize: 14, fontWeight: 600, color: C.textDim, minHeight: 34 }}>Dejarla pasar</button>
        {!ayer && <button className="btn" onClick={() => setAbierta(false)} style={{ fontSize: 13, color: C.textFaint, minHeight: 30 }}>Cancelar</button>}
      </div>
    </div>
  );
}
