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
import { PLATO_CANTINA, RACIONES, SECCIONES_CANTINA, platosDe } from "@/domain/nutricion/cantina";
import { COMIDAS_RAPIDAS, macrosDelDia } from "@/domain/nutricion/iifym";
import { apuntesDe, claveCambio, cuadrarDia } from "@/domain/nutricion/cuadrar";
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

export function DiaDeComida({ comida, apuntes, cambios, apuntarComida, apuntarVarias,
                              deshacerComida, cambiarAlimento, esHoy }) {
  const [abierta, setAbierta] = useState(null);   // comida cuyo "otra cosa" esta abierto
  const [panel, setPanel] = useState("cantina");  // rapida | cantina | casa
  const [racion, setRacion] = useState("normal");
  const [seccion, setSeccion] = useState(SECCIONES_CANTINA[0]);
  const [grupo, setGrupo] = useState("proteina");
  const [gramos, setGramos] = useState({});
  const [cambiando, setCambiando] = useState(null); // "comidaId:alimentoId"

  const objetivo = (comida && comida.macros) || null;
  if (!objetivo) return null;

  const dia = cuadrarDia({ tipoDia: comida.id, objetivo, apuntes, cambios });
  // Cuando ni encogiendo ni quitando se llega, se dice el numero de verdad en
  // vez de enseñar un total que no cuadra y callarse.
  const pasadoDeLargo = dia.previsto.kcal > objetivo.kcal * 1.06;

  // Lo apuntado, agrupado por comida, para poder enseñarlo y deshacerlo entero.
  const porComida = {};
  for (const ap of apuntes) if (ap && ap.comida) (porComida[ap.comida] = porComida[ap.comida] || []).push(ap);
  const sueltos = apuntes.filter(ap => ap && !ap.comida);

  const textoApunte = (ap) => {
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

  /** El panel de apuntar, el mismo para una comida hecha y para una pendiente.
   *  No se cierra solo al marcar algo: en la cantina caen tres cosas. */
  const Apuntador = ({ comidaId }) => (
    <>
      <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.sm }}>
        {[["cantina", "Cantina"], ["rapida", "De siempre"], ["casa", "En casa"]].map(([id, n]) => (
          <button key={id} className="btn" onClick={() => setPanel(id)}
            style={{ ...pastilla(panel === id), flex: 1, justifyContent: "center" }}>{n}</button>
        ))}
      </div>

      {panel === "cantina" && (
        <>
          <div style={{ ...TYPE.body, color: C.textDim, marginBottom: SP.sm }}>
            No peses nada: señala lo que ha caído y di si fue poco, normal o mucho. Puedes marcar varias cosas.
          </div>
          <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.sm }}>
            {RACIONES.map(r => (
              <button key={r.id} className="btn" onClick={() => setRacion(r.id)}
                style={{ ...pastilla(racion === r.id), flex: 1, justifyContent: "center" }}>{r.etiqueta}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: SP.sm, overflowX: "auto", paddingBottom: 2 }}>
            {SECCIONES_CANTINA.map(sec => (
              <button key={sec} className="btn" onClick={() => setSeccion(sec)} style={pastilla(seccion === sec)}>{sec}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {platosDe(seccion).map(p => (
              <button key={p.id} className="btn"
                onClick={() => apuntarComida({ comida: comidaId, origen: "cantina", id: p.id, racion })}
                style={{ ...tarjeta, padding: "10px 14px", textAlign: "left", minHeight: TAP_MIN,
                         width: "100%", display: "flex", justifyContent: "space-between",
                         alignItems: "center", gap: SP.sm }}>
                <span style={{ ...TYPE.body, color: C.text }}>{p.nombre}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>
                  {Math.round(p.kcal * (RACIONES.find(r => r.id === racion) || RACIONES[1]).factor)} kcal
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {panel === "rapida" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {COMIDAS_RAPIDAS.map(r => (
            <button key={r.id} className="btn" onClick={() => apuntarComida({ comida: comidaId, origen: "rapida", id: r.id })}
              style={{ ...tarjeta, padding: "11px 14px", textAlign: "left", minHeight: TAP_MIN, width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: SP.sm }}>
                <span style={{ ...TYPE.bodyStrong, color: C.text }}>{r.nombre}</span>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>{r.kcal} kcal</span>
              </div>
              <div style={{ ...TYPE.body, color: C.textFaint, marginTop: 2 }}>{r.detalle}</div>
            </button>
          ))}
        </div>
      )}

      {panel === "casa" && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: SP.sm, overflowX: "auto", paddingBottom: 2 }}>
            {GRUPOS_CASA.map(g => (
              <button key={g.id} className="btn" onClick={() => setGrupo(g.id)} style={pastilla(grupo === g.id)}>{g.n}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {ALIMENTOS.filter(a => a.grupo === grupo).map(a => (
              <div key={a.id} style={{ ...tarjeta, padding: "9px 12px", display: "flex", alignItems: "center", gap: SP.sm }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...TYPE.body, color: C.text }}>{a.nombre}</div>
                  <div className="mono" style={{ fontSize: 10.5, color: C.textFaint }}>
                    {a.kcal} kcal · {a.prot} P / {a.hc} C / {a.grasa} G por 100 g
                  </div>
                </div>
                <input inputMode="numeric" placeholder="g" value={gramos[a.id] || ""}
                  onChange={e => setGramos(Object.assign({}, gramos, { [a.id]: e.target.value.replace(/\D/g, "") }))}
                  style={{ width: 52, padding: "7px 6px", borderRadius: R.md, textAlign: "center",
                           border: "1px solid " + C.cardBorder, background: C.bg, color: C.text,
                           fontSize: 13, fontWeight: 700, fontFamily: "inherit" }} />
                <button className="btn" disabled={!gramos[a.id]}
                  onClick={() => { apuntarComida({ comida: comidaId, origen: "casa", id: a.id, gramos: Number(gramos[a.id]) });
                                   setGramos(Object.assign({}, gramos, { [a.id]: "" })); }}
                  style={{ minHeight: 36, padding: "0 12px", borderRadius: R.md, flexShrink: 0,
                           background: gramos[a.id] ? C.accent : C.surfaceMuted,
                           border: "1px solid " + (gramos[a.id] ? C.accent : C.cardBorder),
                           color: gramos[a.id] ? "#FAFAF9" : C.textFaint, fontSize: 18, fontWeight: 700 }}>+</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

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
              <div style={{ ...TYPE.micro, color: C.textFaint, marginTop: 2 }}>{c.cuando.toUpperCase()}</div>

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

        <button className="btn" onClick={() => setAbierta(abierta === "suelto" ? null : "suelto")} style={{
          width: "100%", minHeight: TAP_MIN, borderRadius: R.xl, background: C.card,
          border: "1px dashed " + C.cardBorder, color: C.textDim, fontSize: 13, fontWeight: 700,
        }}>Apuntar algo fuera de horas</button>

        {abierta === "suelto" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {COMIDAS_RAPIDAS.map(r => (
              <button key={r.id} className="btn"
                onClick={() => { apuntarComida({ origen: "rapida", id: r.id }); setAbierta(null); }}
                style={{ ...tarjeta, padding: "11px 14px", textAlign: "left", minHeight: TAP_MIN, width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: SP.sm }}>
                  <span style={{ ...TYPE.bodyStrong, color: C.text }}>{r.nombre}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>{r.kcal} kcal</span>
                </div>
              </button>
            ))}
            {[["p_cerveza", "Caña o cerveza"], ["p_refresco", "Refresco con azúcar"], ["p_dulce", "Dulce o bollería"]].map(([id, n]) => (
              <button key={id} className="btn"
                onClick={() => { apuntarComida({ origen: "cantina", id, racion: "normal" }); setAbierta(null); }}
                style={{ ...tarjeta, padding: "11px 14px", textAlign: "left", minHeight: TAP_MIN, width: "100%" }}>
                <span style={{ ...TYPE.bodyStrong, color: C.text }}>{n}</span>
              </button>
            ))}
          </div>
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
