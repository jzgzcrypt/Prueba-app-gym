"use client";

/**
 * EL DIA — tu menu, ajustado a lo que llevas comido.
 *
 * Esto es lo unico de la pestaña que se toca a diario. El resto (los menus de
 * 2022, las equivalencias, los trucos) es consulta; esto es uso.
 *
 * La pantalla es tu menu del dia, en orden. Cada comida se marca de una de
 * dos formas: te la has comido tal cual, o has comido otra cosa y la apuntas
 * por encima —señalando en la cantina, sin pesar nada—. En cuanto apuntas,
 * LAS CANTIDADES DE LO QUE QUEDA se recalculan para que el dia siga cuadrando,
 * y se marca en verde o en ambar lo que ha subido o bajado respecto al plan.
 *
 * No se te propone comida nueva. Tu menu es tu menu; lo que cambia son los
 * gramos.
 */

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ALIMENTO, ALIMENTOS, cantidadLegible, equivalentesDe } from "@/domain/nutricion/alimentos";
// Se siguen leyendo para los apuntes de antes de que esto se escribiera a
// mano: un registro viejo tiene que seguir diciendo lo mismo.
import { PLATO_CANTINA, RACIONES } from "@/domain/nutricion/cantina";
import { COMIDAS_RAPIDAS, macrosDelDia } from "@/domain/nutricion/iifym";
import { interpretar, totalDe } from "@/domain/nutricion/escribir";
import { apuntesDe, claveCambio, cuadrarDia } from "@/domain/nutricion/cuadrar";
import { comidasQuitadas, menuDe } from "@/domain/nutricion/menu-dia";
import { SectionHeader } from "@/features/ui/headers";

const MACROS = [
  { k: "prot", n: "Proteína", color: CAT.fuerza },
  { k: "hc", n: "Carbos", color: CAT.running },
  { k: "grasa", n: "Grasa", color: CAT.movilidad },
];

const GRUPOS_CASA = [
  { id: "proteina", n: "Proteína" }, { id: "carbo", n: "Carbos" },
  { id: "verdura", n: "Verdura" }, { id: "fruta", n: "Fruta" },
  { id: "grasa", n: "Grasa" }, { id: "extra", n: "Otros" },
];

/** De dónde sale cada número, dicho sin tecnicismos. */
const ETIQUETA_CONFIANZA = {
  escrito: "Tus números",
  tabla: "Calculado",
  estimado: "Estimado con tus calorías",
  "sin-entender": "No sé qué es — escribe las calorías",
};

/** Corregir las kcal a mano mantiene la proporción de macros. */
function escalarLinea(linea, kcal) {
  if (!Number.isFinite(kcal) || kcal <= 0) return linea.macros;
  if (!linea.macros.kcal) {
    return { kcal, prot: Math.round((kcal * 0.22) / 4), hc: Math.round((kcal * 0.45) / 4),
             grasa: Math.round((kcal * 0.33) / 9) };
  }
  const f = kcal / linea.macros.kcal;
  return { kcal, prot: Math.round(linea.macros.prot * f), hc: Math.round(linea.macros.hc * f),
           grasa: Math.round(linea.macros.grasa * f) };
}

const tarjeta = {
  background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: "14px 16px",
};

const pastilla = (activo) => ({
  padding: "8px 12px", borderRadius: R.pill, minHeight: 36, whiteSpace: "nowrap",
  background: activo ? C.accent : C.card,
  border: "1px solid " + (activo ? C.accent : C.cardBorder),
  color: activo ? "#FAFAF9" : C.textDim, fontSize: 12, fontWeight: 700,
});

const botonComida = (fuerte) => ({
  flex: 1, minHeight: TAP_MIN - 6, borderRadius: R.lg, fontSize: 12.5, fontWeight: 700,
  background: fuerte ? C.accent : C.surfaceMuted,
  border: "1px solid " + (fuerte ? C.accent : C.cardBorder),
  color: fuerte ? "#FAFAF9" : C.textDim,
});

