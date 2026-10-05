"use client";

/**
 * TU DIA DE COMIDA, LLEVADO POR TU IA (FUERA DE LA APP).
 *
 * Dos gestos y nada mas:
 *   1. "Copiar mi prompt": el mensaje con tus kcal y macros de hoy. Lo pegas
 *      en un chat de Claude o ChatGPT y le vas contando lo que comes; ella
 *      suma y te dice como cuadrar la merienda o la cena.
 *   2. "Pegar su respuesta": la app lee su linea TOTAL DEL DIA y se guarda
 *      sola. Arriba sale lo que llevas y lo que te queda. Pegar otra vez
 *      sustituye el total (la IA siempre da el del dia entero).
 */

import { useState } from "react";
import { C, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { leerTotalDelDia, mensajeDelDia } from "@/domain/nutricion/ia-dia";
import { resumenDia } from "@/domain/nutricion/apuntar";

const miles = (n) => Math.round(n).toLocaleString("es-ES");
const VERDE = "#2F7D4F";

export function TuDia({ comida, apuntes, apuntar, esHoy }) {
  const [aviso, setAviso] = useState(null);
  const [texto, setTexto] = useState("");
  const objetivo = comida.macros;
  const res = resumenDia(apuntes, objetivo);
  const hayTotal = res.llevas.kcal > 0;
  const pct = Math.min(1, res.llevas.kcal / objetivo.kcal);
  const pasado = res.quedan.kcal < 0;

  const copiar = async () => {
    const mensaje = mensajeDelDia({ comida });
    try { await navigator.clipboard.writeText(mensaje); setAviso("Copiado. Pégalo en un chat nuevo de Claude o ChatGPT."); return; } catch { /* sin portapapeles */ }
    try { if (navigator.share) { await navigator.share({ text: mensaje }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    setAviso("Este navegador no deja copiar.");
  };
  const guardarDe = (t) => {
    const total = leerTotalDelDia(t);
    if (!total) { setAviso("No veo la línea TOTAL DEL DÍA en eso. Pega la última respuesta entera de tu IA."); return false; }
    apuntar("dia", { comida: "dia", origen: "ia", texto: "Total de tu IA", kcal: total.kcal, prot: total.prot, hc: total.hc, grasa: total.grasa });
    setTexto(""); setAviso(null);
    return true;
  };
  const pegar = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) { guardarDe(t); return; } setAviso("El portapapeles está vacío."); }
    catch { setAviso("Chrome no deja leer el portapapeles: mantén pulsado el cuadro de abajo y elige Pegar."); }
  };

  const boton = (oscuro) => ({ width: "100%", minHeight: TAP_MIN + 6, borderRadius: R.lg, fontSize: 15, fontWeight: 900,
    background: oscuro ? C.accent : C.card, color: oscuro ? "#FAFAF9" : C.text, border: "1px solid " + (oscuro ? C.accent : C.cardBorder) });

  return (
    <div style={{ padding: "0 " + SP.xl + "px" }}>
      {/* ── Lo que queda ── */}
      <div data-quedan style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 18, padding: "16px 18px" }}>
        <div style={{ ...TYPE.micro, color: comida.id === "comer" ? VERDE : C.textDim }}>
          {(esHoy ? "HOY TOCA " : "ESE DÍA TOCABA ") + comida.etiqueta} · {miles(objetivo.kcal)} KCAL · {objetivo.prot} G PROTEÍNA
        </div>
        {hayTotal ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <span style={{ fontSize: 14, color: C.textDim, fontWeight: 700 }}>{pasado ? "Te has pasado" : "Te quedan"}</span>
              <span className="mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1.2, color: C.text }}>{miles(Math.abs(res.quedan.kcal))}</span>
              <span style={{ fontSize: 14, color: C.textDim, fontWeight: 700 }}>kcal</span>
            </div>
            <div style={{ fontSize: 13, color: res.quedan.prot > 0 ? C.text : VERDE, fontWeight: 700, marginTop: 2 }}>
              {res.quedan.prot > 0 ? res.quedan.prot + " g de proteína por comer" : "Proteína del día hecha ✓"}
            </div>
            <div style={{ height: 8, borderRadius: 4, background: C.surfaceMuted, marginTop: 12, overflow: "hidden" }}>
              <div style={{ width: pct * 100 + "%", height: "100%", borderRadius: 4, background: pasado ? "#D39B12" : VERDE }} />
            </div>
            <div className="mono" style={{ fontSize: 11.5, color: C.textFaint, marginTop: 5 }}>
              llevas {miles(res.llevas.kcal)} kcal · {res.llevas.prot} g proteína · según tu IA
            </div>
          </>
        ) : (
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 8, lineHeight: 1.45 }}>
            Aún no hay nada de hoy. Copia tu prompt, pégalo en tu IA y cuéntale lo que vas comiendo: ella suma y te dice cómo cuadrar la cena.
          </div>
        )}
      </div>

      {/* ── Los dos gestos ── */}
      {esHoy && (
        <div style={{ marginTop: SP.md, display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn" data-copiar onClick={copiar} style={boton(!hayTotal)}>1 · Copiar mi prompt del día</button>
          <button className="btn" data-pegar onClick={pegar} style={boton(hayTotal)}>2 · Pegar lo que dice mi IA</button>
          <textarea value={texto} rows={2} placeholder="…o mantén pulsado aquí y pega su respuesta"
            onChange={e => { setTexto(e.target.value); if (leerTotalDelDia(e.target.value)) guardarDe(e.target.value); }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: R.md, resize: "vertical", border: "1px solid " + C.cardBorder,
                     background: C.card, color: C.text, fontSize: 13, fontFamily: "inherit" }} />
          {aviso && <div data-aviso style={{ fontSize: 12.5, color: "#A06A00", lineHeight: 1.4 }}>{aviso}</div>}
          <div style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.45 }}>
            Pega su respuesta cuando quieras ver lo que te queda; por la noche, la última, que es la que cuenta para ajustar tus kcal de la semana.
          </div>
        </div>
      )}
      {hayTotal && esHoy && (
        <button className="btn" data-borrar onClick={() => apuntar("dia", null)} style={{ width: "100%", minHeight: 36, marginTop: 4, fontSize: 12.5, fontWeight: 700, color: C.textDim }}>
          Borrar el total de hoy
        </button>
      )}
    </div>
  );
}
