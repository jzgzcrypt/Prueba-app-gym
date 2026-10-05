"use client";

import { A, C } from "@/design/tokens";
import { DATE_MAP, WEEKS, claveDia, todayLocalIso } from "@/domain/plan/calendario";

/**
 * La semana en 7 circulos (estilo Aire): la letra del dia encima; dentro, el
 * numero o un check si esta hecho. El dia que estas viendo, en azul. Toca
 * uno para ir a el.
 */
export function WeekDots({ day, checked, onJumpDay }) {
  const week = WEEKS[day.weekIdx];
  const todayIso = todayLocalIso();
  return (
    <div data-semana-circulos style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
      {week.days.map((d, i) => {
        const done = !!checked[claveDia(d)];
        const isRest = d.tipo === "libre";
        const isCurrent = i === day.dayIdx;
        const isToday = DATE_MAP[d.date] === todayIso;
        const num = String(d.date).split(" ")[0];
        const fondo = isCurrent ? A.azul : done ? A.fondo.verde : "#fff";
        const color = isCurrent ? "#fff" : done ? A.verde : isRest ? C.textFaint : C.text;
        return (
          <button key={i} className="btn" onClick={() => onJumpDay(week.weekIdx, i)} aria-label={d.dow + " " + d.date}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: isToday && !isCurrent ? A.azul : C.textDim }}>{d.dow.slice(0, 1)}</span>
            <span style={{ width: 40, height: 40, borderRadius: 20, background: fondo, color, display: "flex", alignItems: "center", justifyContent: "center",
                           fontSize: done && !isCurrent ? 16 : 15, fontWeight: 700,
                           boxShadow: isCurrent ? "none" : "0 1px 2px rgba(0,0,0,.05)",
                           outline: isToday && !isCurrent ? "2px solid " + A.azul : "none", outlineOffset: -2 }}>
              {done ? "✓" : num}
            </span>
          </button>
        );
      })}
    </div>
  );
}
