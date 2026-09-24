"use client";

import { useState } from "react";
import { C, CAT, TAP_MIN } from "@/design/tokens";
import { FLAT_DAYS, claveDia } from "@/domain/plan/calendario";
import { progresion, recordsDelDia, seriesDe, textoSeries, ultimaVez } from "@/domain/fuerza/registro";
import { LecturaSesion, queApuntar } from "@/features/ui/lectura";

/**
 * Lo que sale al terminar una sesion: la pagina de la libreta.
 *
 * Antes marcabas la sesion y no pasaba nada. Ahora ves lo de hoy contra lo de
 * la ultima vez: las series de cada ejercicio (peso x reps) y si has
 * progresado, o el ritmo de las series de running contra lo que pedian, o lo
 * que dice una prueba del objetivo. Sin confeti ni rachas.
 */
export function CierreSesion({ dayKey, workoutWeights, workoutReps, ritmoReal, onGuardarRitmo, onVolver }) {
  const day = FLAT_DAYS.find(d => claveDia(d) === dayKey);
  const [texto, setTexto] = useState(ritmoReal[dayKey] || "");
  const [guardado, setGuardado] = useState(ritmoReal[dayKey] || "");
  if (!day) return null;

  const esFuerza = day.tipo === "fuerza";
  const acento = esFuerza ? CAT.fuerza : CAT.running;
  const filas = esFuerza ? day.ejercicios.map((ej, idx) => {
    const hoy = seriesDe(day.isoDate, idx, workoutWeights, workoutReps);
    const antes = ultimaVez(ej.nombre, day.isoDate, FLAT_DAYS, workoutWeights, workoutReps);
    return { nombre: ej.nombre, hoy, antes, prog: antes ? progresion(hoy, antes.series) : null };
  }) : [];
  const conDatos = filas.filter(f => f.hoy.length);
  const records = esFuerza ? recordsDelDia(day, FLAT_DAYS, workoutWeights, workoutReps) : [];
  const esRecord = new Set(records.map(r => r.nombre));
  const subidas = filas.filter(f => f.prog && (f.prog.tipo === "peso" || f.prog.tipo === "reps")).length;
  const apuntar = queApuntar(day);

  const guardar = () => { onGuardarRitmo(dayKey, texto); setGuardado(texto); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "-apple-system, 'Inter', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        input { font-family: inherit; }
        .btn { transition: opacity 0.1s, transform 0.1s; }
        .btn:active { opacity: 0.65; transform: scale(0.97); }
        .mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; }
      `}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 16px 32px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: acento, letterSpacing: 0.8 }}>SESIÓN HECHA · {day.date}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginTop: 4, lineHeight: 1.2 }}>{day.titulo}</div>

        {records.length > 0 && (
          <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, background: "#FDF6E3", border: "1px solid #E8D9A8" }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#946800", letterSpacing: 0.8 }}>
              {records.length === 1 ? "NUEVO RÉCORD" : records.length + " RÉCORDS NUEVOS"}
            </div>
            {records.map((r, i) => (
              <div key={i} style={{ fontSize: 15, fontWeight: 800, color: C.text, marginTop: 4 }}>
                {r.nombre}: <span className="mono">{r.texto}</span>
              </div>
            ))}
          </div>
        )}

        {esFuerza && (
          <div style={{ marginTop: 18, background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "6px 16px" }}>
            {conDatos.length === 0 && (
              <div style={{ padding: "12px 0", fontSize: 13, color: C.textDim, lineHeight: 1.45 }}>
                No apuntaste series hoy. La próxima vez, cada serie es un toque: es lo que te dirá si el hombro está creciendo.
              </div>
            )}
            {filas.map((f, i) => {
              const color = !f.prog ? C.textDim : f.prog.tipo === "peso" || f.prog.tipo === "reps" ? C.ok : C.textDim;
              const etiqueta = !f.prog ? (f.hoy.length ? "Primera vez" : "")
                : f.prog.tipo === "peso" ? "+" + f.prog.valor + " kg"
                : f.prog.tipo === "reps" ? "+" + f.prog.valor + " reps"
                : f.prog.tipo === "baja" ? f.prog.valor + " kg" : "Igual";
              return (
                <div key={i} style={{ padding: "11px 0", borderTop: i ? "1px solid " + C.divider : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, flex: 1, minWidth: 0 }}>{f.nombre}</div>
                    {esRecord.has(f.nombre) && (
                      <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 0.5, color: "#FAFAF9", background: "#946800",
                                     borderRadius: 999, padding: "3px 8px", flexShrink: 0 }}>RÉCORD</span>
                    )}
                    {etiqueta && <div style={{ fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>{etiqueta}</div>}
                  </div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: f.hoy.length ? C.text : C.textFaint, marginTop: 3 }}>
                    {f.hoy.length ? textoSeries(f.hoy) : "sin apuntar"}
                  </div>
                  {f.antes && (
                    <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>
                      Antes ({f.antes.fecha}): {textoSeries(f.antes.series)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {esFuerza && subidas > 0 && (
          <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: C.ok }}>
            Hoy has progresado en {subidas} {subidas === 1 ? "ejercicio" : "ejercicios"}.
          </div>
        )}

        {!esFuerza && (
          <div style={{ marginTop: 18, background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.textDim, letterSpacing: 0.5, marginBottom: 6 }}>{apuntar.label}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={texto} onChange={e => setTexto(e.target.value)} placeholder={apuntar.ph}
                style={{ flex: 1, minWidth: 0, fontSize: 15, padding: "10px 12px", borderRadius: 10,
                         background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none" }} />
              <button className="btn" onClick={guardar} disabled={!texto.trim()} style={{
                minWidth: TAP_MIN, fontSize: 13, fontWeight: 800, color: "#FAFAF9", background: C.accent,
                padding: "0 16px", borderRadius: 10, opacity: texto.trim() ? 1 : 0.4,
              }}>OK</button>
            </div>
            {guardado && <LecturaSesion day={day} texto={guardado} ritmoReal={Object.assign({}, ritmoReal, { [dayKey]: guardado })} />}
            {!guardado && (
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 8, lineHeight: 1.4 }}>
                Míralo en Strava y apúntalo ahora: mañana ya no te acordarás.
              </div>
            )}
          </div>
        )}

        <button className="btn" onClick={onVolver} style={{
          width: "100%", marginTop: 20, padding: "15px", borderRadius: 12, background: acento,
          fontSize: 15, fontWeight: 900, color: "#FAFAF9", letterSpacing: 0.3,
        }}>VOLVER A HOY</button>
      </div>
    </div>
  );
}
