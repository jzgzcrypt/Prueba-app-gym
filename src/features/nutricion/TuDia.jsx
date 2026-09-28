"use client";

/**
 * TU DIA — IIFYM: dices lo que has comido y la cena se cuadra sola.
 *
 * Desayuno, comida y merienda se apuntan como caigan: "lo de siempre" de un
 * toque, escrito en tus palabras, o señalando en la cantina. La cena no se
 * apunta antes: es lo que queda del dia, dicho a ojo (palmas, puños,
 * pulgares). Sin pesar nada.
 */

import { useEffect, useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ALIMENTO, cantidadLegible } from "@/domain/nutricion/alimentos";
import { PLATO_CANTINA, RACIONES, SECCIONES_CANTINA, macrosPlato, platosDe } from "@/domain/nutricion/cantina";
import { COMIDAS_RAPIDAS, macrosDelDia, macrosRapida, restoDelDia } from "@/domain/nutricion/iifym";
import { interpretar, totalDe } from "@/domain/nutricion/escribir";
import { PORCION, apunteDePlato, enGramos, platoCena, textoPorcion } from "@/domain/nutricion/plato";
import { INSTRUCCIONES_IA, enlacesIA, leerRespuestaIA, promptRecomendacion, totalLeido } from "@/domain/nutricion/pegar";

const CLAVE_IA = "programa7k:ia-instrucciones";
const leerIA = () => { try { return window.localStorage.getItem(CLAVE_IA) === "si"; } catch { return false; } };
const guardarIA = () => { try { window.localStorage.setItem(CLAVE_IA, "si"); } catch { /* solo esta sesion */ } };

const SLOTS = [
  { id: "desayuno", nombre: "Desayuno" },
  { id: "comida", nombre: "Comida", cantina: true },
  { id: "merienda", nombre: "Merienda" },
];
const EN_TARJETAS = new Set(["desayuno", "comida", "merienda", "cena"]);

// "Lo de siempre": una preferencia del movil, no un dato del plan.
const CLAVE_SIEMPRE = "programa7k:siempre";
const SIEMPRE_POR_DEFECTO = { desayuno: "porridge", merienda: "yogur_fruta", comida: null };
function leerSiempre() {
  try { return Object.assign({}, SIEMPRE_POR_DEFECTO, JSON.parse(window.localStorage.getItem(CLAVE_SIEMPRE) || "{}")); }
  catch { return { ...SIEMPRE_POR_DEFECTO }; }
}
function guardarSiempre(v) { try { window.localStorage.setItem(CLAVE_SIEMPRE, JSON.stringify(v)); } catch { /* solo esta sesion */ } }

const tarjeta = { background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: "14px 16px", marginBottom: SP.md };
const boton = (fuerte) => ({
  flex: 1, minHeight: TAP_MIN, borderRadius: R.lg, fontSize: 13, fontWeight: 700, padding: "0 10px",
  background: fuerte ? C.accent : C.surfaceMuted, border: "1px solid " + (fuerte ? C.accent : C.cardBorder),
  color: fuerte ? "#FAFAF9" : C.text,
});
const pastilla = (activo) => ({
  padding: "8px 12px", borderRadius: R.pill, minHeight: 36, whiteSpace: "nowrap",
  background: activo ? C.accent : C.card, border: "1px solid " + (activo ? C.accent : C.cardBorder),
  color: activo ? "#FAFAF9" : C.textDim, fontSize: 12, fontWeight: 700,
});
const r = Math.round;

/** Lo que dice un apunte, en una linea. */
function textoApunte(ap) {
  if (ap.origen === "texto") return ap.texto;
  if (ap.origen === "cantina") {
    const p = PLATO_CANTINA[ap.id], rr = RACIONES.find(x => x.id === ap.racion);
    return (p ? p.nombre : ap.id) + (rr && rr.id !== "normal" ? " (" + rr.etiqueta.toLowerCase() + ")" : "");
  }
  if (ap.origen === "rapida") { const c = COMIDAS_RAPIDAS.find(x => x.id === ap.id); return c ? c.nombre : ap.id; }
  const a = ALIMENTO[ap.id];
  return (a ? a.nombre : ap.id) + " " + cantidadLegible(ap.id, ap.gramos);
}

