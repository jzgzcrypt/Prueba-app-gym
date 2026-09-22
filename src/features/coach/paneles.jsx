"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { BLOQUE, DATE_MAP, FECHA_FIN, RANGO_BLOQUE, WEEKS, claveDia, claveSemana, todayLocalIso } from "@/domain/plan/calendario";
import { REGLAS_BLOQUE } from "@/domain/plan/bloque-1-base-7k";
import { SectionHeader } from "@/features/ui/headers";
/** Dias enteros transcurridos desde una fecha "YYYY-MM-DD" hasta hoy. */
function diasDesde(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const then = Date.UTC(y, m - 1, d);
  const hoy = todayLocalIso().split("-").map(Number);
  const now = Date.UTC(hoy[0], hoy[1] - 1, hoy[2]);
  return Math.max(0, Math.round((now - then) / 86400000));
}

export function PhaseAdjustContent({ currentWeekN, currentWeekOverride, setCurrentWeekOverride, phaseAdjustNote, setPhaseAdjustNote, exportData, importData, storageStatus, ultimoBackup, ultimoGuardado }) {
  const [noteDraft, setNoteDraft] = useState(phaseAdjustNote);
  const autoWeek = (() => {
    const todayIso = todayLocalIso();
    let w = WEEKS[0].n;
    for (const wk of WEEKS) for (const d of wk.days) if (DATE_MAP[d.date] <= todayIso) w = wk.n;
    return w;
  })();
  const isOverridden = currentWeekOverride != null;

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importData(file);
    e.target.value = "";
  };

  return (
    <div style={{ padding: "0 " + SP.lg + "px 30px", display: "flex", flexDirection: "column", gap: SP.md }}>
      <div style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.45 }}>
        Si la vida real se desvía del calendario (te pusiste enfermo, un viaje largo, etc), puedes indicar manualmente en qué semana del plan estás realmente. Esto no cambia fechas ni el calendario — solo ajusta qué semana ve Coach como &laquo;actual&raquo; para las alertas y el acumulado.
      </div>

      <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px" }}>
        <SectionHeader>SEMANA ACTUAL SEGÚN CALENDARIO</SectionHeader>
        <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: SP.md }}>Semana {autoWeek}</div>

        <SectionHeader>SEMANA REAL (AJUSTE MANUAL)</SectionHeader>
        <div style={{ display: "flex", gap: SP.sm, flexWrap: "wrap", marginBottom: SP.sm }}>
          {WEEKS.map(wk => (
            <button key={wk.n} className="btn" onClick={() => setCurrentWeekOverride(wk.n === autoWeek ? null : wk.n)} style={{
              width: 40, height: 40, borderRadius: R.md,
              background: (isOverridden ? currentWeekOverride : autoWeek) === wk.n ? C.accent : C.surfaceMuted,
              color: (isOverridden ? currentWeekOverride : autoWeek) === wk.n ? "#FAFAF9" : C.textDim,
              fontSize: 13, fontWeight: 800,
            }}>{wk.n}</button>
          ))}
        </div>
        {isOverridden && (
          <button className="btn" onClick={() => setCurrentWeekOverride(null)} style={{ fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>Volver al cálculo automático (Semana {autoWeek})</button>
        )}
      </div>

      <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px" }}>
        <SectionHeader>NOTA DE LA DESVIACIÓN</SectionHeader>
        <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
          placeholder="Ej: viaje de trabajo 5 días, retomo la semana 6 en vez de la 5..."
          style={{ width: "100%", minHeight: 70, fontSize: 13, padding: SP.md + "px", borderRadius: R.md, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
        <button className="btn" onClick={() => setPhaseAdjustNote(noteDraft)} style={{
          marginTop: SP.sm, padding: SP.sm + 2 + "px " + SP.lg + "px", borderRadius: R.md, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 12.5,
        }}>GUARDAR NOTA</button>
      </div>

      <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.md }}>
        <SectionHeader>GUARDADO AUTOMÁTICO</SectionHeader>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: storageStatus === "ok" ? C.ok : storageStatus === "error" ? CAT.running : "#D4D4D1",
          }} />
          <div style={{ fontSize: 12.5, color: "#4A4A47" }}>
            {storageStatus === "ok" && (
              ultimoGuardado
                ? "Guardado a las " + new Date(ultimoGuardado).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) +
                  ". Se guarda también al cerrar la app, no solo mientras la usas."
                : "Guardado correctamente. Se guarda también al cerrar la app."
            )}
            {storageStatus === "error" && "No se ha podido guardar. Puede ser que el navegador esté en modo privado o sin espacio: descarga una copia ahora mismo para no perder nada."}
            {storageStatus == null && "Esperando el primer cambio para confirmar el guardado..."}
          </div>
        </div>
      </div>

      <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px" }}>
        <SectionHeader>COPIA DE SEGURIDAD MANUAL</SectionHeader>
        <div style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.45, marginBottom: SP.md }}>
          El guardado automático ya protege tus datos en este artifact publicado. Usa esto solo como copia extra, o para llevar tus datos a otra cuenta o dispositivo.
        </div>
        {(() => {
          // Los datos viven en este navegador y en ningun sitio mas. El aviso no
          // es decorativo: hasta la Fase 2 (cuenta y base de datos) el backup es
          // lo unico que separa "he perdido el movil" de "he perdido el bloque".
          const dias = ultimoBackup ? diasDesde(ultimoBackup) : null;
          const urge = dias == null || dias >= 7;
          if (!urge) {
            return (
              <div style={{ ...TYPE.meta, color: C.textDim, marginBottom: 8 }}>
                Última copia hace {dias === 0 ? "menos de un día" : dias === 1 ? "1 día" : dias + " días"}.
              </div>
            );
          }
          return (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", marginBottom: 10,
                          background: C.card, border: "1px solid " + CAT.running, borderRadius: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: CAT.running, marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ ...TYPE.bodyStrong, color: C.text }}>
                  {ultimoBackup ? "Hace " + dias + " días de la última copia" : "No has hecho ninguna copia todavía"}
                </div>
                <div style={{ ...TYPE.body, color: C.textDim, marginTop: 2 }}>
                  Tus datos están solo en este navegador. Si pierdes el móvil o borras los
                  datos del sitio, se va el bloque entero. Descarga la copia y guárdala donde quieras.
                </div>
              </div>
            </div>
          );
        })()}
        <button className="btn" onClick={exportData} style={{
          width: "100%", padding: SP.sm + 2 + "px", borderRadius: R.md, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 12.5, marginBottom: SP.sm,
        }}>DESCARGAR COPIA (.json)</button>
        <label style={{
          display: "block", textAlign: "center", padding: SP.sm + 2 + "px", borderRadius: R.md,
          background: C.surfaceMuted, border: "1px dashed #D4D4D1", fontSize: 12.5, color: C.textDim, fontWeight: 700, cursor: "pointer",
        }}>
          IMPORTAR COPIA (.json)
          <input type="file" accept="application/json" onChange={handleImportFile} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

