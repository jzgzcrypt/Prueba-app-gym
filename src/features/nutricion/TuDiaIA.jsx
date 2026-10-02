"use client";

/**
 * TU DIA, LLEVADO POR TU IA.
 *
 * Una sola accion a la vista cada vez:
 *   - dia abierto: "Mandar mi dia a la IA" (menu de compartir de Android:
 *     eliges Claude o ChatGPT y el mensaje va ya escrito);
 *   - llega su respuesta (compartida a la app, o pegada): "¿Cierro el dia con…?";
 *   - dia cerrado: como acabo, con una frase de coach.
 * Debajo, la semana en 7 puntos. Nada mas.
 */

import { useState } from "react";
import { C, R, SP, TAP_MIN } from "@/design/tokens";
import { leerTotalDelDia, mensajeDelDia, veredictoDia } from "@/domain/nutricion/ia-dia";

const OSCURO = "#1C1C1C";
const TENUE = "#9A9A96";
const r = Math.round;
const miles = (n) => r(n).toLocaleString("es-ES");

const ESTADO_PUNTO = {
  bien: { fondo: C.ok, borde: C.ok },
  ojo: { fondo: "#D39B12", borde: "#D39B12" },
  abierto: { fondo: "transparent", borde: "#C9C9C5" },
  futuro: { fondo: "#EFEFEC", borde: "#EFEFEC" },
};
const LETRA = ["L", "M", "X", "J", "V", "S", "D"];