function Barra({ nombre, hecho, meta, color }) {
  const pct = meta > 0 ? Math.min(100, (hecho / meta) * 100) : 0;
  const pasado = hecho > meta * 1.08;
  return (
    <div style={{ marginTop: SP.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{nombre.toUpperCase()}</span>
        <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: pasado ? C.amber : "#D4D4D1" }}>
          {Math.round(hecho)} / {Math.round(meta)} g
        </span>
      </div>
      <div style={{ height: 5, background: "#333331", borderRadius: R.pill, marginTop: 4, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: pasado ? C.amber : color, borderRadius: R.pill }} />
      </div>
    </div>
  );
}

/** Lo que ha cambiado respecto al plan. En verde sube, en ámbar baja: de un
 *  vistazo se ve si el día va sobrado o apretado. */
function Cambio({ g }) {
  if (!g) return null;
  return (
    <span className="mono" style={{ fontSize: 11, fontWeight: 700, marginLeft: 6,
                                    color: g > 0 ? C.ok : C.amber }}>
      {g > 0 ? "+" : "−"}{Math.abs(g)}
    </span>
  );
}

export function DiaDeComida({ comida, apuntes, cambios, apuntarVarias,
                              deshacerComida, cambiarAlimento, edits,
                              guardarComidaDelMenu, restaurarMenu, esHoy }) {
  const [abierta, setAbierta] = useState(null);   // comida cuyo "otra cosa" esta abierto
  const [texto, setTexto] = useState("");            // lo que escribes que has comido
  const [correcciones, setCorrecciones] = useState({}); // kcal corregidas a mano, por linea
  const [cambiando, setCambiando] = useState(null); // "comidaId:alimentoId"
  const [editando, setEditando] = useState(null);   // comida cuyo menu se esta editando
  const [anadiendo, setAnadiendo] = useState(false);
  const [grupoMenu, setGrupoMenu] = useState("proteina");

  const objetivo = (comida && comida.macros) || null;
  if (!objetivo) return null;

  const dia = cuadrarDia({ tipoDia: comida.id, objetivo, apuntes, cambios, edits });
  const quitadas = comidasQuitadas(comida.id, edits);
  const hayEdiciones = quitadas.length > 0 || dia.comidas.some(c => c.editada);

  // El menu de partida, sin recalcular, que es sobre lo que se edita: aqui se
  // cambia la DIETA, no la cantidad de hoy.
  const base = menuDe(comida.id, edits);
  const baseDe = (id) => base.find(c => c.id === id);
  const guardar = (id, ingredientes) => guardarComidaDelMenu(comida.id, id, ingredientes);
  // Cuando ni encogiendo ni quitando se llega, se dice el numero de verdad en
  // vez de enseñar un total que no cuadra y callarse.
  const pasadoDeLargo = dia.previsto.kcal > objetivo.kcal * 1.06;

  // Lo apuntado, agrupado por comida, para poder enseñarlo y deshacerlo entero.
  const porComida = {};
  for (const ap of apuntes) if (ap && ap.comida) (porComida[ap.comida] = porComida[ap.comida] || []).push(ap);
  const sueltos = apuntes.filter(ap => ap && !ap.comida);

  const textoApunte = (ap) => {
    if (ap.origen === "texto") return ap.texto + " · " + Math.round(ap.kcal) + " kcal";
    if (ap.origen === "cantina") {
      const p = PLATO_CANTINA[ap.id];
      const r = RACIONES.find(x => x.id === ap.racion);
      return (p ? p.nombre : ap.id) + (r && r.id !== "normal" ? " · " + r.etiqueta.toLowerCase() : "");
    }
    if (ap.origen === "rapida") {
      const c = COMIDAS_RAPIDAS.find(x => x.id === ap.id);
      return c ? c.nombre : ap.id;
    }
    const a = ALIMENTO[ap.id];
    return (a ? a.nombre : ap.id) + " · " + cantidadLegible(ap.id, ap.gramos);
  };

  /**
   * El editor de la dieta. Cambia TU MENU, no la cantidad de hoy: lo que se
   * toca aqui vale para todos los dias de este tipo. Por eso lo dice arriba.
   */
  const Editor = ({ comidaId }) => {
    const c = baseDe(comidaId);
    if (!c) return null;
    const poner = (ings) => guardar(comidaId, ings);
    return (
      <div style={{ marginTop: SP.md, paddingTop: SP.md, borderTop: "1px solid " + C.divider }}>
        <div style={{ ...TYPE.body, color: C.textDim, marginBottom: SP.sm }}>
          Esto cambia <strong style={{ color: C.text }}>tu menú</strong>, no solo hoy: vale para
          todos los días de {comida.etiqueta}. Las cantidades siguen recalculándose encima.
        </div>

        {c.ingredientes.map((i, idx) => (
          <div key={i.id + idx} style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "5px 0" }}>
            <span style={{ ...TYPE.body, color: "#4A4A47", flex: 1, minWidth: 0 }}>
              {ALIMENTO[i.id] ? ALIMENTO[i.id].nombre : i.id}
            </span>
            <input inputMode="numeric" value={i.g}
              onChange={e => {
                const g = Number(e.target.value.replace(/\D/g, "")) || 0;
                poner(c.ingredientes.map((o, j) => (j === idx ? { id: o.id, g } : o)));
              }}
              style={{ width: 56, padding: "7px 6px", borderRadius: R.md, textAlign: "center",
                       border: "1px solid " + C.cardBorder, background: C.bg, color: C.text,
                       fontSize: 13, fontWeight: 700, fontFamily: "inherit" }} />
            <span style={{ ...TYPE.micro, color: C.textFaint, width: 12 }}>g</span>
            <button className="btn" aria-label="Quitar"
              onClick={() => poner(c.ingredientes.filter((_, j) => j !== idx))}
              style={{ background: "transparent", border: "none", color: C.textFaint,
                       fontSize: 17, lineHeight: 1, padding: "4px 6px" }}>×</button>
          </div>
        ))}

        <button className="btn" onClick={() => setAnadiendo(!anadiendo)} style={{
          marginTop: SP.sm, padding: "6px 0", background: "transparent", border: "none",
          color: C.textDim, fontSize: 12, fontWeight: 700, textAlign: "left",
        }}>{anadiendo ? "Cerrar" : "+ Añadir alimento"}</button>

        {anadiendo && (
          <>
            <div style={{ display: "flex", gap: 6, margin: SP.sm + "px 0", overflowX: "auto", paddingBottom: 2 }}>
              {GRUPOS_CASA.map(g => (
                <button key={g.id} className="btn" onClick={() => setGrupoMenu(g.id)} style={pastilla(grupoMenu === g.id)}>{g.n}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {ALIMENTOS.filter(a => a.grupo === grupoMenu).map(a => (
                <button key={a.id} className="btn"
                  onClick={() => { poner(c.ingredientes.concat([{ id: a.id, g: a.unidad ? a.unidad.g : 100 }])); setAnadiendo(false); }}
                  style={pastilla(false)}>{a.nombre}</button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: SP.sm, marginTop: SP.md }}>
          <button className="btn" onClick={() => { guardar(comidaId, null); setEditando(null); }}
            style={{ ...botonComida(false), color: C.amber }}>Quitar del menú</button>
          {c.editada && (
            <button className="btn" onClick={() => { guardar(comidaId, undefined); setEditando(null); }}
              style={botonComida(false)}>Volver al original</button>
          )}
        </div>
      </div>
    );
  };

  /**
   * APUNTAR: escribes lo que has comido y ya esta.
   *
   * Nada de elegir de una lista. La lista nunca tiene lo que has comido, y
   * buscar en ella cuesta mas que escribirlo. Si ya usas una app que hace una
   * foto y te da las calorias, esto es donde copias ese numero.
   *
   * Lo que se entiende se enseña ANTES de apuntarlo, con el numero editable y
   * de donde sale. Un contador en el que no puedes ver ni corregir lo que ha
   * entendido es un contador en el que dejas de creer a la semana.
   */
  const Apuntador = ({ comidaId }) => {
    const lineas = interpretar(texto);
    const conCorreccion = lineas.map((l, i) => correcciones[i] !== undefined && correcciones[i] !== ""
      ? Object.assign({}, l, { macros: escalarLinea(l, Number(correcciones[i])), confianza: "escrito" })
      : l);
    const total = totalDe(conCorreccion);

    const apuntar = () => {
      const buenas = conCorreccion.filter(l => l.macros.kcal > 0);
      if (!buenas.length) return;
      apuntarVarias(buenas.map(l => ({
        comida: comidaId || undefined, origen: "texto", texto: l.nombre,
        kcal: l.macros.kcal, prot: l.macros.prot, hc: l.macros.hc, grasa: l.macros.grasa,
      })));
      setTexto(""); setCorrecciones({}); setAbierta(null);
    };

    return (
      <>
        <textarea value={texto} onChange={e => { setTexto(e.target.value); setCorrecciones({}); }}
          rows={3} autoFocus
          placeholder={"Macarrones con tomate 450 kcal\nFilete de ternera\nUn panecillo"}
          style={{ width: "100%", padding: "11px 13px", borderRadius: R.lg, resize: "vertical",
                   border: "1px solid " + C.cardBorder, background: C.bg, color: C.text,
                   fontSize: 14, lineHeight: 1.5, fontFamily: "inherit" }} />
        <div style={{ ...TYPE.body, color: C.textFaint, marginTop: 5, lineHeight: 1.45 }}>
          Una cosa por línea. Si sabes las calorías, escríbelas y mandan ellas.
        </div>

        {conCorreccion.length > 0 && (
          <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: 4 }}>
            {conCorreccion.map((l, i) => (
              <div key={i} style={{ background: C.surfaceMuted, borderRadius: R.lg, padding: "9px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: SP.sm }}>
                  <span style={{ ...TYPE.body, color: l.confianza === "sin-entender" ? C.amber : "#4A4A47",
                                 flex: 1, minWidth: 0 }}>
                    {l.nombre}{l.gramos ? " · " + Math.round(l.gramos) + " g" : ""}
                  </span>
                  <input inputMode="numeric" placeholder={String(l.macros.kcal)}
                    value={correcciones[i] || ""}
                    onChange={e => setCorrecciones(Object.assign({}, correcciones,
                      { [i]: e.target.value.replace(/\D/g, "") }))}
                    style={{ width: 58, padding: "5px 6px", borderRadius: R.md, textAlign: "center",
                             border: "1px solid " + C.cardBorder, background: C.card, color: C.text,
                             fontSize: 13, fontWeight: 700, fontFamily: "inherit" }} />
                  <span style={{ ...TYPE.micro, color: C.textFaint }}>KCAL</span>
                </div>
                <div className="mono" style={{ fontSize: 10.5, color: C.textFaint, marginTop: 3 }}>
                  {ETIQUETA_CONFIANZA[l.confianza]}
                  {l.macros.kcal > 0 && " · " + l.macros.prot + " P / " + l.macros.hc + " C / " + l.macros.grasa + " G"}
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn" onClick={apuntar} disabled={total.kcal <= 0} style={{
          marginTop: SP.sm, width: "100%", minHeight: TAP_MIN, borderRadius: R.lg,
          background: total.kcal > 0 ? C.accent : C.surfaceMuted,
          border: "1px solid " + (total.kcal > 0 ? C.accent : C.cardBorder),
          color: total.kcal > 0 ? "#FAFAF9" : C.textFaint, fontSize: 13.5, fontWeight: 700,
        }}>
          {total.kcal > 0 ? "Apuntar " + Math.round(total.kcal) + " kcal" : "Escribe lo que has comido"}
        </button>
      </>
    );
  };

  return (
    <div>
      <SectionHeader>{esHoy ? "Hoy" : "Ese día"}</SectionHeader>

      {/* ═══ DONDE VAS ═══ */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ background: C.accent, borderRadius: R.xl, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{comida.etiqueta}</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "#8A8A87" }}>
              {dia.restante.kcal >= 0 ? "quedan " + dia.restante.kcal : "+" + Math.abs(dia.restante.kcal)} kcal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 30, fontWeight: 800, color: "#FAFAF9", letterSpacing: -1 }}>
              {dia.comido.kcal}
            </span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "#8A8A87" }}>/ {objetivo.kcal} kcal</span>
          </div>
          {MACROS.map(m => (
            <Barra key={m.k} nombre={m.n} hecho={dia.comido[m.k]} meta={objetivo[m.k]} color={m.color} />
          ))}
          <div style={{ ...TYPE.body, color: "#A8A8A5", marginTop: SP.md }}>{comida.detalle}</div>
        </div>

        {dia.aviso && (
          <div style={{ ...tarjeta, marginTop: SP.sm, padding: "11px 14px",
                        borderLeft: "3px solid " + (dia.aviso.id === "cerrado" ? C.ok : C.amber) }}>
            <div style={{ ...TYPE.body, color: "#4A4A47" }}>{dia.aviso.texto}</div>
          </div>
        )}
      </div>

      {/* ═══ EL MENU DEL DIA ═══ */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px", display: "flex", flexDirection: "column", gap: SP.sm }}>
        {dia.comidas.map(c => {
          const hechos = porComida[c.id] || [];
          const abierto = abierta === c.id;

          // ─── Una comida ya hecha: se queda en su sitio con lo que apuntaste,
          //     y se le puede seguir añadiendo (en la cantina caen tres cosas).
          if (c.hecha) return (
            <div key={c.id} style={{ ...tarjeta, padding: "12px 14px", background: C.surfaceMuted }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.sm }}>
                <span style={{ ...TYPE.bodyStrong, color: C.textDim }}>{c.nombre}</span>
                <span className="mono" style={{ ...TYPE.micro, color: C.ok, flexShrink: 0 }}>
                  {Math.round(macrosDelDia(hechos).kcal)} KCAL · HECHO
                </span>
              </div>
              <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 2 }}>
                {hechos.map((ap) => (
                  <div key={apuntes.indexOf(ap)} style={{ display: "flex", justifyContent: "space-between",
                                                          alignItems: "center", gap: SP.sm }}>
                    <span style={{ ...TYPE.body, color: "#4A4A47" }}>{textoApunte(ap)}</span>
                    <button className="btn" onClick={() => deshacerComida(null, apuntes.indexOf(ap))} aria-label="Quitar"
                      style={{ background: "transparent", border: "none", color: C.textFaint,
                               fontSize: 17, lineHeight: 1, padding: "2px 6px", flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
              <button className="btn" onClick={() => setAbierta(abierto ? null : c.id)} style={{
                marginTop: SP.sm, padding: "6px 0", background: "transparent", border: "none",
                color: C.textDim, fontSize: 12, fontWeight: 700, textAlign: "left",
              }}>{abierto ? "Cerrar" : "+ Añadir algo más"}</button>
              {abierto && <Apuntador comidaId={c.id} />}
            </div>
          );

          // ─── Una comida que hoy se salta: se enseña tachada y con el porque,
          //     no se esconde. Saber que te la saltas es parte del dia.
          if (c.saltada) return (
            <div key={c.id} style={{ ...tarjeta, padding: "11px 14px", background: "transparent",
                                     borderStyle: "dashed" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.sm }}>
                <span style={{ ...TYPE.bodyStrong, color: C.textFaint, textDecoration: "line-through" }}>
                  {c.nombre}
                </span>
                <span style={{ ...TYPE.micro, color: C.amber, flexShrink: 0 }}>HOY SE SALTA</span>
              </div>
              <div style={{ ...TYPE.body, color: C.textFaint, marginTop: 3 }}>
                No cabe con lo que llevas comido. Si te la comes igual, apúntala y el resto se recalcula.
              </div>
              <button className="btn" onClick={() => setAbierta(abierto ? null : c.id)} style={{
                marginTop: SP.sm, padding: "6px 0", background: "transparent", border: "none",
                color: C.textDim, fontSize: 12, fontWeight: 700, textAlign: "left",
              }}>{abierto ? "Cerrar" : "+ Apuntarla de todos modos"}</button>
              {abierto && <Apuntador comidaId={c.id} />}
            </div>
          );

          // ─── Una comida pendiente: el menu, con las cantidades recalculadas.
          return (
            <div key={c.id} style={{ ...tarjeta, borderLeft: "3px solid " + CAT.nutricion }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.sm }}>
                <span style={{ ...TYPE.cardTitle, color: C.text }}>{c.nombre}</span>
                <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: CAT.nutricion, flexShrink: 0 }}>
                  {c.macros.kcal} kcal
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: SP.sm, marginTop: 2 }}>
                <span style={{ ...TYPE.micro, color: C.textFaint }}>
                  {c.cuando.toUpperCase()}{c.editada && " · TUYA"}
                </span>
                <button className="btn" onClick={() => { setEditando(editando === c.id ? null : c.id); setAnadiendo(false); }}
                  style={{ background: "transparent", border: "none", color: C.textDim,
                           fontSize: 11.5, fontWeight: 700, padding: "2px 0", flexShrink: 0 }}>
                  {editando === c.id ? "Cerrar" : "Editar"}
                </button>
              </div>

              {editando === c.id && <Editor comidaId={c.id} />}

              <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: 2 }}>
                {c.ingredientes.map(i => {
                  const clave = claveCambio(c.id, i.enLugarDe || i.id);
                  const cambioAbierto = cambiando === clave;
                  return (
                    <div key={i.id}>
                      <button className="btn" onClick={() => setCambiando(cambioAbierto ? null : clave)} style={{
                        width: "100%", textAlign: "left", background: "transparent", border: "none",
                        padding: "5px 0", display: "flex", justifyContent: "space-between", gap: SP.sm,
                      }}>
                        <span style={{ ...TYPE.body, color: "#4A4A47" }}>
                          {ALIMENTO[i.id] ? ALIMENTO[i.id].nombre : i.id}
                          {i.enLugarDe && (
                            <span style={{ ...TYPE.micro, color: C.textFaint }}>
                              {" "}· en vez de {ALIMENTO[i.enLugarDe].nombre.toLowerCase()}
                            </span>
                          )}
                        </span>
                        <span style={{ flexShrink: 0 }}>
                          <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>
                            {cantidadLegible(i.id, i.gramos)}
                          </span>
                          <Cambio g={i.cambio} />
                        </span>
                      </button>
                      {cambioAbierto && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "4px 0 8px" }}>
                          {i.enLugarDe && (
                            <button className="btn" onClick={() => { cambiarAlimento(clave, null); setCambiando(null); }}
                              style={pastilla(false)}>Volver a {ALIMENTO[i.enLugarDe].nombre.toLowerCase()}</button>
                          )}
                          {equivalentesDe(i.id).slice(0, 8).map(o => (
                            <button key={o.id} className="btn"
                              onClick={() => { cambiarAlimento(clave, o.id); setCambiando(null); }}
                              style={pastilla(false)}>{o.nombre}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: SP.sm, marginTop: SP.md }}>
                <button className="btn" onClick={() => apuntarVarias(apuntesDe(c))} style={botonComida(true)}>
                  Me lo he comido
                </button>
                <button className="btn" onClick={() => setAbierta(abierto ? null : c.id)} style={botonComida(false)}>
                  {abierto ? "Cerrar" : "He comido otra cosa"}
                </button>
              </div>

              {abierto && (
                <div style={{ marginTop: SP.md, paddingTop: SP.md, borderTop: "1px solid " + C.divider }}>
                  <Apuntador comidaId={c.id} />
                </div>
              )}
            </div>
          );
        })}

        {/* Lo que no es una comida: una caña, un picoteo. Suma al dia y punto. */}
        {sueltos.length > 0 && (
          <div style={{ ...tarjeta, padding: "11px 14px", background: C.surfaceMuted }}>
            <div style={{ ...TYPE.micro, color: C.textDim }}>FUERA DE HORAS</div>
            {sueltos.map((ap) => (
              <div key={apuntes.indexOf(ap)} style={{ display: "flex", justifyContent: "space-between",
                                                      alignItems: "center", gap: SP.sm, marginTop: 4 }}>
                <span style={{ ...TYPE.body, color: "#4A4A47" }}>{textoApunte(ap)}</span>
                <button className="btn" onClick={() => deshacerComida(null, apuntes.indexOf(ap))} aria-label="Quitar"
                  style={{ background: "transparent", border: "none", color: C.textFaint,
                           fontSize: 18, lineHeight: 1, padding: "4px 6px" }}>×</button>
              </div>
            ))}
          </div>
        )}

        {quitadas.length > 0 && (
          <div style={{ ...tarjeta, padding: "11px 14px", background: "transparent", borderStyle: "dashed" }}>
            <div style={{ ...TYPE.micro, color: C.textFaint }}>FUERA DE TU MENÚ</div>
            <div style={{ ...TYPE.body, color: C.textDim, marginTop: 3 }}>
              Las quitaste tú. El resto del día se reparte sin ellas.
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: SP.sm }}>
              {quitadas.map(q => (
                <button key={q.id} className="btn" onClick={() => guardar(q.id, undefined)}
                  style={pastilla(false)}>Devolver {q.nombre.toLowerCase()}</button>
              ))}
            </div>
          </div>
        )}

        {hayEdiciones && (
          <button className="btn" onClick={() => restaurarMenu(comida.id)} style={{
            padding: "8px 0", background: "transparent", border: "none",
            color: C.textFaint, fontSize: 12, fontWeight: 600,
          }}>Volver al menú de partida</button>
        )}

        <button className="btn" onClick={() => setAbierta(abierta === "suelto" ? null : "suelto")} style={{
          width: "100%", minHeight: TAP_MIN, borderRadius: R.xl, background: C.card,
          border: "1px dashed " + C.cardBorder, color: C.textDim, fontSize: 13, fontWeight: 700,
        }}>Apuntar algo fuera de horas</button>

        {/* Una caña, un picoteo: lo mismo, pero sin colgarlo de ninguna comida. */}
        {abierta === "suelto" && (
          <div style={{ ...tarjeta, padding: "13px 15px" }}><Apuntador comidaId={null} /></div>
        )}
      </div>

      {/* Si el dia cierra donde tiene que cerrar, se dice. Es el unico numero
          que importa de todo esto. */}
      {dia.pendientes.length > 0 && (
        <div style={{ padding: "0 " + SP.xl + "px " + SP.lg + "px", ...TYPE.body, color: C.textFaint, lineHeight: 1.5 }}>
          Si te comes lo de arriba, el día cierra en{" "}
          <strong className="mono" style={{ color: pasadoDeLargo ? C.amber : C.textDim }}>{dia.previsto.kcal} kcal</strong> y{" "}
          <strong className="mono" style={{ color: C.textDim }}>{dia.previsto.prot} g</strong> de proteína.{" "}
          {pasadoDeLargo
            ? "Son " + (dia.previsto.kcal - objetivo.kcal) + " kcal por encima del día, y es lo más cerca que se puede " +
              "llegar sin quitar proteína. No se arregla hoy: mañana el menú sale entero otra vez."
            : "Las cantidades ya están ajustadas a lo que llevas comido."}
        </div>
      )}
    </div>
  );
}
