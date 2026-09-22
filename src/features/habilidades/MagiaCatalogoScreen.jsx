"use client";

/**
 * TODOS LOS TRUCOS, Y CUÁNDO VUELVEN.
 *
 * La vista de conjunto del repaso espaciado: en qué estás, qué tienes en la
 * cola con su fecha de vuelta, y qué queda por ver. Ya no hay trucos
 * "bloqueados por semana" — se avanza dominando, así que lo que queda es
 * simplemente lo que queda.
 */

import { useState } from "react";
import { C, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { MAGIA_TRUCOS, magiaDeHoy, progresoMagia } from "@/domain/habilidades/magia";
import { ESCALERA, ESCALON_ASENTADO, faltanDias } from "@/domain/habilidades/repaso";
import { todayLocalIso } from "@/domain/plan/calendario";
import { SectionHeader } from "@/features/ui/headers";

const MORADO = "#6B4C8A";

const cuandoVuelve = (dias) =>
  dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en " + dias + " días";

export function MagiaCatalogoScreen({ onBack, magiaRepaso, dominarTruco, responderRepaso }) {
  const [selectedId, setSelectedId] = useState(null);
  const hoy = todayLocalIso();
  const { actual, repasos } = magiaDeHoy(magiaRepaso, hoy);
  const progreso = progresoMagia(magiaRepaso);
  const estados = magiaRepaso || {};

  const estadoDe = (t) => {
    const e = estados[t.id];
    if (actual && t.id === actual.id) return { etiqueta: "AHORA", color: MORADO, fondo: MORADO + "16" };
    if (!e || e.reaprender) return { etiqueta: "POR VER", color: "#8A8A87", fondo: "#F2F2F0" };
    if (repasos.some(r => r.id === t.id)) return { etiqueta: "REPASO HOY", color: "#946800", fondo: "#FBF3E0" };
    if (e.escalon >= ESCALON_ASENTADO) return { etiqueta: "ASENTADO", color: "#2F7D4F", fondo: "#EAF7EE" };
    return { etiqueta: "EN REPASO", color: "#2F7D4F", fondo: "#EAF7EE" };
  };

  // ─── Un truco abierto ────────────────────────────────────────────────────
  if (selectedId) {
    const truco = MAGIA_TRUCOS.find(t => t.id === selectedId);
    const e = estados[truco.id];
    const est = estadoDe(truco);
    const esActual = actual && actual.id === truco.id;
    const tocaRepaso = repasos.some(r => r.id === truco.id);

    return (
      <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
        <button className="btn" onClick={() => setSelectedId(null)} style={{ fontSize: 13, color: MORADO, fontWeight: 700, marginBottom: SP.lg, minHeight: 36, padding: "6px 0" }}>&lsaquo; TODOS LOS TRUCOS</button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim }}>{truco.dificultad.toUpperCase()}</span>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: est.color, background: est.fondo, padding: "2px 6px", borderRadius: R.sm }}>{est.etiqueta}</span>
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.text, marginTop: 4, marginBottom: 6, letterSpacing: -0.3 }}>{truco.nombre}</div>
        {e && !e.reaprender && !tocaRepaso && (
          <div className="mono" style={{ fontSize: 12, color: MORADO, marginBottom: SP.md }}>
            Vuelve {cuandoVuelve(faltanDias(e, hoy))} · escalón {e.escalon + 1} de {ESCALERA.length}
          </div>
        )}
        <div style={{ fontSize: 13.5, color: "#4A4A47", lineHeight: 1.55, marginBottom: SP.lg }}>{truco.descripcion}</div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: "#787774", marginBottom: 5 }}>QUÉ NECESITAS</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.necesitas}</div>
        </div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <SectionHeader>MÉTODO</SectionHeader>
          {truco.metodo.map((paso, i) => (
            <div key={i} style={{ display: "flex", gap: SP.sm + 2, marginBottom: SP.sm }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: MORADO, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 13.5, color: "#3A3A38", lineHeight: 1.55 }}>{paso}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: "1px solid #E2D5EC", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.sm + 2 }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: "#787774", marginBottom: 5 }}>CÓMO PRESENTARLO</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.presentacion}</div>
        </div>

        <div style={{ background: MORADO + "10", border: "1px solid " + MORADO + "30", borderRadius: R.xl, padding: SP.md + "px " + SP.lg + "px", marginBottom: SP.lg }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: MORADO, marginBottom: 5 }}>CUÁNDO LO DOMINAS</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.5 }}>{truco.dominio}</div>
        </div>

        {esActual && (
          <button className="block" onClick={() => { dominarTruco(truco.id); setSelectedId(null); }} style={{
            width: "100%", padding: "14px 6px", borderRadius: R.lg, textAlign: "center", background: MORADO, border: "none",
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#FAFAF9" }}>YA LO DOMINO — AL SIGUIENTE</div>
            <div style={{ fontSize: 10, color: "#FFFFFFAA", marginTop: 2 }}>Volverá dentro de {ESCALERA[0]} días</div>
          </button>
        )}

        {tocaRepaso && (
          <div style={{ display: "flex", gap: 6 }}>
            {[["bien", "Sale", "#2F7D4F"], ["regular", "A medias", "#946800"], ["mal", "No sale", "#B8462F"]].map(([r, etiqueta, color]) => (
              <button key={r} className="block" onClick={() => { responderRepaso(truco.id, r); setSelectedId(null); }} style={{
                flex: 1, padding: "12px 4px", borderRadius: R.lg, textAlign: "center", minHeight: TAP_MIN,
                background: C.card, border: "1px solid " + color + "44", fontSize: 12, fontWeight: 800, color,
              }}>{etiqueta}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── La lista ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: SP.xl + "px 0" }}>
      <div style={{ padding: "0 " + SP.lg + "px" }}>
        <button className="btn" onClick={onBack} style={{ fontSize: 13, color: MORADO, fontWeight: 700, marginBottom: SP.md, minHeight: 36, padding: "6px 0" }}>&lsaquo; VOLVER A HOY</button>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>Magia</div>
        <div style={{ ...TYPE.body, color: C.textDim, marginTop: 6, lineHeight: 1.5 }}>
          Le das caña a uno. Cuando lo dominas pasa a la cola y el siguiente ocupa su sitio;
          el dominado vuelve cada cierto tiempo para que no se caiga, y cada vez tarda más.
        </div>
        <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: MORADO, marginTop: SP.md }}>
          {progreso.dominados} de {progreso.total} dominados
          {progreso.asentados > 0 && " · " + progreso.asentados + " asentados"}
        </div>
      </div>

      <SectionHeader>Todos los trucos</SectionHeader>
      <div style={{ padding: "0 " + SP.lg + "px", display: "flex", flexDirection: "column", gap: 6 }}>
        {MAGIA_TRUCOS.map(t => {
          const est = estadoDe(t);
          const e = estados[t.id];
          const enCola = e && !e.reaprender && !repasos.some(r => r.id === t.id);
          return (
            <button key={t.id} className="btn" onClick={() => setSelectedId(t.id)} style={{
              width: "100%", textAlign: "left", padding: "12px 14px", minHeight: TAP_MIN,
              background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl,
              borderLeft: "3px solid " + (est.etiqueta === "POR VER" ? C.cardBorder : est.color),
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
                <span style={{ ...TYPE.cardTitle, color: C.text, flex: 1, minWidth: 0 }}>{t.nombre}</span>
                <span style={{ fontSize: 8.5, fontWeight: 800, color: est.color, background: est.fondo,
                               padding: "2px 6px", borderRadius: R.sm, flexShrink: 0 }}>{est.etiqueta}</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 3 }}>
                {t.dificultad}
                {enCola && " · vuelve " + cuandoVuelve(faltanDias(e, hoy))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
