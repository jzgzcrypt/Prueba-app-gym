"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ICON_CUELLO, ICON_GUERRERO, ICON_MAGIA } from "@/domain/assets/icons";
import { getPilarGuerreroDelDia } from "@/domain/habilidades/guerrero";
import { getTrucoSemana } from "@/domain/habilidades/magia";
import { habitoEnPausa } from "@/domain/salud/cuello";
// Fila de lista colapsable: cerrada muestra icono + titulo + estado. Abierta muestra children.
export function PainBlock({ dayKey, expandedBlock, toggleBlock, painLog, setPainLog }) {
  const isOpen = expandedBlock === "molestias";
  const today = painLog[dayKey] || {};
  const zonas = [["cuello","Cuello"],["hombro","Hombro"],["rodilla","Rodilla"]];
  const anyRecorded = zonas.some(([k]) => today[k] != null);
  const maxLevel = anyRecorded ? Math.max(...zonas.map(([k]) => today[k] || 0)) : 0;

  const setLevel = (zona, level) => {
    setPainLog(p => Object.assign({}, p, {
      [dayKey]: Object.assign({}, p[dayKey], { [zona]: (p[dayKey] && p[dayKey][zona] === level) ? null : level })
    }));
  };

  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, overflow: "hidden" }}>
      <div onClick={() => toggleBlock("molestias")} className="block" style={{
        display: "flex", alignItems: "center", gap: SP.md, padding: "13px " + SP.lg + "px", minHeight: TAP_MIN, cursor: "pointer",
      }}>
        <span style={{ ...TYPE.cardTitle, color: C.text, flex: 1 }}>Molestias</span>
        {anyRecorded && (
          <span style={{ fontSize: 11.5, fontWeight: 700, color: maxLevel >= 4 ? CAT.running : maxLevel >= 2 ? C.amber : C.ok }}>
            máx {maxLevel}/5
          </span>
        )}
        <span style={{ fontSize: 14, color: C.textFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>&rsaquo;</span>
      </div>
      {isOpen && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px", borderTop: "1px solid " + C.divider, paddingTop: SP.md }}>
          <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: SP.md, lineHeight: 1.4 }}>1 = nada · 5 = intensa. Toca para registrar, vuelve a tocar para quitar.</div>
          {zonas.map(([key, label]) => (
            <div key={key} style={{ marginBottom: SP.md }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 6 }}>{label}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1,2,3,4,5].map(n => {
                  const active = today[key] === n;
                  const color = n >= 4 ? CAT.running : n >= 2 ? C.amber : C.ok;
                  return (
                    <button key={n} className="btn" onClick={() => setLevel(key, n)} style={{
                      flex: 1, height: 36, borderRadius: R.sm,
                      background: active ? color : C.surfaceMuted, border: active ? "none" : "1px solid #D4D4D1",
                      color: active ? "#FAFAF9" : C.textDim, fontSize: 13, fontWeight: 800,
                    }}>{n}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HabitBlock({ cuelloEj, cM, cT, cN, cuelloTotal, toggleCuello, expandedBlock, toggleBlock }) {
  const isOpen = expandedBlock === "cuello";
  const allDone = cuelloTotal === 3;
  return (
    <div style={{
      background: "#F0F5F8", border: "1px solid #D8E5EC", borderRadius: R.xl, overflow: "hidden",
    }}>
      <div onClick={() => toggleBlock("cuello")} className="block" style={{
        display: "flex", alignItems: "center", gap: SP.md, padding: "13px " + SP.lg + "px", minHeight: TAP_MIN, cursor: "pointer",
      }}>
        <img src={ICON_CUELLO} alt="" style={{ width: 19, height: 19, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...TYPE.cardTitle, color: C.text }}>Cuello</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: CAT.cuello, background: CAT.cuello + "16", padding: "2px 6px", borderRadius: R.sm, letterSpacing: 0.3 }}>BASE DIARIA</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[cM, cT, cN].map((v, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: v ? CAT.cuello : "transparent", border: "1.5px solid " + CAT.cuello }} />
          ))}
        </div>
        <span style={{ fontSize: 14, color: C.textFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>&rsaquo;</span>
      </div>
      {isOpen && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px", borderTop: "1px solid #D8E5EC", paddingTop: SP.md }}>
          {cuelloEj.contexto && (
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.5, marginBottom: 10 }}>{cuelloEj.contexto}</div>
          )}
          <div style={{ marginTop: 4, marginBottom: 4 }}>
            {cuelloEj.pasos.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: CAT.cuello, flexShrink: 0 }}>{i+1}.</span>
                <span style={{ fontSize: 12.5, color: "#4A4A47", lineHeight: 1.45 }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "9px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 2 }}>CÓMO DEBE SENTIRSE</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{cuelloEj.sensacion}</div>
          </div>
          {cuelloEj.aplicacion && (
            <div style={{ background: CAT.cuello + "0D", border: "1px solid " + CAT.cuello + "25", borderRadius: 10, padding: "9px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: CAT.cuello, letterSpacing: 0.5, marginBottom: 2 }}>PARA QUÉ TE SIRVE ESTO</div>
              <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{cuelloEj.aplicacion}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {[["m","AL LEVANTARTE",cM],["t","PAUSA COMER",cT],["n","AL ACOSTARTE",cN]].map(arr => {
              const k = arr[0], label = arr[1], val = arr[2];
              return (
                <button key={k} className="block" onClick={() => toggleCuello(k)} style={{
                  flex: 1, padding: "12px 6px", borderRadius: 10, textAlign: "center",
                  background: val ? CAT.cuello : "#FFFFFF", border: val ? "none" : "1px solid #D8E5EC",
                }}>
                  <div style={{ fontSize: 15, marginBottom: 2, color: val ? "#FAFAF9" : "#D8E5EC" }}>{val ? "✓" : "○"}</div>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: val ? "#FAFAF9" : "#787774", letterSpacing: 0, lineHeight: 1.2 }}>{label}</div>
                </button>
              );
            })}
          </div>
          {allDone && (
            <div style={{ fontSize: 11, color: CAT.cuello, fontWeight: 700, marginTop: 8, textAlign: "center" }}>Hecho. Eso es lo único que tiene que pasar sí o sí hoy.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function GuerreroBlock({ day, dayKey, guerreroLog, setGuerreroLog, expandedBlock, toggleBlock }) {
  if (!day) return null;
  const isOpen = expandedBlock === "guerrero";
  const pilarDia = getPilarGuerreroDelDia(day.weekN, day.dayIdx);
  const practicadoHoy = !!guerreroLog[dayKey];
  const enPausa = habitoEnPausa(day.weekN);
  const colorGuerrero = "#3A3A38"; // gris carbon — serio, distinto de todo lo demas

  return (
    <div style={{ background: "#F2F1EF", border: "1px solid #DCDAD6", borderRadius: R.xl, overflow: "hidden", opacity: enPausa ? 0.6 : 1 }}>
      <div onClick={() => toggleBlock("guerrero")} className="block" style={{
        display: "flex", alignItems: "center", gap: SP.md, padding: "13px " + SP.lg + "px", minHeight: TAP_MIN, cursor: "pointer",
      }}>
        <img src={ICON_GUERRERO} alt="" style={{ width: 19, height: 19, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...TYPE.cardTitle, color: C.text }}>Guerrero</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: colorGuerrero, background: colorGuerrero + "14", padding: "2px 6px", borderRadius: R.sm, letterSpacing: 0.3 }}>{enPausa ? "EN PAUSA" : "HABILIDAD"}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{enPausa ? "En pausa hasta semana 6 — sin exigencia estas semanas" : "Al llegar a casa, antes de sentarte"}</div>
        </div>
        {practicadoHoy && <span style={{ fontSize: 13, color: colorGuerrero }}>✓</span>}
        <span style={{ fontSize: 14, color: C.textFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>&rsaquo;</span>
      </div>
      {isOpen && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px", borderTop: "1px solid #DCDAD6", paddingTop: SP.md }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: colorGuerrero, letterSpacing: 0.5 }}>{pilarDia.nombre.toUpperCase()} · NIVEL {pilarDia.nivel}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6 }}>{pilarDia.nivelNombre}</div>

          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 3 }}>QUÉ NECESITAS</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{pilarDia.necesitas}</div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: colorGuerrero, letterSpacing: 0.5, marginBottom: 6 }}>MÉTODO</div>
            {pilarDia.metodo.map((paso, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: colorGuerrero, flexShrink: 0 }}>{i+1}.</span>
                <span style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.45 }}>{paso}</span>
              </div>
            ))}
          </div>

          <div style={{ background: colorGuerrero + "0D", border: "1px solid " + colorGuerrero + "25", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: colorGuerrero, letterSpacing: 0.5, marginBottom: 3 }}>CÓMO SABER QUE PROGRESAS</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{pilarDia.verificable}</div>
          </div>

          {pilarDia.reglas && (
            <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: CAT.running, letterSpacing: 0.5, marginBottom: 6 }}>3 REGLAS PARA NO LESIONARTE</div>
              {pilarDia.reglas.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: i < pilarDia.reglas.length - 1 ? 6 : 0 }}>
                  <span style={{ fontSize: 11, color: CAT.running, flexShrink: 0 }}>{i+1}.</span>
                  <span style={{ fontSize: 11.5, color: "#4A4A47", lineHeight: 1.4 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          <button className="block" onClick={() => setGuerreroLog(p => Object.assign({}, p, { [dayKey]: !p[dayKey] }))} style={{
            width: "100%", padding: "12px 6px", borderRadius: 10, textAlign: "center",
            background: practicadoHoy ? colorGuerrero : "#FFFFFF", border: practicadoHoy ? "none" : "1px solid #DCDAD6",
          }}>
            <div style={{ fontSize: 15, marginBottom: 2, color: practicadoHoy ? "#FAFAF9" : "#C7C5C1" }}>{practicadoHoy ? "✓" : "○"}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: practicadoHoy ? "#FAFAF9" : "#787774" }}>PRACTICADO HOY</div>
          </button>
        </div>
      )}
    </div>
  );
}