function Barra({ nombre, hecho, meta, color, unidad }) {
  const pct = meta > 0 ? Math.min(100, hecho / meta * 100) : 0;
  const pasado = hecho > meta * 1.05;
  return (
    <div style={{ marginTop: SP.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{nombre}</span>
        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: pasado ? "#E2BA4A" : "#D4D4D1" }}>{r(hecho)} / {r(meta)} {unidad}</span>
      </div>
      <div style={{ height: 6, background: "#333331", borderRadius: R.pill, marginTop: 4, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: pasado ? "#E2BA4A" : color, borderRadius: R.pill }} />
      </div>
    </div>
  );
}

/** Escribir lo que has comido: una cosa por linea; si sabes las kcal, mandan ellas. */
function Escribir({ comidaId, apuntarVarias, onCerrar, placeholder }) {
  const [texto, setTexto] = useState("");
  const lineas = interpretar(texto);
  const total = totalDe(lineas);
  const apuntar = () => {
    const buenas = lineas.filter(l => l.macros.kcal > 0);
    if (!buenas.length) return;
    apuntarVarias(buenas.map(l => ({ comida: comidaId || undefined, origen: "texto", texto: l.escrito || l.nombre,
      kcal: l.macros.kcal, prot: l.macros.prot, hc: l.macros.hc, grasa: l.macros.grasa })));
    onCerrar();
  };
  return (
    <div style={{ marginTop: SP.sm }}>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2} autoFocus
        placeholder={placeholder || "Macarrones con tomate\nFilete de ternera, un panecillo"}
        style={{ width: "100%", padding: "10px 12px", borderRadius: R.lg, resize: "vertical", border: "1px solid " + C.cardBorder,
                 background: C.bg, color: C.text, fontSize: 14, lineHeight: 1.5, fontFamily: "inherit" }} />
      {lineas.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {lineas.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13,
              color: l.confianza === "sin-entender" ? C.amber : C.text }}>
              <span style={{ minWidth: 0 }}>
                {l.escrito || l.nombre}
                {l.confianza === "sin-entender"
                  ? <span style={{ display: "block", fontSize: 11.5 }}>No lo conozco: añade las kcal (ej. «450 kcal»)</span>
                  : l.nombre && l.nombre !== l.escrito && <span style={{ display: "block", fontSize: 11.5, color: C.textFaint }}>≈ {l.nombre.toLowerCase()}</span>}
              </span>
              {l.macros.kcal > 0 && <span className="mono" style={{ flexShrink: 0, color: C.textDim, fontSize: 12 }}>{r(l.macros.kcal)} kcal · {r(l.macros.prot)} p</span>}
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: SP.sm, marginTop: SP.sm }}>
        <button className="btn" onClick={onCerrar} style={{ ...boton(false), flex: "0 0 auto" }}>Cancelar</button>
        <button className="btn" onClick={apuntar} disabled={total.kcal <= 0} style={{ ...boton(total.kcal > 0), opacity: total.kcal > 0 ? 1 : 0.45 }}>
          {total.kcal > 0 ? "Apuntar · " + r(total.kcal) + " kcal" : "Escribe lo que has comido"}
        </button>
      </div>
    </div>
  );
}

/**
 * Con tu IA: le dices (o le mandas foto de) lo que has comido en tu chat de
 * Claude o ChatGPT, copias su respuesta y la pegas aqui. La app solo lee
 * numeros: vale para cualquier comida.
 */
