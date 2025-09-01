"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { preguntas } from "@/data/preguntas";

/* Helpers */
function formatTime(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function JugarPage() {
  // Orden aleatorio de preguntas
  const [order, setOrder] = useState<number[]>(
    () => shuffle([...Array(preguntas.length).keys()])
  );
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const qIndex = order[idx];
  const q = preguntas[qIndex];

  // Estados por pregunta
  const [timeLeft, setTimeLeft] = useState(q.tiempo);
  const [paused, setPaused] = useState(false);
  const [limitDisabled, setLimitDisabled] = useState(false);
  const [selection, setSelection] = useState<number[]>([]);  // 👈 múltiple
  const [timedOut, setTimedOut] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLDivElement>(null);

  const multi = q.correctas.length > 1;

  // Opciones barajadas (manteniendo índice real)
  const opcionesShuf = useMemo(() => {
    const base = q.opciones.map((texto, i) => ({ texto, i }));
    return shuffle([...base]);
  }, [q]);

  const progress = showResults ? 100 : Math.round(((idx + 1) / preguntas.length) * 100);

  // Tipo de feedback para colorear la cajita
  const feedbackType =
    timedOut ? "time" :
    feedback.startsWith("✅") ? "ok" :
    feedback.startsWith("❌") ? "bad" : "";

  // Reiniciar estado cada vez que cambia la pregunta
  useEffect(() => {
    setTimeLeft(q.tiempo);
    setPaused(false);
    setLimitDisabled(false);
    setSelection([]);
    setTimedOut(false);
    setCanNext(false);
    setFeedback("");
  }, [idx, q.tiempo]);

  /* Declarar handleTimeout ANTES del useEffect que lo usa */
  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    setPaused(true);
    setCanNext(true);
    const correctTexts = q.correctas.map(i => q.opciones[i]).join(", ");
    setFeedback(`⏳ Tiempo agotado. Correctas: ${correctTexts}. ${q.explicacion}`);
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }, [q]);

  // Timer
  useEffect(() => {
    if (limitDisabled || paused || timedOut || showResults) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [limitDisabled, paused, timedOut, showResults, timeLeft, handleTimeout]);

  // Toggle selección múltiple
  function toggleSelect(i: number) {
    setSelection(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

  /* Handlers */
  function handleConfirm() {
    if (selection.length === 0) {
      setFeedback("Elegí al menos una opción antes de confirmar.");
      return;
    }
    const selectedSet = new Set(selection);
    const correctSet = new Set(q.correctas);

    const ok =
      selectedSet.size === correctSet.size &&
      [...correctSet].every(i => selectedSet.has(i));

    if (ok) setScore(s => s + 1);

    const correctTexts = q.correctas.map(i => q.opciones[i]).join(", ");
    const chosenTexts = selection.map(i => q.opciones[i]).join(", ");

    setFeedback(
      ok
        ? `✅ Correcto. ${q.explicacion}`
        : `❌ Incorrecto. Correctas: ${correctTexts}. Vos marcaste: ${chosenTexts}. ${q.explicacion}`
    );

    setCanNext(true);
    setPaused(true);
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function handleNext() {
    if (idx < preguntas.length - 1) setIdx(i => i + 1);
    else setShowResults(true);
  }

  function handleRestart() {
    const newOrder = shuffle([...Array(preguntas.length).keys()]);
    setOrder(newOrder);
    setIdx(0); setScore(0); setShowResults(false);
    const first = preguntas[newOrder[0]];
    setTimeLeft(first.tiempo); setPaused(false); setLimitDisabled(false);
    setSelection([]); setTimedOut(false); setCanNext(false); setFeedback("");
  }

  /* Resultados */
  if (showResults) {
    return (
      <main id="contenido" className="page-main fade-in">
        <div className="container-card lift">
          <h1 className="game-title">Resultados</h1>
          <p className="game-subtitle mt-2">
            Puntaje: <strong>{score}</strong> / {preguntas.length}
          </p>

          {/* Progreso 100% */}
          <div className="progress">
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Progreso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={100}
            >
              <div className="progress-bar" style={{ width: `100%` }} />
            </div>
            <p className="progress-label mt-2">100%</p>
          </div>

          <div className="row mt-6">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleRestart}>
              Reiniciar
            </button>
            <Link href="/" className="btn btn-outline btn-lg">Volver al inicio</Link>
          </div>
        </div>
      </main>
    );
  }

  /* Pregunta */
  return (
    <main id="contenido" className="page-main fade-in">
      <div className="container-card lift">
        <Link href="/" className="link">← Volver</Link>

        <h1 className="game-title">Pregunta {idx + 1} de {preguntas.length}</h1>
        <p className="game-subtitle">
          Observá la imagen y seleccioná {multi ? "una o más opciones" : "la opción correcta"}.
        </p>

        {/* Progreso */}
        <div className="progress">
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-label mt-2">{progress}%</p>
        </div>

        {/* Temporizador */}
        <section className="mt-6">
          <div className="timer-row">
            <div className="pill">
              <span>Tiempo restante:</span>
              <span className="time-value">{formatTime(timeLeft)}</span>
            </div>

            <button type="button" className="btn btn-outline" onClick={() => setPaused(p => !p)}>
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => !limitDisabled && setTimeLeft(t => t + 60)}>
              +60 s
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setLimitDisabled(true)}>
              Desactivar límite
            </button>
          </div>
        </section>

        {/* Imagen */}
        <figure className="mt-6">
          <Image
            src={q.imagen}
            alt=""
            width={1280}
            height={720}
            className="img-modern"
            priority={idx === 0}
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <figcaption className="muted mt-2">{q.enunciado}</figcaption>
        </figure>

        {/* Opciones (checkboxes) */}
        <form className="mt-6">
          <fieldset>
            <legend className="mb-2">
              <h2 className="question-text">{q.enunciado}</h2>
            </legend>

            <div className="options-grid">
              {opcionesShuf.map((op, j) => {
                const active = selection.includes(op.i);
                return (
                  <label key={j} className={`option ${active ? "option--active pop" : ""}`}>
                    <input
                      type="checkbox"
                      name={`respuesta-${q.id}`}
                      checked={active}
                      onChange={() => toggleSelect(op.i)}
                    />
                    <span>{op.texto}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="row mt-6">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={selection.length === 0 || canNext}
              onClick={handleConfirm}
            >
              Confirmar
            </button>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              disabled={!canNext}
              onClick={handleNext}
            >
              Siguiente
            </button>
          </div>

          {feedback && (
            <div
              ref={feedbackRef}
              className={`feedback ${feedbackType ? `feedback--${feedbackType}` : ""}`}
            >
              {feedback}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
