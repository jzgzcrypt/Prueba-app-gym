import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fuente", display: "swap" });

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
  themeColor: "#F2F2F7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
