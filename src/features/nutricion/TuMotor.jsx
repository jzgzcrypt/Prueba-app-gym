"use client";

/**
 * EL PESO DE CADA MAÑANA Y LO QUE DICE.
 *
 * Una fila para apuntar el peso (un numero y OK) y lo que sale de ahi: la
 * tendencia, el ritmo de bajada y las kcal de esta semana, con cuanto se
 * han ajustado y por que. Sin rojo: un pico de peso es agua, no un fallo.
 */

import { useState } from "react";
import { C, R, SP } from "@/design/tokens";

const coma = (x, d = 1) => Number(x).toFixed(d).replace(".", ",");
const miles = (n) => Math.round(n).toLocaleString("es-ES");

export function TuMotor({ pesoHoy, guardarPeso, tendencia, programa }) {
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const guardar = () => {
    const kg = Number(String(texto).replace(",", "."));
    if (!Number.isFinite(kg) || kg < 40 || kg > 200) return;
    guardarPeso(Math.round(kg * 10) / 10); setTexto(""); setEditando(false);
  };
  const conPeso = pesoHoy != null && !editando;
  const objetivoSemana = -0.4;
  const kg = programa ? programa.kgSemana : null;
  const porque = !programa || !programa.motivo ? null
    : programa.motivo === "lento" ? "bajas más lento de lo previsto"
    : programa.motivo === "rapido" ? "bajas más rápido de lo previsto: come un poco más"
    : "vas al ritmo previsto";
  const signo = (x, d) => (x > 0 ? "+" : x < 0 ? "−" : "") + coma(Math.abs(x), d);

  return (
    <div data-motor style={{ padding: "0 " + SP.xl + "px", marginBottom: SP.md }}>
      <div style={{ display: "flex", alignItems: "center", gap: SP.sm, background: C.card, border: "1px solid " + C.cardBorder,
                    borderRadius: R.xl, padding: "10px 12px 10px 14px" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text, flexShrink: 0 }}>Peso de hoy</span>
        {conPeso ? (
          <button className="btn mono" onClick={() => { setEditando(true); setTexto(coma(pesoHoy)); }}
            style={{ marginLeft: "auto", fontSize: 15, fontWeight: 800, color: C.ok, minHeight: 36 }}>
            ✓ {coma(pesoHoy)} kg
          </button>
        ) : (
          <>
            <input inputMode="decimal" placeholder={tendencia ? coma(tendencia.tendencia) : "86,0"} value={texto}
              onChange={e => setTexto(e.target.value.replace(/[^\d.,]/g, ""))} onKeyDown={e => { if (e.key === "Enter") guardar(); }}
              style={{ marginLeft: "auto", width: 76, padding: "8px 10px", borderRadius: R.md, border: "1px solid " + C.cardBorder,
                       background: C.bg, fontSize: 15, fontWeight: 700, textAlign: "center", color: C.text, fontFamily: "inherit" }} />
            <span style={{ fontSize: 12, color: C.textDim }}>kg</span>
            <button className="btn" onClick={guardar} style={{ minHeight: 38, padding: "0 14px", borderRadius: R.md, background: C.accent,
                    color: "#FAFAF9", fontSize: 13, fontWeight: 800 }}>OK</button>
          </>
        )}
      </div>

      <div data-como-vas style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.5, padding: "8px 4px 0" }}>
        {tendencia && <>Tendencia <b className="mono" style={{ color: C.text }}>{coma(tendencia.tendencia)} kg</b></>}
        {kg != null && <> · <span className="mono">{signo(kg, 2)} kg/sem</span> (objetivo {signo(objetivoSemana, 1)})</>}
        {kg == null && <>{tendencia ? " · " : ""}Pésate cada mañana, en ayunas: con 8 pesajes en dos semanas, las kcal se ajustan solas cada lunes.</>}
      </div>
      {programa && (
        <div data-ajuste style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, padding: "4px 4px 0" }}>
          Esta semana: <b className="mono">COMER {miles(programa.objetivos.comer.kcal)} · RECORTAR {miles(programa.objetivos.recortar.kcal)}</b>
          {programa.cambio
            ? <span style={{ color: C.textDim }}> ({programa.cambio > 0 ? "+" : "−"}{Math.abs(programa.cambio)} kcal/día: {porque})</span>
            : porque ? <span style={{ color: C.textDim }}> ({porque})</span> : null}
        </div>
      )}
    </div>
  );
}