function ConIA({ comidaId, apuntarVarias, onCerrar, onEscribir }) {
  const [pegado, setPegado] = useState("");
  const [yaCopiadas, setYaCopiadas] = useState(false);
  const [aviso, setAviso] = useState(null);
  useEffect(() => { setYaCopiadas(leerIA()); }, []);
  const lineas = leerRespuestaIA(pegado);
  const total = totalLeido(lineas);
  const enlaces = enlacesIA("");
  const copiar = async () => {
    try { await navigator.clipboard.writeText(INSTRUCCIONES_IA); guardarIA(); setYaCopiadas(true); setAviso("Copiadas: pégalas en un chat nuevo de tu IA."); }
    catch { setAviso("No se pudo copiar. Mantén pulsado el texto de abajo para copiarlo."); }
  };
  const pegar = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) { setPegado(t); setAviso(null); } else setAviso("El portapapeles está vacío: copia la respuesta de tu IA.");
    } catch { setAviso("Chrome no deja leer el portapapeles: pégala en el cuadro (mantén pulsado → Pegar)."); }
  };
  const apuntar = () => {
    if (!lineas.length) return;
    apuntarVarias(lineas.map(l => ({ comida: comidaId || undefined, origen: "texto", texto: l.nombre,
      kcal: l.kcal, prot: l.prot, hc: l.hc, grasa: l.grasa })));
    onCerrar();
  };
  const enlace = { ...boton(false), display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", minHeight: 38, fontSize: 12.5 };
  return (
    <div data-ia style={{ marginTop: SP.sm }}>
      {!yaCopiadas ? (
        <div style={{ background: C.surfaceMuted, borderRadius: R.md, padding: "10px 12px", marginBottom: SP.sm }}>
          <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.45 }}>
            <b>Solo la primera vez:</b> copia las instrucciones y pégalas en un chat nuevo de Claude o ChatGPT. Llámalo «Macros» y usa siempre ese chat.
          </div>
          <button className="btn" onClick={copiar} style={{ ...boton(true), width: "100%", marginTop: 8, minHeight: 40 }}>Copiar instrucciones</button>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.45, marginBottom: SP.sm }}>
          En tu chat «Macros», escribe o manda foto de lo que has comido. Copia la respuesta y pégala aquí.
        </div>
      )}
      <div style={{ display: "flex", gap: SP.sm }}>
        <a href={enlaces.claude} target="_blank" rel="noreferrer" style={enlace}>Abrir Claude</a>
        <a href={enlaces.chatgpt} target="_blank" rel="noreferrer" style={enlace}>Abrir ChatGPT</a>
      </div>
      <button className="btn" onClick={pegar} style={{ ...boton(!lineas.length), width: "100%", marginTop: SP.sm }}>Pegar la respuesta</button>
      <textarea value={pegado} onChange={e => setPegado(e.target.value)} rows={pegado ? 3 : 2}
        placeholder="…o pégala aquí"
        style={{ width: "100%", marginTop: SP.sm, padding: "9px 12px", borderRadius: R.lg, resize: "vertical", border: "1px solid " + C.cardBorder,
                 background: C.bg, color: C.text, fontSize: 13, lineHeight: 1.45, fontFamily: "inherit" }} />
      {aviso && <div style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>{aviso}</div>}
      {pegado && !lineas.length && <div style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>No encuentro números de kcal ni de macros en lo pegado.</div>}
      {lineas.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
          {lineas.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, color: C.text }}>
              <span style={{ minWidth: 0 }}>{l.nombre}{l.confianza === "estimado" && <span style={{ display: "block", fontSize: 11.5, color: C.textFaint }}>solo kcal: macros estimados</span>}</span>
              <span className="mono" style={{ flexShrink: 0, color: C.textDim, fontSize: 12 }}>{r(l.kcal)} kcal · {r(l.prot)} p</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: SP.sm, marginTop: SP.sm }}>
        <button className="btn" onClick={onCerrar} style={{ ...boton(false), flex: "0 0 auto" }}>Cancelar</button>
        <button className="btn" onClick={apuntar} disabled={!lineas.length} style={{ ...boton(lineas.length > 0), opacity: lineas.length ? 1 : 0.45 }}>
          {lineas.length ? "Apuntar · " + r(total.kcal) + " kcal" : "Pega la respuesta"}
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <button className="btn" onClick={onEscribir} style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 700, minHeight: 28 }}>Sin IA: escribir aquí</button>
        {yaCopiadas && <button className="btn" onClick={copiar} style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 700, minHeight: 28 }}>Copiar instrucciones otra vez</button>}
      </div>
    </div>
  );
}