export function MagiaBlock({ day, dayKey, magiaProgress, setMagiaProgress, magiaLog, setMagiaLog, expandedBlock, toggleBlock, onOpenCatalogo }) {
  if (!day) return null;
  const isOpen = expandedBlock === "magia";
  const truco = getTrucoSemana(day.weekN);
  const practicadoHoy = !!magiaLog[dayKey];
  const dominado = truco && !!magiaProgress[truco.id];
  const enPausa = habitoEnPausa(day.weekN);
  const colorMagia = "#6B4C8A"; // ciruela — distinto de todo lo demas

  if (!truco) return null;

  return (
    <div style={{ background: "#F5F1F8", border: "1px solid #E2D5EC", borderRadius: R.xl, overflow: "hidden", opacity: enPausa ? 0.6 : 1 }}>
      <div onClick={() => toggleBlock("magia")} className="block" style={{
        display: "flex", alignItems: "center", gap: SP.md, padding: "13px " + SP.lg + "px", minHeight: TAP_MIN, cursor: "pointer",
      }}>
        <img src={ICON_MAGIA} alt="" style={{ width: 19, height: 19, objectFit: "contain", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...TYPE.cardTitle, color: C.text }}>Magia</span>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: colorMagia, background: colorMagia + "16", padding: "2px 6px", borderRadius: R.sm, letterSpacing: 0.3 }}>{enPausa ? "EN PAUSA" : "HABILIDAD"}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>{enPausa ? "En pausa hasta semana 6 — sin exigencia estas semanas" : "Últimos 10 min antes de dormir"}</div>
        </div>
        {practicadoHoy && <span style={{ fontSize: 13, color: colorMagia }}>✓</span>}
        <span style={{ fontSize: 14, color: C.textFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>&rsaquo;</span>
      </div>
      {isOpen && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px", borderTop: "1px solid #E2D5EC", paddingTop: SP.md }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: colorMagia, letterSpacing: 0.5 }}>TRUCO ACTUAL</span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: "#787774", background: "#FFFFFF", padding: "1px 6px", borderRadius: 5 }}>{truco.dificultad}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 6 }}>{truco.nombre}</div>
          <div style={{ fontSize: 12.5, color: "#4A4A47", lineHeight: 1.5, marginBottom: 12 }}>{truco.descripcion}</div>

          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 3 }}>QUÉ NECESITAS</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{truco.necesitas}</div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: colorMagia, letterSpacing: 0.5, marginBottom: 6 }}>MÉTODO</div>
            {truco.metodo.map((paso, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 800, color: colorMagia, flexShrink: 0 }}>{i+1}.</span>
                <span style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.45 }}>{paso}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#787774", letterSpacing: 0.5, marginBottom: 3 }}>CÓMO PRESENTARLO</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{truco.presentacion}</div>
          </div>

          <div style={{ background: colorMagia + "10", border: "1px solid " + colorMagia + "30", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: colorMagia, letterSpacing: 0.5, marginBottom: 3 }}>CUÁNDO LO DOMINAS</div>
            <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.4 }}>{truco.dominio}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="block" onClick={() => setMagiaLog(p => Object.assign({}, p, { [dayKey]: !p[dayKey] }))} style={{
              flex: 1, padding: "12px 6px", borderRadius: 10, textAlign: "center",
              background: practicadoHoy ? colorMagia : "#FFFFFF", border: practicadoHoy ? "none" : "1px solid #E2D5EC",
            }}>
              <div style={{ fontSize: 15, marginBottom: 2, color: practicadoHoy ? "#FAFAF9" : "#D8C5E2" }}>{practicadoHoy ? "✓" : "○"}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: practicadoHoy ? "#FAFAF9" : "#787774" }}>PRACTICADO HOY</div>
            </button>
            <button className="block" onClick={() => setMagiaProgress(p => Object.assign({}, p, { [truco.id]: !p[truco.id] }))} style={{
              flex: 1, padding: "12px 6px", borderRadius: 10, textAlign: "center",
              background: dominado ? "#2F7D4F" : "#FFFFFF", border: dominado ? "none" : "1px solid #E2D5EC",
            }}>
              <div style={{ fontSize: 15, marginBottom: 2, color: dominado ? "#FAFAF9" : "#D8C5E2" }}>{dominado ? "✓" : "○"}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: dominado ? "#FAFAF9" : "#787774" }}>YA LO DOMINO</div>
            </button>
          </div>

          {onOpenCatalogo && (
            <button className="btn" onClick={onOpenCatalogo} style={{
              width: "100%", marginTop: 10, padding: "10px", fontSize: 11.5, fontWeight: 700, color: colorMagia, textAlign: "center",
            }}>Ver todos los trucos (pasados y futuros) →</button>
          )}
        </div>
      )}
    </div>
  );
}

