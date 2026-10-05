"use client";

/**
 * TU DIA DE COMIDA, EN UNA PANTALLA.
 *
 *   1. Lo que te queda (kcal y proteina), con una barra.
 *   2. Las cuatro comidas: cada una dice lo apuntado o "+ Apuntar". Al
 *      tocarla se abre debajo: lo de siempre (un toque), a ojo (manos y
 *      extras) o las kcal de una etiqueta.
 *   3. Que comer ahora: las raciones de la siguiente comida y tres ideas de
 *      platos normales; "Me lo como" la apunta.
 *
 * Nada de frases que la app tenga que entender, y nada de culpa: pasarse es
 * un dato, no un fallo.
 */

import { useState } from "react";
import { C, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { COMIDAS, EXTRAS, apunteAOjo, apunteKcal, loDeSiempre, repetir, resumenDia } from "@/domain/nutricion/apuntar";
import { ideasPara, platoPara } from "@/domain/nutricion/ideas";
import { PORCION, macrosDePorciones, textoPorcion } from "@/domain/nutricion/plato";

const miles = (n) => Math.round(n).toLocaleString("es-ES");
const VERDE = "#2F7D4F";
const NOMBRE = Object.fromEntries(COMIDAS.map(c => [c.id, c.nombre]));
const TIPOS = ["prot", "hc", "verdura", "grasa"];
const textoPlato = (p) => TIPOS.filter(k => p[k] > 0).map(k => PORCION[k].icono + " " + textoPorcion(p[k], k)).join("  ·  ");

function Contador({ tipo, valor, cambiar }) {
  const p = PORCION[tipo];
  const boton = { width: 38, height: 38, borderRadius: 19, border: "1px solid " + C.cardBorder, background: C.card,
                  fontSize: 18, fontWeight: 800, color: C.text };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{p.icono}</span>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>{p.nombre}</div>
        <div style={{ fontSize: 11, color: C.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.ejemplos}</div>
      </div>
      <button className="btn" aria-label={"menos " + p.nombre} onClick={() => cambiar(Math.max(0, valor - 0.5))} style={boton}>−</button>
      <span className="mono" style={{ width: 34, textAlign: "center", fontSize: 15, fontWeight: 800, color: valor ? C.text : C.textFaint }}>
        {valor ? textoPorcion(valor, tipo).split(" ")[0] : "0"}
      </span>
      <button className="btn" aria-label={"más " + p.nombre} data-mas={tipo} onClick={() => cambiar(valor + 0.5)} style={boton}>+</button>
    </div>
  );
}

/** Lo que se abre al tocar una comida. */
function Apuntar({ comida, log, guardar, cerrar }) {
  const [modo, setModo] = useState("ojo");
  const [por, setPor] = useState({ prot: 0, hc: 0, verdura: 0, grasa: 0 });
  const [extras, setExtras] = useState({});
  const [kcal, setKcal] = useState("");
  const [prot, setProt] = useState("");
  const siempre = loDeSiempre(log, comida);
  const ojo = apunteAOjo(comida, por, extras);
  const porKcal = apunteKcal(comida, Number(kcal), Number(prot) || null);
  const pestana = (id, txt) => (
    <button className="btn" onClick={() => setModo(id)} style={{
      flex: 1, minHeight: 34, borderRadius: 999, fontSize: 12.5, fontWeight: 800,
      background: modo === id ? C.accent : "transparent", color: modo === id ? "#FAFAF9" : C.textDim }}>{txt}</button>
  );
  const listo = { width: "100%", minHeight: TAP_MIN, borderRadius: R.lg, background: C.accent, color: "#FAFAF9",
                  fontSize: 14.5, fontWeight: 900, marginTop: SP.md };

  return (
    <div data-apuntar={comida} style={{ padding: "10px 12px 12px", background: C.surfaceMuted, borderRadius: R.lg, marginTop: 6 }}>
      {siempre.length > 0 && (
        <div style={{ marginBottom: SP.md }}>
          <div style={{ ...TYPE.micro, color: C.textDim, marginBottom: 6 }}>LO DE SIEMPRE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {siempre.map(a => (
              <button key={a.texto} className="btn" data-siempre onClick={() => guardar(repetir(a, comida))} style={{
                textAlign: "left", padding: "9px 12px", borderRadius: R.md, background: C.card, border: "1px solid " + C.cardBorder,
                display: "flex", justifyContent: "space-between", gap: 8, minHeight: 40 }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{a.texto}</span>
                <span className="mono" style={{ fontSize: 12.5, color: C.textDim, flexShrink: 0 }}>{miles(a.kcal)} kcal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, background: C.card, borderRadius: 999, padding: 3, border: "1px solid " + C.cardBorder }}>
        {pestana("ojo", "A ojo")}{pestana("kcal", "Sé las kcal")}
      </div>

      {modo === "ojo" ? (
        <div style={{ marginTop: SP.sm }}>
          {TIPOS.map(t => <Contador key={t} tipo={t} valor={por[t]} cambiar={v => setPor({ ...por, [t]: v })} />)}
          <div style={{ ...TYPE.micro, color: C.textDim, margin: "8px 0 6px" }}>ALGO MÁS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EXTRAS.map(e => {
              const n = extras[e.id] || 0;
              return (
                <button key={e.id} className="btn" onClick={() => setExtras({ ...extras, [e.id]: n >= 2 ? 0 : n + 1 })} style={{
                  padding: "0 12px", minHeight: 34, borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                  background: n ? C.accent : C.card, color: n ? "#FAFAF9" : C.textDim, border: "1px solid " + (n ? C.accent : C.cardBorder) }}>
                  {n > 1 ? n + " × " : ""}{e.nombre}
                </button>
              );
            })}
          </div>
          <button className="btn" disabled={!ojo} onClick={() => ojo && guardar(ojo)} style={{ ...listo, opacity: ojo ? 1 : 0.4 }}>
            {ojo ? "Apuntar · " + miles(ojo.kcal) + " kcal · " + ojo.prot + " g prot." : "Toca las raciones"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: SP.md }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[["kcal", kcal, setKcal, "kcal"], ["proteína (g, opcional)", prot, setProt, "g"]].map(([et, v, set]) => (
              <label key={et} style={{ flex: 1, fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>{et}
                <input inputMode="numeric" value={v} onChange={e => set(e.target.value.replace(/\D/g, ""))} style={{
                  width: "100%", marginTop: 4, padding: "9px 10px", borderRadius: R.md, border: "1px solid " + C.cardBorder,
                  background: C.card, fontSize: 16, fontWeight: 800, color: C.text, fontFamily: "inherit" }} />
              </label>
            ))}
          </div>
          <button className="btn" disabled={!porKcal} onClick={() => porKcal && guardar(porKcal)} style={{ ...listo, opacity: porKcal ? 1 : 0.4 }}>Apuntar</button>
        </div>
      )}
      <button className="btn" onClick={cerrar} style={{ width: "100%", minHeight: 36, marginTop: 4, fontSize: 12.5, fontWeight: 700, color: C.textDim }}>Cancelar</button>
    </div>
  );
}

export function TuDia({ comida, apuntes, log, apuntar, esHoy }) {
  const [abierta, setAbierta] = useState(null);
  const objetivo = comida.macros;
  const res = resumenDia(apuntes, objetivo);
  const pct = Math.min(1, res.llevas.kcal / objetivo.kcal);
  const pasado = res.quedan.kcal < 0;
  const guardar = (c) => (ap) => { apuntar(c, ap); setAbierta(null); };
  const siguiente = esHoy ? res.siguiente : null;
  const plato = siguiente ? platoPara(siguiente, res.quedan) : null;
  const ideas = plato ? ideasPara(plato.porciones, siguiente) : [];

  return (
    <div style={{ padding: "0 " + SP.xl + "px" }}>
      {/* ── Lo que queda ── */}
      <div data-quedan style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 18, padding: "16px 18px" }}>
        <div style={{ ...TYPE.micro, color: comida.id === "comer" ? VERDE : C.textDim }}>
          {(esHoy ? "HOY TOCA " : "ESE DÍA TOCABA ") + comida.etiqueta} · {miles(objetivo.kcal)} KCAL
        </div>
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
          llevas {miles(res.llevas.kcal)} kcal · {res.llevas.prot} g proteína
        </div>
      </div>

      {/* ── Las cuatro comidas ── */}
      <div style={{ marginTop: SP.md, display: "flex", flexDirection: "column", gap: 8 }}>
        {COMIDAS.map(c => {
          const ap = res.porComida[c.id];
          return (
            <div key={c.id} data-comida={c.id}>
              <button className="btn" onClick={() => setAbierta(abierta === c.id ? null : c.id)} style={{
                width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, minHeight: TAP_MIN + 6,
                padding: "10px 14px", borderRadius: R.lg, background: C.card, border: "1px solid " + C.cardBorder }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.text, width: 82, flexShrink: 0 }}>{c.nombre}</span>
                {ap ? (
                  <>
                    <span style={{ flexGrow: 1, minWidth: 0, fontSize: 12.5, color: C.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ap.texto}</span>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: C.text, flexShrink: 0 }}>{miles(ap.kcal || 0)}</span>
                  </>
                ) : (
                  <span style={{ flexGrow: 1, fontSize: 13, fontWeight: 700, color: C.accent }}>+ Apuntar</span>
                )}
              </button>
              {abierta === c.id && (
                <>
                  <Apuntar comida={c.id} log={log} guardar={guardar(c.id)} cerrar={() => setAbierta(null)} />
                  {ap && (
                    <button className="btn" data-borrar={c.id} onClick={() => { apuntar(c.id, null); setAbierta(null); }} style={{
                      width: "100%", minHeight: 36, fontSize: 12.5, fontWeight: 700, color: C.textDim }}>Borrar lo apuntado en {c.nombre.toLowerCase()}</button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Que comer ahora ── */}
      {plato && abierta == null && (
        <div data-que-comer style={{ marginTop: SP.lg, background: "#F3F8F2", border: "1px solid #D9E9D5", borderRadius: 18, padding: "14px 16px" }}>
          <div style={{ ...TYPE.micro, color: VERDE }}>QUÉ COMER {siguiente === "cena" ? "DE CENA" : "EN LA " + NOMBRE[siguiente].toUpperCase()}</div>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text, marginTop: 6, lineHeight: 1.45 }}>{textoPlato(plato.porciones)}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>
            ≈ {miles(plato.macros.kcal)} kcal · {Math.round(plato.macros.prot)} g proteína
            {plato.aviso === "pasado" ? " · el día ya está lleno: algo ligero y con proteína" : plato.aviso === "ligera" ? " · queda poco: algo ligero" : ""}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: SP.md }}>
            {ideas.map(i => (
              <button key={i.id} className="btn" data-idea={i.id} onClick={() => apuntar(siguiente, {
                comida: siguiente, origen: "idea", texto: i.nombre, porciones: i.porciones,
                ...Object.fromEntries(Object.entries(macrosDePorciones(i.porciones)).map(([k, v]) => [k, Math.round(v)])) })} style={{
                textAlign: "left", padding: "10px 12px", borderRadius: R.md, background: C.card, border: "1px solid #D9E9D5",
                display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
                <span style={{ flexGrow: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: C.text }}>{i.nombre}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: C.textDim, marginTop: 1 }}>{textoPlato(i.porciones)}</span>
                  <span className="mono" style={{ fontSize: 11.5, color: C.textDim }}>{miles(i.macros.kcal)} kcal · {Math.round(i.macros.prot)} g prot.</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: VERDE, flexShrink: 0 }}>Me lo como</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
