"use client";

import { useState } from "react";
import { A, C } from "@/design/tokens";
import { leerComidas, leerMicros, leerTotalDelDia, mensajeCargar, mensajeDelDia, sumaDelDia } from "@/domain/nutricion/pegar-ia";
import { ORDEN_MICROS, REFERENCIAS, avisosMicros, estadoMicro, perfilDia, perfilSemana } from "@/domain/nutricion/micros";
import { cargarHabituales, recomendar } from "@/domain/nutricion/recomendar";
import { ScreenHeader } from "@/features/ui/headers";
import { Anillo, Boton, Chevron, Icono, IconoCaja, Seccion, Segmentado, Tarjeta } from "@/features/ui/aire";
import { TuMotor } from "@/features/nutricion/TuMotor";

/**
 * NUTRICION.
 *
 * Que toca hoy y cuanto llevas. Se apunta de dos formas: Mis comidas (las de
 * siempre, de un toque) y, si el dia se sale de lo normal, pegando lo que
 * dice tu IA. Con lo que queda, la app propone cuales de tus comidas cierran
 * el dia. Debajo, la semana, el peso (que ajusta las kcal cada lunes) y la
 * cintura.
 */
const miles = (n) => Math.round(n).toLocaleString("es-ES");
const QUE_ES = {
  comer: "Día de entreno: hidratos alrededor de la sesión.",
  recortar: "Sin sesión intensa: aquí es donde se pierde la grasa.",
};
const LETRAS = ["L", "M", "X", "J", "V", "S", "D"];
const nuevoId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const campo = {
  fontSize: 15, padding: "11px 12px", borderRadius: 10, background: C.surfaceMuted, border: "none",
  color: C.text, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const numero = (v) => { const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) && n >= 0 ? Math.round(n) : null; };

/** Barra fina de "llevas X de Y". */
function Barra({ titulo, llevas, objetivo, unidad, color }) {
  const pct = objetivo ? Math.min(1, llevas / objetivo) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: C.text }}>{titulo}</span>
        <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums" }}><b style={{ color: C.text }}>{miles(llevas)}</b> / {miles(objetivo)} {unidad}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: color + "26" }}>
        <div style={{ width: pct * 100 + "%", height: "100%", borderRadius: 3, background: color }} />
      </div>
    </div>
  );
}

