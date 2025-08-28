import Link from "next/link";

export default function Home() {
  return (
    <main id="contenido">
      <div className="hero-wrap">
        <section className="hero-card fade-in center">
          <h1 className="hero-title">Aplicación Accesible</h1>
          <p className="tagline">
            Juego para aprender a detectar barreras de accesibilidad en fotos.
          </p>

          <div className="cta-row">
            <Link href="/jugar" className="btn btn-primary btn-lg btn-shine">
              Jugar
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
