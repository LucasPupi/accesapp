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
  const [selection, setSelection] = useState<number[]>([]);
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

  const feedbackType =
    timedOut ? "time" :
    feedback.startsWith("✅") ? "ok" :
    feedback.startsWith("❌") ? "bad" : "";

  // Reset por pregunta
  useEffect(() => {
    setTimeLeft(q.tiempo);
    setPaused(false);
    setLimitDisabled(false);
    setSelection([]);
    setTimedOut(false);
    setCanNext(false);
    setFeedback("");
  }, [idx, q.tiempo]);

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

  function toggleSelect(i: number) {
    setSelection(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]
    );
  }

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
      <main id="contenido" className="q-wrap">
        <section className="q-card">
          <h1 style={{fontSize:22, fontWeight:800, color:"#2a2a2a"}}>Resultados</h1>
          <p className="q-sub">Puntaje: <strong style={{color:"#111827"}}>{score}</strong> / {preguntas.length}</p>

          {/* Progreso 100% */}
          <div className="progress-track" role="progressbar" aria-label="Progreso"
               aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}
               style={{marginTop:12}}>
            <div className="progress-bar" style={{ width: `100%` }} />
          </div>
          <div className="progress-percent">100%</div>

          <div style={{display:"flex", gap:12, marginTop:18}}>
            <button type="button"
                    onClick={handleRestart}
                    className="btn-confirm enabled"
                    style={{flex:1}}>
              Reiniciar
            </button>
            <Link href="/" className="btn-next" style={{flex:1}}>
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  /* Pregunta */
  return (
    <main id="contenido" className="q-wrap">
      {/* CARD 1: header + progreso */}
      <section className="q-card q-head">
        <Link href="/" aria-label="Volver" style={{color:"#4b5563"}}>←</Link>
        <h1>Pregunta {idx + 1} de {preguntas.length}</h1>
        <p className="q-sub">
          Observá la imagen y seleccioná {multi ? "una o más opciones" : "la opción correcta"}.
        </p>

        <div className="progress-track" aria-label="Progreso" role="progressbar"
             aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-percent">{progress}%</div>
      </section>

      {/* CARD 2: timer + controles */}
      <section className="q-card q-timer">
        <div className="time-pill">
          {/* icono reloj */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2" style={{marginRight:6}}>
            <circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2"/><path d="M9 3h6"/>
          </svg>
          <span>Tiempo restante:&nbsp;</span>
          <span className="time-value">{formatTime(timeLeft)}</span>
        </div>

        <div style={{display:"flex", gap:"10px", marginTop:"12px", flexWrap:"wrap"}}>
          <button type="button" className="btn-sm" onClick={() => setPaused(p => !p)}>
            Pausar
          </button>
          <button type="button" className="btn-sm" onClick={() => !limitDisabled && setTimeLeft(t => t + 60)}>
            +60s
          </button>
          <button type="button" className="btn-sm" onClick={() => setLimitDisabled(true)}>
            Desactivar límite
          </button>
        </div>
      </section>

      {/* CARD 3: imagen */}
      <section className="q-card q-media">
        <div className="media">
          <Image
            src={q.imagen}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className=""
            priority={idx === 0}
          />
        </div>
      </section>

      {/* CARD 4: opciones + acciones */}
      <section className="q-card q-options">
        <form>
          <fieldset>
            <legend>¿Qué barreras se visualizan en la imagen?</legend>

            <div className="options-grid">
              {opcionesShuf.map((op, j) => {
                const active = selection.includes(op.i);
                return (
                  <label key={j} className={`option ${active ? "option--active" : ""}`}>
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

            <div className="actions">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selection.length === 0 || canNext}
                className={`btn-confirm ${selection.length!==0 && !canNext ? "enabled": ""}`}
              >
                Confirmar
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext}
                className={`btn-next ${canNext ? "enabled": ""}`}
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
          </fieldset>
        </form>
      </section>
    </main>
  );
}