/** Mis comidas: tocar una la apunta; en modo editar se cambian, se borran o se crean. */
function MisComidas({ habituales, setHabituales, apuntar, cerrar }) {
  const [editando, setEditando] = useState(false);
  const [abierta, setAbierta] = useState(null);
  const [completar, setCompletar] = useState(false);
  const [todas, setTodas] = useState(false);
  const [busca, setBusca] = useState("");
  const [nueva, setNueva] = useState({ nombre: "", kcal: "", prot: "", hc: "", grasa: "" });
  const cambiar = (id, k, v) => setHabituales(habituales.map(h => h.id === id ? { ...h, [k]: k === "nombre" ? v : (numero(v) ?? 0) } : h));
  const borrar = (id) => setHabituales(habituales.filter(h => h.id !== id));
  const crear = () => {
    const kcal = numero(nueva.kcal);
    if (!nueva.nombre.trim() || !kcal) return;
    setHabituales([...habituales, { id: nuevoId(), nombre: nueva.nombre.trim(), kcal, prot: numero(nueva.prot) || 0, hc: numero(nueva.hc) || 0, grasa: numero(nueva.grasa) || 0 }]);
    setNueva({ nombre: "", kcal: "", prot: "", hc: "", grasa: "" });
  };
  const sinMicros = habituales.filter(h => !h.micros).length;
  // Las 5 que mas usas (a igualdad, en su orden); "Ver todas" o buscar ensena el resto.
  const ordenadas = habituales.map((h, i) => [h, i]).sort((x, y) => (y[0].usos || 0) - (x[0].usos || 0) || x[1] - y[1]).map(([h]) => h);
  const q = busca.trim().toLowerCase();
  const visibles = q ? ordenadas.filter(h => h.nombre.toLowerCase().includes(q)) : todas ? ordenadas : ordenadas.slice(0, 5);
  const numCampo = (valor, cambio, etiqueta) => (
    <input inputMode="numeric" value={valor} placeholder={etiqueta} aria-label={etiqueta} onChange={cambio}
      style={{ ...campo, flex: 1, minWidth: 0, textAlign: "center", padding: "9px 4px" }} />
  );
  return (
    <Tarjeta data-mis-comidas style={{ padding: 0, marginTop: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 16px 4px" }}>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: C.text }}>Mis comidas</div>
        <button className="btn" onClick={() => setEditando(!editando)} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36, marginRight: 14 }}>{editando ? "Hecho" : "Editar"}</button>
        <button className="btn" onClick={cerrar} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cerrar</button>
      </div>
      {!editando && habituales.length > 8 && (todas || busca) && (
        <div style={{ padding: "2px 16px 6px" }}>
          <input data-buscar-mias value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar"
            style={{ ...campo, padding: "8px 12px", fontSize: 14, background: "#E9E9EE" }} />
        </div>
      )}
      {(editando ? habituales : visibles).map((h) => editando ? (
        <div key={h.id} data-editar-habitual style={{ padding: "8px 16px", borderTop: "1px solid " + C.divider }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <input value={h.nombre} onChange={e => cambiar(h.id, "nombre", e.target.value)} style={{ ...campo, flex: 1, minWidth: 0 }} />
            <button className="btn" aria-label={"Borrar " + h.nombre} onClick={() => borrar(h.id)} style={{ color: A.rojo, minWidth: 32, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icono nombre="mas" tam={20} style={{ transform: "rotate(45deg)" }} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, paddingRight: 38 }}>
            {numCampo(h.kcal, e => cambiar(h.id, "kcal", e.target.value), "kcal")}
            {numCampo(h.prot, e => cambiar(h.id, "prot", e.target.value), "prot.")}
            {numCampo(h.hc ?? "", e => cambiar(h.id, "hc", e.target.value), "hidr.")}
            {numCampo(h.grasa ?? "", e => cambiar(h.id, "grasa", e.target.value), "grasa")}
          </div>
        </div>
      ) : (
        <div key={h.id} style={{ borderTop: "1px solid " + C.divider }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button className="btn" data-habitual onClick={() => apuntar({ nombre: h.nombre, kcal: h.kcal, prot: h.prot, hc: h.hc || 0, grasa: h.grasa || 0, ...(h.micros ? { micros: h.micros } : {}), desde: "mia", de: h.id })}
              style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "0 4px 0 16px", minHeight: 44 }}>
              <span style={{ color: A.azul, display: "flex", flexShrink: 0 }}><Icono nombre="mas" tam={17} grosor={2.4} /></span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.nombre}</span>
              <span style={{ fontSize: 12.5, color: C.textDim, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{miles(h.kcal || 0)} · P{Math.round(h.prot || 0)}</span>
            </button>
            <button className="btn" data-ver-habitual aria-label={"Ver " + h.nombre} onClick={() => setAbierta(abierta === h.id ? null : h.id)}
              style={{ minWidth: 40, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
              <Chevron abierto={abierta === h.id} />
            </button>
          </div>
          {abierta === h.id && <div data-detalle-habitual style={{ padding: "0 16px 10px 43px" }}><DetalleMacros a={h} /></div>}
        </div>
      ))}
      {editando && (
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid " + C.divider }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <input value={nueva.nombre} placeholder="Nueva comida" onChange={e => setNueva(p => ({ ...p, nombre: e.target.value }))} style={{ ...campo, flex: 1, minWidth: 0 }} />
            <button className="btn" aria-label="Añadir comida" onClick={crear} style={{ width: 32, height: 32, borderRadius: 16, background: A.azul, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icono nombre="mas" tam={18} grosor={2.4} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, paddingRight: 38 }}>
            {numCampo(nueva.kcal, e => setNueva(p => ({ ...p, kcal: e.target.value })), "kcal")}
            {numCampo(nueva.prot, e => setNueva(p => ({ ...p, prot: e.target.value })), "prot.")}
            {numCampo(nueva.hc, e => setNueva(p => ({ ...p, hc: e.target.value })), "hidr.")}
            {numCampo(nueva.grasa, e => setNueva(p => ({ ...p, grasa: e.target.value })), "grasa")}
          </div>
        </div>
      )}
      {!editando && !q && habituales.length > 5 && (
        <button className="btn" data-ver-todas onClick={() => setTodas(!todas)}
          style={{ width: "100%", minHeight: 40, borderTop: "1px solid " + C.divider, fontSize: 14, fontWeight: 600, color: A.azul }}>
          {todas ? "Ver menos" : "Ver todas (" + habituales.length + ")"}
        </button>
      )}
      {!editando && q && visibles.length === 0 && <div style={{ fontSize: 13.5, color: C.textDim, padding: "6px 16px 10px" }}>Ninguna con «{busca}».</div>}
      {!editando && (
        <div style={{ padding: completar ? "8px 16px 14px" : "2px 16px 8px", borderTop: "1px solid " + C.divider }}>
          {!completar ? (
            <button className="btn" data-cargar onClick={() => setCompletar(true)} style={{ fontSize: 13, fontWeight: 600, color: A.azul, minHeight: 34, display: "flex", alignItems: "center", gap: 5 }}>
              <Icono nombre="magia" tam={15} /> Cargar de mi IA{sinMicros ? " · completar " + sinMicros : ""}
            </button>
          ) : <CargarDeIA habituales={habituales} setHabituales={setHabituales} cerrar={() => setCompletar(false)} />}
        </div>
      )}
    </Tarjeta>
  );
}

/**
 * Cargar Mis comidas desde tu IA: le cuentas lo que comes a menudo, pegas su
 * respuesta y las comidas se guardan (las nuevas se añaden; las que ya
 * tienes, mismo nombre, se completan con macros y vitaminas).
 */
function CargarDeIA({ habituales, setHabituales, cerrar }) {
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const leidas = texto.trim() ? leerComidas(texto) : [];
  const vista = cargarHabituales(habituales, leidas, nuevoId);
  const hay = vista.nuevas + vista.actualizadas;
  const copiar = async () => {
    const msg = mensajeCargar(habituales);
    try { await navigator.clipboard.writeText(msg); setCopiado(true); } catch { setTexto(msg); }
  };
  const norm = (x) => String(x || "").trim().toLowerCase().replace(/\s+/g, " ");
  const tengo = new Set(habituales.map(h => norm(h.nombre)));
  return (
    <div data-cargar-ia>
      <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5, margin: "4px 0 8px" }}>
        1. Copia el mensaje y pégalo en tu IA. 2. Cuéntale las comidas que tomas a menudo (o mándale foto). 3. Pega aquí su respuesta: se guardan con sus macros y vitaminas.
      </div>
      <Boton tipo="suave" onClick={copiar} style={{ minHeight: 42, fontSize: 15 }}>{copiado ? "Copiado: pégalo en tu IA" : "Copiar mensaje para mi IA"}</Boton>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Pega aquí la respuesta"
        style={{ ...campo, minHeight: 80, resize: "vertical", marginTop: 8 }} />
      {leidas.length > 0 && (
        <div data-cargar-lista style={{ marginTop: 8 }}>
          {leidas.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: i ? "1px solid " + C.divider : "none", fontSize: 14 }}>
              <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{l.nombre}</span>
              <span style={{ color: tengo.has(norm(l.nombre)) ? A.azul : A.verde, fontWeight: 600, flexShrink: 0 }}>{tengo.has(norm(l.nombre)) ? "se completa" : "nueva"}</span>
              <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{miles(l.kcal)} kcal</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1, fontSize: 13.5, color: texto.trim() && !hay ? A.naranja : C.textDim }}>
          {texto.trim() && !hay ? "No veo líneas COMIDA. Pídele a tu IA el formato del mensaje." : ""}
        </div>
        <button className="btn" onClick={cerrar} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cancelar</button>
        <button className="btn" data-guardar-cargar disabled={!hay} onClick={() => { setHabituales(vista.habituales); cerrar(); }}
          style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, background: hay ? A.azul : "#E5E5EA", color: hay ? "#fff" : C.textDim, fontSize: 15, fontWeight: 700 }}>
          Guardar{hay ? " " + hay : ""}
        </button>
      </div>
    </div>
  );
}

