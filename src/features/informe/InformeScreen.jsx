"use client";

import { useState } from "react";
import { compartirImagen } from "@/features/informe/imagen";

/**
 * TU MES — el informe mensual a pantalla completa.
 *
 * Una tarjeta por idea, con el numero en grande. Solo salen las que tienen
 * datos: nunca un "0" triste. Arriba, cerrar y compartir.
 */
const FONDO = "#121212";
const TARJETA = "#1C1C1C";
const TEXTO = "#FAFAF9";
const TENUE = "#9A9A96";
const COLOR = { running: "#E0694E", fuerza: "#5FB38A", tenis: "#4FB3AC", oro: "#E2BA4A" };
const NOMBRE_TIPO = { running: "Running", fuerza: "Fuerza", tenis: "Tenis" };

const miles = (n) => n.toLocaleString("es-ES");
const coma = (n) => String(n).replace(".", ",");

function Tarjeta({ i, etiqueta, color, children }) {
  return (
    <section style={{
      background: TARJETA, borderRadius: 24, padding: "26px 22px", position: "relative", overflow: "hidden",
      animation: "entra .5s ease both", animationDelay: (i * 0.08) + "s",
    }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: 999,
                    background: color, opacity: 0.16, filter: "blur(30px)" }} />
      {etiqueta && <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, color: TENUE, marginBottom: 10 }}>{etiqueta}</div>}
      {children}
    </section>
  );
}

// `medio` para los "antes → despues", que son mas largos y no caben a 58.
const Grande = ({ color, medio, children }) => (
  <div className="mono" style={{ fontSize: medio ? 42 : 58, fontWeight: 800, color, lineHeight: 1, letterSpacing: medio ? -1.5 : -2, whiteSpace: "nowrap" }}>{children}</div>
);
const Sub = ({ children }) => (
  <div style={{ fontSize: 16, fontWeight: 700, color: TEXTO, marginTop: 10, lineHeight: 1.35 }}>{children}</div>
);
const Nota = ({ children }) => (
  <div style={{ fontSize: 13.5, color: TENUE, marginTop: 8, lineHeight: 1.45 }}>{children}</div>
);