export function PaceComparisonChart({ data }) {
  const allVals = data.flatMap(d => [d.esperado, d.real].filter(v => v != null));
  const minV = Math.min(...allVals) - 10;
  const maxV = Math.max(...allVals) + 10;
  const range = maxV - minV || 1;
  const W = 320, H = 90, PAD = 8;

  const pointsEsperado = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
    const y = H - PAD - ((maxV - d.esperado) / range) * (H - PAD * 2);
    return { x, y };
  });
  const pointsReal = data.filter(d => d.real != null).map((d) => {
    const i = data.indexOf(d);
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2);
    const y = H - PAD - ((maxV - d.real) / range) * (H - PAD * 2);
    return { x, y };
  });

  const lineEsperado = pointsEsperado.map(p => p.x + "," + p.y).join(" ");
  const lineReal = pointsReal.map(p => p.x + "," + p.y).join(" ");

  return (
    <svg width="100%" viewBox={"0 0 " + W + " " + (H + 14)} style={{ display: "block" }}>
      <polyline points={lineEsperado} fill="none" stroke="#D4D4D1" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" />
      {pointsReal.length > 1 && <polyline points={lineReal} fill="none" stroke={CAT.running} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pointsReal.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={CAT.running} />)}
      {data.map((d, i) => (
        <text key={i} x={pointsEsperado[i].x} y={H + 10} fontSize="6.5" fill="#8A8A87" textAnchor="middle">S{d.semana}</text>
      ))}
    </svg>
  );
}

