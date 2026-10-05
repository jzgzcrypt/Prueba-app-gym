"use client";

/**
 * EL PESO DE CADA MAÑANA Y LO QUE DICE.
 *
 * Una fila para apuntar el peso (un numero y OK) y una linea con lo que el
 * motor saca de ahi: la tendencia, el ritmo de bajada y tu gasto real. Si
 * esta semana las kcal se han ajustado, se dice cuanto y por que. Sin rojo:
 * un pico de peso es agua, no un fallo.
 */

import { useState } from "react";
import { C, R, SP } from "@/design/tokens";
import { DIAS_PLENOS } from "@/domain/nutricion/adaptativo";

const coma = (x, d = 1) => Number(x).toFixed(d).replace(".", ",");
const miles = (n) => Math.round(n).toLocaleString("es-ES");

export function TuMotor({ pesoHoy, guardarPeso, tendencia, programa }) {
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const g = programa && programa.gasto;
  const guardar = () => {
    const kg = Number(String(texto).replace(",", "."));
    if (!Number.isFinite(kg) || kg < 40 || kg > 200) return;
    guardarPeso(Math.round(kg * 10) / 10); setTexto(""); setEditando(false);
  };
  const conPeso = pesoHoy != null && !editando;
  const objetivoSemana = -0.4;
  // El porque sale del ritmo real de bajada, no del numero de kcal.
  const kg = g && g.kgSemana;
  const porque = kg == null ? null
    : kg > objetivoSemana + 0.1 ? "bajas algo más lento de lo previsto"
    : kg < objetivoSemana - 0.1 ? "bajas más rápido de lo previsto: puedes comer un poco más"
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

      <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.5, padding: "8px 4px 0" }}>
        {tendencia && <>Tendencia <b className="mono" style={{ color: C.text }}>{coma(tendencia.tendencia)} kg</b></>}
        {g && g.kgSemana != null && g.pesajes >= 5 && <> · <span className="mono">{signo(g.kgSemana, 2)} kg/sem</span> (objetivo {signo(objetivoSemana, 1)})</>}
        {programa && programa.ajustado ? (
          <> · tu gasto real <b className="mono" style={{ color: C.text }}>{miles(g.gasto)} kcal</b> ({g.dias} días de datos)</>
        ) : (
          <>{tendencia ? " · " : ""}Tu gasto real: aprendiendo ({g ? Math.min(g.dias, 7) : 0} de 7 días con el total de tu IA). Pésate cada mañana, en ayunas.</>
        )}
        {programa && programa.ajustado && g.confianza < 1 && <span style={{ color: C.textFaint }}> · afinando hasta {DIAS_PLENOS} días</span>}
      </div>
      {programa && programa.ajustado && (
        <div data-ajuste style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, padding: "4px 4px 0" }}>
          Esta semana: <b className="mono">COMER {miles(programa.objetivos.comer.kcal)} · RECORTAR {miles(programa.objetivos.recortar.kcal)}</b>
          {Math.abs(programa.cambio) >= 30
            ? <span style={{ color: C.textDim }}> ({programa.cambio > 0 ? "+" : "−"}{Math.abs(programa.cambio)} kcal/día vs la semana pasada: {porque})</span>
            : porque ? <span style={{ color: C.textDim }}> ({porque})</span> : null}
        </div>
      )}
    </div>
  );
}
