"use client";

import { useState } from "react";
import { C, CAT } from "@/design/tokens";
import { FLAT_DAYS } from "@/domain/plan/calendario";
import { textoTiempo } from "@/domain/progreso/libreta";
import { textoDiferencia, tuContraElPlan } from "@/domain/progreso/plan-vs-real";

const PLAN = "#8A8A87";
const TU = CAT.running;

/** La proxima prueba cronometrada, para decir cuando llega el primer dato. */
function proximaPrueba(ritmoReal) {
  return FLAT_DAYS.find(d => d.prueba && d.prueba.distKm && d.prueba.distKm !== 7 && !ritmoReal[d.isoDate]);
}

/** Una linea en HOY: la respuesta a "¿voy segun plan?" sin abrir nada. */
export function LineaPlan({ ritmoReal, onVer }) {
  const r = tuContraElPlan(FLAT_DAYS, ritmoReal);
  const prox = proximaPrueba(ritmoReal);
  const texto = r.ultimo ? textoDiferencia(r.diferencia)
    : prox ? "Primer dato: " + prox.dow.toLowerCase() + " " + prox.date + ", prueba de " + prox.prueba.distKm + " km" : null;
  if (!texto) return null;
  const color = !r.ultimo ? C.textDim : r.diferencia <= 5 ? C.ok : C.amber;
  return (
    <button className="btn" onClick={onVer} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", minHeight: 44,
      background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 12, textAlign: "left",
    }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6, flexShrink: 0 }}>TÚ vs PLAN</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color }}>{texto}</span>
      <span style={{ color: C.textFaint, fontSize: 16 }}>›</span>
    </button>
  );
}

/**
 * La grafica: tu 7K equivalente contra el que el plan espera, semana a semana.
 * Arriba es mas rapido. Por encima de la linea del plan = por delante.
 */
export function GraficoPlan({ ritmoReal }) {
  const r = tuContraElPlan(FLAT_DAYS, ritmoReal);
  const [sel, setSel] = useState(null);
  const elegido = sel != null ? r.puntos[sel] : r.ultimo;

  const W = 340, H = 190, L = 44, R = 14, T = 14, B = 24;
  const xMax = r.linea.length ? r.linea.at(-1).x : 12;
  const segs = [...r.linea.map(p => p.seg), ...r.puntos.map(p => p.seg)];
  const yMin = Math.floor((Math.min(...segs) - 20) / 60) * 60;
  const yMax = Math.ceil((Math.max(...segs) + 20) / 60) * 60;
  const px = (x) => L + (x - 1) / (xMax - 1) * (W - L - R);
  // Tiempo menor (mas rapido) arriba.
  const py = (s) => T + (s - yMin) / (yMax - yMin) * (H - T - B);
  const ticks = []; for (let s = yMin; s <= yMax; s += 60) ticks.push(s);
  const semanas = [1, 3, 5, 7, 9, 11];
  const ruta = (ps) => ps.map((p, i) => (i ? "L" : "M") + px(p.x).toFixed(1) + " " + py(p.seg).toFixed(1)).join(" ");

  const prox = proximaPrueba(ritmoReal);
  const color = !r.ultimo ? C.textDim : r.diferencia <= 5 ? C.ok : C.amber;

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1.15 }}>
        {r.ultimo ? textoDiferencia(r.diferencia) : "Aún sin datos"}
      </div>
      <div style={{ fontSize: 12.5, color: "#4A4A47", marginTop: 4, lineHeight: 1.45 }}>
        {elegido
          ? <>Tu 7K {elegido.tipo === "series" ? "estimado" : "equivalente"} {elegido === r.ultimo ? "hoy" : "el " + elegido.dia.date}: <b>{textoTiempo(elegido.seg)}</b> · el plan esperaba {textoTiempo(elegido.plan)}</>
          : prox ? <>El primer dato llega con la prueba de {prox.prueba.distKm} km, el {prox.dow.toLowerCase()} {prox.date}. Después, cada sesión de series suma un punto.</>
          : null}
      </div>
      {elegido && (
        <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>
          {elegido.tipo === "prueba"
            ? "De la " + elegido.dia.titulo.toLowerCase() + " (" + elegido.texto + ")."
            : "Estimado de las series del " + elegido.dia.date + " (" + elegido.texto + "). Las pruebas lo confirman."}
        </div>
      )}

      <svg viewBox={"0 0 " + W + " " + H} width="100%" role="img" aria-label="Tu 7K equivalente contra el plan" style={{ display: "block", marginTop: 10, overflow: "visible" }}>
        {ticks.map(s => (
          <g key={s}>
            <line x1={L} x2={W - R} y1={py(s)} y2={py(s)} stroke={C.divider} strokeWidth="1" />
            <text x={L - 6} y={py(s) + 3.5} textAnchor="end" fontSize="10" fill={C.textDim} fontFamily="JetBrains Mono, monospace">{textoTiempo(s)}</text>
          </g>
        ))}
        {semanas.map(w => (
          <text key={w} x={px(w)} y={H - 6} textAnchor="middle" fontSize="10" fill={C.textDim}>S{w}</text>
        ))}
        <text x={L} y={T - 4} fontSize="9.5" fill={C.textDim} fontWeight="700">↑ más rápido</text>

        {r.linea.length > 0 && (
          <>
            <path d={ruta(r.linea)} fill="none" stroke={PLAN} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
            <text x={px(r.linea[0].x) + 4} y={py(r.linea[0].seg) - 6} fontSize="10.5" fontWeight="700" fill={C.textDim}>Plan</text>
            <circle cx={px(r.linea.at(-1).x)} cy={py(r.linea.at(-1).seg)} r="4" fill={PLAN} />
            <text x={px(r.linea.at(-1).x) - 6} y={py(r.linea.at(-1).seg) + 15} textAnchor="end" fontSize="10.5" fontWeight="800" fill={C.text}>33:15</text>
          </>
        )}

        {r.puntos.length > 1 && <path d={ruta(r.puntos)} fill="none" stroke={TU} strokeWidth="2" strokeLinejoin="round" />}
        {r.puntos.map((p, i) => {
          const activo = elegido === p;
          return (
            <g key={i} onClick={() => setSel(i)} style={{ cursor: "pointer" }}>
              <circle cx={px(p.x)} cy={py(p.seg)} r="16" fill="transparent" />
              <circle cx={px(p.x)} cy={py(p.seg)} r={activo ? 6 : 4.5}
                fill={p.tipo === "prueba" ? TU : C.card} stroke={activo ? C.text : TU} strokeWidth="2" />
            </g>
          );
        })}
        {r.ultimo && (
          <text x={px(r.ultimo.x)} y={py(r.ultimo.seg) - 10} textAnchor="middle" fontSize="10.5" fontWeight="800" fill={C.text}>Tú</text>
        )}
      </svg>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6, fontSize: 11, color: C.textDim, fontWeight: 600 }}>
        <span><span style={{ color: TU, fontWeight: 900 }}>●</span> prueba</span>
        <span><span style={{ color: TU, fontWeight: 900 }}>○</span> series (estimado)</span>
        <span><span style={{ color: PLAN, fontWeight: 900, letterSpacing: -1 }}>- -</span> plan</span>
        {r.puntos.length > 0 && <span>Toca un punto para ver de dónde sale</span>}
      </div>
    </div>
  );
}
