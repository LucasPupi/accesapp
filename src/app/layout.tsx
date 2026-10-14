import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accesibilidad UNM",
  description: "Juego para aprender a detectar barreras físicas, comunicacionales y actitudinales.",
};

export const viewport: Viewport = {
  themeColor: "#0f7a43",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} bg-app`}>
        {/* Enlace para saltar directo al contenido (aparece al navegar con teclado) */}
        <a href="#contenido" className="sr-only skip-link">Saltar al contenido</a>
        {/* halos decorativos de fondo */}
        <div className="accents-overlay" aria-hidden="true"></div>
        {children}
      </body>
    </html>
  );
}