/** Pegar de tu IA: copiar el mensaje, hablar con ella y pegar su respuesta. Se lee el TOTAL. */
function PegarIA({ comida, llevas, favoritas, apuntar, cerrar }) {
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const hay = texto.trim();
  const comidas = hay ? leerComidas(texto) : [];
  const leido = hay && !comidas.length ? leerTotalDelDia(texto) : null;
  const micros = hay && !comidas.length ? leerMicros(texto) : null;
  const copiar = async () => {
    const msg = mensajeDelDia({ comida, llevas, favoritas });
    try { await navigator.clipboard.writeText(msg); setCopiado(true); } catch { setTexto(msg); }
  };
  const anadir = () => {
    if (comidas.length) comidas.forEach(c => apuntar({ ...c, desde: "ia" }));
    else if (leido) apuntar({ nombre: "De mi IA", ...leido, desde: "ia", ...(micros ? { micros } : {}) });
    setTexto(""); cerrar();
  };
  const totalComidas = comidas.reduce((t, c) => ({ kcal: t.kcal + c.kcal, prot: t.prot + c.prot }), { kcal: 0, prot: 0 });
  return (
    <Tarjeta data-pegar-ia style={{ padding: "14px 16px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.text }}>Pegar de mi IA</div>
        <button className="btn" onClick={cerrar} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cerrar</button>
      </div>
      <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5, marginBottom: 10 }}>
        1. Copia el mensaje y pégalo en tu IA (Claude, ChatGPT){favoritas && favoritas.length ? "; ya lleva tus comidas guardadas" : ""}. 2. Cuéntale lo que has comido. 3. Pega aquí su respuesta: cada comida se apunta con sus macros y vitaminas.
      </div>
      <Boton tipo="suave" onClick={copiar} style={{ minHeight: 44, fontSize: 15 }}>{copiado ? "Copiado: pégalo en tu IA" : "Copiar mensaje para mi IA"}</Boton>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Pega aquí la respuesta de tu IA"
        style={{ ...campo, minHeight: 90, resize: "vertical", marginTop: 10 }} />
      {hay && comidas.length > 0 && (
        <div data-leidas style={{ marginTop: 10 }}>
          {comidas.map((c, i) => (
            <div key={i} data-leida style={{ display: "flex", gap: 8, padding: "7px 0", borderTop: i ? "1px solid " + C.divider : "none", fontSize: 14 }}>
              <span style={{ flex: 1, color: C.text, fontWeight: 600 }}>{c.nombre}</span>
              <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{miles(c.kcal)} kcal · {c.prot} g{c.micros ? " · vit." : ""}</span>
            </div>
          ))}
          <button className="btn" data-anadir-ia onClick={anadir} style={{ width: "100%", marginTop: 8, minHeight: 44, borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700 }}>
            Añadir {comidas.length === 1 ? "1 comida" : comidas.length + " comidas"} · {miles(totalComidas.kcal)} kcal
          </button>
        </div>
      )}
      {hay && !comidas.length && (
        leido ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1, fontSize: 14, color: C.text }}>Leído: <b>{miles(leido.kcal)} kcal · {leido.prot} g proteína</b>{micros ? " · y vitaminas" : ""}</div>
            <button className="btn" data-anadir-ia onClick={anadir}
              style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700 }}>Añadir</button>
          </div>
        ) : <div style={{ fontSize: 13, color: A.naranja, marginTop: 8 }}>No veo comidas ni la línea TOTAL. Pídele a tu IA que termine con las líneas COMIDA.</div>
      )}
    </Tarjeta>
  );
}

