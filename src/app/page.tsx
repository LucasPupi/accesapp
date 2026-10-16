import Link from "next/link";
import EscenaBarreras from "@/components/EscenaBarreras";

export default function Home() {
  return (
    <main id="contenido" className="home-wrap">
      <section className="hero-card">
        {/* Lupa que recorre una escena y marca las barreras */}
        <EscenaBarreras />

        <div className="hero-body">
          <h1 className="hero-title">Accesibilidad UNM</h1>
          <div className="hero-underline" aria-hidden="true" />

          <p className="hero-desc">
            Identificá en las imágenes las barreras para la accesibilidad:{" "}
            <strong>físicas</strong>, <strong>comunicacionales</strong> y{" "}
            <strong>actitudinales</strong>. Después de responder, vas a leer por qué.
          </p>

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