export function InformeScreen({ informe: inf, onCerrar }) {
  const [compartiendo, setCompartiendo] = useState(false);
  const compartir = async () => { setCompartiendo(true); try { await compartirImagen(inf); } finally { setCompartiendo(false); } };
  let i = 0;

  return (
    <div style={{ minHeight: "100vh", background: FONDO, color: TEXTO, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        .mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; }
        .btn:active { opacity: .65; transform: scale(.97); }
        @keyframes entra { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      `}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button className="btn" onClick={onCerrar} aria-label="Cerrar" style={{ color: TENUE, fontSize: 13, fontWeight: 800, minHeight: 44, padding: "0 4px" }}>✕ CERRAR</button>
          <button className="btn" onClick={compartir} disabled={compartiendo} style={{
            background: TEXTO, color: FONDO, fontSize: 13, fontWeight: 900, borderRadius: 999, padding: "0 18px", minHeight: 40,
          }}>{compartiendo ? "PREPARANDO…" : "COMPARTIR"}</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Portada */}
          <Tarjeta i={i++} color={COLOR.fuerza}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 1.2, color: TENUE }}>SISTEMA 7K · BASE 7K</div>
            <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: -1.5, marginTop: 14, lineHeight: 1 }}>{inf.titulo}</div>
            <Sub>{inf.diasEntrenados} {inf.diasEntrenados === 1 ? "día entrenando" : "días entrenando"}{inf.enCurso ? ", hasta hoy" : ""}</Sub>
          </Tarjeta>

          {inf.sesiones.total > 0 && (
            <Tarjeta i={i++} etiqueta="SESIONES" color={COLOR.fuerza}>
              <Grande color={COLOR.fuerza}>{inf.sesiones.hechas}<span style={{ color: TENUE, fontSize: 30 }}>/{inf.sesiones.total}</span></Grande>
              <Sub>sesiones hechas</Sub>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(inf.sesiones.porTipo).map(([t, v]) => (
                  <div key={t}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 700, color: TENUE, marginBottom: 5 }}>
                      <span>{NOMBRE_TIPO[t] || t}</span><span className="mono">{v.hechas}/{v.total}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "#2A2A2A", overflow: "hidden" }}>
                      <div style={{ width: (v.total ? v.hechas / v.total * 100 : 0) + "%", height: "100%", borderRadius: 4, background: COLOR[t] || TEXTO }} />
                    </div>
                  </div>
                ))}
              </div>
            </Tarjeta>
          )}

          {inf.minutosCorriendo > 0 && (
            <Tarjeta i={i++} etiqueta="CORRIENDO" color={COLOR.running}>
              <Grande color={COLOR.running}>{inf.minutosCorriendo}<span style={{ fontSize: 30 }}> min</span></Grande>
              <Sub>corriendo, en {inf.sesiones.porTipo.running ? inf.sesiones.porTipo.running.hechas : 0} salidas</Sub>
              {inf.mejorRitmoSeries && <Nota>Tus mejores series: <b style={{ color: TEXTO }}>{inf.mejorRitmoSeries}</b></Nota>}
            </Tarjeta>
          )}

          {inf.series > 0 && (
            <Tarjeta i={i++} etiqueta="FUERZA" color={COLOR.fuerza}>
              <Grande color={COLOR.fuerza}>{inf.series}</Grande>
              <Sub>series apuntadas{inf.kilos ? <> · <span className="mono">{miles(inf.kilos)}</span> kg movidos</> : null}</Sub>
              {inf.records.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: COLOR.oro }}>
                    {inf.records.length === 1 ? "1 RÉCORD" : inf.records.length + " RÉCORDS"}
                  </div>
                  {inf.records.slice(0, 5).map((r, k) => (
                    <div key={k} style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
                      {r.nombre} <span className="mono" style={{ color: COLOR.oro }}>{r.texto}</span>
                    </div>
                  ))}
                </div>
              )}
            </Tarjeta>
          )}

          {inf.laterales && (
            <Tarjeta i={i++} etiqueta="HOMBRO" color={COLOR.oro}>
              <Grande medio color={COLOR.oro}>{coma(inf.laterales.antes)} → {coma(inf.laterales.despues)}<span style={{ fontSize: 24 }}> kg</span></Grande>
              <Sub>{inf.laterales.nombre}</Sub>
              <Nota>{inf.laterales.despues > inf.laterales.antes
                ? "Más peso, mismo hombro: está creciendo."
                : "Mismo peso que al empezar: el mes que viene, a por el siguiente escalón."}</Nota>
            </Tarjeta>
          )}

          <Tarjeta i={i++} etiqueta="CUERPO" color={COLOR.tenis}>
            {inf.cintura && inf.cintura.n > 1 ? (
              <>
                <Grande medio color={COLOR.tenis}>{coma(inf.cintura.antes)} → {coma(inf.cintura.despues)}<span style={{ fontSize: 24 }}> cm</span></Grande>
                <Sub>de cintura{inf.cintura.despues < inf.cintura.antes ? ": " + coma((inf.cintura.antes - inf.cintura.despues).toFixed(1)) + " cm menos" : ""}</Sub>
              </>
            ) : inf.cintura ? (
              <>
                <Grande color={COLOR.tenis}>{coma(inf.cintura.despues)}<span style={{ fontSize: 30 }}> cm</span></Grande>
                <Sub>de cintura, tu punto de partida</Sub>
                <Nota>Con la próxima medida verás cuánto baja.</Nota>
              </>
            ) : (
              <>
                <Sub>Aún no hay medidas este mes.</Sub>
                <Nota>Mide la cintura en Progreso: el mes que viene verás aquí cuánto ha bajado.</Nota>
              </>
            )}
          </Tarjeta>

          {inf.planVsReal && (
            <Tarjeta i={i++} etiqueta="TÚ CONTRA EL PLAN" color={inf.planVsReal.diferencia <= 5 ? COLOR.fuerza : COLOR.oro}>
              <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, color: inf.planVsReal.diferencia <= 5 ? COLOR.fuerza : COLOR.oro }}>{inf.planVsReal.texto}</div>
              <Nota>Tu 7K equivalente: <b className="mono" style={{ color: TEXTO }}>{inf.planVsReal.sieteK}</b> · objetivo 33:15</Nota>
            </Tarjeta>
          )}

          {/* Cierre */}
          <Tarjeta i={i++} color={COLOR.running}>
            {inf.semanasCumplidas > 0 && (
              <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 1, color: COLOR.fuerza, marginBottom: 10 }}>
                {inf.semanasCumplidas} {inf.semanasCumplidas === 1 ? "SEMANA CUMPLIDA" : "SEMANAS CUMPLIDAS"}
              </div>
            )}
            <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, letterSpacing: -0.5 }}>{inf.frase}</div>
          </Tarjeta>
        </div>

        <button className="btn" onClick={compartir} disabled={compartiendo} style={{
          width: "100%", marginTop: 18, minHeight: 52, borderRadius: 16, background: TEXTO, color: FONDO, fontSize: 15, fontWeight: 900,
        }}>{compartiendo ? "PREPARANDO…" : "COMPARTIR MI MES"}</button>
      </div>
    </div>
  );
}
