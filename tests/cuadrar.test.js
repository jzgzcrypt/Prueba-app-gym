/**
 * El nucleo: tu sigues tu menu, apuntas lo que has comido de verdad, y las
 * cantidades de lo que queda se recalculan para que el dia cuadre.
 *
 * Lo que se prueba aqui no es que el codigo corra: es que el dia SUMA. Un
 * error en estos numeros es un dia entero mal, todos los dias.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { ALIMENTO, macrosDe } from "../src/domain/nutricion/alimentos.js";
import { COMIDAS_DEL_DIA, MENU_DIA, comidasQuitadas, menuDe } from "../src/domain/nutricion/menu-dia.js";
import { OBJETIVO_MACROS } from "../src/domain/nutricion/dias.js";
import { apuntesDe, claveCambio, cuadrarDia, factoresPara } from "../src/domain/nutricion/cuadrar.js";
import { macrosDelDia } from "../src/domain/nutricion/iifym.js";

const suma = (ings) => ings.reduce((t, i) => {
  const m = macrosDe(i.id, i.g);
  return { kcal: t.kcal + m.kcal, prot: t.prot + m.prot, hc: t.hc + m.hc, grasa: t.grasa + m.grasa };
}, { kcal: 0, prot: 0, hc: 0, grasa: 0 });

const cerca = (a, b, margen) => Math.abs(a - b) <= margen;

test("el menu de partida ya suma lo que tiene que sumar", () => {
  // Si el punto de partida no cuadra, el recalculo arrastra el error siempre.
  for (const [tipo, objetivo] of Object.entries(OBJETIVO_MACROS)) {
    const total = suma(MENU_DIA[tipo].flatMap(c => c.ingredientes));
    assert.ok(cerca(total.kcal, objetivo.kcal, 60), `${tipo}: ${Math.round(total.kcal)} kcal vs ${objetivo.kcal}`);
    assert.ok(cerca(total.prot, objetivo.prot, 12), `${tipo}: ${Math.round(total.prot)} g de proteína`);
    assert.ok(cerca(total.hc, objetivo.hc, 20), `${tipo}: ${Math.round(total.hc)} g de HC`);
    assert.ok(cerca(total.grasa, objetivo.grasa, 10), `${tipo}: ${Math.round(total.grasa)} g de grasa`);
  }
});

test("todo lo que hay en el menu existe en casa y tiene un momento del dia", () => {
  const ids = new Set(COMIDAS_DEL_DIA.map(c => c.id));
  for (const [tipo, plan] of Object.entries(MENU_DIA)) {
    for (const c of plan) {
      assert.ok(ids.has(c.id), `${tipo}: comida desconocida "${c.id}"`);
      assert.ok(c.ingredientes.length > 0, `${tipo}/${c.id} sin ingredientes`);
      for (const i of c.ingredientes) {
        assert.ok(ALIMENTO[i.id], `${tipo}/${c.id}: no existe "${i.id}"`);
        assert.ok(i.g > 0, `${tipo}/${c.id}/${i.id} sin cantidad`);
      }
    }
    // Y van en el orden del dia, no en cualquiera.
    const orden = plan.map(c => COMIDAS_DEL_DIA.findIndex(x => x.id === c.id));
    assert.deepEqual(orden, [...orden].sort((a, b) => a - b), tipo);
  }
});

test("el dia de comer lleva mas carbohidrato que el de recortar", () => {
  const hc = (t) => suma(MENU_DIA[t].flatMap(c => c.ingredientes)).hc;
  assert.ok(hc("comer") > hc("recortar") + 50);
});

test("sin apuntar nada, el menu sale tal cual lo escribiste", () => {
  for (const tipo of ["comer", "recortar"]) {
    const d = cuadrarDia({ tipoDia: tipo, objetivo: OBJETIVO_MACROS[tipo], apuntes: [] });
    assert.equal(d.comidas.length, MENU_DIA[tipo].length);
    assert.equal(d.pendientes.length, MENU_DIA[tipo].length);
    for (const c of d.comidas) for (const i of c.ingredientes) {
      assert.ok(Math.abs(i.cambio) <= i.gramosPlan * 0.25, `${c.id}/${i.id} se movió ${i.cambio} g sin haber comido nada`);
    }
  }
});

test("si en la cantina te pasas, la cena baja", () => {
  // El caso real: macarrones, pescado rebozado y pan. El dia no se tira; se
  // ajusta lo que queda.
  const objetivo = OBJETIVO_MACROS.recortar;
  const normal = cuadrarDia({ tipoDia: "recortar", objetivo, apuntes: [] });
  const pasado = cuadrarDia({ tipoDia: "recortar", objetivo, apuntes: [
    { comida: "desayuno", origen: "rapida", id: "porridge" },
    { comida: "comida", origen: "cantina", id: "macarrones", racion: "mucho" },
    { comida: "comida", origen: "cantina", id: "pescado_rebozado", racion: "normal" },
    { comida: "comida", origen: "cantina", id: "pan_cantina", racion: "normal" },
  ] });
  const cenaDe = (d) => d.pendientes.find(c => c.id === "cena");
  // Las hechas siguen en su sitio, marcadas, pero ya no se recalculan.
  assert.equal(pasado.comidas.length, normal.comidas.length, "una comida hecha no desaparece del día");
  for (const id of ["desayuno", "comida"]) {
    assert.equal(pasado.comidas.find(c => c.id === id).hecha, true, id);
    assert.ok(!pasado.pendientes.some(c => c.id === id), id + " sigue pendiente");
  }
  assert.ok(cenaDe(pasado).macros.hc < cenaDe(normal).macros.hc,
    `la cena no bajó de carbohidrato: ${cenaDe(pasado).macros.hc} vs ${cenaDe(normal).macros.hc}`);
});

test("si has comido corto, lo que queda sube", () => {
  const objetivo = OBJETIVO_MACROS.comer;
  const normal = cuadrarDia({ tipoDia: "comer", objetivo, apuntes: [] });
  const corto = cuadrarDia({ tipoDia: "comer", objetivo, apuntes: [
    { comida: "desayuno", origen: "rapida", id: "cafe" },
    { comida: "comida", origen: "cantina", id: "ensalada_mixta", racion: "poco" },
  ] });
  const cena = (d) => d.pendientes.find(c => c.id === "cena").macros;
  assert.ok(cena(corto).kcal > cena(normal).kcal, `${cena(corto).kcal} vs ${cena(normal).kcal}`);
});

test("después de recalcular, el día previsto cuadra con el objetivo", () => {
  // Esta es LA prueba: hagas lo que hagas a mediodia, si te comes lo que dice
  // la app el dia cierra donde tiene que cerrar.
  const casos = [
    [],
    [{ comida: "desayuno", origen: "rapida", id: "porridge" }],
    [{ comida: "comida", origen: "cantina", id: "lentejas", racion: "normal" },
     { comida: "comida", origen: "cantina", id: "pollo_plancha", racion: "normal" }],
    [{ comida: "desayuno", origen: "rapida", id: "tostadas" },
     { comida: "comida", origen: "cantina", id: "arroz_cantina", racion: "mucho" },
     { origen: "cantina", id: "p_cerveza", racion: "normal" }],
  ];
  for (const tipo of ["comer", "recortar"]) {
    const objetivo = OBJETIVO_MACROS[tipo];
    for (const apuntes of casos) {
      const d = cuadrarDia({ tipoDia: tipo, objetivo, apuntes });
      assert.ok(cerca(d.previsto.kcal, objetivo.kcal, objetivo.kcal * 0.06),
        `${tipo} con ${apuntes.length} apuntes: previsto ${d.previsto.kcal} vs ${objetivo.kcal}`);
      // La proteina llega, salvo cuando ya no puede llegar — y entonces la app
      // lo dice en vez de fingir que cuadra. Un desayuno de café y una comida
      // de arroz no se arreglan con la cena, y eso hay que saberlo.
      if (d.previsto.prot <= objetivo.prot * 0.88) {
        assert.ok(d.aviso && ["no-cuadra", "falta-proteina", "pasado"].includes(d.aviso.id),
          `${tipo}: se queda en ${d.previsto.prot} g de proteína y avisa "${d.aviso && d.aviso.id}"`);
      }
    }
  }
});

test("la verdura y la fruta no se tocan nunca", () => {
  // Son volumen y saciedad: moverlas no arregla el dia y quita lo que sacia.
  const d = cuadrarDia({ tipoDia: "comer", objetivo: OBJETIVO_MACROS.comer, apuntes: [
    { comida: "comida", origen: "cantina", id: "pizza", racion: "mucho" },
  ] });
  for (const c of d.pendientes) for (const i of c.ingredientes) {
    const grupo = ALIMENTO[i.id].grupo;
    if (["verdura", "fruta", "extra"].includes(grupo)) assert.equal(i.cambio, 0, `${c.id}/${i.id}`);
  }
});

test("no se propone una cena imposible para cuadrar un desastre", () => {
  // Si para cuadrar hiciera falta multiplicar la cena por tres, el problema
  // no lo arregla la cena: se topa y se avisa.
  const d = cuadrarDia({ tipoDia: "recortar", objetivo: OBJETIVO_MACROS.recortar, apuntes: [
    { comida: "desayuno", origen: "rapida", id: "cafe" },
    { comida: "comida", origen: "rapida", id: "cafe" },
    { comida: "merienda", origen: "rapida", id: "cafe" },
  ] });
  const cena = d.pendientes.find(c => c.id === "cena");
  assert.ok(cena.macros.kcal < 1400, `cena de ${cena.macros.kcal} kcal`);
  assert.ok(["no-cuadra", "falta-proteina"].includes(d.aviso.id), d.aviso.id);
});

test("pasarse tanto que no quede nada se dice sin dramatizar", () => {
  const d = cuadrarDia({ tipoDia: "recortar", objetivo: OBJETIVO_MACROS.recortar, apuntes: [
    { comida: "desayuno", origen: "rapida", id: "porridge" },
    { comida: "comida", origen: "cantina", id: "pizza", racion: "mucho" },
    { comida: "comida", origen: "cantina", id: "p_dulce", racion: "mucho" },
    { comida: "merienda", origen: "rapida", id: "picoteo" },
  ] });
  assert.ok(d.restante.kcal <= 0, String(d.restante.kcal));
  assert.equal(d.aviso.id, "pasado");
});

test("con el día entero apuntado no queda menú pendiente", () => {
  const apuntes = menuDe("recortar").flatMap(c => c.ingredientes.map(i =>
    ({ comida: c.id, origen: "casa", id: i.id, gramos: i.g })));
  const d = cuadrarDia({ tipoDia: "recortar", objetivo: OBJETIVO_MACROS.recortar, apuntes });
  assert.equal(d.pendientes.length, 0);
  assert.ok(d.comidas.every(c => c.hecha), "el día entero debería estar marcado como hecho");
  assert.equal(d.aviso.id, "cerrado");
  assert.ok(Math.abs(d.restante.kcal) < 80, String(d.restante.kcal));
});

test("comerse una comida tal cual congela los gramos que tenías delante", () => {
  // No los del papel: los que la app te acababa de recalcular.
  const d = cuadrarDia({ tipoDia: "comer", objetivo: OBJETIVO_MACROS.comer, apuntes: [
    { comida: "comida", origen: "cantina", id: "lasana", racion: "mucho" },
  ] });
  const cena = d.pendientes.find(c => c.id === "cena");
  const apuntes = apuntesDe(cena);
  assert.equal(apuntes.length, cena.ingredientes.length);
  for (const a of apuntes) assert.equal(a.comida, "cena");
  const m = macrosDelDia(apuntes);
  assert.ok(Math.abs(m.kcal - cena.macros.kcal) < 2, `${m.kcal} vs ${cena.macros.kcal}`);
});

test("un apunte suelto suma al día pero no cierra ninguna comida", () => {
  // Una caña a media tarde no es la merienda.
  const d = cuadrarDia({ tipoDia: "recortar", objetivo: OBJETIVO_MACROS.recortar, apuntes: [
    { origen: "cantina", id: "p_cerveza", racion: "normal" },
  ] });
  assert.equal(d.pendientes.length, MENU_DIA.recortar.length);
  assert.ok(d.comido.kcal > 100);
});

test("aguanta una entrada rota sin romper el día", () => {
  const d = cuadrarDia({ tipoDia: "comer", objetivo: OBJETIVO_MACROS.comer, apuntes: null });
  assert.ok(d.pendientes.length > 0);
  const { factores } = factoresPara([], { kcal: 500, prot: 40, hc: 50, grasa: 15 });
  for (const f of Object.values(factores)) assert.equal(f, 1);
});

test("cambiar un alimento del menú mantiene lo que suma el plato", () => {
  // "Hoy no hay salmón, hay merluza": cambia el alimento, no el día.
  const objetivo = OBJETIVO_MACROS.recortar;
  const normal = cuadrarDia({ tipoDia: "recortar", objetivo, apuntes: [] });
  const cambiado = cuadrarDia({ tipoDia: "recortar", objetivo, apuntes: [],
    cambios: { [claveCambio("cena", "salmon")]: "merluza" } });
  const cena = (d) => d.pendientes.find(c => c.id === "cena");
  assert.ok(cena(cambiado).ingredientes.some(i => i.id === "merluza" && i.enLugarDe === "salmon"));
  assert.ok(!cena(cambiado).ingredientes.some(i => i.id === "salmon"));
  assert.ok(Math.abs(cena(cambiado).macros.prot - cena(normal).macros.prot) < 8,
    `${cena(cambiado).macros.prot} vs ${cena(normal).macros.prot}`);
  assert.ok(Math.abs(cambiado.previsto.kcal - objetivo.kcal) < objetivo.kcal * 0.06);
});

test("un cambio a un alimento que no existe se ignora", () => {
  const d = cuadrarDia({ tipoDia: "recortar", objetivo: OBJETIVO_MACROS.recortar, apuntes: [],
    cambios: { [claveCambio("cena", "salmon")]: "unicornio" } });
  assert.ok(d.pendientes.find(c => c.id === "cena").ingredientes.some(i => i.id === "salmon"));
});

test("si no cabe el menú entero se quita lo prescindible, no se encoge todo", () => {
  // El caso real: macarrones, pescado rebozado y pan a mediodía. Antes salía
  // una cena de 20 g de pasta y un huevo. Eso no se lo come nadie.
  const d = cuadrarDia({ tipoDia: "comer", objetivo: OBJETIVO_MACROS.comer, apuntes: [
    { comida: "desayuno", origen: "rapida", id: "porridge" },
    { comida: "comida", origen: "cantina", id: "macarrones", racion: "mucho" },
    { comida: "comida", origen: "cantina", id: "pescado_rebozado", racion: "normal" },
    { comida: "comida", origen: "cantina", id: "pan_cantina", racion: "normal" },
  ] });
  assert.ok(d.saltadas.length > 0, "no quitó nada");
  // La cena y la comida nunca se quitan: saltarse una comida principal es el
  // habito que hay que evitar, no el que hay que crear.
  for (const id of d.saltadas) assert.ok(!["desayuno", "comida", "cena"].includes(id), id);
  const cena = d.pendientes.find(c => c.id === "cena");
  assert.ok(cena.macros.kcal > 300, `cena de ${cena.macros.kcal} kcal`);
  assert.equal(d.aviso.id, "saltada");
  // Y lo que se quita es lo que peor proteína da por caloría. El queso batido
  // de la precama son 20 g por 118 kcal: es lo último que se toca.
  assert.ok(d.aviso.texto.includes("almuerzo"), d.aviso.texto);
  assert.ok(!d.saltadas.includes("precama"), "se quitó la precama, que es la proteína más barata");
});

test("quitar comidas acerca el día al objetivo en vez de alejarlo", () => {
  const objetivo = OBJETIVO_MACROS.comer;
  const apuntes = [
    { comida: "desayuno", origen: "rapida", id: "porridge" },
    { comida: "comida", origen: "cantina", id: "macarrones", racion: "mucho" },
    { comida: "comida", origen: "cantina", id: "pescado_rebozado", racion: "normal" },
    { comida: "comida", origen: "cantina", id: "pan_cantina", racion: "normal" },
  ];
  const d = cuadrarDia({ tipoDia: "comer", objetivo, apuntes });
  // Se acerca todo lo que se puede SIN sacrificar proteína: quitar la precama
  // ahorraría calorías, pero son 20 g de proteína por 118 kcal y eso no se
  // cambia. Que sobren 130 kcal es el precio correcto.
  assert.ok(d.previsto.kcal < objetivo.kcal * 1.08,
    `el día cierra en ${d.previsto.kcal} con un objetivo de ${objetivo.kcal}`);
  assert.ok(d.previsto.prot >= objetivo.prot * 0.95, `${d.previsto.prot} g de proteína`);
});

test("un día normal no salta ninguna comida", () => {
  for (const tipo of ["comer", "recortar"]) {
    const d = cuadrarDia({ tipoDia: tipo, objetivo: OBJETIVO_MACROS[tipo], apuntes: [] });
    assert.deepEqual(d.saltadas, [], tipo);
  }
});

// ─── EDITAR LA DIETA ───────────────────────────────────────────────────────
// El menú de partida es mío; el que se usa cada día tiene que ser suyo.

test("si quitas el desayuno, el resto del día carga con sus calorías", () => {
  const objetivo = OBJETIVO_MACROS.comer;
  const edits = { comer: { desayuno: null } };
  const d = cuadrarDia({ tipoDia: "comer", objetivo, apuntes: [], edits });

  assert.ok(!d.comidas.some(c => c.id === "desayuno"), "el desayuno sigue ahí");
  assert.ok(Math.abs(d.previsto.kcal - objetivo.kcal) < objetivo.kcal * 0.08,
    `el día cierra en ${d.previsto.kcal} con un objetivo de ${objetivo.kcal}`);
  assert.ok(d.previsto.prot > objetivo.prot * 0.85, `${d.previsto.prot} g de proteína`);
});

test("si desayunas menos, se nota en el desayuno y no en otro sitio", () => {
  const objetivo = OBJETIVO_MACROS.comer;
  const original = menuDe("comer").find(c => c.id === "desayuno");
  const mitad = original.ingredientes.map(i => ({ id: i.id, g: Math.round(i.g / 2) }));
  const d = cuadrarDia({ tipoDia: "comer", objetivo, apuntes: [], edits: { comer: { desayuno: mitad } } });

  const desayuno = d.pendientes.find(c => c.id === "desayuno");
  assert.ok(desayuno.editada, "no se marcó como tuya");
  const normal = cuadrarDia({ tipoDia: "comer", objetivo, apuntes: [] }).pendientes.find(c => c.id === "desayuno");
  assert.ok(desayuno.macros.kcal < normal.macros.kcal * 0.7,
    `${desayuno.macros.kcal} vs ${normal.macros.kcal}`);
  assert.ok(Math.abs(d.previsto.kcal - objetivo.kcal) < objetivo.kcal * 0.08);
});

test("se puede añadir un alimento al menú y una comida que no estaba", () => {
  const edits = { recortar: {
    postentreno: [{ id: "whey", g: 30 }, { id: "platano", g: 120 }],
    cena: menuDe("recortar").find(c => c.id === "cena").ingredientes.concat([{ id: "aguacate", g: 50 }]),
  } };
  const menu = menuDe("recortar", edits);
  assert.ok(menu.some(c => c.id === "postentreno"), "no se añadió el post-entreno");
  assert.ok(menu.find(c => c.id === "cena").ingredientes.some(i => i.id === "aguacate"));
  // Y cae en su sitio del día, no al final.
  const orden = menu.map(c => c.id);
  assert.ok(orden.indexOf("postentreno") < orden.indexOf("cena"), orden.join(" → "));
});

test("volver al original siempre es posible: la edición es una capa encima", () => {
  const edits = { comer: { desayuno: null, cena: [{ id: "pollo", g: 50 }] } };
  assert.equal(menuDe("comer", edits).length, MENU_DIA.comer.length - 1);
  // Quitar la capa devuelve el menú exacto de partida.
  assert.deepEqual(menuDe("comer", { comer: {} }).map(c => c.id), MENU_DIA.comer.map(c => c.id));
  assert.deepEqual(menuDe("comer", {}).map(c => c.id), MENU_DIA.comer.map(c => c.id));
});

test("las comidas quitadas se pueden listar para devolverlas", () => {
  const quitadas = comidasQuitadas("comer", { comer: { desayuno: null, precama: [] } });
  assert.deepEqual(quitadas.map(c => c.id), ["desayuno", "precama"]);
  assert.deepEqual(comidasQuitadas("comer", {}), []);
  assert.deepEqual(comidasQuitadas("comer", undefined), []);
});

test("una edición sin sentido no rompe el día", () => {
  for (const edits of [
    { comer: { inventada: [{ id: "pollo", g: 100 }] } },   // comida que no existe
    { comer: { cena: [{ id: "unicornio", g: 100 }] } },    // alimento que no existe
    { comer: null },
  ]) {
    const d = cuadrarDia({ tipoDia: "comer", objetivo: OBJETIVO_MACROS.comer, apuntes: [], edits });
    assert.ok(d.comidas.length > 0);
    assert.ok(Number.isFinite(d.previsto.kcal), JSON.stringify(edits));
  }
});

test("editar el menú de COMER no toca el de RECORTAR", () => {
  const edits = { comer: { desayuno: null } };
  assert.deepEqual(menuDe("recortar", edits).map(c => c.id), MENU_DIA.recortar.map(c => c.id));
});
