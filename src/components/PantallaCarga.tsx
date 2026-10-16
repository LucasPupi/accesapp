/**
 * Pantalla de carga: un ojo que mira a los costados y parpadea
 * ("buscando barreras") mientras se descargan las fotos del juego.
 */
export default function PantallaCarga({ cargadas, total }: { cargadas: number; total: number }) {
  const porcentaje = total ? Math.round((cargadas / total) * 100) : 0;

  return (
    <main id="contenido" className="loader">
      <div className="loader-eye" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle className="loader-ring" cx="60" cy="60" r="56" />
          <g className="loader-lid">
            <path
              className="loader-outline"
              d="M14 60s18-30 46-30 46 30 46 30-18 30-46 30S14 60 14 60Z"
            />
            <g className="loader-pupil">
              <circle cx="60" cy="60" r="14" />
              <circle className="loader-glint" cx="65" cy="55" r="4" />
            </g>
          </g>
        </svg>
      </div>

      <p className="loader-title">Preparando las fotos…</p>

      <div
        className="loader-bar"
        role="progressbar"
        aria-label="Cargando fotos"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={cargadas}
        aria-valuetext={`${cargadas} de ${total} fotos`}
      >
        <span style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="loader-count" aria-hidden="true">
        {cargadas} de {total}
      </p>
    </main>
  );
}