export function TuDiaIA({ comida, apuntes, esHoy, cerrarDia, reabrirDia, pendiente, limpiarPendiente, semana }) {
  const [cerrando, setCerrando] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState(null);
  const objetivo = comida.macros;
  const cerrado = (apuntes || []).filter(a => a && a.comida === "dia").slice(-1)[0] || null;
  // Lo que ha llegado para cerrar: compartido desde la IA, o pegado aqui.
  const entrada = pendiente || (cerrando ? texto : "");
  const leido = entrada ? leerTotalDelDia(entrada) : null;

  const mandar = async () => {
    const mensaje = mensajeDelDia({ comida });
    setAviso(null);
    try {
      if (navigator.share) { await navigator.share({ text: mensaje }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(mensaje); setAviso("Copiado: pégalo en un chat nuevo de Claude o ChatGPT."); }
    catch { setAviso("No se pudo compartir ni copiar en este navegador."); }
  };
  const pegar = async () => {
    try { const t = await navigator.clipboard.readText(); if (t) setTexto(t); else setAviso("El portapapeles está vacío."); }
    catch { setAviso("Chrome no deja leer el portapapeles: mantén pulsado el cuadro y elige Pegar."); }
  };
  const confirmar = () => {
    if (!leido) return;
    cerrarDia({ kcal: leido.kcal, prot: leido.prot, hc: leido.hc, grasa: leido.grasa });
    setCerrando(false); setTexto(""); setAviso(null);
    if (limpiarPendiente) limpiarPendiente();
  };
  const cancelar = () => { setCerrando(false); setTexto(""); setAviso(null); if (limpiarPendiente) limpiarPendiente(); };

  const botonBlanco = { width: "100%", minHeight: TAP_MIN + 8, borderRadius: R.lg, background: "#FAFAF9", color: OSCURO,
                        fontSize: 15, fontWeight: 900, letterSpacing: 0.2, marginTop: SP.lg };
  const enlace = { color: TENUE, fontSize: 12.5, fontWeight: 700, minHeight: 36, padding: "0 4px", marginTop: 4 };
  const veredicto = cerrado ? veredictoDia(cerrado, objetivo) : null;

  return (
    <div style={{ padding: "0 " + SP.xl + "px" }}>
      <div data-dia style={{ background: OSCURO, borderRadius: 20, padding: "20px 20px 14px", color: "#FAFAF9" }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, color: TENUE }}>{esHoy ? "HOY TOCA" : "ESE DÍA TOCABA"}</div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginTop: 4,
                      color: comida.id === "comer" ? "#7BC8A0" : "#FAFAF9" }}>{comida.etiqueta}</div>
        <div style={{ fontSize: 13, color: TENUE, marginTop: 6, lineHeight: 1.4 }}>{comida.detalle}</div>

        {/* ── El dia cerrado ── */}
        {cerrado && !entrada ? (
          <div data-resultado style={{ marginTop: SP.lg }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>{miles(cerrado.kcal)}</span>
              <span className="mono" style={{ fontSize: 16, color: TENUE }}>/ {miles(objetivo.kcal)} kcal</span>
              {veredicto.tono === "bien" && <span style={{ fontSize: 22, color: "#7BC8A0" }}>✓</span>}
            </div>
            <div className="mono" style={{ fontSize: 13, color: cerrado.prot >= objetivo.prot - 10 ? "#7BC8A0" : "#E2BA4A", marginTop: 2 }}>
              proteína {r(cerrado.prot)} / {objetivo.prot} g
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: SP.md, lineHeight: 1.4,
                          color: veredicto.tono === "bien" ? "#FAFAF9" : "#E2BA4A" }}>{veredicto.texto}</div>
            <button className="btn" onClick={() => { reabrirDia(); setCerrando(true); }} style={enlace}>Corregir</button>
          </div>
        ) : leido ? (
          /* ── Ha llegado la respuesta: se confirma ── */
          <div data-confirmar style={{ marginTop: SP.lg }}>
            <div style={{ fontSize: 13, color: TENUE }}>{leido.desde === "total" ? "Tu IA dice que hoy llevas" : "Sumando lo que ha llegado"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              <span className="mono" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>{miles(leido.kcal)}</span>
              <span className="mono" style={{ fontSize: 16, color: TENUE }}>/ {miles(objetivo.kcal)} kcal</span>
            </div>
            <div className="mono" style={{ fontSize: 13, color: TENUE }}>proteína {leido.prot} g · hidratos {leido.hc} g · grasa {leido.grasa} g</div>
            <button className="btn" onClick={confirmar} style={botonBlanco}>Cerrar el día</button>
            <button className="btn" onClick={cancelar} style={enlace}>No, aún no</button>
          </div>
        ) : cerrando ? (
          /* ── Pegar su respuesta (si no se compartio a la app) ── */
          <div style={{ marginTop: SP.lg }}>
            <div style={{ fontSize: 13, color: TENUE, lineHeight: 1.45 }}>
              En tu IA, mantén pulsada su última respuesta → <b style={{ color: "#FAFAF9" }}>Compartir → 7K</b>. O cópiala y pégala aquí:
            </div>
            <button className="btn" onClick={pegar} style={botonBlanco}>Pegar su respuesta</button>
            <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2} placeholder="…o pégala aquí"
              style={{ width: "100%", marginTop: SP.sm, padding: "9px 12px", borderRadius: R.md, resize: "vertical",
                       border: "1px solid #3A3A38", background: "#262625", color: "#FAFAF9", fontSize: 13, fontFamily: "inherit" }} />
            {texto && !leido && <div style={{ fontSize: 12, color: "#E2BA4A", marginTop: 4 }}>No veo el TOTAL DEL DÍA ni números de kcal en eso.</div>}
            <button className="btn" onClick={cancelar} style={enlace}>Cancelar</button>
          </div>
        ) : (
          /* ── Dia abierto: una sola accion ── */
          <>
            <div className="mono" style={{ marginTop: SP.lg, fontSize: 15, fontWeight: 700 }}>
              {miles(objetivo.kcal)} kcal · {objetivo.prot} g proteína
            </div>
            <div className="mono" style={{ fontSize: 12, color: TENUE, marginTop: 2 }}>hidratos {objetivo.hc} g · grasa {objetivo.grasa} g</div>
            <button className="btn" onClick={mandar} style={botonBlanco}>Mandar mi día a la IA</button>
            <div style={{ fontSize: 12.5, color: TENUE, marginTop: 8, lineHeight: 1.45 }}>
              Luego cuéntale lo que comes: ella lleva la cuenta y te dice la cena.
            </div>
            <button className="btn" onClick={() => setCerrando(true)} style={enlace}>Cerrar el día →</button>
          </>
        )}
        {aviso && <div style={{ fontSize: 12, color: "#E2BA4A", marginTop: 6 }}>{aviso}</div>}
      </div>

      {/* ── La semana ── */}
      {semana && (
        <div data-semana style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px 4px" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {semana.dias.map((d, i) => {
              const e = ESTADO_PUNTO[d.estado];
              return (
                <div key={d.iso} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: e.fondo, border: "2px solid " + e.borde }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textFaint }}>{LETRA[i]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{semana.protMedia != null ? semana.protMedia + " g" : "–"}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textFaint }}>proteína media</div>
          </div>
        </div>
      )}
      <div style={{ height: 1, background: C.divider, margin: "10px 0 0" }} />
    </div>
  );
}
