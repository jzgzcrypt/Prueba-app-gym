"use client";

import { useState } from "react";
import { A, C, CARD } from "@/design/tokens";
import { Boton, Icono, IconoCaja, Tarjeta } from "@/features/ui/aire";

/**
 * LO DE ARRIBA DE HOY: una cosa cada vez, si avanzas, y una vez por semana
 * como te has sentido. Es lo que ves al abrir; lo demas va plegado.
 */

const ICONO = { "cuello-m": ["cuello", "azul"], "cuello-t": ["cuello", "azul"], "cuello-n": ["cuello", "azul"],
  peso: ["peso", "azul"], sesion: ["correr", "rojo"], comida: ["plato", "verde"], extras: ["magia", "morado"] };

/** "Ahora toca": lo de esta hora, grande, con un toque para hacerlo. */
export function AhoraToca({ plan, onSesion, onCuello, onPeso, onComida, onExtras, tituloSesion }) {
  const [kg, setKg] = useState("");
  const a = plan.ahora;
  const [ic, tono] = ICONO[a.id] || ["meta", "gris"];
  const guardarPeso = () => { const n = Number(String(kg).replace(",", ".")); if (n > 40 && n < 200) { onPeso(Math.round(n * 10) / 10); setKg(""); } };
  return (
    <div data-ahora style={{ ...CARD, padding: "16px 16px 14px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: A.rojo, letterSpacing: 0.3 }}>AHORA TOCA</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        <IconoCaja nombre={ic} tono={tono} tam={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: -0.4, lineHeight: 1.15 }}>{a.titulo}</div>
          <div style={{ fontSize: 14, color: C.textDim, marginTop: 3, lineHeight: 1.4 }}>{a.sub}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        {a.accion === "sesion" && <Boton tipo="color" color={A.rojo} data-ahora-accion onClick={onSesion}>{tituloSesion ? "Empezar" : "Hecho"}</Boton>}
        {a.accion === "cuello" && <Boton tipo="color" color={A.azul} data-ahora-accion onClick={() => onCuello(a.id.slice(-1))}>Hecho</Boton>}
        {a.accion === "comida" && <Boton tipo="color" color={A.verde} data-ahora-accion onClick={onComida}>Apuntar</Boton>}
        {a.accion === "extras" && <Boton tipo="suave" data-ahora-accion onClick={onExtras}>Ver magia y guerrero</Boton>}
        {a.accion === "peso" && (
          <div style={{ display: "flex", gap: 8 }}>
            <input inputMode="decimal" value={kg} placeholder="86,0" onChange={e => setKg(e.target.value.replace(/[^\d.,]/g, ""))}
              onKeyDown={e => { if (e.key === "Enter") guardarPeso(); }} data-ahora-peso
              style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 999, border: "none", background: C.surfaceMuted, fontSize: 17, fontWeight: 700, textAlign: "center", fontFamily: "inherit" }} />
            <Boton tipo="color" color={A.azul} data-ahora-accion onClick={guardarPeso} style={{ width: "auto", padding: "0 22px" }}>OK</Boton>
          </div>
        )}
      </div>
      {plan.despues.length > 0 && (
        <div style={{ fontSize: 13, color: C.textDim, marginTop: 10 }}>
          Después: {plan.despues.map(d => d.titulo).join(" · ")}
        </div>
      )}
    </div>
  );
}

const TONO = { bien: A.verde, ojo: A.naranja, gris: C.textFaint, neutro: C.text };
const ICONO_OBJ = { "7k": ["correr", "rojo"], panza: ["regla", "morado"], hombro: ["mancuerna", "azul"], cuello: ["cuello", "verde"] };

