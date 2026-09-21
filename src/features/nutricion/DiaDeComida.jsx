"use client";

/**
 * EL DIA DE COMIDA — apuntar por encima y que la cena cuadre sola.
 *
 * Esto es lo unico de la pestaña que se toca a diario. El resto (los menus de
 * 2022, las equivalencias, los trucos) es consulta; esto es uso.
 *
 * El flujo es el del dia de verdad: desayunas lo de siempre y lo apuntas de un
 * toque, comes en la cantina y señalas lo que ha caido sin pesar nada, y a las
 * nueve de la noche la app ya sabe lo que queda y te da tres cenas que
 * encajan. Eliges por apetito. Eso es IIFYM: no importa QUE comas, importa lo
 * que suma el dia.
 */

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { ALIMENTO, ALIMENTOS, cantidadLegible } from "@/domain/nutricion/alimentos";
import { PLATO_CANTINA, RACIONES, SECCIONES_CANTINA, platosDe } from "@/domain/nutricion/cantina";
import {
  COMIDAS_RAPIDAS, estadoDelResto, generarComidas, macrosDelDia, redondearMacros,
  repartirResto, restoDelDia,
} from "@/domain/nutricion/iifym";
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

const pastilla = (activo) => ({
  padding: "8px 12px", borderRadius: R.pill, minHeight: 36, whiteSpace: "nowrap",
  background: activo ? C.accent : C.card,
  border: "1px solid " + (activo ? C.accent : C.cardBorder),
  color: activo ? "#FAFAF9" : C.textDim, fontSize: 12, fontWeight: 700,
});

const tarjeta = {
  background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.xl, padding: "14px 16px",
};

/** Una barra por macro: cuanto llevas de lo que toca. Se ve de un vistazo
 *  si vas corto de proteina, que es lo unico que no se recupera mañana. */
function Barra({ nombre, hecho, meta, color, unidad }) {
  const pct = meta > 0 ? Math.min(100, (hecho / meta) * 100) : 0;
  const pasado = hecho > meta * 1.08;
  return (
    <div style={{ marginTop: SP.sm }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{nombre.toUpperCase()}</span>
        <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: pasado ? C.amber : "#D4D4D1" }}>
          {Math.round(hecho)} / {Math.round(meta)}{unidad}
        </span>
      </div>
      <div style={{ height: 5, background: "#333331", borderRadius: R.pill, marginTop: 4, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: pasado ? C.amber : color, borderRadius: R.pill }} />
      </div>
    </div>
  );
}

function Plato({ opcion, onComer }) {
  return (
    <div style={{ ...tarjeta, borderLeft: "3px solid " + CAT.nutricion }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: SP.sm }}>
        <span style={{ ...TYPE.cardTitle, color: C.text }}>{opcion.nombre}</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: CAT.nutricion, flexShrink: 0 }}>
          {opcion.macros.kcal} kcal
        </span>
      </div>
      <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: 3 }}>
        {opcion.ingredientes.map(i => (
          <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: SP.sm }}>
            <span style={{ ...TYPE.body, color: "#4A4A47" }}>{i.nombre}</span>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.text, flexShrink: 0 }}>{i.cantidad}</span>
          </div>
        ))}
      </div>
      <div className="mono" style={{ fontSize: 11, color: C.textFaint, marginTop: SP.sm }}>
        {opcion.macros.prot} g proteína · {opcion.macros.hc} g HC · {opcion.macros.grasa} g grasa
      </div>
      {opcion.nota && <div style={{ ...TYPE.body, color: C.textDim, marginTop: 4 }}>{opcion.nota}</div>}
      <button className="btn" onClick={() => onComer(opcion)} style={{
        marginTop: SP.md, width: "100%", minHeight: TAP_MIN - 6, borderRadius: R.lg,
        background: C.surfaceMuted, border: "1px solid " + C.cardBorder,
        color: C.text, fontSize: 13, fontWeight: 700,
      }}>Esta me la como</button>
    </div>
  );
}

