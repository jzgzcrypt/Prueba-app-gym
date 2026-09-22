"use client";

/**
 * LA COMPRA DE LA SEMANA.
 *
 * Sale sola del menú: se cuentan los días de COMER y RECORTAR que tiene la
 * semana y se multiplica. Si editaste tu menú, la lista lo sabe.
 *
 * Dos bloques, porque en el supermercado hay dos preguntas distintas: lo que
 * sí o sí, y lo que depende —si no hay salmón hay merluza, y entonces no son
 * 800 g sino 1,8 kg, ya calculado para no hacer la cuenta delante del
 * mostrador—. Más la despensa: sal, café, especias. Cosas que igual hacen
 * falta y igual no, y que solo tú sabes si se te han acabado.
 *
 * Se tacha tocando. Lo tachado se guarda por semana, así que el lunes que
 * viene la lista vuelve a estar entera.
 */

import { useState } from "react";
import { C, CAT, R, SP, TAP_MIN, TYPE } from "@/design/tokens";
import { DESPENSA, claveCompra, listaDeLaCompra } from "@/domain/nutricion/compra";
import { comidaDelDia } from "@/domain/nutricion/dias";
import { SectionHeader } from "@/features/ui/headers";

const Tacha = ({ marcado }) => (
  <span style={{
    width: 19, height: 19, borderRadius: 5, flexShrink: 0,
    border: "1.5px solid " + (marcado ? CAT.nutricion : C.cardBorder),
    background: marcado ? CAT.nutricion : "transparent",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "#FAFAF9", fontSize: 12, fontWeight: 800, lineHeight: 1,
  }}>{marcado ? "✓" : ""}</span>
);