/** "¿Avanzo?": tus 4 objetivos y tú, una linea cada uno. */
export function Avanzo({ objetivos, cumplidos, sentir, prueba, onVer }) {
  return (
    <Tarjeta data-avanzo style={{ padding: "12px 16px 8px" }}>
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.text }}>¿Avanzo?</div>
        {prueba && <div style={{ fontSize: 12, color: C.textDim }}>Prueba de 2 semanas · día {prueba.dia} de 14</div>}
      </div>
      {objetivos.map(o => {
        const [ic, tono] = ICONO_OBJ[o.id] || ["grafica", "gris"];
        return (
          <button key={o.id} className="btn" onClick={onVer} data-avanzo-fila={o.id}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 40, textAlign: "left", borderTop: "1px solid " + C.divider }}>
            <IconoCaja nombre={ic} tono={tono} tam={28} />
            <span style={{ width: 62, fontSize: 14, fontWeight: 600, color: C.text }}>{o.nombre}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: o.valor ? TONO[o.tono] : C.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {o.valor ? (o.flecha ? o.flecha + " " : "") + o.tendencia : o.accion}
            </span>
            {o.valor && <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flexShrink: 0 }}>{o.valor}</span>}
          </button>
        );
      })}
      <div data-avanzo-fila="tu" style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, borderTop: "1px solid " + C.divider }}>
        <IconoCaja nombre="escudo" tono="gris" tam={28} />
        <span style={{ width: 62, fontSize: 14, fontWeight: 600, color: C.text }}>Tú</span>
        <span style={{ flex: 1, fontSize: 13, color: C.textDim }}>
          {cumplidos.total ? "días cumplidos esta semana" : "la semana empieza hoy"}{sentir ? " · te sentiste " + sentir + "/5" : ""}
        </span>
        {cumplidos.total > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{cumplidos.hechos}/{cumplidos.total}</span>}
      </div>
    </Tarjeta>
  );
}

/** Domingo (o el lunes, si se paso): como te has sentido contigo esta semana. */
export function SentirSemana({ onGuardar }) {
  const [nota, setNota] = useState(null);
  const [frase, setFrase] = useState("");
  return (
    <Tarjeta data-sentir style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>¿Cómo te has sentido contigo esta semana?</div>
      <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>Es tu objetivo de verdad. Un toque.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} className="btn" data-nota={n} onClick={() => setNota(n)} style={{
            flex: 1, height: 46, borderRadius: 14, fontSize: 18, fontWeight: 700,
            background: nota === n ? A.azul : C.surfaceMuted, color: nota === n ? "#fff" : C.text }}>{n}</button>
        ))}
      </div>
      {nota != null && (
        <>
          <input value={frase} onChange={e => setFrase(e.target.value)} placeholder="Una frase, si quieres (qué te ha pesado, qué ha ido bien)"
            style={{ width: "100%", boxSizing: "border-box", marginTop: 10, padding: "11px 12px", borderRadius: 10, border: "none", background: C.surfaceMuted, fontSize: 14, fontFamily: "inherit" }} />
          <Boton tipo="color" color={A.azul} data-sentir-guardar onClick={() => onGuardar({ nota, frase: frase.trim() })} style={{ marginTop: 10, minHeight: 44, fontSize: 15 }}>Guardar</Boton>
        </>
      )}
    </Tarjeta>
  );
}

const linea = (t, a, d) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: "1px solid " + C.divider, fontSize: 14 }}>
    <span style={{ color: C.text }}>{t}</span>
    <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums" }}>{a} → <b style={{ color: C.text }}>{d}</b></span>
  </div>
);

/** El final de la prueba: antes contra durante, y tu eliges. */
export function FinPrueba({ comp, onQuedarme, onVolver }) {
  const { antes: a, durante: d } = comp;
  const pct = (x, t) => (t ? Math.round(x / t * 100) + " %" : "—");
  return (
    <Tarjeta data-fin-prueba style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700, color: C.text }}>
        <Icono nombre="grafica" tam={18} color={A.azul} /> Se acabó la prueba de 2 semanas
      </div>
      <div style={{ fontSize: 13, color: C.textDim, margin: "4px 0 6px" }}>Las 2 semanas de antes → estas 2.</div>
      {linea("Sesiones hechas", a.hechas + "/" + a.sesiones + " (" + pct(a.hechas, a.sesiones) + ")", d.hechas + "/" + d.sesiones + " (" + pct(d.hechas, d.sesiones) + ")")}
      {linea("Días con cuello", a.cuello + "/" + a.dias, d.cuello + "/" + d.dias)}
      {linea("Días cumplidos", a.cumplidos + "/" + a.dias, d.cumplidos + "/" + d.dias)}
      {linea("Cómo te sentiste", a.sentir ?? "—", d.sentir ?? "—")}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Boton tipo="color" color={A.verde} data-quedarme onClick={onQuedarme} style={{ flex: 1, minHeight: 46, fontSize: 15 }}>Me quedo así</Boton>
        <Boton tipo="suave" data-volver onClick={onVolver} style={{ flex: 1, minHeight: 46, fontSize: 15 }}>Volver al plan anterior</Boton>
      </div>
    </Tarjeta>
  );
}
