"use client";

/**
 * EL PESO DE CADA MAÑANA Y LO QUE DICE.
 *
 * Una fila para apuntar el peso (un numero y OK) y lo que sale de ahi: la
 * tendencia, el ritmo de bajada y las kcal de esta semana, con cuanto se
 * han ajustado y por que. Sin rojo: un pico de peso es agua, no un fallo.
 */

import { useState } from "react";
import { A, C } from "@/design/tokens";
import { Check, IconoCaja, Tarjeta } from "@/features/ui/aire";

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
    <Tarjeta data-motor style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconoCaja nombre="peso" tono="azul" />
        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.text }}>Peso de hoy</div>
        {conPeso ? (
          <button className="btn" onClick={() => { setEditando(true); setTexto(coma(pesoHoy)); }}
            style={{ fontSize: 17, fontWeight: 700, color: C.text, minHeight: 40, display: "flex", alignItems: "center", gap: 6, fontVariantNumeric: "tabular-nums" }}>
            {coma(pesoHoy)} kg <Check hecho tam={20} />
          </button>
        ) : (
          <>
            <input inputMode="decimal" placeholder={tendencia ? coma(tendencia.tendencia) : "86,0"} value={texto}
              onChange={e => setTexto(e.target.value.replace(/[^\d.,]/g, ""))} onKeyDown={e => { if (e.key === "Enter") guardar(); }}
              style={{ width: 72, padding: "9px 10px", borderRadius: 10, border: "none", background: C.surfaceMuted,
                       fontSize: 16, fontWeight: 600, textAlign: "center", color: C.text, fontFamily: "inherit" }} />
            <button className="btn" onClick={guardar} style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, background: A.azul,
                    color: "#fff", fontSize: 15, fontWeight: 700 }}>OK</button>
          </>
        )}
      </div>

      <div data-como-vas style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5, marginTop: 10 }}>
        {tendencia && <>Tendencia <b style={{ color: C.text }}>{coma(tendencia.tendencia)} kg</b></>}
        {kg != null && <> · {signo(kg, 2)} kg/sem (objetivo {signo(objetivoSemana, 1)})</>}
        {kg == null && <>{tendencia ? " · " : ""}Pésate cada mañana, en ayunas: con 8 pesajes en dos semanas, las kcal se ajustan solas cada lunes.</>}
      </div>
      {programa && (
        <div data-ajuste style={{ fontSize: 13, color: C.text, lineHeight: 1.5, marginTop: 4 }}>
          Esta semana: <b>COMER {miles(programa.objetivos.comer.kcal)} · RECORTAR {miles(programa.objetivos.recortar.kcal)}</b>
          {programa.cambio
            ? <span style={{ color: C.textDim }}> ({programa.cambio > 0 ? "+" : "−"}{Math.abs(programa.cambio)} kcal/día: {porque})</span>
            : porque ? <span style={{ color: C.textDim }}> ({porque})</span> : null}
        </div>
      )}
    </Tarjeta>
  );
}
