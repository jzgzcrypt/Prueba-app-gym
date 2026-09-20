import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema 7K",
  description: "Sistema personal de entrenamiento, salud y habilidades",
  applicationName: "Sistema 7K",
  // iOS no lee el manifiesto: necesita estas dos por separado para abrir a
  // pantalla completa y usar su propio icono al anadirla a la pantalla de inicio.
  appleWebApp: { capable: true, title: "7K", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // La app se usa con el movil en la mano y con guantes de gimnasio: que un
  // doble toque no haga zoom evita tocar donde no es.
  userScalable: false,
  viewportFit: "cover",
  // La app es de uso diario en movil: la barra del navegador acompana al fondo.
  themeColor: "#FAFAF9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
