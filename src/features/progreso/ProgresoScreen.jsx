"use client";

import { claveDia } from "@/domain/plan/calendario";
import { useState } from "react";
import { C, CAT } from "@/design/tokens";
import { QuickFieldInput, SimpleLineChart } from "@/features/ui/charts";
export function ProgresoScreen({ medidas, setMedidas, ritmoReal, weeks, checked, workoutWeights }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ peso: "", cintura: "", anchoHombro: "", cadera: "", hombro: "", cadenaPosterior: "", columna: "", caderaMov: "", foto: null });
  const [quickField, setQuickField] = useState(null); // "peso" | "cintura" | "cadera" | "hombro" | "cadenaPosterior" | "columna" | "caderaMov" | null (menu)
  const [showExport, setShowExport] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showComparativa, setShowComparativa] = useState(false);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      reducirFoto(ev.target.result)
        .then(foto => setForm(p => Object.assign({}, p, { foto })))
        .catch(() => setForm(p => Object.assign({}, p, { foto: null })));
    };
    reader.readAsDataURL(file);
  };

  const addMedida = () => {
    const tieneAlgo = form.peso || form.cintura || form.anchoHombro || form.cadera || form.hombro || form.cadenaPosterior || form.columna || form.caderaMov;
    if (!tieneAlgo) return;
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    setMedidas(prev => [...prev, {
      fecha, peso: form.peso ? parseFloat(form.peso) : null,
      cintura: form.cintura ? parseFloat(form.cintura) : null,
      anchoHombro: form.anchoHombro ? parseFloat(form.anchoHombro) : null,
      cadera: form.cadera ? parseFloat(form.cadera) : null,
      hombro: form.hombro ? parseFloat(form.hombro) : null,
      cadenaPosterior: form.cadenaPosterior ? parseFloat(form.cadenaPosterior) : null,
      columna: form.columna ? parseFloat(form.columna) : null,
      caderaMov: form.caderaMov ? parseFloat(form.caderaMov) : null,
      foto: form.foto || null,
    }]);
    setForm({ peso: "", cintura: "", anchoHombro: "", cadera: "", hombro: "", cadenaPosterior: "", columna: "", caderaMov: "", foto: null });
    setShowForm(false);
  };

  const saveQuickField = (key, value) => {
    if (!value) return;
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    setMedidas(prev => [...prev, {
      fecha, peso: null, cintura: null, cadera: null, hombro: null, cadenaPosterior: null, columna: null, caderaMov: null, foto: null,
      [key]: parseFloat(value),
    }]);
    setQuickField(null);
  };

  const pesoData = medidas.filter(m => m.peso != null).map(m => ({ fecha: m.fecha, v: m.peso }));
  const cinturaData = medidas.filter(m => m.cintura != null).map(m => ({ fecha: m.fecha, v: m.cintura }));
  const caderaData = medidas.filter(m => m.cadera != null).map(m => ({ fecha: m.fecha, v: m.cadera }));
  const hombroData = medidas.filter(m => m.hombro != null).map(m => ({ fecha: m.fecha, v: m.hombro }));
  // El ratio hombro/cintura: sube si el hombro crece o si la cintura baja, asi
  // que recoge las dos mitades de la estetica en un solo numero. Es el
  // indicador bueno cuando hay recomposicion, porque el peso apenas se mueve.
  const ratioData = medidas
    .filter(m => m.anchoHombro != null && m.cintura != null && m.cintura > 0)
    .map(m => ({ fecha: m.fecha, v: Math.round((m.anchoHombro / m.cintura) * 100) / 100 }));
  const cadenaPosteriorData = medidas.filter(m => m.cadenaPosterior != null).map(m => ({ fecha: m.fecha, v: m.cadenaPosterior }));
  const columnaData = medidas.filter(m => m.columna != null).map(m => ({ fecha: m.fecha, v: m.columna }));
  const caderaMovData = medidas.filter(m => m.caderaMov != null).map(m => ({ fecha: m.fecha, v: m.caderaMov }));
  const medidasConFoto = medidas.filter(m => m.foto);

  const ritmosData = Object.entries(ritmoReal).filter(([k,v]) => v).slice(-8);
  const diasCompletados = Object.values(checked).filter(Boolean).length;

  // Cruza workoutWeights (por dayKey) con weeks para agrupar por nombre de ejercicio
  const exerciseProgress = {}; // { nombre: [{fecha, v}] }
  weeks.forEach(wk => {
    wk.days.forEach((day, di) => {
      if (day.tipo !== "fuerza") return;
      const dayKey = claveDia(wk.days[di]);
      const dw = workoutWeights[dayKey];
      if (!dw) return;
      day.ejercicios.forEach((ej, ei) => {
        const serieWeights = dw[ei];
        if (!serieWeights) return;
        const vals = Object.values(serieWeights).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        if (vals.length === 0) return;
        const maxW = Math.max(...vals);
        if (!exerciseProgress[ej.nombre]) exerciseProgress[ej.nombre] = [];
        exerciseProgress[ej.nombre].push({ fecha: day.date, v: maxW });
      });
    });
  });
  const exerciseNames = Object.keys(exerciseProgress).filter(n => exerciseProgress[n].length > 1);

  // PR (record personal) y deteccion de estancamiento por ejercicio
  const exercisePRs = {}; // { nombre: maxWeight }
  const exerciseStagnant = {}; // { nombre: true/false } - 2+ semanas sin superar el PR previo
  Object.keys(exerciseProgress).forEach(nombre => {
    const serie = exerciseProgress[nombre];
    let pr = 0;
    serie.forEach(p => { if (p.v > pr) pr = p.v; });
    exercisePRs[nombre] = pr;
    // Estancado: las ultimas 2+ entradas no superan el maximo alcanzado antes de ellas
    if (serie.length >= 3) {
      const lastTwo = serie.slice(-2);
      const beforeThat = serie.slice(0, -2);
      const prBefore = beforeThat.length > 0 ? Math.max(...beforeThat.map(p => p.v)) : 0;
      exerciseStagnant[nombre] = lastTwo.every(p => p.v <= prBefore) && prBefore > 0;
    }
  });
  const stagnantList = Object.keys(exerciseStagnant).filter(n => exerciseStagnant[n]);

  const resumenTexto = () => {
    let txt = "PROGRAMA 7K — RESUMEN\n\n";
    txt += "Sesiones completadas: " + diasCompletados + "\n";
    if (medidas.length > 0) {
      const ultima = medidas[medidas.length - 1];
      txt += "Última medición (" + ultima.fecha + "): " + ultima.peso + "kg";
      if (ultima.cintura) txt += ", cintura " + ultima.cintura + "cm";
      if (ultima.cadera) txt += ", cadera " + ultima.cadera + "cm";
      txt += "\n";
    }
    if (ritmosData.length > 0) {
      txt += "\nÚltimos ritmos registrados:\n";
      ritmosData.forEach(([k, v]) => { txt += "- " + v + "\n"; });
    }
    return txt;
  };

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>PROGRESO</div>
      <div style={{ fontSize: 12, color: C.textDim, marginBottom: 18, fontWeight: 600 }}>Datos objetivos. Sin rachas, sin porcentajes.</div>

      <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
        {ratioData.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <SimpleLineChart data={ratioData} label="Hombro ÷ cintura — tu estética en un número" unit="" color={CAT.fuerza} />
            <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 6, lineHeight: 1.4 }}>
              Sube por los dos lados a la vez: hombro más ancho o cintura más estrecha.
              Es mejor indicador que el peso, que con recomposición engaña.
            </div>
          </div>
        )}

        <SimpleLineChart data={pesoData} label="Peso" unit="kg" color={C.accent} onAddData={() => { setQuickField("peso"); setShowForm(false); }} />
      </div>

      {(cinturaData.length > 1 || caderaData.length > 1 || hombroData.length > 1) && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
          {cinturaData.length > 1 && <div style={{ marginBottom: (caderaData.length > 1 || hombroData.length > 1) ? 16 : 0 }}><SimpleLineChart data={cinturaData} label="Cintura" unit="cm" color="#3A6EA5" /></div>}
          {caderaData.length > 1 && <div style={{ marginBottom: hombroData.length > 1 ? 16 : 0 }}><SimpleLineChart data={caderaData} label="Cadera" unit="cm" color="#946800" /></div>}
          {hombroData.length > 1 && <SimpleLineChart data={hombroData} label="Hombro (test manos espalda — menos es mejor)" unit="cm" color={CAT.cuello} />}
        </div>
      )}

      {stagnantList.length > 0 && (
        <div style={{ background: "#FBF0EF", border: "1px solid #E8C9C6", borderRadius: 14, padding: "13px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "#171717" }}>Estancamiento detectado</div>
          <div style={{ fontSize: 11.5, color: "#787774", marginTop: 3, lineHeight: 1.4 }}>
            {stagnantList.length === 1
              ? stagnantList[0] + " lleva 2+ registros sin superar tu peso máximo previo."
              : stagnantList.length + " ejercicios llevan 2+ registros sin superar el peso máximo previo: " + stagnantList.join(", ") + "."}
          </div>
        </div>
      )}

      {exerciseNames.length > 0 && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderLeft: "3px solid " + CAT.fuerza, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 10 }}>Progresión de carga</div>
          {!selectedExercise ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {exerciseNames.map(name => {
                const isStagnant = exerciseStagnant[name];
                return (
                  <button key={name} className="btn" onClick={() => setSelectedExercise(name)} style={{
                    textAlign: "left", padding: "10px 12px", background: "#F2F2F0", borderRadius: 10,
                    fontSize: 12.5, fontWeight: 600, color: C.text, display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isStagnant && <span style={{ fontSize: 11 }}>⚠</span>}
                      {name}
                    </span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span className="mono" style={{ color: CAT.fuerza, fontWeight: 800, fontSize: 13 }}>{exercisePRs[name]}kg</span>
                      <span style={{ fontSize: 9, color: "#8A8A87", fontWeight: 700 }}>PR</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedExercise(null)} style={{ fontSize: 11.5, color: "#787774", fontWeight: 700, marginBottom: 10 }}>&lsaquo; Todos los ejercicios</button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: CAT.fuerza }}>{exercisePRs[selectedExercise]}kg</span>
                <span style={{ fontSize: 11, color: "#8A8A87", fontWeight: 700 }}>récord personal</span>
              </div>
              <SimpleLineChart data={exerciseProgress[selectedExercise]} label={selectedExercise} unit="kg" color={CAT.fuerza} />
            </div>
          )}
        </div>
      )}

      <button className="btn" onClick={() => { setQuickField(quickField ? null : "menu"); setShowForm(false); }} style={{
        width: "100%", padding: "14px", borderRadius: 12, background: quickField ? "#F2F2F0" : C.accent,
        fontSize: 14, fontWeight: 800, color: quickField ? C.text : "#FAFAF9", marginBottom: 12,
      }}>{quickField ? "CANCELAR" : "+ ANOTAR UN DATO"}</button>

      {quickField === "menu" && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10, textAlign: "center" }}>¿Qué vas a anotar hoy?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["peso", "Peso", "kg", "#171717"],
              ["cintura", "Cintura", "cm", "#3A6EA5"],
              ["anchoHombro", "Ancho de hombro", "cm", CAT.fuerza],
              ["cadera", "Cadera", "cm", "#946800"],
              ["hombro", "Mov. Hombro", "cm", CAT.cuello],
              ["cadenaPosterior", "Mov. Tocar suelo", "cm", "#3A6EA5"],
              ["columna", "Mov. Puente", "nivel 1-3", "#6B4C8A"],
              ["caderaMov", "Mov. ATG/Cossack", "nivel 1-3", CAT.movilidad],
            ].map(([key, label, unit, color]) => (
              <button key={key} className="btn" onClick={() => setQuickField(key)} style={{
                padding: "18px 12px", borderRadius: 14, background: C.card, border: "1px solid " + C.cardBorder,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#171717" }}>{label}</div>
                <div style={{ fontSize: 11, color: "#8A8A87", marginTop: 2 }}>{unit}</div>
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => setShowForm(true)} style={{
            width: "100%", marginTop: 10, padding: "10px", fontSize: 11.5, fontWeight: 700, color: "#8A8A87",
          }}>Prefiero anotar varios datos a la vez →</button>
        </div>
      )}

      {quickField && quickField !== "menu" && (
        <QuickFieldInput fieldKey={quickField} onSave={saveQuickField} onBack={() => setQuickField("menu")} />
      )}

      {showForm && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
          <button className="btn" onClick={() => setShowForm(false)} style={{ fontSize: 11.5, color: "#787774", fontWeight: 700, marginBottom: 10 }}>&lsaquo; Volver a anotar solo un dato</button>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[["peso","Peso (kg) — opcional"],["cintura","Cintura (cm) — opcional"],["anchoHombro","Ancho de hombro (cm) — opcional"],["cadera","Cadera (cm) — opcional"],["hombro","Hombro — test manos espalda (cm) — opcional"]].map(([key,label]) => (
              <div key={key}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#787774", marginBottom: 3 }}>{label}</div>
                <input value={form[key]} onChange={e => setForm(p => Object.assign({}, p, { [key]: e.target.value }))}
                  type="number" inputMode="decimal" style={{
                    width: "100%", fontSize: 14, padding: "10px 12px", borderRadius: 10,
                    background: "#F2F2F0", border: "1px solid #D4D4D1", color: "#171717", outline: "none",
                  }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#787774", marginBottom: 3 }}>Foto de progreso — opcional</div>
              {form.foto ? (
                <div style={{ position: "relative" }}>
                  <img src={form.foto} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 10 }} />
                  <button onClick={() => setForm(p => Object.assign({}, p, { foto: null }))} style={{
                    position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff",
                    borderRadius: 6, fontSize: 11, fontWeight: 700, padding: "4px 8px",
                  }}>QUITAR</button>
                </div>
              ) : (
                <label style={{
                  display: "block", textAlign: "center", padding: "16px", borderRadius: 10,
                  background: "#F2F2F0", border: "1px dashed #D4D4D1", fontSize: 12.5, color: "#787774", fontWeight: 600, cursor: "pointer",
                }}>
                  Toca para subir una foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                </label>
              )}
            </div>
            <button className="btn" onClick={addMedida} style={{
              marginTop: 4, padding: "12px", borderRadius: 10, background: C.accent, color: "#FAFAF9", fontWeight: 800, fontSize: 13,
            }}>GUARDAR MEDICIÓN</button>
          </div>
        </div>
      )}

      {medidasConFoto.length >= 2 && (
        <button className="btn" onClick={() => setShowComparativa(!showComparativa)} style={{
          width: "100%", padding: "12px", borderRadius: 12, background: showComparativa ? C.accent : "#F2F2F0",
          fontSize: 13, fontWeight: 800, color: showComparativa ? "#FAFAF9" : C.text, marginBottom: 12,
        }}>{showComparativa ? "OCULTAR COMPARATIVA" : "VER ANTES / DESPUÉS"}</button>
      )}

      {showComparativa && medidasConFoto.length >= 2 && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[medidasConFoto[0], medidasConFoto[medidasConFoto.length-1]].map((m, i) => (
              <div key={i} style={{ flex: 1 }}>
                <img src={m.foto} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginTop: 6, textAlign: "center" }}>{i === 0 ? "ANTES" : "AHORA"} · {m.fecha}</div>
                <div className="mono" style={{ fontSize: 12, color: "#787774", textAlign: "center", marginTop: 2 }}>{m.peso}kg</div>
              </div>
            ))}
          </div>
          {medidasConFoto.length > 2 && (
            <div style={{ fontSize: 10.5, color: "#8A8A87", marginTop: 10, textAlign: "center" }}>{medidasConFoto.length} fotos totales registradas</div>
          )}
        </div>
      )}

      {ritmosData.length > 0 && (
        <div style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 8 }}>Últimos ritmos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {ritmosData.map(([k, v], i) => (
              <div key={i} style={{ fontSize: 13, color: "#4A4A47", fontWeight: 600 }}>{v}</div>
            ))}
          </div>
        </div>
      )}

      <button className="btn" onClick={() => setShowExport(!showExport)} style={{
        width: "100%", padding: "12px", borderRadius: 12, background: "#F2F2F0",
        fontSize: 13, fontWeight: 800, color: C.text,
      }}>{showExport ? "OCULTAR RESUMEN" : "EXPORTAR RESUMEN"}</button>

      {showExport && (
        <div style={{ marginTop: 12, background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px" }}>
          <pre style={{ fontSize: 12, color: "#4A4A47", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>{resumenTexto()}</pre>
          <div style={{ fontSize: 11, color: "#8A8A87", marginTop: 8 }}>Copia este texto y pégalo en el chat para que Claude lo revise.</div>
        </div>
      )}
    </div>
  );
}

/**
 * Deja la foto en ~800 px de alto y JPEG al 70%: unos 60-120 KB.
 *
 * Todo lo guardado va en un solo bloque de localStorage, que admite unos 5 MB.
 * Una foto del movil tal cual son 3-7 MB en base64: con la primera, el bloque
 * no cabia y dejaba de guardarse TODO lo demas. Para comparar el cuerpo cada
 * dos semanas sobra con esta resolucion.
 */
const FOTO_ALTO_MAX = 800;
function reducirFoto(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, FOTO_ALTO_MAX / img.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("sin canvas")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
