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

test("con hora de carrera, la carrera va a su hora y avisa 15 min antes", async () => {
  const { calendarioIcs } = await import("../src/domain/plan/ics.js");
  const { FLAT_DAYS } = await import("../src/domain/plan/calendario.js");
  const ics = calendarioIcs(FLAT_DAYS, { desde: "2026-11-02", horasCarrera: { 1: "17:30", 3: "18:30", 6: "10:00" } });
  const ev = (iso) => ics.split("BEGIN:VEVENT").find(b => b.includes("UID:" + iso + "@"));
  assert.match(ev("2026-11-03"), /DTSTART:20261103T173000/);
  assert.match(ev("2026-11-03"), /TRIGGER:-PT15M/);
  assert.match(ev("2026-11-05"), /DTSTART:20261105T183000/);
  assert.match(ev("2026-11-08"), /DTSTART:20261108T100000/);
  assert.match(ev("2026-11-04"), /DTSTART:20261104T170000/, "la fuerza sigue a la hora general");
  assert.match(ev("2026-11-04"), /TRIGGER:-PT30M/);
});

test("si el 5 km mueve la fecha, el calendario sigue la nueva y cancela el viejo 7K", async () => {
  const { calendarioIcs } = await import("../src/domain/plan/ics.js");
  const { diasDelCalendario } = await import("../src/domain/plan/calendario.js");
  const objetivo = (extra) => diasDelCalendario(extra).find(d => d.tipo === "objetivo").isoDate;
  assert.equal(objetivo(0), "2027-01-31");
  assert.equal(objetivo(4), "2027-02-28");
  assert.equal(objetivo(-1), "2027-01-24");
  const ics = calendarioIcs(diasDelCalendario(4), { desde: "2026-12-28", original: diasDelCalendario(0) });
  const ev = (iso) => ics.split("BEGIN:VEVENT").filter(b => b.includes("UID:" + iso + "@"));
  assert.match(ev("2027-02-28")[0], /EL DÍA/);
  assert.equal(ev("2027-01-31").length, 1, "el 31 de enero lleva una sesion normal, no el 7K");
  assert.doesNotMatch(ev("2027-01-31")[0], /EL DÍA/);
  const adelantado = calendarioIcs(diasDelCalendario(-1), { desde: "2026-12-28", original: diasDelCalendario(0) });
  const viejo = adelantado.split("BEGIN:VEVENT").find(b => b.includes("UID:2027-01-31@"));
  assert.match(viejo, /STATUS:CANCELLED/, "el viejo dia del 7K se cancela");
});