export function ListBlock({ id, expandedBlock, toggleBlock, icon, accent, title, statusText, statusDone, children }) {
  const isOpen = expandedBlock === id;
  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, overflow: "hidden" }}>
      <div onClick={() => toggleBlock(id)} className="block" style={{
        display: "flex", alignItems: "center", gap: SP.md, padding: "13px " + SP.lg + "px",
        minHeight: TAP_MIN, cursor: "pointer",
      }}>
        {icon && <img src={icon} alt="" style={{ width: 19, height: 19, objectFit: "contain", flexShrink: 0 }} />}
        <span style={{ ...TYPE.cardTitle, color: C.text, flex: 1 }}>{title}</span>
        {statusText && (
          <span style={{
            fontSize: 11.5, fontWeight: 700, color: statusDone ? C.ok : C.textDim,
            marginRight: 2, fontVariantNumeric: "tabular-nums",
          }}>{statusDone ? "✓ " + statusText : statusText}</span>
        )}
        <span style={{ fontSize: 14, color: C.textFaint, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>&rsaquo;</span>
      </div>
      {isOpen && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px", borderTop: "1px solid " + C.divider, paddingTop: SP.md }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function MoveDayBlock({ dayKey, weekN, dayIdx, day, week, postponed, setPostponed }) {
  const [open, setOpen] = useState(false);
  const otherDays = week.days.map((d, i) => ({ d, i })).filter(x => x.i !== dayIdx);
  const isPostponed = !!postponed[dayKey];

  const postponeTo = (targetDay) => {
    setPostponed(prev => Object.assign({}, prev, {
      [dayKey]: { destino: targetDay.dow + " " + targetDay.date, titulo: day.titulo }
    }));
    setOpen(false);
  };

  const cancelar = () => {
    setPostponed(prev => {
      const next = Object.assign({}, prev);
      delete next[dayKey];
      return next;
    });
  };

  if (isPostponed) {
    return (
      <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#171717" }}>
          Movida a {postponed[dayKey].destino}
        </div>
        <button className="btn" onClick={cancelar} style={{ fontSize: 11, color: "#787774", fontWeight: 700, marginTop: 3 }}>Deshacer</button>
      </div>
    );
  }

  return (
    <div style={{ background: "transparent", borderRadius: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ padding: "6px 4px", cursor: "pointer" }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#A8A8A5" }}>¿Mover a otro día? &rsaquo;</div>
      </button>
      {open && (
        <div style={{ padding: "4px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>
          {otherDays.map(({ d, i }) => (
            <button key={i} className="btn" onClick={() => postponeTo(d)} style={{
              textAlign: "left", padding: "10px 12px", background: "#F2F2F0", borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: C.text,
            }}>
              Mover a {d.dow} ({d.date})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BigBlock({ label, title, sub, accent, icon, children }) {
  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "4px solid " + accent, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
        <div style={{ fontSize: 10, fontWeight: 800, color: accent, letterSpacing: 1 }}>{label}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginTop: 4, lineHeight: 1.25 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: C.textDim, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
      {children}
    </div>
  );
}

export function MovBlock({ bloque, label, done, onToggle, onOpen }) {
  const [open, setOpen] = useState(false);
  if (bloque.length === 0) return null;
  return (
    <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + CAT.movilidad, borderRadius: R.xl, overflow: "hidden" }}>
      <div style={{ padding: SP.md + "px " + SP.lg + "px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: SP.sm }}>
        <div onClick={() => setOpen(!open)} style={{ flex: 1, cursor: "pointer", minHeight: 36, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...TYPE.sectionLabel, color: CAT.movilidad }}>{label}</div>
          <div style={{ ...TYPE.cardTitle, fontSize: 13.5, color: C.text, marginTop: 3 }}>{bloque.length} ejercicios · toca para ver</div>
        </div>
        <button className="btn" onClick={onToggle} style={{
          width: TAP_MIN, height: TAP_MIN, borderRadius: R.md, background: done ? C.ok : C.surfaceMuted,
          border: done ? "none" : "1px solid #D4D4D1", color: done ? "#FAFAF9" : C.textDim,
          fontSize: 17, fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>{done ? "✓" : ""}</button>
      </div>
      {open && (
        <div className="expand-in" style={{ padding: "0 " + SP.lg + "px " + SP.lg + "px" }}>
          {bloque.map((m,i) => (
            <div key={i} onClick={() => onOpen(m.id)} className="btn" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px " + SP.md + "px",
              background: C.surfaceMuted, borderRadius: R.md, marginBottom: SP.xs + 2, cursor: "pointer", minHeight: 40,
            }}>
              <span style={{ ...TYPE.bodyStrong, fontSize: 13, color: "#3A3A38" }}>{m.ex}</span>
              <span className="mono" style={{ fontSize: 11, color: C.textDim }}>{m.t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
