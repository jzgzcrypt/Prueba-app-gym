"use client";

import { C, SP, TYPE } from "@/design/tokens";
import { ICON_NUTRICION } from "@/domain/assets/icons";
import { ScreenHeader } from "@/features/ui/headers";
import { TuMotor } from "@/features/nutricion/TuMotor";

/**
 * NUTRICION, LO MINIMO.
 *
 * Que toca comer hoy (kcal y proteina) y el peso de cada mañana, que es lo
 * que ajusta las kcal de la semana. Sin apuntar comidas.
 */
const miles = (n) => Math.round(n).toLocaleString("es-ES");
const VERDE = "#2F7D4F";
const QUE_ES = {
  comer: "Día de entreno: hidratos alrededor de la sesión.",
  recortar: "Sin sesión intensa: aquí es donde se pierde la grasa.",
};

export function NutricionScreen({ comida, esHoy, motor }) {
  const m = comida && comida.macros;
  return (
    <div>
      <ScreenHeader icon={ICON_NUTRICION} title="NUTRICIÓN" />

      {m && (
        <div style={{ padding: "0 " + SP.xl + "px", marginBottom: SP.md }}>
          <div data-hoy-comida style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 18, padding: "18px 20px" }}>
            <div style={{ ...TYPE.micro, color: comida.id === "comer" ? VERDE : C.textDim }}>{(esHoy ? "HOY TOCA " : "ESE DÍA TOCABA ") + comida.etiqueta}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5, color: C.text }}>{miles(m.kcal)}</span>
              <span style={{ fontSize: 15, color: C.textDim, fontWeight: 700 }}>kcal</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 2 }}>{m.prot} g de proteína</div>
            <div className="mono" style={{ fontSize: 12, color: C.textFaint, marginTop: 4 }}>hidratos {m.hc} g · grasa {m.grasa} g</div>
            <div style={{ fontSize: 13, color: C.textDim, marginTop: 10, lineHeight: 1.45 }}>{QUE_ES[comida.id]}</div>
          </div>
        </div>
      )}

      {motor && esHoy && <TuMotor {...motor} />}
      <div style={{ height: 40 }} />
    </div>
  );
}
