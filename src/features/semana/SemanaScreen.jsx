"use client";

import { useState } from "react";
import { A, C, TAP_MIN, TYPE } from "@/design/tokens";
import { Boton, Check, Chevron, IconoCaja, Tarjeta } from "@/features/ui/aire";
import { DATE_MAP, FLAT_DAYS, WEEKS, claveDia } from "@/domain/plan/calendario";
import { KpiBlock } from "@/features/semana/KpiBlock";
import { useArrastrar } from "@/features/semana/arrastrar";
import { moverTarea } from "@/domain/plan/reprogramar";
const DIAS_C = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
/** "2026-11-02" -> "lunes 2". */
const fechaCorta = (iso) => { const f = new Date(iso + "T12:00:00"); return DIAS_C[f.getDay()] + " " + f.getDate(); };

export function SemanaScreen({ weekIdx, setWeekIdx, jumpToDay, checked, todayIso, workoutWeights, ritmoReal, pausedRanges, setPausedRanges, aplicarDia = (d) => d, movidas = {}, setMovidas }) {
  const week = WEEKS[weekIdx];
  const [kpiOpen, setKpiOpen] = useState(null);
  const [pauseMode, setPauseMode] = useState(false);
  const [pauseSelection, setPauseSelection] = useState([]);

  const isPaused = (dayKey) => pausedRanges.some(r => r.days.includes(dayKey));

  const toggleDaySelection = (dayKey) => {
    setPauseSelection(prev => prev.includes(dayKey) ? prev.filter(k => k !== dayKey) : [...prev, dayKey]);
  };

  const confirmPause = () => {
    if (pauseSelection.length === 0) { setPauseMode(false); return; }
    setPausedRanges(prev => [...prev, { days: pauseSelection, label: "Pausa · " + pauseSelection.length + " días" }]);
    setPauseSelection([]);
    setPauseMode(false);
  };

  // Lo que hay en cada dia: la suya (si no se fue) y la que llego de otro.
  const enDia = (propio) => {
    const iso = propio.isoDate;
    const origen = Object.keys(movidas || {}).find(o => movidas[o] === iso);
    const llegada = origen ? FLAT_DAYS.find(d => d.isoDate === origen) || null : null;
    const suya = movidas && movidas[iso] ? null : propio;
    return { suya, llegada };
  };
  // Mantener pulsado y arrastrar mueve UNA tarea a otro dia (ver moverTarea).
  // El tenis, lo hecho y lo pasado no se mueven.
  const libreDeArrastre = (propio) => !pauseMode && !!setMovidas && propio.tipo !== "compromiso" && propio.isoDate >= todayIso;
  const movible = (i) => {
    const propio = week.days[i];
    if (!libreDeArrastre(propio)) return false;
    const { suya, llegada } = enDia(propio);
    const tarea = llegada || (suya && suya.tipo !== "libre" ? suya : null);
    return !!tarea && !checked[tarea.isoDate];
  };
  const { arrastre, filaProps, tragarClic } = useArrastrar({
    puede: movible,
    acepta: (a, b) => libreDeArrastre(week.days[b]) && !!moverTarea(movidas, week.days[a].isoDate, week.days[b].isoDate),
    alSoltar: (a, b) => { const m = moverTarea(movidas, week.days[a].isoDate, week.days[b].isoDate); if (m) setMovidas(m); },
  });

  const iconoDe = (day) => day.tipo === "fuerza" ? ["mancuerna", "azul"] : day.tipo === "compromiso" ? ["tenis", "verde"]
    : day.tipo === "libre" ? ["reloj", "gris"] : day.tipo === "test" || day.tipo === "objetivo" ? ["meta", "naranja"] : ["correr", "rojo"];

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.textDim }}>{week.dates}{week.extra ? " · +5 km" : ""}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ ...TYPE.screenTitle, color: C.text }}>Semana {week.planN || week.n}</div>
        <button className="btn" onClick={() => { setPauseMode(!pauseMode); setPauseSelection([]); }} style={{
          fontSize: 15, fontWeight: 600, color: A.azul, minHeight: TAP_MIN, marginBottom: 2,
        }}>{pauseMode ? "Cancelar" : "Pausa"}</button>
      </div>

      {pauseMode && (
        <Tarjeta style={{ padding: "12px 14px", marginTop: 8 }}>
          <div style={{ fontSize: 13, color: C.textDim, marginBottom: 10, lineHeight: 1.4 }}>Toca los días de viaje o imprevisto. Luego confirma.</div>
          <Boton tipo={pauseSelection.length > 0 ? "oscuro" : "suave"} onClick={confirmPause} disabled={pauseSelection.length === 0}>
            Confirmar pausa ({pauseSelection.length} días)
          </Boton>
        </Tarjeta>
      )}

      <div style={{ display: "flex", background: "#E4E4E9", borderRadius: 10, padding: 2, marginTop: 12, overflowX: "auto" }}>
        {WEEKS.map((w, i) => (
          <button key={w.n} className="btn" onClick={() => setWeekIdx(i)} style={{
            flex: "1 0 auto", minWidth: 42, minHeight: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: weekIdx === i ? "#fff" : "transparent", color: weekIdx === i ? C.text : "#3A3A3C",
            boxShadow: weekIdx === i ? "0 1px 3px rgba(0,0,0,.1)" : "none",
            // El bloque 1 queda como historia: se ve, pero apagado.
            opacity: w.bloque === 1 && weekIdx !== i ? 0.5 : 1 }}
            aria-label={(w.bloque === 1 ? "Bloque 1, semana " : "Semana ") + (w.planN || w.n)}>S{w.planN || w.n}</button>
        ))}
      </div>

      <Tarjeta data-dias style={{ marginTop: 14, overflow: arrastre ? "visible" : "hidden" }}>
        {week.days.map(aplicarDia).map((propio, i) => {
          // Lo movido: el dia enseña la suya y, debajo, la que llego de otro.
          // Si la suya se fue (o se dejo pasar) y no llego nada, se dice.
          const iso = propio.isoDate;
          const { suya, llegada: ll } = enDia(propio);
          const llegada = ll && aplicarDia(ll);
          const conSuya = suya && suya.tipo !== "libre";
          const principal = conSuya || !llegada ? propio : llegada;
          const day = { ...principal, isoDate: iso, date: propio.date, dow: propio.dow };
          const salida = movidas && movidas[iso];
          const deDonde = (d) => "viene del " + d.dow.toLowerCase().replace("miercoles", "miércoles").replace("sabado", "sábado");
          const notaMov = llegada && conSuya ? "+ " + llegada.titulo + " · "
            : llegada ? deDonde(llegada).replace(/^v/, "V") + " · "
            : salida === "pasa" ? "Dejada pasar · " : /^\d{4}-/.test(salida || "") ? "Movida al " + fechaCorta(salida) + " · " : "";
          const key = principal === llegada ? llegada.isoDate : claveDia(propio);
          const done = !!checked[key];
          const isT = DATE_MAP[day.date] === todayIso;
          const paused = isPaused(key);
          const selected = pauseSelection.includes(key);
          const [ico, tono] = iconoDe(day);
          return (
            <button key={i} className="btn" data-dia-semana={iso} {...filaProps(i)}
              onClick={() => { if (tragarClic()) return; if (pauseMode) toggleDaySelection(key); else jumpToDay(weekIdx, i); }} style={{
              width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", minHeight: 64,
              borderTop: i ? "1px solid " + C.divider : "none",
              background: arrastre && arrastre.sobre === i ? A.fondo.azul : selected ? A.fondo.azul : isT ? "#F0F6FF" : C.card,
              opacity: paused ? 0.5 : 1, position: "relative", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
              ...(arrastre && arrastre.desde === i ? { transform: "translateY(" + arrastre.dy + "px) scale(1.02)", zIndex: 2,
                  boxShadow: "0 8px 24px rgba(0,0,0,.15)", borderRadius: 14, transition: "none" } : { transition: "background .15s" }) }}>
              <div style={{ width: 34, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim }}>{day.dow.slice(0, 3)}</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: isT ? A.azul : C.text }}>{String(day.date).split(" ")[0]}</div>
              </div>
              <IconoCaja nombre={ico} tono={tono} tam={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: done || paused || (!suya && !llegada) ? C.textDim : C.text, textDecoration: paused ? "line-through" : "none",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{day.titulo}</div>
                {(() => {
                  // La duracion solo si el titulo no la dice ya ("Tirada 25 min").
                  const dur = day.tipo !== "libre" && day.dur && !String(day.titulo).includes(day.dur) && (suya || llegada) && !(llegada && conSuya) ? day.dur : "";
                  const sub = (notaMov + (paused ? "Pausa" : dur)).replace(/ · $/, "");
                  return sub ? <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 1, color: C.textDim }}>{sub}</div> : null;
                })()}
              </div>
              {pauseMode ? <Check hecho={selected} color={A.azul} /> : day.tipo === "libre" ? <Chevron /> : <Check hecho={done} />}
            </button>
          );
        })}
      </Tarjeta>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
        <KpiBlock title={"Resumen de la semana " + (week.planN || week.n)} isOpen={kpiOpen === "semana"}
          onToggle={() => setKpiOpen(kpiOpen === "semana" ? null : "semana")}
          weeks={[week]} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal} />

        <KpiBlock title="Acumulado del plan" isOpen={kpiOpen === "total"}
          onToggle={() => setKpiOpen(kpiOpen === "total" ? null : "total")}
          weeks={WEEKS.filter(w => w.n <= week.n)} checked={checked} workoutWeights={workoutWeights} ritmoReal={ritmoReal}
          isAcumulado currentWeekN={week.n} />
      </div>
    </div>
  );
}
