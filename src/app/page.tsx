import Link from "next/link";

export default function Home() {
  return (
    <main id="contenido">
      <div className="hero-wrap">
        <section className="hero-card fade-in center">
          <h1 className="hero-title">Accesibilidad UNM</h1>
          <p className="tagline">
            Identificar en las imágenes las siguientes barreras para la accesibilidad: 
            Barreras físicas, Barreras comunicacionales, Barreras actitudinales.
          </p>

          <div className="cta-row">
            <Link href="/jugar" className="btn btn-primary btn-lg btn-shine">
              INICIAR
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
