"use client";

import { useState } from "react";
import { C, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ICON_NUTRICION } from "@/domain/assets/icons";
import { ScreenHeader } from "@/features/ui/headers";
import { TuDia } from "@/features/nutricion/TuDia";
import { TuMotor } from "@/features/nutricion/TuMotor";
import { ListaCompra } from "@/features/nutricion/ListaCompra";

/**
 * NUTRICION: tu dia de comida y poco mas.
 *
 * Arriba el peso de hoy (el motor que ajusta las kcal de la semana); luego
 * lo que te queda, las cuatro comidas para apuntar y que comer ahora. La
 * compra, plegada al final.
 */
export function NutricionScreen({ comida, apuntes = [], log = {}, apuntar, edits, esHoy, motor,
                                  diasSemana, inicioSemana, compraMarcada, marcarCompra,
                                  comidasFuera, marcarFuera }) {
  const [verCompra, setVerCompra] = useState(false);

  return (
    <div>
      <ScreenHeader icon={ICON_NUTRICION} title="NUTRICIÓN" />

      {motor && esHoy && <TuMotor {...motor} />}
      {comida && apuntar && <TuDia comida={comida} apuntes={apuntes} log={log} apuntar={apuntar} esHoy={esHoy} />}

      {diasSemana && marcarCompra && (
        <div style={{ padding: SP.lg + "px " + SP.xl + "px 0" }}>
          <button className="btn" onClick={() => setVerCompra(!verCompra)} style={{
            width: "100%", textAlign: "left", padding: "12px 14px", minHeight: TAP_MIN,
            background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl,
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...TYPE.cardTitle, color: C.text }}>La compra de la semana</span>
            <span style={{ color: C.textFaint, fontSize: 14 }}>{verCompra ? "–" : "+"}</span>
          </button>
          {verCompra && (
            <div style={{ margin: SP.sm + "px -" + SP.xl + "px 0" }}>
              <ListaCompra dias={diasSemana} inicioSemana={inicioSemana} edits={edits}
                           marcado={compraMarcada} marcarCompra={marcarCompra}
                           fuera={comidasFuera} marcarFuera={marcarFuera} />
            </div>
          )}
        </div>
      )}
      <div style={{ height: 40 }} />
    </div>
  );
}
