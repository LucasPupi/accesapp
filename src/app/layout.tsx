import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

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
      <body className={figtree.variable}>
        {/* Enlace para saltar directo al contenido (aparece al navegar con teclado) */}
        <a href="#contenido" className="sr-only skip-link">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
