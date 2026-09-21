"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ICON_NUTRICION } from "@/domain/assets/icons";
import { CHEAT_MEAL, EQUIVALENCIAS, MENUS, NEAT, TIPS_NUTRICION } from "@/domain/nutricion/menus";
import { ScreenHeader, SectionHeader } from "@/features/ui/headers";
import { DiaDeComida } from "@/features/nutricion/DiaDeComida";

export function NutricionScreen({ comida, apuntes = [], cambios, apuntarComida, apuntarVarias,
                                  deshacerComida, cambiarAlimento, esHoy }) {
  const [menuAbierto, setMenuAbierto] = useState(MENUS[0].id);
  const [diaAbierto, setDiaAbierto] = useState("entreno");
  const [verTips, setVerTips] = useState(false);

  const menu = MENUS.find(m => m.id === menuAbierto) || MENUS[0];
  const dia = menu.dias.find(d => d.tipo === diaAbierto) || menu.dias[0];
  const hoyEsComer = comida ? comida.id === "comer" : null;

  return (
    <div>
      <ScreenHeader icon={ICON_NUTRICION} title="NUTRICIÓN" />

      {/* ═══ HOY — lo único que se toca a diario: apuntar y que la cena cuadre ═══ */}
      {comida && apuntarComida && (
        <DiaDeComida comida={comida} apuntes={apuntes} cambios={cambios}
                     apuntarComida={apuntarComida} apuntarVarias={apuntarVarias}
                     deshacerComida={deshacerComida} cambiarAlimento={cambiarAlimento} esHoy={esHoy} />
      )}

      {/* ═══ LOS MENÚS REALES ═══ */}
      <SectionHeader>Tus menús</SectionHeader>
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ ...TYPE.body, color: C.textDim, marginBottom: SP.md, lineHeight: 1.5 }}>
          Los programas que ya seguiste. Están como referencia, no como prescripción: los escribió un dietista para
          el cuerpo que tenías entonces. <strong style={{ color: C.text }}>Ya separaban día de entreno y día de
          descanso</strong> — la regla de este bloque no es nueva, es tuya, y funcionó.
        </div>

        <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.md }}>
          {MENUS.map(m => (
            <button key={m.id} className="btn" onClick={() => setMenuAbierto(m.id)} style={{
              flex: 1, padding: "9px 10px", borderRadius: R.md, minHeight: TAP_MIN - 8,
              background: m.id === menuAbierto ? C.accent : C.card,
              border: "1px solid " + (m.id === menuAbierto ? C.accent : C.cardBorder),
              color: m.id === menuAbierto ? "#FAFAF9" : C.textDim,
              fontSize: 12, fontWeight: 700,
            }}>{m.fecha.replace(" de 2022", " 2022").replace("de ", "")}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.md }}>
          {menu.dias.map(d => {
            const activo = d.tipo === diaAbierto;
            const esElDeHoy = hoyEsComer !== null &&
              ((hoyEsComer && d.tipo === "entreno") || (!hoyEsComer && d.tipo === "descanso"));
            return (
              <button key={d.tipo} className="btn" onClick={() => setDiaAbierto(d.tipo)} style={{
                flex: 1, padding: "9px 10px", borderRadius: R.md, minHeight: TAP_MIN - 8,
                background: activo ? C.surfaceMuted : "transparent",
                border: "1px solid " + (activo ? C.cardBorder : "transparent"),
                color: activo ? C.text : C.textFaint, fontSize: 11.5, fontWeight: 700,
              }}>
                {d.tipo === "entreno" ? "Entreno" : "Descanso"}{esElDeHoy && " ·  hoy"}
              </button>
            );
          })}
        </div>

        <div style={{ background: C.card, border: "1px solid " + C.cardBorder,
                      borderLeft: "3px solid " + CAT.nutricion, borderRadius: R.xl, padding: "15px 17px" }}>
          <div style={{ ...TYPE.micro, color: C.textDim }}>{dia.etiqueta}</div>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: C.text, marginTop: 5, letterSpacing: -0.4 }}>
            {dia.kcal} kcal
          </div>
          <div className="mono" style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
            {dia.hc} g HC · {dia.prot} g proteína · {dia.grasa} g grasa
          </div>

          <div style={{ marginTop: SP.md, display: "flex", flexDirection: "column", gap: SP.md }}>
            {dia.comidas.map((c, i) => (
              <div key={i} style={{ paddingTop: i ? SP.md : 0, borderTop: i ? "1px solid " + C.divider : "none" }}>
                <div style={{ ...TYPE.sectionLabel, color: CAT.nutricion }}>{c.n}</div>
                <div style={{ ...TYPE.body, color: "#4A4A47", marginTop: 4 }}>{c.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ EQUIVALENCIAS — lo que hace que una dieta se sostenga ═══ */}
      <SectionHeader>Puedes cambiar</SectionHeader>
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px", display: "flex", flexDirection: "column", gap: SP.sm }}>
        {EQUIVALENCIAS.map((e, i) => (
          <div key={i} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg, padding: "11px 14px" }}>
            <div style={{ ...TYPE.bodyStrong, color: C.text }}>{e.de}</div>
            <div style={{ ...TYPE.body, color: C.textDim, marginTop: 2 }}>= {e.a}</div>
          </div>
        ))}
        <div style={{ ...TYPE.body, color: C.textFaint, lineHeight: 1.5 }}>
          Habrá algo de dispersión de calorías, y es asumible. Prefiero garantizar la adherencia a través de la flexibilidad.
        </div>
      </div>

      {/* ═══ PASOS ═══ */}
      <SectionHeader>Los pasos</SectionHeader>
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: "14px 16px" }}>
          <div style={{ ...TYPE.cardTitle, color: C.text }}>{NEAT.titulo}</div>
          <div style={{ ...TYPE.body, color: C.textDim, marginTop: 5 }}>{NEAT.texto}</div>
          <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: CAT.nutricion, marginTop: 9 }}>{NEAT.objetivo}</div>
        </div>
      </div>

      {/* ═══ COMIDA LIBRE ═══ */}
      <SectionHeader>{CHEAT_MEAL.titulo}</SectionHeader>
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: "14px 16px" }}>
          <div style={{ ...TYPE.micro, color: C.amber }}>{CHEAT_MEAL.cuando.toUpperCase()}</div>
          <div style={{ ...TYPE.body, color: "#4A4A47", marginTop: 6 }}>{CHEAT_MEAL.idea}</div>
          <div style={{ marginTop: SP.md, display: "flex", flexDirection: "column", gap: SP.sm }}>
            {CHEAT_MEAL.pautas.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: SP.sm }}>
                <span style={{ color: C.amber, flexShrink: 0 }}>·</span>
                <span style={{ ...TYPE.body, color: C.textDim }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ TIPS — colapsados, que son muchos ═══ */}
      <div style={{ padding: SP.md + "px " + SP.xl + "px 30px" }}>
        <button className="btn" onClick={() => setVerTips(!verTips)} style={{
          width: "100%", textAlign: "left", padding: "12px 14px", minHeight: TAP_MIN,
          background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ ...TYPE.cardTitle, color: C.text }}>Trucos del día a día</span>
          <span style={{ color: C.textFaint, fontSize: 14 }}>{verTips ? "–" : "+"}</span>
        </button>
        {verTips && (
          <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: SP.sm }}>
            {TIPS_NUTRICION.map((t, i) => (
              <div key={i} style={{ background: C.surfaceMuted, borderRadius: R.lg, padding: "11px 14px", ...TYPE.body, color: "#4A4A47" }}>{t}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