/**
 * Pedirle a tu IA una idea para la merienda o la cena con lo que queda del
 * dia. Copia el mensaje (o abre la IA con el ya puesto); la IA contesta en el
 * formato de siempre, y si te lo comes lo pegas con «Con tu IA».
 */
function PedirIdea({ que, resto, tipoDia, comido, plato }) {
  const [hecho, setHecho] = useState(null);
  const texto = promptRecomendacion({ que, resto, tipoDia, comido, plato });
  const enlaces = enlacesIA(texto);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setHecho("copiado"); } catch { setHecho("abrir"); }
  };
  const enlace = { ...boton(false), display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", minHeight: 36, fontSize: 12.5 };
  return (
    <div data-idea={que} style={{ marginTop: SP.sm }}>
      <button className="btn" onClick={copiar} style={{ fontSize: 12.5, fontWeight: 800, color: C.text, minHeight: 34, padding: 0 }}>
        💡 Pídele idea a tu IA para {que === "cena" ? "la cena" : "la merienda"}
      </button>
      {hecho && (
        <div style={{ background: C.surfaceMuted, borderRadius: R.md, padding: "9px 11px", marginTop: 4 }}>
          <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.45 }}>
            {hecho === "copiado"
              ? "Copiado con lo que te queda del día. Pégalo en tu chat «Macros». Si te lo comes, copia su respuesta y apúntala con «Con tu IA»."
              : "No se pudo copiar: ábrelo directamente en tu IA."}
          </div>
          <div style={{ display: "flex", gap: SP.sm, marginTop: 7 }}>
            <a href={enlaces.claude} target="_blank" rel="noreferrer" style={enlace}>Abrir en Claude</a>
            <a href={enlaces.chatgpt} target="_blank" rel="noreferrer" style={enlace}>Abrir en ChatGPT</a>
          </div>
        </div>
      )}
    </div>
  );
}

/** La cantina: tocas lo que ha caido y dices si fue poco, normal o mucho. */
function Cantina({ apuntarVarias, onCerrar }) {
  const [seccion, setSeccion] = useState(SECCIONES_CANTINA[0]);
  const [elegidos, setElegidos] = useState([]); // [{ id, racion }]
  const total = elegidos.reduce((a, e) => { const m = macrosPlato(e.id, e.racion); return { kcal: a.kcal + m.kcal, prot: a.prot + m.prot }; }, { kcal: 0, prot: 0 });
  const siguienteRacion = (rac) => RACIONES[(RACIONES.findIndex(x => x.id === rac) + 1) % RACIONES.length].id;
  return (
    <div style={{ marginTop: SP.sm }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
        {SECCIONES_CANTINA.map(s => <button key={s} className="btn" onClick={() => setSeccion(s)} style={pastilla(s === seccion)}>{s}</button>)}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
        {platosDe(seccion).map(p => (
          <button key={p.id} className="btn" onClick={() => setElegidos(el => [...el, { id: p.id, racion: "normal" }])} style={pastilla(false)}>{p.nombre}</button>
        ))}
      </div>
      {elegidos.length > 0 && (
        <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: 4 }}>
          {elegidos.map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: SP.sm, background: C.surfaceMuted, borderRadius: R.md, padding: "6px 10px" }}>
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>{PLATO_CANTINA[e.id].nombre}</span>
              <button className="btn" onClick={() => setElegidos(el => el.map((x, j) => j === i ? { ...x, racion: siguienteRacion(x.racion) } : x))}
                style={{ ...pastilla(false), minHeight: 30, padding: "4px 10px" }}>{RACIONES.find(x => x.id === e.racion).etiqueta}</button>
              <button className="btn" aria-label="Quitar" onClick={() => setElegidos(el => el.filter((_, j) => j !== i))}
                style={{ fontSize: 17, color: C.textFaint, padding: "2px 6px" }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: SP.sm, marginTop: SP.sm }}>
        <button className="btn" onClick={onCerrar} style={{ ...boton(false), flex: "0 0 auto" }}>Cancelar</button>
        <button className="btn" disabled={!elegidos.length} onClick={() => {
          apuntarVarias(elegidos.map(e => ({ comida: "comida", origen: "cantina", id: e.id, racion: e.racion })));
          onCerrar();
        }} style={{ ...boton(elegidos.length > 0), opacity: elegidos.length ? 1 : 0.45 }}>
          {elegidos.length ? "Apuntar · " + r(total.kcal) + " kcal" : "Toca lo que has comido"}
        </button>
      </div>
    </div>
  );
}

