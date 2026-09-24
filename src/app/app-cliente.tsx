"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

/**
 * La app se pinta solo en el navegador.
 *
 * Todo en ella depende de la fecha de hoy (que dia toca, cuanto falta), y la
 * pagina se genera una sola vez, al desplegar. Si se generaba en el servidor,
 * cualquier dia distinto al del despliegue llegaba con el dia equivocado y
 * React tenia que tirarla y repintarla (error #418), con un parpadeo del dia
 * que no era. Sin servidor no hay nada que desencajar.
 */
const App = dynamic(() => import("@/features/App"), {
  ssr: false,
  loading: () => <div style={{ minHeight: "100vh", background: "#FAFAF9" }} />,
});

export default function AppCliente() {
  // Guarda la app en el movil para que abra sin cobertura (ver public/sw.js).
  // Solo en produccion: en desarrollo cachearia codigo a medio escribir.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        const urls = performance.getEntriesByType("resource").map((r) => r.name);
        reg.active?.postMessage({ tipo: "guardar", urls });
      })
      .catch(() => { /* sin SW: la app sigue igual, pero necesita red */ });
  }, []);
  return <App />;
}
