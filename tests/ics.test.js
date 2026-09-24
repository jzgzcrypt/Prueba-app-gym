/**
 * El plan en el calendario: cada sesion con su aviso, nada en los descansos,
 * y un fichero que el movil pueda leer.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { FLAT_DAYS, WEEKS } from "../src/domain/plan/calendario.js";
import { calendarioIcs, eventoDelDia } from "../src/domain/plan/ics.js";

const ics = calendarioIcs(FLAT_DAYS, { hora: "17:00" });
const eventos = ics.split("BEGIN:VEVENT").slice(1);

test("un evento por cada sesion y cada tenis, ninguno en los descansos", () => {
  const conEvento = FLAT_DAYS.filter(d => d.tipo !== "libre");
  assert.equal(eventos.length, conEvento.length);
  for (const d of FLAT_DAYS.filter(d => d.tipo === "libre")) assert.equal(eventoDelDia(d, "17:00"), null);
});

test("cada evento avisa antes", () => {
  for (const e of eventos) assert.match(e, /BEGIN:VALARM[\s\S]*TRIGGER:-PT\d+M[\s\S]*END:VALARM/);
});

test("las sesiones van a la hora elegida y el tenis a la suya", () => {
  const mie = WEEKS[0].days[2], lun = WEEKS[0].days[0];
  assert.match(ics, new RegExp("DTSTART:" + mie.isoDate.replace(/-/g, "") + "T170000"));
  assert.match(ics, new RegExp("DTSTART:" + lun.isoDate.replace(/-/g, "") + "T200000"));
  assert.match(ics, new RegExp("DTEND:" + lun.isoDate.replace(/-/g, "") + "T213000"));
  const a18 = calendarioIcs(FLAT_DAYS, { hora: "18:00" });
  assert.match(a18, new RegExp("DTSTART:" + mie.isoDate.replace(/-/g, "") + "T180000"));
});

test("se puede empezar desde hoy", () => {
  const desde = WEEKS[2].days[0].isoDate;
  const parcial = calendarioIcs(FLAT_DAYS, { desde });
  assert.ok(!parcial.includes("UID:" + WEEKS[0].days[2].isoDate));
  assert.ok(parcial.includes("UID:" + desde));
});

test("el formato es valido: CRLF, lineas plegadas y texto escapado", () => {
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  for (const l of ics.split("\r\n")) assert.ok(new TextEncoder().encode(l).length <= 75, l);
  assert.ok(!/SUMMARY:[^\r]*[^\\],/.test(ics), "las comas del texto van escapadas");
});
