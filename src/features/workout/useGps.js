"use client";

import { useEffect, useRef, useState } from "react";
import { agregarPunto, marcarTramo, nuevoRegistro, pausar as pausarRegistro, PRECISION_MAX_M } from "@/domain/running/gps";

/**
 * El GPS del movil (Chrome lo da con watchPosition; hace falta HTTPS).
 *
 * `estado`: "apagado" | "buscando" | "ok" | "aproximada" | "denegado" | "sin-gps".
 * `precision`: la del ultimo fix (m), para ensenar "GPS listo · ±5 m".
 * `regRef.current` es el registro de siempre (para leerlo dentro de un
 * setInterval sin esperar a React); `reg` el mismo, para pintar.
 *
 * En pausa se sigue escuchando: asi, al reanudar, la señal ya esta cogida.
 * Los puntos de la pausa no cuentan.
 */
export function useGps() {
  const [estado, setEstado] = useState("apagado");
  const [precision, setPrecision] = useState(null);
  // Fixes seguidos malisimos: Android le da a Chrome la ubicacion aproximada.
  const malosRef = useRef(0);
  const [reg, setReg] = useState(nuevoRegistro);
  const regRef = useRef(reg);
  const activoRef = useRef(false);
  const watchRef = useRef(null);

  const escuchar = () => {
    if (watchRef.current != null) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) { setEstado("sin-gps"); return; }
    setEstado(e => e === "ok" ? e : "buscando");
    try {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const c = pos.coords;
          // speed: la velocidad Doppler del GPS; es lo que hace preciso el ritmo.
          const p = { lat: c.latitude, lon: c.longitude, acc: c.accuracy, speed: c.speed, t: pos.timestamp || Date.now() };
          setPrecision(c.accuracy);
          // La ubicacion aproximada de Android llega a 1-3 km; un GPS que aun
          // esta cogiendo señal baja de 200 m en segundos. 3 seguidos, sin
          // velocidad, es que Chrome no tiene la precisa.
          malosRef.current = c.accuracy >= 200 && c.speed == null ? malosRef.current + 1 : 0;
          setEstado(c.accuracy <= PRECISION_MAX_M || c.speed != null ? "ok" : malosRef.current >= 3 ? "aproximada" : "buscando");
          if (!activoRef.current) return;
          regRef.current = agregarPunto(regRef.current, p);
          setReg(regRef.current);
        },
        (err) => { setEstado(err && err.code === 1 ? "denegado" : "buscando"); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
    } catch { setEstado("sin-gps"); }
  };

  const soltar = () => {
    try { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); } catch { /* nada */ }
    watchRef.current = null;
  };

  /** Empieza o reanuda a contar. */
  const iniciar = () => { activoRef.current = true; escuchar(); };
  /** Deja de contar (sigue escuchando). */
  const pausar = () => {
    activoRef.current = false;
    regRef.current = pausarRegistro(regRef.current);
    setReg(regRef.current);
  };
  /** Marca si ahora se corre (0) o se recupera (1), para el mapa. */
  const marcar = (k) => { regRef.current = marcarTramo(regRef.current, k); };
  /** Deja de contar y suelta el GPS (bateria). */
  const parar = () => { pausar(); soltar(); setEstado("apagado"); };

  useEffect(() => () => soltar(), []);

  return { estado, precision, reg, regRef, iniciar, pausar, parar, escuchar, marcar };
}

/** La linea de estado del GPS, o null si va bien. */
export function avisoGps(estado) {
  if (estado === "buscando") return "GPS: buscando señal… (mejor al aire libre, lejos de edificios altos)";
  if (estado === "aproximada") return "Chrome tiene tu ubicación aproximada: así no hay ritmo ni mapa. Ajustes → Aplicaciones → Chrome → Permisos → Ubicación → activa «Usar ubicación precisa».";
  if (estado === "denegado") return "Sin permiso de ubicación: el tiempo va igual, pero sin ritmo ni mapa. Para darlo: toca el candado junto a la dirección → Permisos → Ubicación → Permitir.";
  if (estado === "sin-gps") return "Este navegador no da GPS: el ritmo lo apuntas tú al terminar.";
  return null;
}