export function ListaCompra({ dias, inicioSemana, edits, marcado, marcarCompra }) {
  const [abierto, setAbierto] = useState(null); // item cuyas alternativas se ven
  const [copiado, setCopiado] = useState(false);

  if (!dias || !dias.length) return null;
  const lista = listaDeLaCompra({ dias, comidaDelDia, edits });
  const marcas = marcado || {};
  const esta = (id) => !!marcas[claveCompra(inicioSemana, id)];

  const total = lista.items.length;
  const hechos = lista.items.filter(i => esta(i.id)).length;

  /** En texto plano, para mandársela a alguien o pegarla donde sea. */
  const comoTexto = () =>
    "Compra de la semana (" + lista.cuenta.comer + " días de comer, " +
    lista.cuenta.recortar + " de recortar)\n\n" +
    lista.secciones.map(s => s.nombre + "\n" +
      s.items.map(i => "- " + i.nombre + ": " + i.cantidad).join("\n")).join("\n\n") +
    "\n\nRevisar en casa\n" + DESPENSA.map(d => "- " + d.nombre).join("\n");

  const copiar = () => {
    const texto = comoTexto();
    const ok = () => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok).catch(() => {});
    } else {
      // Sin permiso de portapapeles: al menos que se pueda seleccionar.
      const a = document.createElement("textarea");
      a.value = texto; document.body.appendChild(a); a.select();
      try { document.execCommand("copy"); ok(); } catch { /* se ignora */ }
      document.body.removeChild(a);
    }
  };

  return (
    <div>
      <SectionHeader>La compra</SectionHeader>

      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ ...TYPE.body, color: C.textDim, lineHeight: 1.5 }}>
          Sale de tu menú: <strong style={{ color: C.text }}>{lista.cuenta.comer} días de comer
          y {lista.cuenta.recortar} de recortar</strong>. Las cantidades van redondeadas hacia arriba
          y con un 10% de margen — quedarse corto un jueves cuesta más que el gramo de más.
        </div>
        <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: CAT.nutricion, marginTop: SP.sm }}>
          {hechos} de {total} en el carro
        </div>
      </div>

      {lista.secciones.map(seccion => (
        <div key={seccion.id} style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
          <div style={{ ...TYPE.sectionLabel, color: C.textDim, marginBottom: 6 }}>{seccion.nombre}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {seccion.items.map(item => {
              const marcadoItem = esta(item.id);
              const verAlt = abierto === item.id;
              return (
                <div key={item.id} style={{
                  background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg,
                  opacity: marcadoItem ? 0.55 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SP.sm, padding: "10px 13px" }}>
                    <button className="btn" onClick={() => marcarCompra(claveCompra(inicioSemana, item.id))}
                      aria-label={marcadoItem ? "Quitar del carro" : "Al carro"}
                      style={{ display: "flex", alignItems: "center", gap: SP.sm, flex: 1, minWidth: 0,
                               background: "transparent", border: "none", textAlign: "left", minHeight: TAP_MIN - 20 }}>
                      <Tacha marcado={marcadoItem} />
                      <span style={{ ...TYPE.body, color: C.text, flex: 1, minWidth: 0,
                                     textDecoration: marcadoItem ? "line-through" : "none" }}>{item.nombre}</span>
                      <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: C.textDim, flexShrink: 0 }}>
                        {item.cantidad}
                      </span>
                    </button>
                    {item.alternativas.length > 0 && (
                      <button className="btn" onClick={() => setAbierto(verAlt ? null : item.id)}
                        aria-label="Si no hay"
                        style={{ background: "transparent", border: "none", color: C.textFaint,
                                 fontSize: 11, fontWeight: 800, padding: "4px 2px", flexShrink: 0 }}>
                        {verAlt ? "−" : "o…"}
                      </button>
                    )}
                  </div>
                  {verAlt && (
                    <div style={{ padding: "0 13px 10px 43px" }}>
                      <div style={{ ...TYPE.micro, color: C.textFaint, marginBottom: 4 }}>SI NO HAY, O NO TE APETECE</div>
                      {item.alternativas.map(a => (
                        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: SP.sm, padding: "2px 0" }}>
                          <span style={{ ...TYPE.body, color: C.textDim }}>{a.nombre}</span>
                          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: C.textDim }}>{a.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ─── Lo que igual hace falta y igual no ─── */}
      <div style={{ padding: "0 " + SP.xl + "px " + SP.md + "px" }}>
        <div style={{ ...TYPE.sectionLabel, color: C.textDim, marginBottom: 6 }}>Mirar en casa</div>
        <div style={{ ...TYPE.body, color: C.textFaint, marginBottom: 6, lineHeight: 1.45 }}>
          Sin cantidad a propósito: solo tú sabes si se te ha acabado la sal.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {DESPENSA.map(d => {
            const marcadoItem = esta(d.id);
            return (
              <button key={d.id} className="btn" onClick={() => marcarCompra(claveCompra(inicioSemana, d.id))}
                style={{ display: "flex", alignItems: "center", gap: SP.sm, width: "100%", textAlign: "left",
                         background: C.card, border: "1px solid " + C.cardBorder, borderRadius: R.lg,
                         padding: "10px 13px", minHeight: TAP_MIN - 8, opacity: marcadoItem ? 0.55 : 1 }}>
                <Tacha marcado={marcadoItem} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ ...TYPE.body, color: C.text, textDecoration: marcadoItem ? "line-through" : "none" }}>{d.nombre}</span>
                  {d.nota && <span style={{ ...TYPE.body, color: C.textFaint, display: "block", fontSize: 11.5 }}>{d.nota}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "0 " + SP.xl + "px " + SP.lg + "px" }}>
        <button className="btn" onClick={copiar} style={{
          width: "100%", minHeight: TAP_MIN, borderRadius: R.xl,
          background: C.card, border: "1px solid " + C.cardBorder,
          color: copiado ? CAT.nutricion : C.textDim, fontSize: 13, fontWeight: 700,
        }}>{copiado ? "Copiada" : "Copiar la lista"}</button>
      </div>
    </div>
  );
}