export function TuDia({ comida, apuntes, apuntarVarias, deshacerComida, esHoy }) {
  const [abierto, setAbierto] = useState(null);   // "desayuno:escribir", "comida:cantina", "cena:escribir", "extra:escribir"
  const [siempre, setSiempre] = useState(SIEMPRE_POR_DEFECTO);
  const [eligiendoSiempre, setEligiendoSiempre] = useState(null);
  const [verGramos, setVerGramos] = useState(false);
  useEffect(() => { setSiempre(leerSiempre()); }, []);

  const objetivo = comida && comida.macros;
  if (!objetivo) return null;
  const lista = apuntes || [];
  const comido = macrosDelDia(lista);
  const resto = restoDelDia(objetivo, lista);
  const de = (id) => lista.filter(ap => ap && ap.comida === id);
  const sueltos = lista.map((ap, i) => ({ ap, i })).filter(({ ap }) => ap && !EN_TARJETAS.has(ap.comida));
  const cenaApuntada = de("cena");
  const plato = platoCena(resto);
  const comidoTextos = lista.filter(Boolean).map(textoApunte);
  const platoTexto = ["prot", "hc", "verdura", "grasa"].filter(k => plato.porciones[k] > 0)
    .map(k => textoPorcion(plato.porciones[k], k) + " de " + PORCION[k].nombre.toLowerCase()).join(", ");
  const cerrar = () => setAbierto(null);
  const apuntadoTexto = (aps) => {
    const m = macrosDelDia(aps);
    return r(m.kcal) + " kcal · " + r(m.prot) + " g prot";
  };

  const Hecha = ({ id, aps }) => (
    <>
      {aps.map((ap, i) => <div key={i} style={{ fontSize: 13.5, color: C.text, lineHeight: 1.45 }}>{textoApunte(ap)}</div>)}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span className="mono" style={{ fontSize: 12, color: C.textDim }}>{apuntadoTexto(aps)}</span>
        <button className="btn" onClick={() => deshacerComida(id)} style={{ fontSize: 12, fontWeight: 700, color: C.textDim, minHeight: 32, padding: "0 4px" }}>Cambiar</button>
      </div>
    </>
  );

  return (
    <div style={{ padding: "0 " + SP.xl + "px" }}>
      {/* ═══ DONDE VAS ═══ */}
      <div style={{ background: C.accent, borderRadius: R.xl, padding: "16px 18px", marginBottom: SP.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#FAFAF9" }}>{esHoy ? "HOY" : "ESE DÍA"} TOCA {comida.etiqueta}</span>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "#8A8A87" }}>
            {resto.kcal >= 0 ? "quedan " + r(resto.kcal) : "+" + r(-resto.kcal)} kcal
          </span>
        </div>
        <Barra nombre="KCAL" hecho={comido.kcal} meta={objetivo.kcal} color="#FAFAF9" unidad="" />
        <Barra nombre="PROTEÍNA" hecho={comido.prot} meta={objetivo.prot} color={CAT.fuerza} unidad="g" />
        <div className="mono" style={{ fontSize: 11, color: "#8A8A87", marginTop: SP.sm }}>
          hidrato {r(comido.hc)}/{objetivo.hc} g · grasa {r(comido.grasa)}/{objetivo.grasa} g
        </div>
        <div style={{ ...TYPE.body, fontSize: 12.5, color: "#A8A8A5", marginTop: 6 }}>{comida.detalle}</div>
      </div>

      {/* ═══ DESAYUNO · COMIDA · MERIENDA ═══ */}
      {SLOTS.map(s => {
        const aps = de(s.id);
        const rapida = siempre[s.id] ? COMIDAS_RAPIDAS.find(c => c.id === siempre[s.id]) : null;
        const modo = abierto && abierto.startsWith(s.id + ":") ? abierto.split(":")[1] : null;
        return (
          <div key={s.id} data-slot={s.id} style={tarjeta}>
            <div style={{ ...TYPE.cardTitle, color: C.text, marginBottom: aps.length || modo ? 6 : 10 }}>{s.nombre}</div>
            {aps.length > 0 ? <Hecha id={s.id} aps={aps} /> : modo === "escribir" ? (
              <Escribir comidaId={s.id} apuntarVarias={apuntarVarias} onCerrar={cerrar} />
            ) : modo === "cantina" ? (
              <Cantina apuntarVarias={apuntarVarias} onCerrar={cerrar} />
            ) : modo === "ia" ? (
              <ConIA comidaId={s.id} apuntarVarias={apuntarVarias} onCerrar={cerrar} onEscribir={() => setAbierto(s.id + ":escribir")} />
            ) : (
              <>
                <div style={{ display: "flex", gap: SP.sm }}>
                  {rapida && (
                    <button className="btn" onClick={() => apuntarVarias([{ comida: s.id, origen: "rapida", id: rapida.id }])} style={boton(true)}>
                      {rapida.nombre}
                    </button>
                  )}
                  {s.cantina && <button className="btn" onClick={() => setAbierto(s.id + ":cantina")} style={boton(!rapida)}>Cantina</button>}
                  <button className="btn" onClick={() => setAbierto(s.id + ":ia")} style={boton(false)}>Con tu IA</button>
                </div>
                {s.id === "merienda" && (
                  <PedirIdea que="merienda" resto={resto} tipoDia={comida.id} comido={comidoTextos} />
                )}
                {eligiendoSiempre === s.id ? (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: SP.sm }}>
                    {COMIDAS_RAPIDAS.filter(c => c.id !== "picoteo" && c.id !== "cafe").map(c => (
                      <button key={c.id} className="btn" onClick={() => {
                        const v = { ...siempre, [s.id]: c.id }; setSiempre(v); guardarSiempre(v); setEligiendoSiempre(null);
                      }} style={pastilla(siempre[s.id] === c.id)}>{c.nombre} · {macrosRapida(c.id).kcal}</button>
                    ))}
                  </div>
                ) : (
                  <button className="btn" onClick={() => setEligiendoSiempre(s.id)} style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 700, marginTop: 6, minHeight: 28 }}>
                    {rapida ? "Cambiar «lo de siempre»" : "Poner un «lo de siempre»"}
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* ═══ LA CENA, CUADRADA ═══ */}
      <div data-cena style={{ ...tarjeta, border: "2px solid " + C.accent }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ ...TYPE.cardTitle, color: C.text }}>Cena</span>
          {!cenaApuntada.length && <span style={{ fontSize: 11.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.4 }}>CUADRA TU DÍA</span>}
        </div>
        {cenaApuntada.length > 0 ? <Hecha id="cena" aps={cenaApuntada} /> : abierto === "cena:ia" ? (
          <ConIA comidaId="cena" apuntarVarias={apuntarVarias} onCerrar={cerrar} onEscribir={() => setAbierto("cena:escribir")} />
        ) : lista.length === 0 && abierto !== "cena:escribir" ? (
          <div style={{ fontSize: 13.5, color: C.textDim, lineHeight: 1.5 }}>
            Apunta desayuno, comida y merienda como caigan: aquí te sale la cena que cuadra el día, a ojo, sin pesar nada.
          </div>
        ) : abierto === "cena:escribir" ? (
          <Escribir comidaId="cena" apuntarVarias={apuntarVarias} onCerrar={cerrar} placeholder={"Tortilla francesa de 2 huevos\nEnsalada, un yogur"} />
        ) : (
          <>
            {plato.aviso === "pasado" && <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 8, lineHeight: 1.4 }}>El día ya va lleno: esta noche, proteína y verdura. Mañana, normal.</div>}
            {plato.aviso === "ligera" && <div style={{ fontSize: 13, fontWeight: 700, color: C.textDim, marginBottom: 8 }}>Queda poco: cena ligera.</div>}
            {["prot", "hc", "verdura", "grasa"].map(k => {
              const n = plato.porciones[k];
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: "1px solid " + C.divider, opacity: n ? 1 : 0.45 }}>
                  <span style={{ fontSize: 22, width: 28, textAlign: "center" }}>{PORCION[k].icono}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{n ? textoPorcion(n, k) : "Nada"} <span style={{ fontWeight: 600, color: C.textDim, fontSize: 13 }}>de {PORCION[k].nombre.toLowerCase()}</span></div>
                    {n > 0 && <div style={{ fontSize: 12, color: C.textFaint }}>{PORCION[k].ejemplos}</div>}
                  </div>
                </div>
              );
            })}
            {plato.extraProteina && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ok, marginTop: 4 }}>+ un yogur proteico o un batido: aún falta proteína.</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span className="mono" style={{ fontSize: 12, color: C.textDim }}>≈ {r(plato.macros.kcal)} kcal · {r(plato.macros.prot)} g prot</span>
              <button className="btn" onClick={() => setVerGramos(v => !v)} style={{ fontSize: 12, fontWeight: 700, color: C.textDim, minHeight: 32 }}>{verGramos ? "Ocultar gramos" : "Ver en gramos"}</button>
            </div>
            {verGramos && (
              <div style={{ background: C.surfaceMuted, borderRadius: R.md, padding: "8px 10px", marginTop: 4 }}>
                {enGramos(plato.porciones).map(g => <div key={g.tipo} style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}><b style={{ color: C.text }}>{PORCION[g.tipo].nombre}:</b> {g.texto}</div>)}
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 3 }}>Una de las opciones de cada línea, no todas.</div>
              </div>
            )}
            <div style={{ display: "flex", gap: SP.sm, marginTop: SP.md }}>
              <button className="btn" onClick={() => apuntarVarias([apunteDePlato(plato)])} style={boton(true)}>Cené esto</button>
              <button className="btn" onClick={() => setAbierto("cena:ia")} style={boton(false)}>Cené otra cosa</button>
            </div>
            <PedirIdea que="cena" resto={resto} tipoDia={comida.id} comido={comidoTextos} plato={platoTexto} />
          </>
        )}
      </div>

      {/* ═══ FUERA DE HORAS ═══ */}
      <div style={{ ...tarjeta, padding: "10px 16px" }}>
        {sueltos.map(({ ap, i }) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minHeight: 32 }}>
            <span style={{ fontSize: 13, color: C.text }}>{textoApunte(ap)}</span>
            <button className="btn" aria-label="Quitar" onClick={() => deshacerComida(ap.comida && !EN_TARJETAS.has(ap.comida) ? ap.comida : null, i)}
              style={{ fontSize: 17, color: C.textFaint, padding: "2px 6px" }}>×</button>
          </div>
        ))}
        {abierto === "extra:ia" ? (
          <ConIA comidaId={null} apuntarVarias={apuntarVarias} onCerrar={cerrar} onEscribir={() => setAbierto("extra:escribir")} />
        ) : abierto === "extra:escribir" ? (
          <Escribir comidaId={null} apuntarVarias={apuntarVarias} onCerrar={cerrar} placeholder={"Una caña\nUn puñado de patatas"} />
        ) : (
          <div style={{ display: "flex", gap: SP.sm, alignItems: "center" }}>
            <button className="btn" onClick={() => setAbierto("extra:ia")} style={{ fontSize: 13, fontWeight: 700, color: C.text, minHeight: 36 }}>+ Algo más, fuera de horas</button>
            <span style={{ flex: 1 }} />
            <button className="btn" onClick={() => apuntarVarias([{ origen: "rapida", id: "picoteo" }])} style={{ ...pastilla(false), minHeight: 32 }}>Picoteo</button>
          </div>
        )}
      </div>
    </div>
  );
}
