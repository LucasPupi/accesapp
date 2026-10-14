"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preguntas } from "@/data/preguntas";

/* ========= Helpers ========= */
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

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Cuántos segundos antes del final avisamos al lector de pantalla. */
const AVISO_SEGUNDOS = 10;

/* ========= Tipos ========= */
type Resultado = "ok" | "bad" | "time";

type Respuesta = {
  resultado: Resultado;
  seleccionTextos: string[];
};

type RespuestaAudit = {
  preguntaId: number;
  seleccion: number[];
  correctas: number[];
  ok: boolean;
  tiempoMs: number;
  agotado: boolean;
};

type EstadoGuardado = "idle" | "saving" | "ok" | "error";

/** Convierte la auditoría "cruda" (índices) a una versión legible para la planilla. */
function buildReadableAudit(raw: RespuestaAudit[]) {
  return raw.map((row) => {
    const pq = preguntas.find((p) => p.id === row.preguntaId);
    const imagen = pq?.imagen ?? "";
    const opciones = pq?.opciones ?? [];
    return {
      preguntaId: row.preguntaId,
      enunciado: pq?.enunciado ?? "",
      imagen,
      imagenNombre: imagen.split("/").pop() ?? "",
      estado: row.agotado ? "tiempo" : row.ok ? "correcto" : "incorrecto",
      ok: row.ok,
      tiempoMs: row.tiempoMs,
      tiempoSeg: Math.round(row.tiempoMs / 1000),
      seleccionIndices: row.seleccion,
      seleccionTextos: row.seleccion.map((i) => opciones[i]).filter(Boolean),
      correctasIndices: row.correctas,
      correctasTextos: row.correctas.map((i) => opciones[i]).filter(Boolean),
    };
  });
}

