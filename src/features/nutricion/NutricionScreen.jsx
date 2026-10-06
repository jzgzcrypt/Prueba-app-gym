"use client";

import { useState } from "react";
import { A, C } from "@/design/tokens";
import { leerMicros, leerTotalDelDia, mensajeDelDia, sumaDelDia } from "@/domain/nutricion/pegar-ia";
import { ORDEN_MICROS, REFERENCIAS, avisosMicros, estadoMicro, perfilDia, perfilSemana } from "@/domain/nutricion/micros";
import { recomendar } from "@/domain/nutricion/recomendar";
import { ScreenHeader } from "@/features/ui/headers";
import { Anillo, Boton, Icono, IconoCaja, Seccion, Segmentado, Tarjeta } from "@/features/ui/aire";
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
  const [nueva, setNueva] = useState({ nombre: "", kcal: "", prot: "" });
  const cambiar = (id, k, v) => setHabituales(habituales.map(h => h.id === id ? { ...h, [k]: k === "nombre" ? v : (numero(v) ?? 0) } : h));
  const borrar = (id) => setHabituales(habituales.filter(h => h.id !== id));
  const crear = () => {
    const kcal = numero(nueva.kcal), prot = numero(nueva.prot);
    if (!nueva.nombre.trim() || !kcal) return;
    setHabituales([...habituales, { id: nuevoId(), nombre: nueva.nombre.trim(), kcal, prot: prot || 0, hc: 0, grasa: 0 }]);
    setNueva({ nombre: "", kcal: "", prot: "" });
  };
  return (
    <Tarjeta data-mis-comidas style={{ padding: 0, marginTop: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 6px" }}>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.text }}>Mis comidas</div>
        <button className="btn" onClick={() => setEditando(!editando)} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36, marginRight: 14 }}>{editando ? "Hecho" : "Editar"}</button>
        <button className="btn" onClick={cerrar} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cerrar</button>
      </div>
      {!editando && <div style={{ fontSize: 13, color: C.textDim, padding: "0 16px 6px" }}>Toca una para sumarla a hoy.</div>}
      {habituales.map((h) => editando ? (
        <div key={h.id} style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 16px", borderTop: "1px solid " + C.divider }}>
          <input value={h.nombre} onChange={e => cambiar(h.id, "nombre", e.target.value)} style={{ ...campo, flex: 1, minWidth: 0 }} />
          <input inputMode="numeric" value={h.kcal} onChange={e => cambiar(h.id, "kcal", e.target.value)} aria-label="kcal" style={{ ...campo, width: 62, textAlign: "center" }} />
          <input inputMode="numeric" value={h.prot} onChange={e => cambiar(h.id, "prot", e.target.value)} aria-label="proteína" style={{ ...campo, width: 48, textAlign: "center" }} />
          <button className="btn" aria-label={"Borrar " + h.nombre} onClick={() => borrar(h.id)} style={{ color: A.rojo, minWidth: 32, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icono nombre="mas" tam={20} style={{ transform: "rotate(45deg)" }} />
          </button>
        </div>
      ) : (
        <button key={h.id} className="btn" data-habitual onClick={() => apuntar({ nombre: h.nombre, kcal: h.kcal, prot: h.prot, hc: h.hc || 0, grasa: h.grasa || 0, desde: "mia", de: h.id })}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 16px", borderTop: "1px solid " + C.divider, minHeight: 52 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{h.nombre}</div>
            <div style={{ fontSize: 12.5, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>{miles(h.kcal)} kcal · {h.prot} g proteína</div>
          </div>
          <span style={{ width: 30, height: 30, borderRadius: 15, background: A.fondo.azul, color: A.azul, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icono nombre="mas" tam={18} grosor={2.4} />
          </span>
        </button>
      ))}
      {editando && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "10px 16px 14px", borderTop: "1px solid " + C.divider }}>
          <input value={nueva.nombre} placeholder="Nueva comida" onChange={e => setNueva(p => ({ ...p, nombre: e.target.value }))} style={{ ...campo, flex: 1, minWidth: 0 }} />
          <input inputMode="numeric" value={nueva.kcal} placeholder="kcal" onChange={e => setNueva(p => ({ ...p, kcal: e.target.value }))} style={{ ...campo, width: 62, textAlign: "center" }} />
          <input inputMode="numeric" value={nueva.prot} placeholder="g" onChange={e => setNueva(p => ({ ...p, prot: e.target.value }))} style={{ ...campo, width: 48, textAlign: "center" }} />
          <button className="btn" aria-label="Añadir comida" onClick={crear} style={{ width: 32, height: 32, borderRadius: 16, background: A.azul, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icono nombre="mas" tam={18} grosor={2.4} />
          </button>
        </div>
      )}
      {editando && <div style={{ fontSize: 12, color: C.textDim, padding: "0 16px 14px" }}>Nombre · kcal · gramos de proteína</div>}
    </Tarjeta>
  );
}

/** Pegar de tu IA: copiar el mensaje, hablar con ella y pegar su respuesta. Se lee el TOTAL. */
function PegarIA({ comida, llevas, apuntar, cerrar }) {
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);
  const leido = texto.trim() ? leerTotalDelDia(texto) : null;
  const micros = texto.trim() ? leerMicros(texto) : null;
  const copiar = async () => {
    const msg = mensajeDelDia({ comida, llevas });
    try { await navigator.clipboard.writeText(msg); setCopiado(true); } catch { setTexto(msg); }
  };
  return (
    <Tarjeta data-pegar-ia style={{ padding: "14px 16px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: C.text }}>Pegar de mi IA</div>
        <button className="btn" onClick={cerrar} style={{ fontSize: 15, color: A.azul, fontWeight: 600, minHeight: 36 }}>Cerrar</button>
      </div>
      <div style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5, marginBottom: 10 }}>
        1. Copia el mensaje y pégalo en tu IA (Claude, ChatGPT). 2. Cuéntale lo que has comido. 3. Pega aquí su respuesta: se suma su línea TOTAL.
      </div>
      <Boton tipo="suave" onClick={copiar} style={{ minHeight: 44, fontSize: 15 }}>{copiado ? "Copiado: pégalo en tu IA" : "Copiar mensaje para mi IA"}</Boton>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Pega aquí la respuesta de tu IA"
        style={{ ...campo, minHeight: 90, resize: "vertical", marginTop: 10 }} />
      {texto.trim() && (
        leido ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <div style={{ flex: 1, fontSize: 14, color: C.text }}>Leído: <b>{miles(leido.kcal)} kcal · {leido.prot} g proteína</b>{micros ? " · y vitaminas" : ""}</div>
            <button className="btn" data-anadir-ia onClick={() => { apuntar({ nombre: "De mi IA", ...leido, desde: "ia", ...(micros ? { micros } : {}) }); setTexto(""); cerrar(); }}
              style={{ minHeight: 38, padding: "0 16px", borderRadius: 999, background: A.azul, color: "#fff", fontSize: 15, fontWeight: 700 }}>Añadir</button>
          </div>
        ) : <div style={{ fontSize: 13, color: A.naranja, marginTop: 8 }}>No veo la línea TOTAL. Pídele a tu IA que termine con ella.</div>
      )}
    </Tarjeta>
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

export function NutricionScreen({ comida, esHoy, apuntes = [], apuntar, quitar, habituales = [], setHabituales, semana, semanaApuntes = [], medidas = [], irAProgreso, motor }) {
  const [panel, setPanel] = useState(null); // null | "mias" | "ia"
  const m = comida && comida.macros;
  const llevas = sumaDelDia(apuntes);
  const quedan = m ? { kcal: m.kcal - llevas.kcal, prot: m.prot - llevas.prot } : null;
  const ideas = m ? recomendar({ habituales, quedan, yaComidas: apuntes.map(a => a.de) }) : [];
  const apuntarNuevo = (ap) => apuntar({ id: nuevoId(), ...ap });
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
            <div key={a.id || i} data-apunte style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px 10px 16px", borderTop: i ? "1px solid " + C.divider : "none", minHeight: 56 }}>
              <IconoCaja nombre={a.desde === "ia" ? "portapapeles" : "plato"} tono={a.desde === "ia" ? "morado" : "verde"} tam={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{a.nombre || "Comida"}</div>
                <div style={{ fontSize: 12.5, color: C.textDim, fontVariantNumeric: "tabular-nums" }}>{miles(a.kcal || 0)} kcal · {Math.round(a.prot || 0)} g proteína</div>
              </div>
              {a.id && (
                <button className="btn" aria-label={"Quitar " + (a.nombre || "comida")} onClick={() => quitar(a.id)}
                  style={{ color: "#C7C7CC", minWidth: 36, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icono nombre="mas" tam={20} grosor={2.2} style={{ transform: "rotate(45deg)" }} />
                </button>
              )}
            </div>
          ))}
        </Tarjeta>
      )}
      {apuntes.length === 0 && <div style={{ fontSize: 14, color: C.textDim, margin: "0 4px 4px" }}>Nada apuntado todavía.</div>}

      {ideas.length > 0 && (
        <Tarjeta data-ideas style={{ padding: "14px 16px", marginTop: 10, background: A.fondo.azul, boxShadow: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: A.azul, marginBottom: 8 }}>
            <Icono nombre="idea" tam={18} /> Te quedan {miles(quedan.kcal)} kcal · {Math.max(0, Math.round(quedan.prot))} g proteína
          </div>
          {ideas.map((o, i) => (
            <button key={i} className="btn" data-idea onClick={() => o.comidas.forEach(c => apuntarNuevo({ nombre: c.nombre, kcal: c.kcal, prot: c.prot, hc: c.hc || 0, grasa: c.grasa || 0, desde: "mia", de: c.id }))}
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
      {panel === "mias" && <MisComidas habituales={habituales} setHabituales={setHabituales} apuntar={apuntarNuevo} cerrar={() => setPanel(null)} />}
      {panel === "ia" && comida && <PegarIA comida={comida} llevas={llevas} apuntar={apuntarNuevo} cerrar={() => setPanel(null)} />}

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