export function DiaDeComida({ comida, apuntes, apuntarComida, borrarComida, esHoy }) {
  const [panel, setPanel] = useState(null); // "rapida" | "cantina" | "casa"
  const [racion, setRacion] = useState("normal");
  const [seccion, setSeccion] = useState(SECCIONES_CANTINA[0]);
  const [grupo, setGrupo] = useState("proteina");
  const [gramos, setGramos] = useState({});
  const [ronda, setRonda] = useState([]); // ids ya vistos, para pedir otras

  const objetivo = (comida && comida.macros) || null;
  if (!objetivo) return null;

  const llevado = redondearMacros(macrosDelDia(apuntes));
  const resto = restoDelDia(objetivo, apuntes);
  const estado = estadoDelResto(resto, objetivo);
  // La cena se topa: lo que no cabe en un plato se reserva para merienda y
  // recena en vez de proponerte 1.300 kcal de una sentada.
  const { objetivo: objetivoCena, reservado } = repartirResto(resto);
  const opciones = generarComidas(objetivoCena, { momento: "cena", cuantas: 3, excluir: ronda });

  const abrir = (p) => setPanel(panel === p ? null : p);

  const comerPlato = (opcion) => {
    for (const i of opcion.ingredientes) apuntarComida({ origen: "casa", id: i.id, gramos: i.gramos });
    setRonda([]);
    setPanel(null);
  };

  const otraRonda = () => setRonda(ronda.concat(opciones.map(o => o.id)));

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

  return (
    <div>
      <SectionHeader>{esHoy ? "Hoy" : "Ese día"}</SectionHeader>

      {/* ═══ EL OBJETIVO Y LO QUE LLEVAS ═══ */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ background: C.accent, borderRadius: R.xl, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...TYPE.micro, color: "#8A8A87" }}>{comida.etiqueta}</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "#8A8A87" }}>
              {resto.kcal > 0 ? "quedan " + Math.round(resto.kcal) : "+" + Math.abs(Math.round(resto.kcal))} kcal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 30, fontWeight: 800, color: "#FAFAF9", letterSpacing: -1 }}>
              {llevado.kcal}
            </span>
            <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: "#8A8A87" }}>/ {objetivo.kcal} kcal</span>
          </div>
          {MACROS.map(m => (
            <Barra key={m.k} nombre={m.n} hecho={llevado[m.k]} meta={objetivo[m.k]} color={m.color} unidad=" g" />
          ))}
          <div style={{ ...TYPE.body, color: "#A8A8A5", marginTop: SP.md }}>{comida.detalle}</div>
        </div>
      </div>

      {/* ═══ LO QUE HAS APUNTADO ═══ */}
      {apuntes.length > 0 && (
        <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px", display: "flex", flexDirection: "column", gap: 6 }}>
          {apuntes.map((ap, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: SP.sm,
                                  background: C.surfaceMuted, borderRadius: R.lg, padding: "9px 12px" }}>
              <span style={{ ...TYPE.body, color: "#4A4A47", flex: 1 }}>{textoApunte(ap)}</span>
              <button className="btn" onClick={() => borrarComida(i)} aria-label="Quitar"
                style={{ background: "transparent", border: "none", color: C.textFaint, fontSize: 18,
                         lineHeight: 1, padding: "4px 6px", minWidth: 30 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ APUNTAR ═══ */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ display: "flex", gap: SP.sm }}>
          {[["rapida", "De siempre"], ["cantina", "Cantina"], ["casa", "En casa"]].map(([id, n]) => (
            <button key={id} className="btn" onClick={() => abrir(id)} style={{
              ...pastilla(panel === id), flex: 1, minHeight: TAP_MIN - 6, justifyContent: "center",
            }}>{n}</button>
          ))}
        </div>

        {panel === "rapida" && (
          <div style={{ marginTop: SP.sm, display: "flex", flexDirection: "column", gap: 6 }}>
            {COMIDAS_RAPIDAS.map(c => (
              <button key={c.id} className="btn" onClick={() => apuntarComida({ origen: "rapida", id: c.id })}
                style={{ ...tarjeta, padding: "11px 14px", textAlign: "left", minHeight: TAP_MIN, width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: SP.sm }}>
                  <span style={{ ...TYPE.bodyStrong, color: C.text }}>{c.nombre}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>{c.kcal} kcal</span>
                </div>
                <div style={{ ...TYPE.body, color: C.textFaint, marginTop: 2 }}>{c.detalle}</div>
              </button>
            ))}
          </div>
        )}

        {panel === "cantina" && (
          <div style={{ marginTop: SP.sm }}>
            <div style={{ ...TYPE.body, color: C.textDim, marginBottom: SP.sm }}>
              No peses nada: señala lo que ha caído y di si fue poco, normal o mucho. Con eso basta —
              lo que cuenta es el total del día, no la comida.
            </div>
            <div style={{ display: "flex", gap: SP.sm, marginBottom: SP.sm }}>
              {RACIONES.map(r => (
                <button key={r.id} className="btn" onClick={() => setRacion(r.id)}
                  style={{ ...pastilla(racion === r.id), flex: 1, justifyContent: "center" }}>{r.etiqueta}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: SP.sm, overflowX: "auto", paddingBottom: 2 }}>
              {SECCIONES_CANTINA.map(s => (
                <button key={s} className="btn" onClick={() => setSeccion(s)} style={pastilla(seccion === s)}>{s}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {platosDe(seccion).map(p => (
                <button key={p.id} className="btn" onClick={() => apuntarComida({ origen: "cantina", id: p.id, racion })}
                  style={{ ...tarjeta, padding: "10px 14px", textAlign: "left", minHeight: TAP_MIN, width: "100%",
                           display: "flex", justifyContent: "space-between", alignItems: "center", gap: SP.sm }}>
                  <span style={{ ...TYPE.body, color: C.text }}>{p.nombre}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>
                    {Math.round(p.kcal * (RACIONES.find(r => r.id === racion) || RACIONES[1]).factor)} kcal
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {panel === "casa" && (
          <div style={{ marginTop: SP.sm }}>
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
                      {a.kcal} kcal · {a.prot} P / {a.hc} C / {a.grasa} G por 100 g{a.nota ? " · " + a.nota : ""}
                    </div>
                  </div>
                  <input inputMode="numeric" placeholder="g" value={gramos[a.id] || ""}
                    onChange={e => setGramos(Object.assign({}, gramos, { [a.id]: e.target.value.replace(/\D/g, "") }))}
                    style={{ width: 52, padding: "7px 6px", borderRadius: R.md, textAlign: "center",
                             border: "1px solid " + C.cardBorder, background: C.bg, color: C.text,
                             fontSize: 13, fontWeight: 700, fontFamily: "inherit" }} />
                  <button className="btn" disabled={!gramos[a.id]}
                    onClick={() => { apuntarComida({ origen: "casa", id: a.id, gramos: Number(gramos[a.id]) });
                                     setGramos(Object.assign({}, gramos, { [a.id]: "" })); }}
                    style={{ minHeight: 36, padding: "0 12px", borderRadius: R.md, flexShrink: 0,
                             background: gramos[a.id] ? C.accent : C.surfaceMuted,
                             border: "1px solid " + (gramos[a.id] ? C.accent : C.cardBorder),
                             color: gramos[a.id] ? "#FAFAF9" : C.textFaint, fontSize: 18, fontWeight: 700 }}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ LA CENA ═══ */}
      <SectionHeader>{estado.titulo}</SectionHeader>
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ ...TYPE.body, color: C.textDim, marginBottom: SP.md, lineHeight: 1.5 }}>{estado.texto}</div>

        {reservado && (
          <div style={{ ...tarjeta, padding: "11px 14px", marginBottom: SP.sm, background: C.surfaceMuted }}>
            <div style={{ ...TYPE.bodyStrong, color: C.text }}>
              Se apartan {reservado.kcal} kcal para la merienda y la recena
            </div>
            <div style={{ ...TYPE.body, color: C.textDim, marginTop: 2 }}>
              Queso batido, fruta, un yogur proteico. Las cenas de abajo cuadran el resto del día.
            </div>
          </div>
        )}

        {opciones.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: SP.sm }}>
              {opciones.map(o => <Plato key={o.id} opcion={o} onComer={comerPlato} />)}
            </div>
            <div style={{ ...TYPE.body, color: C.textFaint, marginTop: SP.sm, lineHeight: 1.5 }}>
              Las tres suman lo mismo. Elige por apetito, no por cálculo: eso es todo el truco.
            </div>
            <button className="btn" onClick={otraRonda} style={{
              marginTop: SP.sm, width: "100%", minHeight: TAP_MIN, borderRadius: R.xl,
              background: C.card, border: "1px solid " + C.cardBorder, color: C.textDim,
              fontSize: 13, fontWeight: 700,
            }}>Otras opciones</button>
          </>
        )}
        {opciones.length === 0 && ronda.length > 0 && (
          <button className="btn" onClick={() => setRonda([])} style={{
            width: "100%", minHeight: TAP_MIN, borderRadius: R.xl,
            background: C.card, border: "1px solid " + C.cardBorder, color: C.textDim,
            fontSize: 13, fontWeight: 700,
          }}>Volver a las primeras</button>
        )}
      </div>
    </div>
  );
}