export function HitosContent({ bloquesHistorial, setBloquesHistorial, currentWeekN, checked }) {
  const [showCierre, setShowCierre] = useState(false);
  const [revisionDraft, setRevisionDraft] = useState("");
  const todayIso = todayLocalIso();

  const bloqueActivo = bloquesHistorial.find(b => b.estado === "activo") || bloquesHistorial[bloquesHistorial.length - 1];
  const diasParaFin = bloqueActivo ? Math.round((new Date(bloqueActivo.fin) - new Date(todayIso)) / (1000*60*60*24)) : null;
  const bloqueTerminado = diasParaFin != null && diasParaFin <= 0;

  // Adherencia del bloque activo, para dar contexto real al cerrarlo
  let diasHechos = 0, diasTotales = 0;
  WEEKS.forEach(wk => wk.days.forEach((d, di) => {
    if (d.tipo === "libre") return;
    diasTotales++;
    if (checked[claveDia(wk.days[di])]) diasHechos++;
  }));
  const adherenciaBloque = diasTotales > 0 ? Math.round((diasHechos / diasTotales) * 100) : 0;

  const cerrarBloque = () => {
    setBloquesHistorial(prev => prev.map(b =>
      b.numero === bloqueActivo.numero ? Object.assign({}, b, { estado: "cerrado", revision: revisionDraft }) : b
    ));
    setShowCierre(false);
    setRevisionDraft("");
  };

  return (
    <div style={{ padding: "0 " + SP.lg + "px 30px" }}>
      <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: SP.lg, lineHeight: 1.45 }}>
        El plan sigue en bloques encadenados. Cada bloque tiene su objetivo, y al llegar al hito de cierre revisamos juntos cómo fue y planificamos el siguiente en el chat.
      </div>

      {bloqueActivo && (
        <div style={{ background: bloqueTerminado ? "#FDF6E3" : C.card, border: "1px solid " + (bloqueTerminado ? "#E8D9A8" : C.cardBorder), borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.md }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.accent, marginBottom: 4 }}>
            {bloqueActivo.estado === "activo" ? "BLOQUE ACTIVO" : "ÚLTIMO BLOQUE"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 6 }}>{bloqueActivo.nombre}</div>
          <div style={{ fontSize: 12.5, color: "#4A4A47", marginBottom: 10 }}>Objetivo running: {bloqueActivo.objetivoRunning}</div>

          <div style={{ display: "flex", gap: SP.md, marginBottom: 10 }}>
            <div style={{ flex: 1, border: "1px solid " + C.cardBorder, borderRadius: R.md, padding: SP.sm + "px " + SP.md + "px" }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: bloqueTerminado ? C.amber : C.text }}>
                {bloqueTerminado ? "HITO" : diasParaFin}
              </div>
              <div style={{ fontSize: 9.5, color: C.textDim, fontWeight: 700 }}>{bloqueTerminado ? "LLEGÓ EL DÍA" : "DÍAS PARA EL HITO"}</div>
            </div>
            <div style={{ flex: 1, border: "1px solid " + C.cardBorder, borderRadius: R.md, padding: SP.sm + "px " + SP.md + "px" }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: adherenciaBloque >= 80 ? C.ok : C.amber }}>{adherenciaBloque}%</div>
              <div style={{ fontSize: 9.5, color: C.textDim, fontWeight: 700 }}>ADHERENCIA DEL BLOQUE</div>
            </div>
          </div>

          {bloqueActivo.estado === "activo" && (
            <button className="btn" onClick={() => setShowCierre(!showCierre)} style={{
              width: "100%", padding: SP.md + "px", borderRadius: R.md,
              background: bloqueTerminado ? C.accent : C.surfaceMuted,
              color: bloqueTerminado ? "#FAFAF9" : C.textDim, fontWeight: 800, fontSize: 12.5,
            }}>{bloqueTerminado ? "CERRAR BLOQUE Y REVISAR" : "Adelantar cierre del bloque"}</button>
          )}
        </div>
      )}

      {showCierre && bloqueActivo && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.md }}>
          <SectionHeader>REVISIÓN DEL BLOQUE</SectionHeader>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: SP.sm, lineHeight: 1.4 }}>
            ¿Cómo fue el objetivo? ¿Llegaste al ritmo, al volumen, cómo te sentiste? Esta nota es tu punto de partida cuando definas el siguiente bloque conmigo en el chat.
          </div>
          <textarea value={revisionDraft} onChange={e => setRevisionDraft(e.target.value)}
            placeholder="Ej: llegué a 4:52/km en vez de 4:45, hombro se nota mucho más ancho, cuello sin molestias desde semana 6..."
            style={{ width: "100%", minHeight: 90, fontSize: 13, padding: SP.md + "px", borderRadius: R.md, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: SP.sm }} />
          <button className="btn" onClick={cerrarBloque} style={{
            width: "100%", padding: SP.md + "px", borderRadius: R.md, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 12.5,
          }}>GUARDAR Y CERRAR BLOQUE</button>
        </div>
      )}

      <div style={{ fontSize: 11, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8, marginBottom: SP.sm, paddingLeft: 2 }}>HISTORIAL DE BLOQUES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: SP.sm }}>
        {bloquesHistorial.slice().reverse().map(b => (
          <div key={b.numero} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg, padding: SP.md + "px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{b.nombre}</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: b.estado === "activo" ? C.ok : C.textFaint }}>{b.estado.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{b.objetivoRunning}</div>
            {b.revision && (
              <div style={{ fontSize: 12, color: "#4A4A47", marginTop: 8, padding: SP.sm + "px", background: C.surfaceMuted, borderRadius: R.sm, lineHeight: 1.4 }}>{b.revision}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyLogContent({ weeklyLog, setWeeklyLog, currentWeekN, checked, ritmoReal, painLog, cuelloChecks, magiaLog, guerreroLog }) {
  const [editingWeek, setEditingWeek] = useState(null);
  const [draft, setDraft] = useState({ paso: "", porque: "", ajuste: "" });

  const weeksWithData = WEEKS.filter(w => w.n <= currentWeekN).slice().reverse();

  const startEdit = (clave) => {
    const v = weeklyLog[clave];
    setEditingWeek(clave);
    setDraft(v && typeof v === "object" ? { paso: v.paso || "", porque: v.porque || "", ajuste: v.ajuste || "" }
                                        : { paso: typeof v === "string" ? v : "", porque: "", ajuste: "" });
  };
  const save = (clave) => { setWeeklyLog(p => Object.assign({}, p, { [clave]: draft })); setEditingWeek(null); };
  const tieneAlgo = (v) => !!v && (typeof v === "string" ? !!v : !!(v.paso || v.porque || v.ajuste));

  // Las tres preguntas salen de tu propia bitacora: las notas que de verdad
  // sirvieron separaban que paso, por que, y que se ajusta. Preguntarlo por
  // separado es lo que convierte el registro en una decision.
  const CAMPOS = [
    { k: "paso",   label: "QUÉ PASÓ",    ph: "Los hechos, sin interpretarlos. 3 de 3 salidas, 0 de fuerza..." },
    { k: "porque", label: "POR QUÉ",     ph: "El motivo real, aunque no guste. Pereza en el momento, no falta de tiempo..." },
    { k: "ajuste", label: "QUÉ AJUSTO",  ph: "Qué cambia a partir de ahora. Si no cambia nada, escríbelo también." },
  ];

  return (
    <div style={{ padding: "0 16px 30px" }}>
      <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 14, lineHeight: 1.4 }}>
        Tres preguntas por semana. Separarlas es lo que hace que la revisión sirva
        para decidir algo, y no solo para dejar constancia.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {weeksWithData.map(wk => {
          const clave = claveSemana(wk);
          const isEditing = editingWeek === clave;
          const v = weeklyLog[clave];
          const hasLog = tieneAlgo(v);
          const datos = resumenSemana(wk, { checked, ritmoReal, painLog, cuelloChecks, magiaLog, guerreroLog });
          return (
            <div key={clave} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: C.text, marginBottom: 6 }}>SEMANA {wk.n} · {wk.dates}</div>

              {/* Los datos de la semana, al lado de las preguntas: se responde
                  mirando lo que pasó, no lo que uno recuerda. */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {datos.map((d, i) => (
                  <div key={i} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.2, padding: "3px 8px",
                                        borderRadius: 999, background: C.surfaceMuted, color: d.color || C.textDim }}>
                    {d.label} {d.valor}
                  </div>
                ))}
              </div>

              {isEditing ? (
                <div>
                  {CAMPOS.map(c => (
                    <div key={c.k} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: C.textFaint, marginBottom: 3 }}>{c.label}</div>
                      <textarea value={draft[c.k]} onChange={e => setDraft(p => Object.assign({}, p, { [c.k]: e.target.value }))}
                        placeholder={c.ph}
                        style={{ width: "100%", minHeight: 52, fontSize: 13, padding: "8px 10px", borderRadius: 8, border: "1px solid #D4D4D1", color: "#171717", outline: "none", fontFamily: "inherit", resize: "vertical" }} />
                    </div>
                  ))}
                  <button className="btn" onClick={() => save(clave)} style={{ fontSize: 11.5, fontWeight: 800, color: "#FAFAF9", background: C.accent, padding: "8px 16px", borderRadius: 8, minHeight: TAP_MIN - 10 }}>GUARDAR REVISIÓN</button>
                </div>
              ) : hasLog ? (
                <div onClick={() => startEdit(clave)} style={{ cursor: "text" }}>
                  {CAMPOS.map(c => {
                    const texto = typeof v === "string" ? (c.k === "paso" ? v : "") : (v[c.k] || "");
                    if (!texto) return null;
                    return (
                      <div key={c.k} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, color: C.textFaint }}>{c.label}</div>
                        <div style={{ fontSize: 13, color: "#4A4A47", background: C.surfaceMuted, borderRadius: 8, padding: "7px 10px", marginTop: 2 }}>{texto}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <button className="btn" onClick={() => startEdit(clave)} style={{ fontSize: 11.5, color: "#8A8A87", fontWeight: 700, minHeight: TAP_MIN - 14 }}>+ Revisar esta semana</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Lo que de verdad paso esa semana, sacado de los registros y no de la memoria.
 *  Va al lado de las preguntas para que la revision se responda con datos. */
function resumenSemana(wk, { checked, ritmoReal, painLog, cuelloChecks, magiaLog, guerreroLog }) {
  const claves = wk.days.map(claveDia);
  const cuenta = (filtro) => wk.days.reduce((n, d) => n + (filtro(d) && checked[claveDia(d)] ? 1 : 0), 0);
  const total = (filtro) => wk.days.filter(filtro).length;

  const esRun = (d) => d.tipo === "run" || d.tipo === "test" || d.tipo === "objetivo";
  const esFuerza = (d) => d.tipo === "fuerza";
  const esTenis = (d) => d.tipo === "compromiso";

  const ritmos = claves.map(k => ritmoReal[k]).filter(Boolean);
  const habitos = claves.reduce((n, k) =>
    n + (magiaLog[k] ? 1 : 0) + (guerreroLog[k] ? 1 : 0) +
    (["m","t","n"].some(m => cuelloChecks[k + "-" + m]) ? 1 : 0), 0);
  const dolores = claves.map(k => painLog[k]).filter(Boolean)
    .flatMap(p => Object.values(p)).filter(v => v >= 3).length;

  const out = [];
  const tRun = total(esRun), tFue = total(esFuerza), tTen = total(esTenis);
  if (tRun) out.push({ label: "Running", valor: cuenta(esRun) + "/" + tRun, color: cuenta(esRun) === tRun ? C.ok : C.textDim });
  if (tFue) out.push({ label: "Fuerza", valor: cuenta(esFuerza) + "/" + tFue, color: cuenta(esFuerza) === tFue ? C.ok : C.textDim });
  if (tTen) out.push({ label: "Tenis", valor: cuenta(esTenis) + "/" + tTen, color: cuenta(esTenis) === tTen ? C.ok : C.textDim });
  out.push({ label: "Hábitos", valor: String(habitos), color: habitos > 0 ? C.ok : C.amber });
  if (ritmos.length) out.push({ label: "Ritmo", valor: ritmos.join(" · ") });
  if (dolores) out.push({ label: "Dolor ≥3", valor: String(dolores), color: C.amber });
  return out;
}

export function PlanGlobalContent({ jumpToDay, setWeekIdx, onJumpAway, checked }) {
  const FASES_INFO = [
    { fase: "RAMPA", color: CAT.fuerza, semanas: "S1", texto: "Correr/caminar y fuerza corta, para volver del parón. El domingo, la prueba de partida: cuánto aguantas corriendo seguido." },
    { fase: "ESTETICA", color: CAT.cuello, semanas: "S2-S4", texto: "Base aeróbica con fartlek suave. Hombro dos veces por semana y mínimo fijo de pecho y espalda. El jueves de S4, 3 km a tope: de ahí salen tus ritmos." },
    { fase: "CALIDAD", color: "#946800", semanas: "S5", texto: "Primeras series algo más rápidas que el objetivo. La fuerza no sube a la vez." },
    { fase: "ESPECIFICIDAD", color: CAT.running, semanas: "S6-S9", texto: "Series al ritmo objetivo que se alargan: 800 m, 1 km, 2 km. Tirada de hasta 60 min. El 5 km de S8 decide la fecha. S9 es la semana más cargada del bloque." },
    { fase: "PUENTE", color: "#6B4C8A", semanas: "S10", texto: "Baja el volumen, se mantiene el ritmo: 2x3 km a 4:45. Sin déficit de comida." },
    { fase: "OBJETIVO", color: CAT.running, semanas: "S11", texto: "Taper y el día: km 1 a 4:48, km 2-6 a 4:45, km 7 a tope." },
  ];

  const todayIso = todayLocalIso();
  const objetivoDate = new Date(FECHA_FIN);
  const diasParaObjetivo = Math.round((objetivoDate - new Date(todayIso)) / (1000*60*60*24));

  return (
    <div>
      <div style={{ padding: "4px 16px 12px" }}>
        <div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600 }}>{BLOQUE.semanas} semanas · {RANGO_BLOQUE} · {BLOQUE.objetivo}</div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: C.accent, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#B0B0AD", letterSpacing: 0.8 }}>DÍAS PARA EL OBJETIVO</div>
            <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "#E5E5E3", marginTop: 4 }}>{new Date(FECHA_FIN + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })} · {BLOQUE.objetivo}</div>
          </div>
          <div className="mono" style={{ fontSize: 30, fontWeight: 800, color: "#FAFAF9" }}>
            {diasParaObjetivo > 0 ? diasParaObjetivo : diasParaObjetivo === 0 ? "HOY" : "—"}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: 0.8, marginBottom: 6 }}>OBJETIVO A LARGO PLAZO</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.55, marginBottom: 10 }}>
            Correr 7km a 4:45/km el domingo 6 de diciembre, o más tarde si el 5 km de S8 dice que hace falta más tiempo: se mueve la fecha, no se baja el ritmo. En paralelo, construir hombro/pecho/brazos visiblemente más definidos y resolver la rigidez de cuello/clavícula heredada del accidente — sin que ninguno de los tres objetivos sacrifique a los otros dos.
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: 0.8, marginBottom: 6 }}>CÓMO SE LLEGA</div>
          <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.55 }}>
            El running manda siempre — nunca se sacrifica una sesión de calidad por fuerza. Tres carreras y el tenis. La fuerza es empuje/tirón/pierna con hombro dos veces por semana hasta S10, y un bloque de prevención (gemelo, glúteo medio, core) todos los sábados. El cuello se trabaja todos los días, sin excepción — es el hábito de menor esfuerzo y mayor constancia de todo el plan.
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 }}>LAS 6 FASES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {FASES_INFO.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + f.color, borderRadius: 10 }}>
              <div style={{ minWidth: 42 }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: f.color }}>{f.semanas}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.text, marginBottom: 2 }}>{f.fase}</div>
                <div style={{ fontSize: 11.5, color: "#787774", lineHeight: 1.4 }}>{f.texto}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 }}>CUANDO LA SEMANA NO SALE</div>
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "4px 16px" }}>
          {REGLAS_BLOQUE.map((r, i) => (
            <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid " + C.divider : "none" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, marginBottom: 2 }}>{r.t}</div>
              <div style={{ fontSize: 12, color: "#4A4A47", lineHeight: 1.45 }}>{r.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px 8px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#8A8A87", letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 }}>SEMANA A SEMANA — PASADO / PRESENTE / FUTURO</div>
      </div>
      <div style={{ padding: "0 16px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
        {WEEKS.map((wk, wi) => {
          const fc = (FASES_INFO.find(f => f.fase === wk.fase) || {}).color || C.textDim;
          const runSessions = wk.days.filter(d => d.tipo === "run" || d.tipo === "test" || d.tipo === "objetivo");
          const fuerzaDays = wk.days.filter(d => d.tipo === "fuerza").length;

          // Determinar temporalidad de la semana: pasado / presente / futuro
          const weekStartIso = DATE_MAP[wk.days[0].date];
          const weekEndIso = DATE_MAP[wk.days[wk.days.length-1].date];
          const isPresent = todayIso >= weekStartIso && todayIso <= weekEndIso;
          const isPast = todayIso > weekEndIso;
          const temporalLabel = isPresent ? "AHORA" : isPast ? "PASADA" : "PRÓXIMA";
          const temporalColor = isPresent ? C.ok : isPast ? C.textFaint : C.textDim;

          // Adherencia real de la semana si ya paso o esta en curso
          let weekDone = 0, weekTotal = 0;
          if (isPast || isPresent) {
            wk.days.forEach((d, di) => {
              if (d.tipo === "libre") return;
              weekTotal++;
              if (checked[claveDia(wk.days[di])]) weekDone++;
            });
          }

          return (
            <div key={wk.n} onClick={() => { setWeekIdx(wi); onJumpAway(); }} className="block" style={{
              background: isPresent ? "#F4F4F2" : C.card, border: "1px solid " + (isPresent ? C.accent : C.cardBorder), borderLeft: "3px solid " + fc,
              borderRadius: 12, padding: "12px 14px", cursor: "pointer", opacity: isPast ? 0.72 : 1,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>S{wk.n} · {wk.dates}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: temporalColor, letterSpacing: 0.5 }}>{temporalLabel}</span>
                </div>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: fc, letterSpacing: 0.5 }}>{wk.fase}</span>
              </div>
              {(isPast || isPresent) && weekTotal > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 4, background: C.divider, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: (weekDone/weekTotal*100) + "%", height: "100%", background: weekDone===weekTotal ? C.ok : fc, borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: C.textDim, fontWeight: 700 }}>{weekDone}/{weekTotal}</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                {runSessions.map((s, si) => {
                  const isKey = s.esCalidad || s.tipo === "test" || s.tipo === "objetivo";
                  return (
                    <div key={si} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: isKey ? CAT.running : "#787774", fontWeight: isKey ? 700 : 500 }}>
                        {isKey ? "● " : "○ "}{s.titulo}
                      </span>
                      <span className="mono" style={{ fontSize: 10.5, color: "#8A8A87", flexShrink: 0 }}>{s.dur}</span>
                    </div>
                  );
                })}
              </div>
              {fuerzaDays > 0 && (
                <div style={{ fontSize: 10.5, color: "#8A8A87", marginTop: 6, paddingTop: 6, borderTop: "1px solid " + C.cardBorder }}>
                  + {fuerzaDays} sesiones de fuerza
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