const ETIQUETA_MICRO = { fibra: ["Fibra", "g"], hierro: ["Hierro", "mg"], calcio: ["Calcio", "mg"], vitD: ["Vit. D", "µg"], b12: ["B12", "µg"], omega3: ["Omega-3", "g"], sodio: ["Sodio", "mg"] };
const num1 = (v) => (v < 10 ? String(Math.round(v * 10) / 10).replace(".", ",") : Math.round(v).toLocaleString("es-ES"));

/** Una comida apuntada: al tocarla, sus macros y micros; la estrella la guarda en Mis comidas. */
function ApunteFila({ a, primera, quitar, favorita, alternarFavorita }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div data-apunte style={{ borderTop: primera ? "none" : "1px solid " + C.divider }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px 10px 16px", minHeight: 56 }}>
        <button className="btn" data-abrir-apunte onClick={() => setAbierta(!abierta)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
          <IconoCaja nombre={a.desde === "ia" ? "portapapeles" : "plato"} tono={a.desde === "ia" ? "morado" : "verde"} tam={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{a.nombre || "Comida"}</div>
            <div style={{ fontSize: 12.5, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>{miles(a.kcal || 0)} kcal · {Math.round(a.prot || 0)} g proteína</div>
          </div>
          <Chevron abierto={abierta} />
        </button>
        <button className="btn" data-favorita aria-label={favorita ? "Quitar de Mis comidas" : "Guardar en Mis comidas"} onClick={() => alternarFavorita(a)}
          style={{ color: favorita ? A.naranja : "#C7C7CC", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={favorita ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
          </svg>
        </button>
        {a.id && (
          <button className="btn" aria-label={"Quitar " + (a.nombre || "comida")} onClick={() => quitar(a.id)}
            style={{ color: "#C7C7CC", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icono nombre="mas" tam={20} grosor={2.2} style={{ transform: "rotate(45deg)" }} />
          </button>
        )}
      </div>
      {abierta && (
        <div data-detalle-apunte style={{ padding: "0 16px 12px 62px" }}>
          <DetalleMacros a={a} />
        </div>
      )}
    </div>
  );
}

/** Los macros en cuadros y, si los hay, los micros en una linea. */
function DetalleMacros({ a }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: a.micros ? 8 : 0 }}>
        {[["Kcal", a.kcal, ""], ["Prot.", a.prot, "g"], ["Hidr.", a.hc, "g"], ["Grasa", a.grasa, "g"]].map(([t, v, u]) => (
          <div key={t} style={{ background: C.surfaceMuted, borderRadius: 10, padding: "6px 8px" }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600 }}>{t}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{Math.round(v || 0)}{u && <span style={{ fontSize: 11, color: C.textDim }}> {u}</span>}</div>
          </div>
        ))}
      </div>
      {a.micros ? (
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
          {Object.keys(ETIQUETA_MICRO).filter(k => Number.isFinite(a.micros[k])).map(k => ETIQUETA_MICRO[k][0] + " " + num1(a.micros[k]) + " " + ETIQUETA_MICRO[k][1]).join(" · ")}
          {a.microsRepartidos ? <div style={{ fontSize: 12, color: C.textFaint }}>Vitaminas repartidas del total del día.</div> : null}
        </div>
      ) : <div style={{ fontSize: 12.5, color: C.textFaint }}>Sin vitaminas todavía.</div>}
    </>
  );
}

/** Vitaminas y minerales que estimó tu IA: hoy o la media de la semana, y avisos. */
function Micros({ apuntes, semanaApuntes, esHoy }) {
  const sem = perfilSemana(semanaApuntes);
  const hoy = perfilDia(apuntes);
  const [vista, setVista] = useState(null);
  if (!sem.media && !hoy) return null;
  const v = vista || (hoy ? "hoy" : "semana");
  const datos = v === "hoy" ? hoy : sem.media;
  const avisos = avisosMicros(sem.porDia);
  return (
    <>
      <Seccion>Vitaminas y minerales</Seccion>
      <Tarjeta data-micros style={{ padding: "14px 16px" }}>
        <Segmentado opciones={[["hoy", esHoy ? "Hoy" : "Ese día"], ["semana", "Media semana"]]} valor={v} cambiar={setVista} style={{ marginBottom: 12 }} />
        {datos ? ORDEN_MICROS.filter(k => Number.isFinite(datos[k])).map(k => {
          const r = REFERENCIAS[k], e = estadoMicro(k, datos[k]);
          const col = e.bien ? A.verde : A.naranja;
          const val = datos[k] < 10 ? String(Math.round(datos[k] * 10) / 10).replace(".", ",") : Math.round(datos[k]).toLocaleString("es-ES");
          return (
            <div key={k} data-micro={k} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: C.text }}>{r.nombre}</span>
                <span style={{ color: C.textDim, fontVariantNumeric: "tabular-nums" }}>
                  <b style={{ color: C.text }}>{val}</b> {r.unidad} · <span style={{ color: col, fontWeight: 600 }}>{Math.round(e.pct * 100)} %</span>{r.tope ? " del tope" : ""}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: col + "26" }}>
                <div style={{ width: Math.min(1, e.pct) * 100 + "%", height: "100%", borderRadius: 3, background: col }} />
              </div>
            </div>
          );
        }) : <div style={{ fontSize: 14, color: C.textDim, padding: "4px 0 8px" }}>Hoy aún no hay vitaminas: llegan cuando pegas de tu IA.</div>}
        {avisos.map(a => (
          <div key={a.k} data-aviso-micro style={{ display: "flex", gap: 8, padding: "10px 0 2px", borderTop: "1px solid " + C.divider, marginTop: 4 }}>
            <span style={{ color: A.naranja, paddingTop: 1 }}><Icono nombre="aviso" tam={17} /></span>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.4 }}><b>{a.texto}</b> <span style={{ color: C.textDim }}>Idea: {a.idea}.</span></div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: C.textFaint, marginTop: 8 }}>Estimado por tu IA · {sem.diasConDato} {sem.diasConDato === 1 ? "día" : "días"} con dato esta semana</div>
      </Tarjeta>
    </>
  );
}

