"use client";

import { useState } from "react";
import { C, R, SP } from "@/design/tokens";
import { ICON_CUELLO, ICON_FUERZA, ICON_RUNNING, LOGO_7K } from "@/domain/assets/icons";


export function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const pasos = [
    {
      titulo: "Bienvenido a Programa 7K",
      texto: "11 semanas hasta el 15 de noviembre: 7km a 4:45/km. En paralelo, físico visible y salud de cuello real. Todo en un solo sitio, sin presión ni rachas.",
      icono: LOGO_7K,
    },
    {
      titulo: "Running y Fuerza",
      texto: "En Hoy verás la sesión del día ya lista para empezar. El running manda siempre — nunca se sacrifica una sesión de calidad por fuerza.",
      icono: ICON_RUNNING,
    },
    {
      titulo: "5 hábitos, cada uno con su progreso",
      texto: "Cuello (salud), Movilidad (4 patrones), Técnica de carrera, Guerrero (calma y golpeo), Magia (memoria). Cada uno sube de nivel con las semanas — tócalos cuando quieras a lo largo del día.",
      icono: ICON_CUELLO,
    },
    {
      titulo: "Coach es tu panorama completo",
      texto: "Adherencia, curvas de progreso, alertas si algo se desvía, y el sistema de bloques — cuando termines las 11 semanas, revisamos juntos y planificamos lo siguiente.",
      icono: ICON_FUERZA,
    },
  ];
  const p = pasos[step];
  const esUltimo = step === pasos.length - 1;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: SP.xxl + "px " + SP.xl + "px" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn" onClick={onFinish} style={{ fontSize: 12, color: C.textDim, fontWeight: 700, padding: "8px 4px" }}>SALTAR</button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: SP.xxxl }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: C.surfaceMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={p.icono} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, textAlign: "center", marginTop: SP.xl, letterSpacing: -0.3 }}>{p.titulo}</div>
        <div style={{ fontSize: 14.5, color: "#4A4A47", textAlign: "center", marginTop: SP.md, lineHeight: 1.55, padding: "0 " + SP.md + "px" }}>{p.texto}</div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: SP.xl }}>
          {pasos.map((_, i) => (
            <div key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, background: i === step ? C.accent : C.divider, transition: "width 0.2s ease" }} />
          ))}
        </div>
        <button className="btn" onClick={() => esUltimo ? onFinish() : setStep(s => s + 1)} style={{
          width: "100%", padding: SP.md + "px", borderRadius: R.md, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 14,
        }}>{esUltimo ? "EMPEZAR" : "SIGUIENTE"}</button>
      </div>
    </div>
  );
}
