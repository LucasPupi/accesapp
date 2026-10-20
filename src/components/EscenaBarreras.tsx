"use client";

import { useState } from "react";

/**
 * Ilustración animada de la portada.
 * Una lupa recorre una escena y va marcando las tres barreras, igual que en el juego:
 *  1. Física: una entrada con escalones y una persona en silla de ruedas abajo.
 *  2. Comunicacional: un cartel con letra chiquita y amontonada.
 *  3. Actitudinal: dos personas charlando que ignoran a una persona con bastón blanco.
 *
 * - Animación completa: la lupa recorre la escena en un ciclo de 10 s que se repite.
 *   Tiene un botón para pausarla (las pautas WCAG piden poder detener lo que se mueve solo).
 * - Con "reducir movimiento" activado en el sistema: la lupa no aparece y las tres
 *   etiquetas se muestran de a una con un fundido suave, una sola vez.
 * Los tiempos están en globals.css (buscá "escena").
 */

/** Persona dibujada como pictograma: cabeza, cuerpo y piernas. `x` es el centro. */
function Persona({ x, color = "var(--ink)" }: { x: number; color?: string }) {
  return (
    <g transform={`translate(${x} 136)`} fill={color}>
      <circle cx="0" cy="0" r="8" />
      <rect x="-9" y="12" width="18" height="30" rx="8" />
      <rect x="-8" y="38" width="7" height="26" rx="3" />
      <rect x="1" y="38" width="7" height="26" rx="3" />
    </g>
  );
}

/** Etiqueta verde que aparece cuando la lupa encuentra la barrera. */
function Etiqueta({ x, y, w, texto, n }: { x: number; y: number; w: number; texto: string; n: number }) {
  return (
    <g className={`escena-chip escena-chip--${n}`}>
      <rect x={x - w / 2} y={y} width={w} height="32" rx="16" fill="var(--green)" />
      <text x={x} y={y + 22} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="700">
        {texto}
      </text>
    </g>
  );
}

export default function EscenaBarreras() {
  const [pausada, setPausada] = useState(false);

  return (
    <div className={`escena ${pausada ? "escena--pausada" : ""}`}>
      <svg
        viewBox="0 0 560 240"
        role="img"
        aria-label="Ilustración: una lupa recorre una escena y marca una barrera física (escalones en una entrada), una comunicacional (un cartel ilegible) y una actitudinal (personas que ignoran a alguien con bastón blanco)."
      >
        {/* Cielo y suelo */}
        <rect width="560" height="240" fill="#eaf3ed" />
        <rect y="200" width="560" height="40" fill="#d3e3d8" />

        {/* 1 · Barrera física: edificio con escalones */}
        <g className="escena-zona escena-zona--1">
          <rect x="72" y="52" width="136" height="148" rx="4" fill="#fff" stroke="#c9d6cd" strokeWidth="2" />
          <rect x="88" y="70" width="28" height="24" rx="3" fill="#dbe8df" />
          <rect x="164" y="70" width="28" height="24" rx="3" fill="#dbe8df" />
          <rect x="120" y="116" width="40" height="54" rx="3" fill="var(--green-tint)" stroke="var(--green)" strokeWidth="2" />
          <rect x="108" y="170" width="64" height="10" fill="#b9c7bd" />
          <rect x="100" y="180" width="80" height="10" fill="#a9b9ae" />
          <rect x="92" y="190" width="96" height="10" fill="#99ab9f" />
        </g>
        {/* Persona en silla de ruedas, al pie de la escalera */}
        <g fill="var(--ink)">
          <circle cx="44" cy="146" r="8" />
          <rect x="36" y="157" width="16" height="24" rx="7" />
          <rect x="44" y="174" width="22" height="7" rx="3" />
          <rect x="60" y="176" width="7" height="20" rx="3" />
          <circle cx="44" cy="186" r="13" fill="none" stroke="var(--ink)" strokeWidth="4" />
        </g>

        {/* 2 · Barrera comunicacional: cartel con letra chiquita */}
        <g className="escena-zona escena-zona--2">
          <rect x="278" y="128" width="6" height="72" fill="#99ab9f" />
          <rect x="236" y="72" width="90" height="60" rx="6" fill="#fff" stroke="#c9d6cd" strokeWidth="2" />
          <g fill="#b5c2b9">
            <rect x="246" y="82" width="70" height="3" rx="1.5" />
            <rect x="246" y="89" width="62" height="3" rx="1.5" />
            <rect x="246" y="96" width="70" height="3" rx="1.5" />
            <rect x="246" y="103" width="54" height="3" rx="1.5" />
            <rect x="246" y="110" width="68" height="3" rx="1.5" />
            <rect x="246" y="117" width="44" height="3" rx="1.5" />
          </g>
        </g>

        {/* Árbol de adorno */}
        <rect x="350" y="160" width="6" height="40" fill="#99ab9f" />
        <circle cx="353" cy="148" r="20" fill="#b9d4c2" />

        {/* 3 · Barrera actitudinal: dos personas charlan e ignoran a quien usa bastón */}
        <g className="escena-zona escena-zona--3">
          <Persona x={410} color="#3c4840" />
          {/* bastón blanco con punta roja */}
          <line x1="419" y1="172" x2="432" y2="200" stroke="#56625a" strokeWidth="5" strokeLinecap="round" />
          <line x1="419" y1="172" x2="432" y2="200" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="432" cy="199" r="2.5" fill="var(--red)" />
          <Persona x={482} />
          <Persona x={518} />
          {/* globo de diálogo entre las dos */}
          <g>
            <rect x="476" y="96" width="48" height="26" rx="13" fill="#fff" stroke="#c9d6cd" strokeWidth="2" />
            <path d="M494 121l4 9 6-9" fill="#fff" stroke="#c9d6cd" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="490" cy="109" r="2.5" fill="#99ab9f" />
            <circle cx="500" cy="109" r="2.5" fill="#99ab9f" />
            <circle cx="510" cy="109" r="2.5" fill="#99ab9f" />
          </g>
        </g>

        {/* Etiquetas que aparecen al "encontrar" cada barrera */}
        <Etiqueta x={140} y={12} w={96} texto="Física" n={1} />
        <Etiqueta x={281} y={30} w={170} texto="Comunicacional" n={2} />
        <Etiqueta x={466} y={56} w={130} texto="Actitudinal" n={3} />

        {/* La lupa */}
        <g className="escena-lupa">
          <line x1="26" y1="26" x2="52" y2="52" stroke="var(--ink)" strokeWidth="9" strokeLinecap="round" />
          <circle r="34" fill="rgba(255,255,255,.35)" stroke="var(--ink)" strokeWidth="6" />
          <circle r="34" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity=".7" transform="scale(.82)" />
        </g>
      </svg>

      <button
        type="button"
        className="escena-pausa"
        onClick={() => setPausada((p) => !p)}
        aria-pressed={pausada}
      >
        {pausada ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        )}
        <span className="sr-only">{pausada ? "Reanudar animación" : "Pausar animación"}</span>
      </button>
    </div>
  );
}
