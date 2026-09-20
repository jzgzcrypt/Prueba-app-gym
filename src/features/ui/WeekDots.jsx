"use client";

import { C, CAT, SP } from "@/design/tokens";
import { WEEKS } from "@/domain/plan/bloque-1-base-7k";
import { DATE_MAP, todayLocalIso } from "@/domain/plan/calendario";
export function WeekDots({ day, checked, onJumpDay }) {
  const week = WEEKS[day.weekIdx];
  const todayIso = todayLocalIso();
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "0 " + SP.lg + "px " + SP.lg + "px" }}>
      {week.days.map((d, i) => {
        const dKey = week.n + "-" + i;
        const done = !!checked[dKey];
        const isRest = d.tipo === "libre";
        const isCurrent = i === day.dayIdx;
        const isToday = DATE_MAP[d.date] === todayIso;
        const isFuture = DATE_MAP[d.date] > todayIso;
        return (
          <button key={i} onClick={() => onJumpDay(week.weekIdx, i)} style={{
            width: isCurrent ? 9 : 7, height: isCurrent ? 9 : 7, borderRadius: "50%", padding: 0,
            background: isRest ? "transparent" : done ? C.ok : isFuture ? "transparent" : CAT.running,
            border: isRest ? "1.5px solid " + C.divider : done ? "none" : isFuture ? "1.5px solid " + C.cardBorder : "1.5px solid " + CAT.running,
            outline: isToday ? "2px solid " + C.textFaint : "none", outlineOffset: 2,
            cursor: "pointer", flexShrink: 0,
          }} aria-label={d.dow + " " + d.date} />
        );
      })}
    </div>
  );
}
