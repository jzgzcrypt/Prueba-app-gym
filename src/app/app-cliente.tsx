"use client";

import dynamic from "next/dynamic";

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
  return <App />;
}