export default function JugarPage() {
  /* ---------- Orden y progreso ---------- */
  const [order, setOrder] = useState<number[]>(() =>
    shuffle([...Array(preguntas.length).keys()])
  );
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const q = preguntas[order[idx]];
  const multi = q.correctas.length > 1;
  const total = preguntas.length;

  /* ---------- Datos del jugador (ventana inicial) ---------- */
  const [gateOpen, setGateOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const errores = {
    nombre: nombre.trim() ? "" : "Escribí tu nombre.",
    apellido: apellido.trim() ? "" : "Escribí tu apellido.",
    email: !email.trim()
      ? "Escribí tu email."
      : emailOk(email)
      ? ""
      : "El email no parece válido (ejemplo: nombre@correo.com).",
  };

  /* ---------- Estado de la pregunta actual ---------- */
  const [timeLeft, setTimeLeft] = useState(q.tiempo);
  const [paused, setPaused] = useState(false);
  const [limitDisabled, setLimitDisabled] = useState(false);
  const [selection, setSelection] = useState<number[]>([]);
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [aviso, setAviso] = useState(""); // mensajes para lectores de pantalla

  const answered = respuesta !== null;

  /* ---------- Tiempos / auditoría ---------- */
  const quizStartedAt = useRef<number>(Date.now());
  const preguntaInicio = useRef<number>(Date.now());
  const [auditoria, setAuditoria] = useState<RespuestaAudit[]>([]);
  const [guardado, setGuardado] = useState<EstadoGuardado>("idle");

  /* ---------- Referencias para mover el foco ---------- */
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resultadosRef = useRef<HTMLHeadingElement>(null);

  // Opciones barajadas (manteniendo el índice real)
  const opcionesShuf = useMemo(
    () => shuffle(q.opciones.map((texto, i) => ({ texto, i }))),
    [q]
  );

  const progress = showResults ? 100 : Math.round(((idx + 1) / total) * 100);

  /* ---------- Reset al cambiar de pregunta ---------- */
  useEffect(() => {
    setTimeLeft(q.tiempo);
    setPaused(false);
    setLimitDisabled(false);
    setSelection([]);
    setRespuesta(null);
    setAviso("");
    preguntaInicio.current = Date.now();
  }, [idx, q.tiempo]);

  // Al empezar y al pasar de pregunta llevamos el foco al título
  // para que quien usa lector de pantalla sepa que cambió.
  useEffect(() => {
    if (gateOpen && !showResults) tituloRef.current?.focus();
  }, [idx, showResults, gateOpen]);

  /* ---------- Registrar una respuesta ---------- */
  const registrar = useCallback(
    (resultado: Resultado, sel: number[]) => {
      setAuditoria((a) => [
        ...a,
        {
          preguntaId: q.id,
          seleccion: sel,
          correctas: q.correctas,
          ok: resultado === "ok",
          tiempoMs: Date.now() - preguntaInicio.current,
          agotado: resultado === "time",
        },
      ]);
      setRespuesta({
        resultado,
        seleccionTextos: sel.map((i) => q.opciones[i]),
      });
    },
    [q]
  );

  // Cuando aparece el mensaje de respuesta le pasamos el foco:
  // así se ve en pantalla y el lector de pantalla lo lee completo.
  useEffect(() => {
    if (!respuesta || !feedbackRef.current) return;
    feedbackRef.current.focus({ preventScroll: true });
    const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    feedbackRef.current.scrollIntoView({
      behavior: menosMovimiento ? "auto" : "smooth",
      block: "center",
    });
  }, [respuesta]);

  // Al terminar, el foco va al título "Resultados"
  useEffect(() => {
    if (showResults) resultadosRef.current?.focus();
  }, [showResults]);

  /* ---------- Timer ---------- */
  const timerActivo = gateOpen && !paused && !limitDisabled && !answered && !showResults;

  // Guardamos la selección en una ref para que marcar opciones no reinicie el segundo en curso.
  const selectionRef = useRef<number[]>([]);
  selectionRef.current = selection;

  useEffect(() => {
    if (!timerActivo) return;
    if (timeLeft <= 0) {
      registrar("time", selectionRef.current);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timerActivo, timeLeft, registrar]);

  // Aviso hablado cuando queda poco tiempo
  useEffect(() => {
    if (timerActivo && timeLeft === AVISO_SEGUNDOS) {
      setAviso(`Quedan ${AVISO_SEGUNDOS} segundos.`);
    }
  }, [timerActivo, timeLeft]);

  /* ---------- Acciones ---------- */
  function empezar(e: React.FormEvent) {
    e.preventDefault();
    setIntentoEnviar(true);
    if (errores.nombre) return nombreRef.current?.focus();
    if (errores.apellido) return apellidoRef.current?.focus();
    if (errores.email) return emailRef.current?.focus();

    setGateOpen(true);
    quizStartedAt.current = Date.now();
    preguntaInicio.current = Date.now();
  }

  function toggleSelect(i: number) {
    setSelection((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function handleConfirm() {
    if (selection.length === 0 || answered) return;
    const sel = new Set(selection);
    const ok = sel.size === q.correctas.length && q.correctas.every((i) => sel.has(i));
    if (ok) setScore((s) => s + 1);
    registrar(ok ? "ok" : "bad", selection);
  }

  function togglePausa() {
    setAviso(paused ? "Tiempo reanudado." : "Tiempo en pausa.");
    setPaused(!paused);
  }

  function sumarTiempo() {
    setTimeLeft((t) => t + 60);
    setAviso("Se agregaron 60 segundos.");
  }

  function quitarLimite() {
    setLimitDisabled(true);
    setAviso("Límite de tiempo desactivado para esta pregunta.");
  }

  function handleNext() {
    if (idx < total - 1) setIdx((i) => i + 1);
    else setShowResults(true);
  }

  function handleRestart() {
    const nuevoOrden = shuffle([...Array(total).keys()]);
    setOrder(nuevoOrden);
    setIdx(0);
    setScore(0);
    setShowResults(false);
    setAuditoria([]);
    setGuardado("idle");
    // forzamos el reset de la primera pregunta aunque idx ya fuera 0
    setTimeLeft(preguntas[nuevoOrden[0]].tiempo);
    setPaused(false);
    setLimitDisabled(false);
    setSelection([]);
    setRespuesta(null);
    quizStartedAt.current = Date.now();
    preguntaInicio.current = Date.now();
  }

  /* ---------- Envío a Google Sheets al terminar ---------- */
  useEffect(() => {
    if (!showResults || guardado !== "idle") return;
    setGuardado("saving");

    const payload = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      score,
      total,
      tiempoSegundos: Math.max(0, Math.round((Date.now() - quizStartedAt.current) / 1000)),
      respuestas: buildReadableAudit(auditoria),
    };

    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => setGuardado(r.ok ? "ok" : "error"))
      .catch((err) => {
        console.error("Error guardando en Sheets:", err);
        setGuardado("error");
      });
  }, [showResults, guardado, nombre, apellido, email, score, total, auditoria]);

  /* ========= UI ========= */

  /* --- Ventana de datos (bloquea el juego hasta "Empezar") --- */
  const gateModal = !gateOpen && (
    <div className="gate-backdrop">
      <div
        className="gate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-titulo"
        aria-describedby="gate-desc"
      >
        <h2 id="gate-titulo" className="gate-title">Antes de empezar</h2>
        <p id="gate-desc" className="gate-desc">Completá tus datos para guardar tu puntaje.</p>

        <form onSubmit={empezar} noValidate className="gate-form">
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              ref={nombreRef}
              autoFocus
              autoComplete="given-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={intentoEnviar && !!errores.nombre}
              aria-describedby={intentoEnviar && errores.nombre ? "nombre-error" : undefined}
            />
            {intentoEnviar && errores.nombre && (
              <p id="nombre-error" className="field-error">{errores.nombre}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              ref={apellidoRef}
              autoComplete="family-name"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              aria-invalid={intentoEnviar && !!errores.apellido}
              aria-describedby={intentoEnviar && errores.apellido ? "apellido-error" : undefined}
            />
            {intentoEnviar && errores.apellido && (
              <p id="apellido-error" className="field-error">{errores.apellido}</p>
            )}
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={intentoEnviar && !!errores.email}
              aria-describedby={intentoEnviar && errores.email ? "email-error" : undefined}
            />
            {intentoEnviar && errores.email && (
              <p id="email-error" className="field-error">{errores.email}</p>
            )}
          </div>

          <div className="gate-actions">
            <button type="submit" className="btn-confirm enabled">Empezar</button>
            <Link href="/" className="btn-next">Cancelar</Link>
          </div>
        </form>

        <p className="gate-note">
          Al continuar aceptás que registremos tus datos y respuestas con fines educativos.
        </p>
      </div>
    </div>
  );

  /* --- Resultados --- */
  if (showResults) {
    return (
      <main id="contenido" className="q-wrap">
        <section className="q-card">
          <h1 ref={resultadosRef} tabIndex={-1} className="results-title">Resultados</h1>
          <p className="q-sub">
            Puntaje: <strong className="results-score">{score}</strong> de {total}
          </p>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={100}
          >
            <div className="progress-bar" style={{ width: "100%" }} />
          </div>

          <p className="save-status" role="status">
            {guardado === "saving" && "Guardando tus resultados…"}
            {guardado === "ok" && "Tus resultados se guardaron correctamente."}
            {guardado === "error" &&
              "No pudimos guardar tus resultados. Avisale a la persona a cargo de la actividad."}
          </p>

          <div className="actions">
            <button type="button" onClick={handleRestart} className="btn-confirm enabled">
              Reiniciar
            </button>
            <Link href="/" className="btn-next">Volver al inicio</Link>
          </div>
        </section>
      </main>
    );
  }

  /* --- Pregunta --- */
  const correctTexts = q.correctas.map((i) => q.opciones[i]).join(", ");

  return (
    <>
      {gateModal}

      {/* Mientras la ventana de datos está abierta, el resto queda "inerte":
          no se puede enfocar ni lo lee el lector de pantalla. */}
      <main id="contenido" className="q-wrap" inert={!gateOpen}>
        {/* Región invisible donde anunciamos cambios del timer */}
        <p className="sr-only" aria-live="polite" role="status">{aviso}</p>

        {/* CARD 1: encabezado + progreso */}
        <section className="q-card q-head">
          <Link href="/" className="back-link">
            <span aria-hidden="true">←</span> Volver al inicio
          </Link>
          <h1 ref={tituloRef} tabIndex={-1}>Pregunta {idx + 1} de {total}</h1>
          <p className="q-sub">
            Observá la imagen y seleccioná {multi ? "una o más opciones" : "la opción correcta"}.
          </p>

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
          <div className="progress-percent" aria-hidden="true">{progress}%</div>
        </section>

        {/* CARD 2: timer + controles */}
        <section className="q-card q-timer" aria-label="Tiempo">
          <div className="time-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v5l3 2" />
              <path d="M9 3h6" />
            </svg>
            {limitDisabled ? (
              <span>Sin límite de tiempo</span>
            ) : (
              <>
                <span>Tiempo restante:</span>
                {/* Se actualiza cada segundo: no lo anunciamos para no saturar al lector */}
                <span className="time-value">{formatTime(timeLeft)}</span>
                {paused && <span className="time-paused">(en pausa)</span>}
              </>
            )}
          </div>

          <div className="timer-controls">
            <button
              type="button"
              className="btn-sm"
              onClick={togglePausa}
              aria-pressed={paused}
              disabled={answered || limitDisabled}
            >
              {paused ? "Reanudar" : "Pausar"}
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={sumarTiempo}
              disabled={answered || limitDisabled}
            >
              Sumar 60 segundos
            </button>
            <button
              type="button"
              className="btn-sm"
              onClick={quitarLimite}
              disabled={answered || limitDisabled}
            >
              Desactivar límite
            </button>
          </div>
        </section>

        {/* CARD 3: imagen */}
        <section className="q-card q-media" aria-label="Imagen">
          <figure className="media">
            <Image
              key={q.imagen}
              src={q.imagen}
              alt={q.alt}
              width={740}
              height={493}
              sizes="(max-width: 820px) 100vw, 780px"
              priority={idx === 0}
            />
          </figure>
        </section>

        {/* CARD 4: opciones + acciones */}
        <section className="q-card q-options">
          <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
            <fieldset disabled={answered}>
              <legend>{q.enunciado}</legend>

              <div className="options-grid">
                {opcionesShuf.map((op) => {
                  const active = selection.includes(op.i);
                  return (
                    <label key={op.i} className={`option ${active ? "option--active" : ""}`}>
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

            <div className="actions">
              <button
                type="submit"
                disabled={selection.length === 0 || answered}
                className={`btn-confirm ${selection.length !== 0 && !answered ? "enabled" : ""}`}
              >
                Confirmar
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!answered}
                className={`btn-next ${answered ? "enabled" : ""}`}
              >
                {idx < total - 1 ? "Siguiente" : "Ver resultados"}
              </button>
            </div>
          </form>

          {respuesta && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              className={`feedback feedback--${respuesta.resultado}`}
            >
              <p className="feedback-title">
                <span aria-hidden="true">
                  {respuesta.resultado === "ok" ? "✅ " : respuesta.resultado === "bad" ? "❌ " : "⏳ "}
                </span>
                {respuesta.resultado === "ok"
                  ? "Correcto."
                  : respuesta.resultado === "bad"
                  ? "Incorrecto."
                  : "Se terminó el tiempo."}
              </p>
              {respuesta.resultado !== "ok" && (
                <p>
                  Correctas: {correctTexts}.
                  {respuesta.resultado === "bad" && ` Vos marcaste: ${respuesta.seleccionTextos.join(", ")}.`}
                </p>
              )}
              <p className="feedback-text">{q.explicacion}</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
