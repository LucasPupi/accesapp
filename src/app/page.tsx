import Link from "next/link";
import { preguntas } from "@/data/preguntas";

// Se calculan solos: si agregás preguntas en src/data/preguntas.ts, el inicio se actualiza.
const cantidadPreguntas = preguntas.length;
const cantidadCategorias = preguntas[0]?.opciones.length ?? 3;

export default function Home() {
  return (
    <main id="contenido" className="home-wrap">
      <section className="hero-card">
        {/* Icono redondo */}
        <div className="hero-icon" aria-hidden="true">
          {/* ojo simple */}
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
          </svg>
        </div>

        {/* Título + subrayado */}
        <h1 className="hero-title">Accesibilidad UNM</h1>
        <div className="hero-underline" aria-hidden="true" />

        {/* Descripción */}
        <p className="hero-desc">
          Identificar en las imágenes las siguientes barreras
          para la accesibilidad: <strong>Barreras físicas</strong>,
          <strong> Barreras comunicacionales</strong>,
          <strong> Barreras actitudinales</strong>.
        </p>

        {/* Métricas */}
        <ul className="metrics" aria-label="Resumen de la actividad">
          <li className="metric">
            <strong>{cantidadPreguntas}</strong>
            <span>Preguntas</span>
          </li>
          <li className="metric">
            <strong>~5</strong>
            <span>Minutos</span>
          </li>
          <li className="metric">
            <strong>{cantidadCategorias}</strong>
            <span>Categorías</span>
          </li>
        </ul>

        {/* CTA */}
        <div className="cta-row">
          <Link href="/jugar" className="btn btn--start">
            {/* icono rectángulo con “play” */}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="2.5" y="5" width="19" height="14" rx="3" fill="currentColor" opacity=".25"/>
              <path d="M10 9l5 3-5 3V9Z" fill="currentColor"/>
            </svg>
            INICIAR
          </Link>
        </div>
      </section>
    </main>
  );
}
