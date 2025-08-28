import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";


const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Juego de accesibilidad",
  description: "creado por Lucas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      {/* usamos solo nuestras clases de CSS puro */}
      <body className={`${geistSans.variable} ${geistMono.variable} bg-app`}>
        {/* overlay con halos (CSS puro) */}
        <div className="accents-overlay"></div>

        {/* skip link básico (si querés, después lo estilizamos) */}
        <a href="#contenido" className="sr-only">Saltar al contenido</a>

        {children}
      </body>
    </html>
  );
}
