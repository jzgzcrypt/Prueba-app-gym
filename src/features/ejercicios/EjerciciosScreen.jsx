"use client";

import { useState } from "react";
import { A, C } from "@/design/tokens";
import { CATALOGO } from "@/domain/fuerza/catalogo";
import { FLAT_DAYS } from "@/domain/plan/calendario";
import { textoSeries, ultimaVez } from "@/domain/fuerza/registro";
import { ScreenHeader } from "@/features/ui/headers";
import { Boton, Chevron, Icono, IconoCaja, Pastilla, Segmentado, Tarjeta } from "@/features/ui/aire";

const campo = {
  fontSize: 15, padding: "12px 14px", borderRadius: 12, background: C.surfaceMuted, border: "none",
  color: C.text, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const tituloBloque = (color = C.textDim) => ({ fontSize: 13, fontWeight: 600, color, marginBottom: 8 });

export function EjerciciosScreen({ selectedId, setSelectedId, youtubeLinks, setYoutubeLinks, customExercises, setCustomExercises, flaggedExercises, setFlaggedExercises, pushUndo, workoutWeights = {}, workoutReps = {} }) {
  const [linkInput, setLinkInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [catTab, setCatTab] = useState("fuerza"); // fuerza | movilidad
  const [grupoSel, setGrupoSel] = useState(null); // null = todos
  const [newEx, setNewEx] = useState({ nombre: "", grupo: "", pasos: "", sensacion: "" });
  const [flagInput, setFlagInput] = useState("");
  const [editingFlag, setEditingFlag] = useState(false);

  // Fusiona catalogo base + ejercicios personalizados
  const ALL_EXERCISES = Object.assign({}, CATALOGO, customExercises);
  // Lo ultimo que apuntaste de un ejercicio, en cualquier dia del plan.
  const ultimo = (nombre) => {
    const u = ultimaVez(nombre, "9999-12-31", FLAT_DAYS, workoutWeights, workoutReps);
    return u ? textoSeries(u.series) : "";
  };

  if (selectedId) {
    const ej = ALL_EXERCISES[selectedId];
    if (!ej) { setSelectedId(null); return null; }
    const link = youtubeLinks[selectedId] || ej.youtube || "";
    const isFlagged = !!flaggedExercises[ej.nombre];
    const u = ultimo(ej.nombre);
    return (
      <div style={{ padding: "16px 16px 24px" }}>
        <button className="btn" onClick={() => { setSelectedId(null); setEditing(false); setEditingFlag(false); }} style={{
          fontSize: 16, color: A.azul, fontWeight: 500, marginBottom: 10, minHeight: 40, display: "flex", alignItems: "center", gap: 2,
        }}><Icono nombre="izquierda" tam={20} grosor={2.4} /> Ejercicios</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim }}>{ej.grupo}</div>
          {ej.custom && <Pastilla color={A.azul}>Propio</Pastilla>}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: "2px 0 16px", letterSpacing: -0.6, lineHeight: 1.15 }}>{ej.nombre}</div>

        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
            <Tarjeta style={{ height: 150, background: "#1C1C1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Icono nombre="play" tam={26} />
              </div>
            </Tarjeta>
          </a>
        )}

        {u && (
          <Tarjeta style={{ padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <IconoCaja nombre="reloj" tono="azul" />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textDim }}>Última vez</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{u}</div>
            </div>
          </Tarjeta>
        )}

        <Tarjeta style={{ padding: "16px 18px", marginBottom: 12 }}>
          <div style={tituloBloque()}>Cómo se hace</div>
          {ej.pasos.map((p,i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, background: A.fondo.azul, color: A.azul, fontSize: 12, fontWeight: 700,
                             display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</span>
              <span style={{ fontSize: 15, color: C.text, lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </Tarjeta>

        {ej.sensacion && (
          <Tarjeta style={{ padding: "16px 18px", marginBottom: 12 }}>
            <div style={tituloBloque(A.verde)}>Cómo debe sentirse</div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.5 }}>{ej.sensacion}</div>
          </Tarjeta>
        )}

        {ej.errores && (
          <Tarjeta style={{ padding: "16px 18px", marginBottom: 12 }}>
            <div style={tituloBloque(A.naranja)}>Errores a evitar</div>
            <div style={{ fontSize: 15, color: C.text, lineHeight: 1.5 }}>{ej.errores}</div>
          </Tarjeta>
        )}

        {/* MARCAR COMO PROBLEMATICO */}
        <Tarjeta style={{ padding: "16px 18px", marginBottom: 12, background: isFlagged ? A.fondo.rojo : "#fff" }}>
          <div style={{ ...tituloBloque(isFlagged ? A.rojo : C.textDim), display: "flex", alignItems: "center", gap: 6 }}>
            {isFlagged && <Icono nombre="aviso" tam={15} />}{isFlagged ? "Te ha dado molestias" : "¿Te ha dado molestias?"}
          </div>
          {isFlagged && !editingFlag ? (
            <div>
              <div style={{ fontSize: 15, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>{flaggedExercises[ej.nombre]}</div>
              <div style={{ display: "flex", gap: 18 }}>
                <button className="btn" onClick={() => { setFlagInput(flaggedExercises[ej.nombre]); setEditingFlag(true); }} style={{ fontSize: 14, color: A.azul, fontWeight: 600, minHeight: 36 }}>Editar</button>
                <button className="btn" onClick={() => {
                  const notaAnterior = flaggedExercises[ej.nombre];
                  setFlaggedExercises(p => { const n = Object.assign({}, p); delete n[ej.nombre]; return n; });
                  if (pushUndo) pushUndo("Aviso quitado", () => setFlaggedExercises(p => Object.assign({}, p, { [ej.nombre]: notaAnterior })));
                }} style={{ fontSize: 14, color: A.azul, fontWeight: 600, minHeight: 36 }}>Quitar aviso</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={flagInput} onChange={e => setFlagInput(e.target.value)} placeholder="Ej: carga mal el hombro derecho" style={{ ...campo, flex: 1 }} />
              <button className="btn" onClick={() => { if (flagInput.trim()) { setFlaggedExercises(p => Object.assign({}, p, { [ej.nombre]: flagInput.trim() })); setEditingFlag(false); setFlagInput(""); } }} style={{
                fontSize: 15, fontWeight: 700, color: "#fff", background: A.rojo, padding: "0 18px", borderRadius: 999, minWidth: 60,
              }}>OK</button>
            </div>
          )}
        </Tarjeta>

        <Tarjeta style={{ padding: "16px 18px" }}>
          <div style={tituloBloque()}>Tu vídeo</div>
          {link && !editing ? (
            <div>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: A.azul, wordBreak: "break-all", display: "block", marginBottom: 6 }}>{link}</a>
              <button className="btn" onClick={() => { setLinkInput(link); setEditing(true); }} style={{ fontSize: 14, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cambiar</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Link de YouTube" style={{ ...campo, flex: 1 }} />
              <button className="btn" onClick={() => { setYoutubeLinks(p=>Object.assign({},p,{[selectedId]:linkInput})); setEditing(false); }} style={{
                fontSize: 15, fontWeight: 700, color: "#fff", background: A.azul, padding: "0 18px", borderRadius: 999, minWidth: 60,
              }}>OK</button>
            </div>
          )}
        </Tarjeta>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const deLaCategoria = Object.entries(ALL_EXERCISES)
    .filter(([, ej]) => (ej.categoria || "movilidad") === catTab); // sin categoria explicita = movilidad (los originales del catalogo)
  const todosLosGrupos = [...new Set(deLaCategoria.map(([, ej]) => ej.grupo))];
  const grupoActivo = todosLosGrupos.includes(grupoSel) ? grupoSel : null;
  const grupos = {};
  deLaCategoria.forEach(([id, ej]) => {
    if (grupoActivo && ej.grupo !== grupoActivo) return;
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

  const chip = (activo) => ({
    flexShrink: 0, minHeight: 34, padding: "0 14px", borderRadius: 999, fontSize: 14, fontWeight: 600,
    background: activo ? C.text : "#fff", color: activo ? "#fff" : C.text,
    boxShadow: activo ? "none" : "0 1px 2px rgba(0,0,0,.06)",
  });

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <ScreenHeader title="Ejercicios" subtitle="Tu biblioteca" />

      <Segmentado opciones={[["fuerza", "Fuerza"], ["movilidad", "Movilidad"]]} valor={catTab}
        cambiar={(v) => { setCatTab(v); setGrupoSel(null); }} style={{ marginBottom: 12 }} />

      <div style={{ position: "relative", marginBottom: 12 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textDim, display: "flex" }}>
          <Icono nombre="buscar" tam={18} />
        </span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar" style={{
          ...campo, background: "#E4E4E9", paddingLeft: 38, borderRadius: 12 }} />
      </div>

      <div data-chips style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px 16px", padding: "2px 16px 4px", scrollbarWidth: "none" }}>
        <button className="btn" onClick={() => setGrupoSel(null)} style={chip(!grupoActivo)}>Todos</button>
        {todosLosGrupos.map(g => (
          <button key={g} className="btn" onClick={() => setGrupoSel(g)} style={chip(grupoActivo === g)}>{g}</button>
        ))}
      </div>

      {!hasResults && (
        <div style={{ fontSize: 15, color: C.textDim, textAlign: "center", padding: "32px 0" }}>
          {search ? "Sin resultados para \"" + search + "\"" : "Sin ejercicios en esta categoría todavía."}
        </div>
      )}

      {Object.entries(grupos).map(([grupo, ejs]) => (
        <div key={grupo} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textDim, margin: "0 4px 8px" }}>{grupo}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ejs.map(ej => {
              const isFlagged = !!flaggedExercises[ej.nombre];
              const video = youtubeLinks[ej.id] || ej.youtube;
              const u = ultimo(ej.nombre);
              return (
                <Tarjeta key={ej.id} data-ejercicio onClick={() => setSelectedId(ej.id)} className="block" style={{
                  padding: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", borderRadius: 18,
                }}>
                  {video ? (
                    <div style={{ width: 64, height: 48, borderRadius: 12, background: "#1C1C1E", flexShrink: 0, color: "#fff",
                                  display: "flex", alignItems: "center", justifyContent: "center" }}><Icono nombre="play" tam={18} /></div>
                  ) : (
                    <div style={{ width: 64, height: 48, borderRadius: 12, background: catTab === "fuerza" ? A.fondo.azul : A.fondo.verde, flexShrink: 0,
                                  color: catTab === "fuerza" ? A.azul : A.verde, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icono nombre={catTab === "fuerza" ? "mancuerna" : "mover"} tam={44} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.25 }}>{ej.nombre}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: u ? A.azul : C.textDim, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                      {u ? "Último: " + u : ej.grupo}
                    </div>
                    {(isFlagged || ej.avanzado || ej.custom) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                        {isFlagged && <Pastilla color={A.rojo}>Molestias</Pastilla>}
                        {ej.avanzado && <Pastilla color={A.morado}>Avanzado</Pastilla>}
                        {ej.custom && <Pastilla color={A.azul}>Propio</Pastilla>}
                      </div>
                    )}
                  </div>
                  <Chevron />
                </Tarjeta>
              );
            })}
          </div>
        </div>
      ))}

      <Tarjeta style={{ padding: 0, marginTop: 6 }}>
        <button className="btn" data-anadir onClick={() => setShowAddForm(!showAddForm)} style={{
          width: "100%", minHeight: 52, display: "flex", alignItems: "center", gap: 10, padding: "0 16px",
          fontSize: 15, fontWeight: 600, color: A.azul,
        }}>
          <Icono nombre={showAddForm ? "izquierda" : "mas"} tam={20} grosor={2.2} />
          {showAddForm ? "Cancelar" : "Añadir ejercicio propio"}
        </button>
        {showAddForm && (
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={newEx.nombre} onChange={e => setNewEx(p => Object.assign({}, p, { nombre: e.target.value }))} placeholder="Nombre del ejercicio" style={campo} />
            <input value={newEx.grupo} onChange={e => setNewEx(p => Object.assign({}, p, { grupo: e.target.value }))} placeholder="Grupo (ej: Cuello, Cadera, Pecho)" style={campo} />
            <textarea value={newEx.pasos} onChange={e => setNewEx(p => Object.assign({}, p, { pasos: e.target.value }))} placeholder="Pasos (uno por línea)" style={{ ...campo, minHeight: 70, resize: "vertical" }} />
            <input value={newEx.sensacion} onChange={e => setNewEx(p => Object.assign({}, p, { sensacion: e.target.value }))} placeholder="Cómo debe sentirse (opcional)" style={campo} />
            <Boton tipo="color" onClick={addCustomExercise}>Guardar ejercicio</Boton>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
