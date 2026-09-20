"use client";

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ICON_FUERZA, ICON_MOVILIDAD } from "@/domain/assets/icons";
import { CATALOGO } from "@/domain/fuerza/catalogo";
import { MOVILIDAD } from "@/domain/salud/movilidad";
import { ScreenHeader, SectionHeader } from "@/features/ui/headers";
export function EjerciciosScreen({ selectedId, setSelectedId, youtubeLinks, setYoutubeLinks, customExercises, setCustomExercises, flaggedExercises, setFlaggedExercises, pushUndo }) {
  const [linkInput, setLinkInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [catTab, setCatTab] = useState("fuerza"); // fuerza | movilidad
  const [newEx, setNewEx] = useState({ nombre: "", grupo: "", pasos: "", sensacion: "" });
  const [flagInput, setFlagInput] = useState("");
  const [editingFlag, setEditingFlag] = useState(false);

  // Fusiona catalogo base + ejercicios personalizados
  const ALL_EXERCISES = Object.assign({}, CATALOGO, customExercises);

  if (selectedId) {
    const ej = ALL_EXERCISES[selectedId];
    if (!ej) { setSelectedId(null); return null; }
    const link = youtubeLinks[selectedId] || ej.youtube || "";
    const isFlagged = !!flaggedExercises[ej.nombre];
    return (
      <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
        <button className="btn" onClick={() => { setSelectedId(null); setEditing(false); setEditingFlag(false); }} style={{
          fontSize: 13, color: C.accent, fontWeight: 700, marginBottom: SP.lg, minHeight: 36, padding: "6px 0",
        }}>&lsaquo; EJERCICIOS</button>
        <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.textDim }}>{ej.grupo.toUpperCase()}</div>
          {ej.custom && <span style={{ fontSize: 8.5, fontWeight: 800, color: C.accent, background: C.surfaceMuted, padding: "2px 6px", borderRadius: R.sm }}>PERSONALIZADO</span>}
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.text, marginTop: 4, marginBottom: SP.lg, letterSpacing: -0.3 }}>{ej.nombre}</div>

        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px " + SP.xl + "px", marginBottom: SP.sm + 2 }}>
          <SectionHeader>CÓMO SE HACE</SectionHeader>
          {ej.pasos.map((p,i) => (
            <div key={i} style={{ display: "flex", gap: SP.sm + 2, marginBottom: SP.sm }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: C.accent, flexShrink: 0 }}>{i+1}.</span>
              <span style={{ fontSize: 13.5, color: "#3A3A38", lineHeight: 1.55 }}>{p}</span>
            </div>
          ))}
        </div>

        {ej.sensacion && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.md + "px " + SP.xl + "px", marginBottom: SP.sm + 2 }}>
            <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.ok, marginBottom: 5 }}>CÓMO DEBE SENTIRSE</div>
            <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.55 }}>{ej.sensacion}</div>
          </div>
        )}

        {ej.errores && (
          <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.md + "px " + SP.xl + "px", marginBottom: SP.sm + 2 }}>
            <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: C.accent, marginBottom: 5 }}>ERRORES A EVITAR</div>
            <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.55 }}>{ej.errores}</div>
          </div>
        )}

        {/* MARCAR COMO PROBLEMATICO */}
        <div style={{ background: isFlagged ? "#FBF0EF" : C.card, border: "1px solid " + (isFlagged ? "#E8C9C6" : C.cardBorder), borderRadius: R.xl, padding: SP.md + "px " + SP.xl + "px", marginBottom: SP.sm + 2 }}>
          <div style={{ ...TYPE.sectionLabel, fontSize: 10, color: isFlagged ? CAT.running : C.textDim, marginBottom: 5 }}>{isFlagged ? "⚠ TE HA DADO MOLESTIAS" : "¿TE HA DADO MOLESTIAS?"}</div>
          {isFlagged && !editingFlag ? (
            <div>
              <div style={{ fontSize: 13, color: "#3A3A38", lineHeight: 1.5, marginBottom: 8 }}>{flaggedExercises[ej.nombre]}</div>
              <div style={{ display: "flex", gap: SP.md }}>
                <button className="btn" onClick={() => { setFlagInput(flaggedExercises[ej.nombre]); setEditingFlag(true); }} style={{ fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>EDITAR</button>
                <button className="btn" onClick={() => {
                  const notaAnterior = flaggedExercises[ej.nombre];
                  setFlaggedExercises(p => { const n = Object.assign({}, p); delete n[ej.nombre]; return n; });
                  if (pushUndo) pushUndo("Aviso quitado", () => setFlaggedExercises(p => Object.assign({}, p, { [ej.nombre]: notaAnterior })));
                }} style={{ fontSize: 11.5, color: C.textDim, fontWeight: 700 }}>QUITAR AVISO</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: SP.xs + 2 }}>
              <input value={editingFlag ? flagInput : flagInput} onChange={e => setFlagInput(e.target.value)} placeholder="Ej: carga mal el hombro derecho" style={{
                flex: 1, fontSize: 13, padding: "10px " + SP.md + "px", borderRadius: R.md, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none",
              }} />
              <button className="btn" onClick={() => { if (flagInput.trim()) { setFlaggedExercises(p => Object.assign({}, p, { [ej.nombre]: flagInput.trim() })); setEditingFlag(false); setFlagInput(""); } }} style={{
                fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: CAT.running, padding: "0 " + SP.lg + "px", borderRadius: R.md, minWidth: 60,
              }}>OK</button>
            </div>
          )}
        </div>

        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.md + "px " + SP.xl + "px" }}>
          <SectionHeader>TU VÍDEO</SectionHeader>
          {link && !editing ? (
            <div>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.accent, wordBreak: "break-all", display: "block", marginBottom: SP.sm }}>{link}</a>
              <button className="btn" onClick={() => { setLinkInput(link); setEditing(true); }} style={{ fontSize: 12, color: C.textDim, fontWeight: 700, minHeight: 32 }}>CAMBIAR</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: SP.xs + 2 }}>
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Link de YouTube" style={{
                flex: 1, fontSize: 13, padding: "11px " + SP.md + "px", borderRadius: R.md, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none",
              }} />
              <button className="btn" onClick={() => { setYoutubeLinks(p=>Object.assign({},p,{[selectedId]:linkInput})); setEditing(false); }} style={{
                fontSize: 12, fontWeight: 800, color: "#FAFAF9", background: C.accent, padding: "0 " + SP.lg + "px", borderRadius: R.md, minWidth: 60,
              }}>OK</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const grupos = {};
  Object.entries(ALL_EXERCISES).forEach(([id, ej]) => {
    const ejCategoria = ej.categoria || "movilidad"; // sin categoria explicita = movilidad (los originales del catalogo)
    if (ejCategoria !== catTab) return;
    if (query && !ej.nombre.toLowerCase().includes(query) && !ej.grupo.toLowerCase().includes(query)) return;
    (grupos[ej.grupo] = grupos[ej.grupo] || []).push(Object.assign({id}, ej));
  });
  const hasResults = Object.keys(grupos).length > 0;

  const addCustomExercise = () => {
    if (!newEx.nombre.trim() || !newEx.grupo.trim()) return;
    const id = "custom_" + Date.now();
    setCustomExercises(p => Object.assign({}, p, {
      [id]: {
        nombre: newEx.nombre.trim(), grupo: newEx.grupo.trim(), categoria: catTab,
        pasos: newEx.pasos.trim() ? newEx.pasos.split("\n").filter(l => l.trim()) : ["Sin pasos detallados todavía."],
        sensacion: newEx.sensacion.trim(), errores: "", youtube: "", custom: true,
      }
    }));
    setNewEx({ nombre: "", grupo: "", pasos: "", sensacion: "" });
    setShowAddForm(false);
  };

  return (
    <div style={{ padding: SP.xl + "px " + SP.lg + "px" }}>
      <ScreenHeader icon={ICON_MOVILIDAD} title="EJERCICIOS" subtitle="Directorio completo. Toca para ver." />

      <div style={{ display: "flex", gap: SP.xs + 2, marginBottom: SP.md }}>
        <button className="btn" onClick={() => setCatTab("fuerza")} style={{
          flex: 1, height: 40, borderRadius: R.md, fontSize: 12.5, fontWeight: 800,
          background: catTab === "fuerza" ? C.accent : C.surfaceMuted, color: catTab === "fuerza" ? "#FAFAF9" : C.textDim,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <img src={ICON_FUERZA} alt="" style={{ width: 15, height: 15, objectFit: "contain", opacity: catTab === "fuerza" ? 1 : 0.5, filter: catTab === "fuerza" ? "invert(1) brightness(2)" : "none" }} />
          FUERZA
        </button>
        <button className="btn" onClick={() => setCatTab("movilidad")} style={{
          flex: 1, height: 40, borderRadius: R.md, fontSize: 12.5, fontWeight: 800,
          background: catTab === "movilidad" ? C.accent : C.surfaceMuted, color: catTab === "movilidad" ? "#FAFAF9" : C.textDim,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <img src={ICON_MOVILIDAD} alt="" style={{ width: 15, height: 15, objectFit: "contain", opacity: catTab === "movilidad" ? 1 : 0.5, filter: catTab === "movilidad" ? "invert(1) brightness(2)" : "none" }} />
          MOVILIDAD
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ejercicio o grupo..." style={{
        width: "100%", fontSize: 13.5, padding: "11px " + SP.md + "px", borderRadius: R.md, background: C.surfaceMuted,
        border: "1px solid #D4D4D1", color: C.text, outline: "none", marginBottom: SP.md, boxSizing: "border-box",
      }} />

      <button className="btn" onClick={() => setShowAddForm(!showAddForm)} style={{
        width: "100%", padding: SP.md + "px", borderRadius: R.md, background: showAddForm ? C.surfaceMuted : C.accent,
        fontSize: 12.5, fontWeight: 800, color: showAddForm ? C.text : "#FAFAF9", marginBottom: SP.lg,
      }}>{showAddForm ? "CANCELAR" : "+ AÑADIR EJERCICIO PROPIO"}</button>

      {showAddForm && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: SP.lg + "px", marginBottom: SP.lg, display: "flex", flexDirection: "column", gap: SP.sm }}>
          <input value={newEx.nombre} onChange={e => setNewEx(p => Object.assign({}, p, { nombre: e.target.value }))} placeholder="Nombre del ejercicio" style={{
            fontSize: 13, padding: "10px " + SP.md + "px", borderRadius: R.sm, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none",
          }} />
          <input value={newEx.grupo} onChange={e => setNewEx(p => Object.assign({}, p, { grupo: e.target.value }))} placeholder="Grupo (ej: Cuello, Cadera, Pecho)" style={{
            fontSize: 13, padding: "10px " + SP.md + "px", borderRadius: R.sm, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none",
          }} />
          <textarea value={newEx.pasos} onChange={e => setNewEx(p => Object.assign({}, p, { pasos: e.target.value }))} placeholder="Pasos (uno por línea)" style={{
            fontSize: 13, padding: "10px " + SP.md + "px", borderRadius: R.sm, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none", minHeight: 60, fontFamily: "inherit", resize: "vertical",
          }} />
          <input value={newEx.sensacion} onChange={e => setNewEx(p => Object.assign({}, p, { sensacion: e.target.value }))} placeholder="Cómo debe sentirse (opcional)" style={{
            fontSize: 13, padding: "10px " + SP.md + "px", borderRadius: R.sm, background: C.surfaceMuted, border: "1px solid #D4D4D1", color: C.text, outline: "none",
          }} />
          <button className="btn" onClick={addCustomExercise} style={{
            padding: SP.sm + 2 + "px", borderRadius: R.sm, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 12.5,
          }}>GUARDAR EJERCICIO</button>
        </div>
      )}

      {!hasResults && (
        <div style={{ fontSize: 13, color: C.textDim, textAlign: "center", padding: SP.xxl + "px 0" }}>
          {search ? "Sin resultados para \"" + search + "\"" : "Sin ejercicios en esta categoría todavía."}
        </div>
      )}

      {Object.entries(grupos).map(([grupo, ejs]) => (
        <div key={grupo} style={{ marginBottom: SP.lg }}>
          <SectionHeader>{grupo.toUpperCase()}</SectionHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: SP.xs + 2 }}>
            {ejs.map(ej => {
              const isFlagged = !!flaggedExercises[ej.nombre];
              return (
                <div key={ej.id} onClick={() => setSelectedId(ej.id)} className="block" style={{
                  background: C.card, border: "1px solid " + (isFlagged ? CAT.running : ej.avanzado ? CAT.movilidad : C.cardBorder), borderRadius: R.lg,
                  padding: SP.md + "px " + SP.md + "px", minHeight: TAP_MIN,
                  display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SP.sm, flexWrap: "wrap" }}>
                    {isFlagged && <span style={{ fontSize: 12 }}>⚠</span>}
                    <span style={{ fontSize: 13.5, color: "#3A3A38", fontWeight: 600 }}>{ej.nombre}</span>
                    {ej.avanzado && <span style={{ fontSize: 8.5, fontWeight: 800, color: CAT.movilidad, background: CAT.movilidad + "18", padding: "2px 6px", borderRadius: R.sm }}>AVANZADO</span>}
                    {ej.custom && <span style={{ fontSize: 8.5, fontWeight: 800, color: C.accent, background: C.surfaceMuted, padding: "2px 6px", borderRadius: R.sm }}>PROPIO</span>}
                  </div>
                  <span style={{ fontSize: 15, color: C.textFaint, flexShrink: 0, marginLeft: SP.sm }}>&rsaquo;</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
