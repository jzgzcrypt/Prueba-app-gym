"use client";

import { FECHA_FIN, FECHA_INICIO, FLAT_DAYS, claveDia, todayLocalIso } from "@/domain/plan/calendario";
import { useEffect, useRef, useState } from "react";
import { lecturaPrueba } from "@/domain/progreso/libreta";
import { parteDelCoach } from "@/domain/progreso/parte";
import { mesesDelBloque, nombreMes } from "@/domain/progreso/informe";
import { GraficoPlan } from "@/features/ui/plan-vs-real";
import { MapaRuta } from "@/features/ui/MapaRuta";
import { textoTiempo } from "@/domain/running/gps";
import { tendenciaPeso } from "@/domain/nutricion/adaptativo";
import { tablaRecords } from "@/domain/fuerza/registro";
import { A, C, CARD, CAT } from "@/design/tokens";
import { ScreenHeader } from "@/features/ui/headers";
import { Boton, Chevron, Fila, Icono, IconoCaja, Pastilla, Tarjeta } from "@/features/ui/aire";
import { QuickFieldInput, SimpleLineChart } from "@/features/ui/charts";
export function ProgresoScreen({ medidas, setMedidas, ritmoReal, weeks, checked, workoutWeights, workoutReps, onVerInforme, cuelloChecks, painLog, gps, pesosDiarios }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ peso: "", cintura: "", anchoHombro: "", cadera: "", hombro: "", cadenaPosterior: "", columna: "", caderaMov: "", foto: null });
  const [quickField, setQuickField] = useState(null); // "peso" | "cintura" | "cadera" | "hombro" | "cadenaPosterior" | "columna" | "caderaMov" | null (menu)
  const [showExport, setShowExport] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const formRef = useRef(null);
  useEffect(() => {
    if (showForm && formRef.current) formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [showForm]);
  const [showComparativa, setShowComparativa] = useState(false);
  // Que seccion del detalle esta abierta. Se recuerda en este movil.
  const [abierta, setAbiertaEstado] = useState(null);
  useEffect(() => { try { setAbiertaEstado(window.localStorage.getItem("programa7k:progreso") || null); } catch { /* sin storage */ } }, []);
  const setAbierta = (s) => { setAbiertaEstado(s); try { window.localStorage.setItem("programa7k:progreso", s || ""); } catch { /* sin storage */ } };
  const abrir = (s) => {
    setAbierta(s);
    setTimeout(() => { const el = document.getElementById("detalle-" + s); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  };
  const hoyIso = todayLocalIso();
  const semanaActual = weeks.find(w => w.days[0].isoDate <= hoyIso && w.days[w.days.length - 1].isoDate >= hoyIso);
  const parte = parteDelCoach({ dias: FLAT_DAYS, semanas: weeks, checked, cuelloChecks, painLog, ritmoReal,
    pesos: workoutWeights, reps: workoutReps, medidas, fechaInicio: FECHA_INICIO, hoyIso: todayLocalIso() });

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
    // La foto sola tambien vale: es la medicion que mas dice de la estetica.
    const tieneAlgo = form.peso || form.cintura || form.anchoHombro || form.cadera || form.hombro || form.cadenaPosterior || form.columna || form.caderaMov || form.foto;
    if (!tieneAlgo) return;
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    setMedidas(prev => [...prev, {
      // iso: la fecha completa, para el informe mensual. "fecha" se queda para
      // que lo guardado antes se siga leyendo igual.
      fecha, iso: todayLocalIso(), peso: form.peso ? parseFloat(form.peso) : null,
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
      fecha, iso: todayLocalIso(), peso: null, cintura: null, cadera: null, hombro: null, cadenaPosterior: null, columna: null, caderaMov: null, foto: null,
      [key]: parseFloat(value),
    }]);
    setQuickField(null);
  };

  // El peso: cada pesaje (medidas y el de cada mañana) y su tendencia, que es
  // la que cuenta (el de un dia lleva agua). Ultimas 8 semanas.
  const pesoData = (() => {
    const p = {};
    for (const m of medidas) if (m && m.iso && m.peso != null) p[m.iso] = m.peso;
    Object.assign(p, pesosDiarios || {});
    const t = tendenciaPeso(p, todayLocalIso()).slice(-56);
    if (t.length < 2) return medidas.filter(m => m.peso != null).map(m => ({ fecha: m.fecha, v: m.peso }));
    return t.map(x => ({ fecha: x.iso.slice(8) + "/" + x.iso.slice(5, 7), v: x.peso, t: x.tendencia }));
  })();
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
    <div style={{ padding: "16px 16px 28px" }}>
      <ScreenHeader title="Progreso" subtitle={semanaActual ? "Semana " + semanaActual.n + " de " + weeks.length : ""} />

      <TuObjetivo veredicto={parte.veredicto} />
      <ProximaPrueba ritmoReal={ritmoReal} />
      <TuPeso datos={pesoData} onApuntar={() => { setShowForm(false); setQuickField("peso"); }} />
      <Constancia c={parte.constancia} />
      <Objetivos parte={parte} onAbrir={abrir} />

      <div style={{ display: "flex", gap: 8, margin: "14px 0 12px" }}>
        <Boton tipo={showForm ? "suave" : "oscuro"} onClick={() => { setQuickField(null); setShowForm(!showForm); }} style={{ flex: 1, fontSize: 15 }}>
          {showForm ? "Cancelar" : "Medir: cintura, hombro y foto"}
        </Boton>
        <Boton tipo="suave" onClick={() => { setShowForm(false); setQuickField(quickField ? null : "menu"); }} style={{ width: "auto", fontSize: 15 }}>
          {quickField ? "Cerrar" : "1 dato"}
        </Boton>
      </div>

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
        <div ref={formRef} style={{ background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
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

      <div style={{ fontSize: 19, fontWeight: 700, color: C.text, margin: "20px 4px 8px" }}>Detalle</div>

      <Seccion id="running" titulo="Running" resumen={parte.objetivos[0].valor ? parte.objetivos[0].tendencia : "sin pruebas aún"} abierta={abierta} setAbierta={setAbierta}>
        <GraficoPlan ritmoReal={ritmoReal} />
        <PruebasCompactas ritmoReal={ritmoReal} />
        <TusSalidas gps={gps} />
      </Seccion>

      <Seccion id="cuerpo" titulo="Cuerpo" resumen={parte.objetivos[1].valor || "sin medidas"} abierta={abierta} setAbierta={setAbierta}>
      <div>
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
        <div style={{ marginTop: 16 }}>
          {cinturaData.length > 1 && <div style={{ marginBottom: (caderaData.length > 1 || hombroData.length > 1) ? 16 : 0 }}><SimpleLineChart data={cinturaData} label="Cintura" unit="cm" color="#3A6EA5" /></div>}
          {caderaData.length > 1 && <div style={{ marginBottom: hombroData.length > 1 ? 16 : 0 }}><SimpleLineChart data={caderaData} label="Cadera" unit="cm" color="#946800" /></div>}
          {hombroData.length > 1 && <SimpleLineChart data={hombroData} label="Hombro (test manos espalda — menos es mejor)" unit="cm" color={CAT.cuello} />}
        </div>
      )}
      {medidasConFoto.length >= 2 && (
        <button className="btn" onClick={() => setShowComparativa(!showComparativa)} style={{
          width: "100%", padding: "12px", borderRadius: 12, background: showComparativa ? C.accent : "#F2F2F0",
          fontSize: 13, fontWeight: 800, color: showComparativa ? "#FAFAF9" : C.text, marginTop: 14,
        }}>{showComparativa ? "OCULTAR COMPARATIVA" : "VER ANTES / DESPUÉS"}</button>
      )}

      {showComparativa && medidasConFoto.length >= 2 && (
        <div style={{ marginTop: 12 }}>
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
      </Seccion>

      <Seccion id="fuerza" titulo="Fuerza" resumen={parte.objetivos[2].valor ? parte.objetivos[2].valor + " laterales" : "sin pesos aún"} abierta={abierta} setAbierta={setAbierta}>
        <Records pesos={workoutWeights} reps={workoutReps} />
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
        <div style={{ marginTop: 4 }}>
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
      </Seccion>

      <Seccion id="meses" titulo="Tus meses" resumen="informe de cada mes" abierta={abierta} setAbierta={setAbierta}>
        <TusMeses onVer={onVerInforme} />
      </Seccion>

      <div style={{ marginTop: 14 }}>
      <button className="btn" onClick={() => setShowExport(!showExport)} style={{
        width: "100%", padding: "10px", fontSize: 11.5, fontWeight: 700, color: C.textDim,
      }}>{showExport ? "Ocultar resumen" : "Resumen en texto para Claude"}</button>

      {showExport && (
        <div style={{ marginTop: 12, background: C.card, border: "1px solid " + C.cardBorder, borderRadius: 14, padding: "16px 18px" }}>
          <pre style={{ fontSize: 12, color: "#4A4A47", whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>{resumenTexto()}</pre>
          <div style={{ fontSize: 11, color: "#8A8A87", marginTop: 8 }}>Copia este texto y pégalo en el chat para que Claude lo revise.</div>
        </div>
      )}
      </div>
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

const etiqueta = { fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6, marginBottom: 8 };




/** Tus mejores marcas de cada ejercicio: peso y reps, y cuando. */
function Records({ pesos, reps }) {
  const tabla = tablaRecords(FLAT_DAYS, pesos, reps);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={etiqueta}>TUS RÉCORDS</div>
      {tabla.length === 0 && (
        <div style={{ fontSize: 13, color: "#4A4A47", lineHeight: 1.45 }}>
          Aparecen al apuntar series: cada vez que superes tu mejor peso, o tus mejores reps con ese peso, sale aquí.
        </div>
      )}
      {tabla.slice(0, 10).map(t => (
        <div key={t.nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8,
                                     padding: "8px 0", borderTop: "1px solid " + C.divider }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, flex: 1, minWidth: 0 }}>{t.nombre}</span>
          <span style={{ textAlign: "right", flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 800, color: C.text }}>
              {(t.peso != null ? t.peso + " kg" : "") + (t.reps != null ? (t.peso != null ? " × " : "× ") + t.reps : "")}
            </span>
            <span style={{ fontSize: 11, color: C.textDim, marginLeft: 6 }}>{t.fecha}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Los meses del bloque, cada uno con su informe. El en curso tambien. */
function TusMeses({ onVer }) {
  const hoy = todayLocalIso();
  const meses = mesesDelBloque(FLAT_DAYS, hoy).reverse();
  if (!meses.length || !onVer) return null;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {meses.map(m => (
          <button key={m} className="btn" onClick={() => onVer(m)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52,
            background: "#121212", borderRadius: 12, padding: "0 16px",
          }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#FAFAF9" }}>Tu {nombreMes(m)}</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: m === hoy.slice(0, 7) ? "#9A9A96" : "#5FB38A" }}>
              {m === hoy.slice(0, 7) ? "EN CURSO →" : "VER →"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const DIA = 86400000;
const aMs = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** La tarjeta oscura: el objetivo, cuanto falta y por donde vas del plan. */
function TuObjetivo({ veredicto }) {
  const hoy = todayLocalIso();
  const total = Math.round((aMs(FECHA_FIN) - aMs(FECHA_INICIO)) / DIA) + 1;
  const dia = Math.max(1, Math.min(total, Math.round((aMs(hoy) - aMs(FECHA_INICIO)) / DIA) + 1));
  const faltan = Math.max(0, Math.round((aMs(FECHA_FIN) - aMs(hoy)) / DIA));
  const meta = FLAT_DAYS.find(d => d.tipo === "objetivo");
  return (
    <div data-tu-objetivo style={{ background: "#1C1C1E", borderRadius: 22, padding: "18px 18px 16px", color: "#fff", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, opacity: 0.7 }}>
        <Icono nombre="meta" tam={16} /> Tu objetivo
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, marginTop: 4 }}>
        {meta && meta.prueba ? meta.prueba.distKm : 7} km a {meta && meta.ritmo ? textoRitmoSeg(meta.ritmo) : "4:45"}/km
      </div>
      <div style={{ fontSize: 15, opacity: 0.8, marginTop: 2 }}>
        {+FECHA_FIN.slice(8)} de {MESES[+FECHA_FIN.slice(5, 7) - 1]} · {faltan === 0 ? "¡es hoy!" : "faltan " + faltan + " días"}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600, opacity: 0.7, margin: "14px 0 6px" }}>
        <span>Día {dia} de {total}</span><span>{Math.round(dia / total * 100)} %</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.18)" }}>
        <div style={{ width: dia / total * 100 + "%", height: "100%", borderRadius: 3, background: A.verde }} />
      </div>
      {veredicto && <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 14, opacity: 0.9 }}>{veredicto.texto}</div>}
    </div>
  );
}
const textoRitmoSeg = (s) => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0");

/** La proxima prueba: que es, cuando y que tiempo va en linea con el objetivo. */
function ProximaPrueba({ ritmoReal }) {
  const hoy = todayLocalIso();
  const d = FLAT_DAYS.find(x => x.prueba && x.isoDate >= hoy && !(ritmoReal || {})[claveDia(x)]);
  if (!d) return null;
  const dias = Math.round((aMs(d.isoDate) - aMs(hoy)) / DIA);
  const que = d.prueba.partida ? "Prueba de partida" : d.tipo === "objetivo" ? "El día: 7 km" : d.prueba.distKm + " km a tope";
  const linea = d.prueba.enLinea ? "En línea con el objetivo: " + textoTiempo(d.prueba.enLinea) + " o menos."
    : d.prueba.decide ? "Esta decide la fecha del 7K." : null;
  return (
    <Tarjeta data-proxima-prueba style={{ padding: "14px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <IconoCaja nombre="correr" tono="rojo" tam={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textDim }}>Próxima prueba · {dias === 0 ? "hoy" : dias === 1 ? "mañana" : "en " + dias + " días"}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{que} · {d.dow ? d.dow.slice(0, 3).toLowerCase() : ""} {d.date}</div>
        {linea && <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>{linea}</div>}
      </div>
    </Tarjeta>
  );
}

/** El peso: los pesajes y la tendencia, que es la que cuenta. */
function TuPeso({ datos, onApuntar }) {
  const ds = (datos || []).filter(x => x && (x.v != null || x.t != null));
  const tend = ds.filter(x => x.t != null);
  const ult = tend.length ? tend[tend.length - 1].t : ds.length ? ds[ds.length - 1].v : null;
  const pri = tend.length ? tend[0].t : ds.length ? ds[0].v : null;
  const vals = ds.flatMap(x => [x.v, x.t]).filter(v => v != null);
  const W = 320, H = 90, min = Math.min(...vals) - 0.3, max = Math.max(...vals) + 0.3;
  const X = (i) => ds.length > 1 ? i / (ds.length - 1) * W : W / 2;
  const Y = (v) => H - (v - min) / (max - min || 1) * H;
  const camino = ds.map((x, i) => x.t != null ? [X(i), Y(x.t)] : null).filter(Boolean).map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const cambio = ult != null && pri != null ? Math.round((ult - pri) * 10) / 10 : null;
  return (
    <Tarjeta data-tu-peso style={{ padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.textDim }}>Peso · tendencia</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
            {ult != null ? String(Math.round(ult * 10) / 10).replace(".", ",") + " kg" : "—"}
          </div>
        </div>
        {cambio != null && ds.length > 1 && (
          <Pastilla color={cambio <= 0 ? A.verde : A.naranja}>{(cambio > 0 ? "+" : "") + String(cambio).replace(".", ",")} kg en {ds.length} días</Pastilla>
        )}
      </div>
      {vals.length > 1 ? (
        <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width="100%" height={H + 8} style={{ display: "block", marginTop: 8 }} aria-label="Peso y tendencia">
          {ds.map((x, i) => x.v != null && <circle key={i} cx={X(i)} cy={Y(x.v)} r="2.6" fill={A.azul} opacity=".35" />)}
          <path d={camino} fill="none" stroke={A.azul} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <div style={{ fontSize: 13.5, color: C.textDim, marginTop: 6 }}>Pésate cada mañana en ayunas: con unos días sale la tendencia.</div>
      )}
      <button className="btn" onClick={onApuntar} style={{ fontSize: 14, fontWeight: 600, color: A.azul, minHeight: 36, marginTop: 4 }}>Apuntar peso</button>
    </Tarjeta>
  );
}

const CELDA = {
  hecho: { background: A.verde }, falta: { background: A.fondo.naranja, border: "1.5px solid " + A.naranja },
  hoy: { background: "#fff", border: "2px solid " + A.azul }, descanso: { background: "#E5E5EA" },
  futuro: { background: "#fff", border: "1.5px solid #E5E5EA" }, "futuro-descanso": { background: "#F2F2F7" },
};

/** La constancia de las 11 semanas: una columna por semana, un cuadrado por dia. */
function Constancia({ c }) {
  return (
    <Tarjeta data-constancia style={{ padding: "14px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Constancia</span>
        <span style={{ fontSize: 13, color: C.textDim }}>
          {c.cumplidas > 0 ? c.cumplidas + (c.cumplidas === 1 ? " semana cumplida · " : " semanas cumplidas · ") : ""}{c.hechas}/{c.pasadas} sesiones
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }} aria-label="Sesiones del bloque, semana a semana">
        {c.tira.map((sem, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            {sem.map((e, j) => <span key={j} title={e} style={{ width: 16, height: 16, borderRadius: 5, boxSizing: "border-box", ...CELDA[e] }} />)}
            <span style={{ fontSize: 10.5, fontWeight: 600, color: C.textFaint, marginTop: 2 }}>{i + 1}</span>
          </div>
        ))}
      </div>
    </Tarjeta>
  );
}

const TONO_A = { bien: A.verde, ojo: A.naranja, gris: C.textFaint, neutro: C.text };
const ICONO_OBJ = { "7k": ["correr", "rojo"], panza: ["regla", "morado"], hombro: ["mancuerna", "azul"], cuello: ["cuello", "verde"] };

/** Los objetivos del bloque en filas, y las alarmas si las hay. */
function Objetivos({ parte, onAbrir }) {
  const { objetivos, alarmas } = parte;
  return (
    <>
      <Tarjeta data-objetivos style={{ padding: 0, overflow: "hidden", marginBottom: alarmas.length ? 12 : 0 }}>
        {objetivos.map((o, i) => {
          const [ic, tono] = ICONO_OBJ[o.id] || ["grafica", "gris"];
          return (
            <Fila key={o.id} primera={i === 0} icono={ic} tono={tono} titulo={o.nombre}
              sub={o.valor ? <span style={{ color: TONO_A[o.tono] }}>{o.flecha ? o.flecha + " " : ""}{o.tendencia}</span> : o.accion}
              derecha={<span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {o.valor && <span style={{ fontSize: 16, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{o.valor}</span>}
                {o.seccion && <Chevron />}
              </span>}
              onClick={o.seccion ? () => onAbrir(o.seccion) : undefined} />
          );
        })}
      </Tarjeta>
      {alarmas.length > 0 && (
        <Tarjeta data-alarmas style={{ padding: "6px 16px", background: A.fondo.naranja, boxShadow: "none" }}>
          {alarmas.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: i ? "1px solid rgba(0,0,0,.06)" : "none" }}>
              <span style={{ color: A.naranja, paddingTop: 1 }}><Icono nombre="aviso" tam={18} /></span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{a.texto}</div>
                <div style={{ fontSize: 13.5, color: C.textDim, marginTop: 2 }}>{a.accion}</div>
              </div>
            </div>
          ))}
        </Tarjeta>
      )}
    </>
  );
}

/** Una seccion del detalle: una linea plegada, se abre al tocar. */
function Seccion({ id, titulo, resumen, abierta, setAbierta, children }) {
  const open = abierta === id;
  return (
    <div id={"detalle-" + id} style={{ ...CARD, marginBottom: 10, overflow: "hidden" }}>
      <button className="btn" onClick={() => setAbierta(open ? null : id)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, minHeight: 54, padding: "0 16px", textAlign: "left",
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: C.text, flex: 1 }}>{titulo}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.textDim }}>{resumen}</span>
        <Chevron abierto={open} />
      </button>
      {open && <div style={{ padding: "4px 16px 16px" }}>{children}</div>}
    </div>
  );
}

/** Las pruebas del bloque, una linea cada una. */
function PruebasCompactas({ ritmoReal }) {
  const hoy = todayLocalIso();
  return (
    <div style={{ marginTop: 12 }}>
      {FLAT_DAYS.filter(d => d.prueba).map(d => {
        const texto = ritmoReal[claveDia(d)];
        const l = texto && d.prueba.distKm ? lecturaPrueba(d.prueba, texto) : null;
        return (
          <div key={d.isoDate} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid " + C.divider }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>S{d.weekN} · {d.prueba.partida ? "Partida" : d.tipo === "objetivo" ? "El día" : d.prueba.distKm + " km"}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: l && !l.error ? (l.tono === "bien" ? C.ok : C.amber) : texto ? C.text : C.textDim, textAlign: "right" }}>
              {texto ? texto + (l && !l.error ? " · " + (l.tono === "bien" ? "✓" : "ojo") : "") : d.isoDate === hoy ? "hoy" : d.date}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Las ultimas salidas con GPS: una fila cada una; al tocarla, su mapa. */
function TusSalidas({ gps }) {
  const [abierta, setAbierta] = useState(null);
  const salidas = Object.keys(gps || {}).filter(k => gps[k] && gps[k].ruta).sort().reverse().slice(0, 5)
    .map(k => ({ k, g: gps[k], day: FLAT_DAYS.find(d => claveDia(d) === k) })).filter(x => x.day);
  if (!salidas.length) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: C.textDim, letterSpacing: 0.6, marginBottom: 6 }}>TUS SALIDAS</div>
      {salidas.map(({ k, g, day }) => (
        <div key={k} style={{ borderTop: "1px solid " + C.cardBorder }}>
          <button className="btn" onClick={() => setAbierta(abierta === k ? null : k)} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44, textAlign: "left" }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{day.date} · {day.titulo}</span>
            <span className="mono" style={{ fontSize: 12.5, color: C.textDim, flexShrink: 0, marginLeft: 8 }}>
              {(g.m / 1000).toFixed(2).replace(".", ",")} km · {textoTiempo(g.seg)} {abierta === k ? "▾" : "›"}
            </span>
          </button>
          {abierta === k && <div style={{ paddingBottom: 12 }}><MapaRuta ruta={g.ruta} objetivo={g.obj} titulo={day.titulo} fecha={day.isoDate} datos={g} /></div>}
        </div>
      ))}
    </div>
  );
}
