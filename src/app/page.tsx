import Link from "next/link";
import Image from "next/image";
import { preguntas } from "@/data/preguntas";

// Se calculan solos: si agregás preguntas en src/data/preguntas.ts, el inicio se actualiza.
const cantidadPreguntas = preguntas.length;
const cantidadCategorias = preguntas[0]?.opciones.length ?? 3;

export default function Home() {
  return (
    <main id="contenido" className="home-wrap">
      <section className="hero-card">
        {/* Foto de portada (decorativa) */}
        <div className="hero-photo">
          <Image
            src="/fotos/ciego_exterior.webp"
            alt=""
            width={740}
            height={493}
            sizes="(max-width: 680px) 100vw, 640px"
            priority
          />
        </div>

        <div className="hero-body">
          {/* Icono redondo */}
          <div className="hero-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <h1 className="hero-title">Accesibilidad UNM</h1>
          <div className="hero-underline" aria-hidden="true" />

          <p className="hero-desc">
            Identificá en las imágenes las barreras para la accesibilidad:{" "}
            <strong>físicas</strong>, <strong>comunicacionales</strong> y{" "}
            <strong>actitudinales</strong>. Después de responder, vas a leer por qué.
          </p>

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

          <Link href="/jugar" className="btn-primary btn-start">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" />
            </svg>
            Iniciar
          </Link>
        </div>
      </section>
    </main>
  );
}