export function NutricionScreen({ comida, esHoy, cuadre = null, apuntes = [], apuntar, quitar, habituales = [], setHabituales, semana, semanaApuntes = [], medidas = [], irAProgreso, motor }) {
  const [panel, setPanel] = useState(null); // null | "mias" | "ia"
  const [verIdeas, setVerIdeas] = useState(false);
  const m = comida && comida.macros;
  const llevas = sumaDelDia(apuntes);
  const quedan = m ? { kcal: m.kcal - llevas.kcal, prot: m.prot - llevas.prot } : null;
  const ideas = m ? recomendar({ habituales, quedan, yaComidas: apuntes.map(a => a.de) }) : [];
  const apuntarNuevo = (ap) => apuntar({ id: nuevoId(), ...ap });
  const mismo = (x, y) => (x || "").trim().toLowerCase() === (y || "").trim().toLowerCase();
  const esFavorita = (a) => habituales.some(h => mismo(h.nombre, a.nombre));
  const alternarFavorita = (a) => {
    if (esFavorita(a)) { setHabituales(habituales.filter(h => !mismo(h.nombre, a.nombre))); return; }
    setHabituales([...habituales, { id: nuevoId(), nombre: a.nombre, kcal: Math.round(a.kcal || 0), prot: Math.round(a.prot || 0),
      hc: Math.round(a.hc || 0), grasa: Math.round(a.grasa || 0), ...(a.micros ? { micros: a.micros } : {}), usos: 1 }]);
  };
  // Mis comidas: al usar una, cuenta (las mas usadas van primero en el mensaje para la IA).
  const apuntarHabitual = (ap) => {
    apuntarNuevo(ap);
    if (ap.de) setHabituales(habituales.map(h => h.id === ap.de ? { ...h, usos: (h.usos || 0) + 1 } : h));
  };
  const color = comida && comida.id === "comer" ? A.verde : A.naranja;
  const conCintura = medidas.filter(x => x && x.cintura != null);
  const ultCintura = conCintura[conCintura.length - 1];
  const primCintura = conCintura[0];
  const conFoto = medidas.filter(x => x && x.foto);
  const ultFoto = conFoto[conFoto.length - 1];

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <ScreenHeader title="Nutrición" subtitle={comida ? (esHoy ? "Hoy toca " : "Ese día tocaba ") + comida.etiqueta : ""} />

      {m && (
        <Tarjeta data-hoy-comida style={{ padding: "18px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Anillo pct={llevas.kcal / m.kcal} color={color} tam={124}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{miles(Math.max(0, quedan.kcal))}</div>
              <div style={{ fontSize: 11.5, color: C.textDim, fontWeight: 600 }}>{quedan.kcal >= 0 ? "kcal quedan" : "kcal de más"}</div>
            </Anillo>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textDim }}>Proteína</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
                {miles(llevas.prot)}<span style={{ fontSize: 15, color: C.textDim, fontWeight: 600 }}> / {m.prot} g</span>
              </div>
              <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.4, marginTop: 4 }}>{QUE_ES[comida.id]}</div>
            </div>
          </div>
          {cuadre && (
            <div data-cuadre style={{ display: "flex", gap: 8, marginTop: 14, padding: "10px 12px", borderRadius: 12, background: A.fondo.azul, fontSize: 13.5, color: C.text, lineHeight: 1.45 }}>
              <span style={{ color: A.azul, paddingTop: 1 }}><Icono nombre="calendario" tam={17} /></span>
              <span>{cuadre}{comida.cuadre ? <b> Hoy: {miles(m.kcal)} kcal.</b> : null}</span>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Barra titulo="Kcal" llevas={llevas.kcal} objetivo={m.kcal} unidad="kcal" color={color} />
            <Barra titulo="Proteína" llevas={llevas.prot} objetivo={m.prot} unidad="g" color={A.azul} />
            <Barra titulo="Hidratos" llevas={llevas.hc} objetivo={m.hc} unidad="g" color={A.naranja} />
            <Barra titulo="Grasa" llevas={llevas.grasa} objetivo={m.grasa} unidad="g" color={A.morado} />
          </div>
        </Tarjeta>
      )}

      <Seccion>{esHoy ? "Hoy has comido" : "Ese día comiste"}</Seccion>
      {apuntes.length > 0 && (
        <Tarjeta data-apuntes style={{ padding: 0, overflow: "hidden" }}>
          {apuntes.map((a, i) => (
            <ApunteFila key={a.id || i} a={a} primera={i === 0} quitar={quitar}
              favorita={esFavorita(a)} alternarFavorita={alternarFavorita} />
          ))}
        </Tarjeta>
      )}
      {apuntes.length === 0 && <div style={{ fontSize: 14, color: C.textDim, margin: "0 4px 4px" }}>Nada apuntado todavía.</div>}

      {ideas.length > 0 && (
        <Tarjeta data-ideas style={{ padding: verIdeas ? "4px 12px 12px" : "0 12px", marginTop: 10, background: A.fondo.azul, boxShadow: "none" }}>
          <button className="btn" data-ver-ideas onClick={() => setVerIdeas(!verIdeas)}
            style={{ width: "100%", minHeight: 44, display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: A.azul, textAlign: "left" }}>
            <Icono nombre="idea" tam={18} />
            <span style={{ flex: 1 }}>Te quedan {miles(quedan.kcal)} kcal · {Math.max(0, Math.round(quedan.prot))} g · ideas</span>
            <Chevron abierto={verIdeas} />
          </button>
          {verIdeas && ideas.map((o, i) => (
            <button key={i} className="btn" data-idea onClick={() => o.comidas.forEach(c => apuntarHabitual({ nombre: c.nombre, kcal: c.kcal, prot: c.prot, hc: c.hc || 0, grasa: c.grasa || 0, ...(c.micros ? { micros: c.micros } : {}), desde: "mia", de: c.id }))}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "#fff", borderRadius: 14, padding: "10px 12px", marginTop: i ? 8 : 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{o.comidas.map(c => c.nombre).join(" + ")}</div>
                <div style={{ fontSize: 12.5, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>{miles(o.kcal)} kcal · {o.prot} g proteína</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.azul }}>Apuntar</span>
            </button>
          ))}
        </Tarjeta>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Boton tipo="color" data-boton-mias onClick={() => setPanel(panel === "mias" ? null : "mias")} style={{ flex: 1, minHeight: 46, fontSize: 15 }}>+ Mis comidas</Boton>
        <Boton tipo="suave" data-boton-ia onClick={() => setPanel(panel === "ia" ? null : "ia")} style={{ flex: 1, minHeight: 46, fontSize: 15 }}>Pegar de mi IA</Boton>
      </div>
      {panel === "mias" && <MisComidas habituales={habituales} setHabituales={setHabituales} apuntar={apuntarHabitual} cerrar={() => setPanel(null)} />}
      {panel === "ia" && comida && <PegarIA comida={comida} llevas={llevas} favoritas={habituales} apuntar={apuntarNuevo} cerrar={() => setPanel(null)} />}

      {semana && (
        <>
          <Seccion>Esta semana</Seccion>
          <Tarjeta data-semana-nutricion style={{ padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 96 }}>
              {semana.dias.map((d, i) => {
                const h = d.objetivo ? Math.min(1.2, d.kcal / d.objetivo) : 0;
                const col = d.estado === "bien" ? A.verde : d.estado === "ojo" ? A.naranja : "#E5E5EA";
                return (
                  <div key={d.iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ width: "100%", maxWidth: 26, height: Math.max(6, h * 72), borderRadius: 7, background: d.kcal ? col : "#EFEFF4" }} />
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: C.textDim }}>{LETRAS[i]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 13, color: C.textDim, marginTop: 8 }}>
              {semana.cerrados
                ? <>Proteína media <b style={{ color: C.text }}>{semana.protMedia} g</b> · {semana.dias.filter(d => d.estado === "bien").length} de {semana.cerrados} días en objetivo</>
                : "Apunta lo que comes y aquí verás la semana."}
            </div>
          </Tarjeta>
        </>
      )}

      <Micros apuntes={apuntes} semanaApuntes={semanaApuntes} esHoy={esHoy} />

      {motor && esHoy && (
        <>
          <Seccion>Peso</Seccion>
          <TuMotor {...motor} />
        </>
      )}

      <Seccion>Cintura y foto</Seccion>
      <Tarjeta data-cintura style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        {ultFoto
          ? <img src={ultFoto.foto} alt="" style={{ width: 48, height: 64, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />
          : <IconoCaja nombre="regla" tono="morado" />}
        <div style={{ flex: 1, minWidth: 0 }}>
          {ultCintura ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{String(ultCintura.cintura).replace(".", ",")} cm</div>
              <div style={{ fontSize: 12.5, color: C.textDim }}>
                {ultCintura.fecha}{primCintura !== ultCintura ? " · " + (ultCintura.cintura - primCintura.cintura > 0 ? "+" : "") + String(Math.round((ultCintura.cintura - primCintura.cintura) * 10) / 10).replace(".", ",") + " cm desde el inicio" : ""}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>Una vez por semana</div>
              <div style={{ fontSize: 12.5, color: C.textDim }}>Cintura a la altura del ombligo y una foto, el lunes en ayunas.</div>
            </>
          )}
        </div>
        <button className="btn" onClick={irAProgreso} style={{ fontSize: 15, fontWeight: 600, color: A.azul, minHeight: 40 }}>Apuntar</button>
      </Tarjeta>
    </div>
  );
}
