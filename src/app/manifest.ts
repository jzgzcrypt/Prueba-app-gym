import type { MetadataRoute } from "next";

/**
 * Manifiesto de app instalable. Con esto, "Anadir a pantalla de inicio" en el
 * movil deja un icono propio y la app abre a pantalla completa, sin barra de
 * navegador: se usa como una app, no como una pagina.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sistema 7K",
    short_name: "7K",
    description: "Entrenamiento, salud y habilidades",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF9",
    theme_color: "#FAFAF9",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
