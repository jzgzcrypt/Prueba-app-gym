/**
 * La compra de la semana.
 *
 * Sale del menú, no de una lista escrita a mano: si editas el menú, la lista
 * cambia. Y dice dos cosas distintas — lo que sí o sí, y con qué cambiarlo —
 * porque en el supermercado hay dos preguntas distintas.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { WEEKS } from "../src/domain/plan/calendario.js";
import { comidaDelDia } from "../src/domain/nutricion/dias.js";
import { ALIMENTO } from "../src/domain/nutricion/alimentos.js";
import { MENU_DIA, menuDe } from "../src/domain/nutricion/menu-dia.js";
import {
  DESPENSA, FUERA_POR_DEFECTO, SECCIONES, cantidadDeCompra, claveCompra, listaDeLaCompra, tiposDeSemana,
} from "../src/domain/nutricion/compra.js";

const semana = (n) => WEEKS[n].days;
const lista = (opciones) => listaDeLaCompra(Object.assign({ dias: semana(0), comidaDelDia }, opciones));

test("la semana se reparte entre días de comer y de recortar, y suman siete", () => {
  for (const w of WEEKS) {
    const c = tiposDeSemana(w.days, comidaDelDia);
    assert.equal(c.comer + c.recortar, 7, "semana " + w.n);
    assert.ok(c.comer >= 1, "semana " + w.n);
    // Las semanas sin deficit (S10-S11) no tienen dias de recortar, a proposito.
    if (!w.sinDeficit) assert.ok(c.recortar >= 1, "semana " + w.n);
  }
});

test("todo lo que pide el menú aparece en la lista, y nada más", () => {
  const l = lista();
  const delMenu = new Set([...MENU_DIA.comer, ...MENU_DIA.recortar]
    .flatMap(c => c.ingredientes).map(i => i.id));
  const enLista = new Set(l.items.map(i => i.id));
  for (const id of delMenu) assert.ok(enLista.has(id), "falta " + id + " en la compra");
  for (const id of enLista) assert.ok(delMenu.has(id), "sobra " + id + " en la compra");
});

test("cada cosa cae en su sección del supermercado", () => {
  const l = lista();
  const ids = SECCIONES.map(s => s.id);
  for (const s of l.secciones) {
    assert.ok(ids.includes(s.id), s.id);
    assert.ok(s.items.length > 0, "sección vacía: " + s.id);
  }
  // Y el total cuadra: nada se pierde ni se cuenta dos veces.
  assert.equal(l.secciones.reduce((t, s) => t + s.items.length, 0), l.items.length);
});

test("las secciones van en el orden en que se recorre la tienda", () => {
  const orden = lista().secciones.map(s => s.id);
  const esperado = SECCIONES.map(s => s.id).filter(id => orden.includes(id));
  assert.deepEqual(orden, esperado);
});

test("las cantidades son las de la semana, no las de un día", () => {
  // El pollo sale en la comida de los dos tipos de día: 170 g × 7 días.
  const pollo = lista().items.find(i => i.id === "pollo");
  assert.ok(pollo.gramos >= 170 * 7 * 0.9, String(pollo.gramos));
  assert.ok(pollo.gramos <= 170 * 7 * 1.1, String(pollo.gramos));
});

test("se redondea hacia arriba y se dice como se pide en la tienda", () => {
  // Nadie pide 173 g de pollo.
  assert.equal(cantidadDeCompra("pollo", 1190), "1,2 kg");
  assert.equal(cantidadDeCompra("pollo", 173), "200 g");
  assert.equal(cantidadDeCompra("huevo", 700), "1 docena");
  assert.equal(cantidadDeCompra("huevo", 240), "6 huevos");
  assert.equal(cantidadDeCompra("legumbres", 900), "3 botes");
  assert.equal(cantidadDeCompra("yogur_proteico", 400), "3 yogures");
  assert.equal(cantidadDeCompra("atun_lata", 100), "3 latas");
  assert.equal(cantidadDeCompra("bebida_almendras", 3500), "4 l");
});

test("nunca se pide menos de lo que hace falta", () => {
  for (const item of lista().items) {
    const numero = parseFloat(item.cantidad.replace(",", ".")) || 0;
    const enGramos = /kg/.test(item.cantidad) ? numero * 1000
      : / l\b/.test(item.cantidad) ? numero * 1000
      : /\d+ g\b|ml/.test(item.cantidad) ? numero
      : null; // unidades: se comprueban aparte
    if (enGramos !== null) {
      assert.ok(enGramos >= item.gramos, `${item.nombre}: pide ${item.gramos} g y compras ${item.cantidad}`);
    }
  }
});

test("cada cosa dice por qué cambiarla, con la cantidad ya convertida", () => {
  const boniato = lista().items.find(i => i.id === "boniato");
  const arroz = boniato.alternativas.find(a => a.id === "arroz");
  assert.ok(arroz, "el boniato debería poder cambiarse por arroz");
  // Y no a igualdad de gramos: 1,4 kg de boniato no son 1,4 kg de arroz.
  assert.notEqual(arroz.cantidad, boniato.cantidad);
  for (const item of lista().items) {
    for (const a of item.alternativas) {
      assert.ok(ALIMENTO[a.id], `${item.id} → ${a.id} no existe`);
      assert.equal(ALIMENTO[a.id].grupo, ALIMENTO[item.id].grupo, `${item.id} → ${a.id} cambia de grupo`);
      assert.notEqual(a.id, item.id);
    }
  }
});

test("no se ofrecen cambios que nadie haría", () => {
  // La whey del batido no se sustituye por pollo, ni los 2 kg de queso batido
  // de la precama. Ofrecerlo llena la lista de ruido.
  for (const id of ["whey", "queso_batido", "yogur_proteico", "bebida_almendras", "aceite"]) {
    const item = lista().items.find(i => i.id === id);
    if (item) assert.deepEqual(item.alternativas, [], id + " ofrece cambios raros");
  }
  for (const item of lista().items) {
    assert.ok(!item.alternativas.some(a => a.id === "whey"), item.id + " propone whey");
  }
});

test("si quitas el desayuno del menú, desaparece de la compra lo que solo estaba ahí", () => {
  const conDesayuno = lista();
  const sinDesayuno = lista({ edits: { comer: { desayuno: null }, recortar: { desayuno: null } } });

  const avenaAntes = conDesayuno.items.find(i => i.id === "avena");
  assert.ok(avenaAntes, "la avena debería estar con el desayuno puesto");
  assert.ok(!sinDesayuno.items.find(i => i.id === "avena"), "la avena sigue en la compra sin desayuno");

  // Y lo que está en varias comidas baja, pero no desaparece.
  const frutaAntes = conDesayuno.items.find(i => i.id === "fruta");
  const frutaDespues = sinDesayuno.items.find(i => i.id === "fruta");
  assert.ok(frutaDespues, "la fruta no debería desaparecer");
  assert.ok(frutaDespues.gramos < frutaAntes.gramos, `${frutaDespues.gramos} vs ${frutaAntes.gramos}`);
});

test("si cambias una cantidad del menú, la compra la sigue", () => {
  const base = menuDe("recortar").find(c => c.id === "cena");
  const doble = base.ingredientes.map(i => (i.id === "boniato" ? { id: i.id, g: i.g * 2 } : i));
  const antes = lista().items.find(i => i.id === "boniato").gramos;
  const despues = lista({ edits: { recortar: { cena: doble } } }).items.find(i => i.id === "boniato").gramos;
  assert.ok(despues > antes * 1.4, `${despues} vs ${antes}`);
});

test("la despensa no lleva cantidades: solo tú sabes si se te ha acabado la sal", () => {
  assert.ok(DESPENSA.length > 0);
  for (const d of DESPENSA) {
    assert.ok(d.nombre, JSON.stringify(d));
    assert.equal(d.cantidad, undefined);
    assert.equal(d.gramos, undefined);
  }
  assert.deepEqual(lista().despensa, DESPENSA);
});

test("la clave de tachado separa semanas, para que el lunes vuelva a estar entera", () => {
  assert.notEqual(claveCompra("2026-09-21", "pollo"), claveCompra("2026-09-28", "pollo"));
  assert.equal(claveCompra("2026-09-21", "pollo"), "2026-09-21:pollo");
});

test("una semana sin días no revienta", () => {
  const vacia = listaDeLaCompra({ dias: [], comidaDelDia });
  assert.equal(vacia.dias, 0);
  assert.deepEqual(vacia.secciones, []);
  assert.deepEqual(vacia.items, []);
  assert.deepEqual(listaDeLaCompra({ dias: null, comidaDelDia }).items, []);
});

test("todas las semanas del bloque dan una lista comprable", () => {
  for (const w of WEEKS) {
    const l = listaDeLaCompra({ dias: w.days, comidaDelDia });
    assert.ok(l.items.length > 10, "semana " + w.n + " solo tiene " + l.items.length);
    for (const i of l.items) {
      assert.ok(i.cantidad && !/NaN|undefined/.test(i.cantidad), `semana ${w.n}, ${i.id}: "${i.cantidad}"`);
      assert.ok(i.gramos > 0, `semana ${w.n}, ${i.id}`);
    }
  }
});

// ─── LO QUE COMES FUERA NO SE COMPRA ──────────────────────────────────────

test("las comidas que haces fuera no entran en el carro", () => {
  // De lunes a viernes come en la cantina: esa comida no se compra.
  const con = lista();
  const sin = lista({ fuera: FUERA_POR_DEFECTO });

  const pollo = (l) => l.items.find(i => i.id === "pollo").gramos;
  assert.ok(pollo(sin) < pollo(con) * 0.5, `${pollo(sin)} vs ${pollo(con)}`);
  assert.equal(sin.fueraDeCasa, 5);
});

test("pero siguen contando para los macros del día", () => {
  // No es lo mismo comer fuera que quitarlo del menú: el menú no cambia, solo
  // la compra. Si se confundieran, el día dejaría de cuadrar.
  const menuAntes = menuDe("recortar");
  lista({ fuera: FUERA_POR_DEFECTO });
  assert.deepEqual(menuDe("recortar"), menuAntes);
  assert.ok(menuAntes.some(c => c.id === "comida"), "la comida sigue en el menú");
});

test("se salta el día que dices, no un día cualquiera", () => {
  // El lunes es día de COMER igual que el domingo: si se contara por tipo de
  // día en vez de por día de la semana, saltarse el lunes se llevaría por
  // delante la comida del domingo, que sí haces en casa.
  const soloLunes = lista({ fuera: { comida: [0] } });
  const soloDomingo = lista({ fuera: { comida: [6] } });
  const todos = lista();

  const arroz = (l) => (l.items.find(i => i.id === "arroz") || { gramos: 0 }).gramos;
  // El arroz solo está en la comida de los días de COMER: lunes y domingo.
  assert.ok(arroz(soloLunes) < arroz(todos), "quitar el lunes no bajó el arroz");
  assert.equal(arroz(soloLunes), arroz(soloDomingo), "lunes y domingo deberían pesar igual");
  assert.equal(arroz(lista({ fuera: { comida: [0, 6] } })), 0, "sin ninguna comida de COMER no debería quedar arroz");
});

test("marcar todas las comidas fuera deja la compra vacía", () => {
  const todasFuera = {};
  for (const c of menuDe("comer").concat(menuDe("recortar"))) todasFuera[c.id] = [0, 1, 2, 3, 4, 5, 6];
  const l = lista({ fuera: todasFuera });
  assert.deepEqual(l.items, []);
  // Y la despensa sigue ahí: la sal no depende de dónde comas.
  assert.deepEqual(l.despensa, DESPENSA);
});

test("sin decir nada, se compra todo", () => {
  assert.equal(lista().fueraDeCasa, 0);
  assert.equal(lista({ fuera: {} }).fueraDeCasa, 0);
  assert.equal(lista({ fuera: null }).items.length, lista().items.length);
});

test("una marca rara no descuadra la compra", () => {
  for (const fuera of [{ comida: "lunes" }, { comida: [99] }, { inventada: [0, 1] }]) {
    const l = lista({ fuera });
    assert.ok(l.items.length > 10, JSON.stringify(fuera));
    for (const i of l.items) assert.ok(i.gramos > 0, JSON.stringify(fuera) + " → " + i.id);
  }
});
