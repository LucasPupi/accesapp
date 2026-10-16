"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preguntas } from "@/data/preguntas";
import PantallaCarga from "@/components/PantallaCarga";
import { guardarSonido, reproducir, sonidoActivado, type NombreSonido } from "@/lib/sonidos";

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

/** Tiempo mínimo que se muestra la pantalla de carga (para que la animación se llegue a ver). */
const CARGA_MINIMA_MS = 1400;

const menosMovimiento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Descarga una foto y avisa cuando está lista (o si falló, para no trabar la carga). */
function precargar(src: string) {
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Número que sube de 0 hasta `valor` (para el puntaje final). */
function useConteo(valor: number, activo: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!activo) return;
    if (menosMovimiento() || valor === 0) {
      setN(valor);
      return;
    }
    const dur = 700 + valor * 90;
    const t0 = performance.now();
    let raf = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      setN(Math.round(valor * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, activo]);
  return n;
}

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

  /* ---------- Pantalla de carga ---------- */
  const [cargando, setCargando] = useState(true);
  const [fotosListas, setFotosListas] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const inicio = Date.now();
    Promise.all(
      preguntas.map((p) =>
        precargar(p.imagen).then(() => {
          if (!cancelado) setFotosListas((n) => n + 1);
        })
      )
    ).then(() => {
      const minimo = menosMovimiento() ? 300 : CARGA_MINIMA_MS;
      const resto = Math.max(0, minimo - (Date.now() - inicio));
      setTimeout(() => {
        if (!cancelado) setCargando(false);
      }, resto);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  /* ---------- Sonido ---------- */
  const [sonido, setSonido] = useState(true);
  const sonidoRef = useRef(true);
  useEffect(() => {
    const guardado = sonidoActivado();
    setSonido(guardado);
    sonidoRef.current = guardado;
  }, []);

  const sonar = useCallback((nombre: NombreSonido) => {
    if (sonidoRef.current) reproducir(nombre);
  }, []);

  function alternarSonido() {
    const nuevo = !sonido;
    setSonido(nuevo);
    sonidoRef.current = nuevo;
    guardarSonido(nuevo);
    setAviso(nuevo ? "Sonido activado." : "Sonido desactivado.");
    if (nuevo) reproducir("seleccionar");
  }

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
      sonar(resultado === "ok" ? "correcto" : resultado === "bad" ? "incorrecto" : "tiempo");
    },
    [q, sonar]
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

  // Al terminar, el foco va al título "Resultados" y suena la melodía final
  useEffect(() => {
    if (!showResults) return;
    resultadosRef.current?.focus();
    sonar("final");
  }, [showResults, sonar]);

  const puntajeAnimado = useConteo(score, showResults);

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
    // Un toque suave en cada uno de los últimos 5 segundos
    if (timerActivo && timeLeft > 0 && timeLeft <= 5) sonar("aviso");
  }, [timerActivo, timeLeft, sonar]);

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
    if (!selection.includes(i)) sonar("seleccionar");
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
            <button type="submit" className="btn-primary">Empezar</button>
            <Link href="/" className="btn-secondary">Cancelar</Link>
          </div>
        </form>

        <p className="gate-note">
          Al continuar aceptás que registremos tus datos y respuestas con fines educativos.
        </p>
      </div>
    </div>
  );

  /* --- Barra superior (marca + tiempo) --- */
  const marca = (
    <Link href="/" className="brand">
      <span className="brand-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      Accesibilidad UNM
      <span className="sr-only">, volver al inicio</span>
    </Link>
  );

  /* --- Botón de sonido --- */
  const botonSonido = (
    <button
      type="button"
      className="btn-chip btn-sound"
      onClick={alternarSonido}
      aria-pressed={sonido}
    >
      {sonido ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </svg>
      )}
      Sonido
    </button>
  );

  /* --- Pantalla de carga --- */
  if (cargando) {
    return <PantallaCarga cargadas={fotosListas} total={total} />;
  }

  /* --- Resultados --- */
  if (showResults) {
    return (
      <main id="contenido" className="game">
        <header className="game-bar">
          {marca}
          {botonSonido}
        </header>

        <section className="result-card">
          <h1 ref={resultadosRef} tabIndex={-1} className="result-title">Resultados</h1>
          <p className="result-score">
            {/* El número sube de 0 al puntaje; el lector de pantalla lee el valor final */}
            <strong aria-hidden="true">{puntajeAnimado}</strong>
            <span className="sr-only">{score}</span> <span>de {total} correctas</span>
          </p>

          {/* Un segmento por pregunta: verde si acertaste, rojo si no */}
          <div className="segments" aria-hidden="true">
            {auditoria.map((r, i) => (
              <span
                key={i}
                className={`segment segment--pop ${r.ok ? "segment--done" : "segment--miss"}`}
                style={{ "--i": i } as React.CSSProperties}
              />
            ))}
          </div>

          <p className="save-status" role="status">
            {guardado === "saving" && "Guardando tus resultados…"}
            {guardado === "ok" && "Tus resultados se guardaron correctamente."}
            {guardado === "error" &&
              "No pudimos guardar tus resultados. Avisale a la persona a cargo de la actividad."}
          </p>

          <div className="result-actions">
            <button type="button" onClick={handleRestart} className="btn-primary">
              Jugar de nuevo
            </button>
            <Link href="/" className="btn-secondary">Volver al inicio</Link>
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
      <main id="contenido" className="game" inert={!gateOpen}>
        {/* Región invisible donde anunciamos cambios del timer */}
        <p className="sr-only" aria-live="polite" role="status">{aviso}</p>

        <header className="game-bar">
          {marca}

          <div className="bar-right">
            <div className="timer" role="group" aria-label="Tiempo">
              <p className="timer-value">
                {limitDisabled ? (
                  <span className="timer-label">Sin límite de tiempo</span>
                ) : (
                  <>
                    <span className="timer-label">
                      {answered || paused ? "Tiempo detenido" : "Tiempo restante"}
                    </span>
                    {/* Se actualiza cada segundo: no lo anunciamos para no saturar al lector */}
                    <span
                      className={`timer-number ${
                        timerActivo && timeLeft <= AVISO_SEGUNDOS ? "timer-number--low" : ""
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </>
                )}
              </p>

              {!answered && !limitDisabled && (
                <div className="timer-controls">
                  <button type="button" className="btn-chip" onClick={togglePausa} aria-pressed={paused}>
                    {paused ? "Reanudar" : "Pausar"}
                  </button>
                  <button type="button" className="btn-chip" onClick={sumarTiempo}>
                    +60 s<span className="sr-only">egundos</span>
                  </button>
                  <button type="button" className="btn-chip" onClick={quitarLimite}>
                    Sin límite
                  </button>
                </div>
              )}
            </div>
            {botonSonido}
          </div>
        </header>

        <div className="game-body">
          <div className="q-top">
            <h1 ref={tituloRef} tabIndex={-1} className="q-title">
              Pregunta {idx + 1} de {total}
            </h1>
            <div
              className="segments"
              role="progressbar"
              aria-label="Progreso"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={idx + 1}
              aria-valuetext={`Pregunta ${idx + 1} de ${total}`}
            >
              {Array.from({ length: total }, (_, i) => (
                <span
                  key={i}
                  className={`segment ${i < idx ? "segment--done" : i === idx ? "segment--done segment--current" : ""}`}
                />
              ))}
            </div>
          </div>

          <div className="q-layout q-enter" key={idx}>
            <figure className="q-photo">
              <Image
                key={q.imagen}
                src={q.imagen}
                alt={q.alt}
                width={740}
                height={493}
                sizes="(max-width: 900px) 100vw, 640px"
                // Las fotos ya están optimizadas (.webp chicas) y se precargan en la
                // pantalla de carga: así aparecen al instante, sin volver a descargarse.
                unoptimized
                priority={idx === 0}
              />
            </figure>

            <div className="q-panel">
              <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
                <fieldset disabled={answered}>
                  <legend className="q-question">{q.enunciado}</legend>
                  <p className="q-hint">
                    {multi ? "Podés marcar una o más opciones." : "Marcá la opción correcta."}
                  </p>

                  <div className="options">
                    {opcionesShuf.map((op) => {
                      const active = selection.includes(op.i);
                      const esCorrecta = q.correctas.includes(op.i);
                      // Después de responder mostramos qué era correcto y qué no
                      const estado = !answered
                        ? ""
                        : esCorrecta
                        ? "option--correct"
                        : active
                        ? "option--wrong"
                        : "option--dim";
                      return (
                        <label
                          key={op.i}
                          className={`option ${active ? "option--active" : ""} ${estado}`}
                        >
                          <input
                            type="checkbox"
                            name={`respuesta-${q.id}`}
                            checked={active}
                            onChange={() => toggleSelect(op.i)}
                          />
                          <span className="option-text">{op.texto}</span>
                          {answered && esCorrecta && (
                            <svg className="option-mark" viewBox="0 0 24 24" role="img" aria-label="Correcta">
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          )}
                          {answered && !esCorrecta && active && (
                            <svg className="option-mark" viewBox="0 0 24 24" role="img" aria-label="Incorrecta">
                              <path d="M7 7l10 10M17 7L7 17" />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {!answered && (
                  <button
                    type="submit"
                    className="btn-primary btn-block"
                    disabled={selection.length === 0}
                  >
                    Confirmar
                  </button>
                )}
              </form>

              {respuesta && (
                <div
                  ref={feedbackRef}
                  tabIndex={-1}
                  className={`feedback feedback--${respuesta.resultado}`}
                >
                  <p className="feedback-title">
                    <span className="feedback-icon" aria-hidden="true">
                      {respuesta.resultado === "ok" ? (
                        <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      ) : respuesta.resultado === "bad" ? (
                        <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7" /><path d="M12 10v3l2 1.5M10 3h4" /></svg>
                      )}
                    </span>
                    {respuesta.resultado === "ok"
                      ? "¡Correcto!"
                      : respuesta.resultado === "bad"
                      ? "No es correcto"
                      : "Se terminó el tiempo"}
                  </p>
                  {respuesta.resultado !== "ok" && (
                    <p className="feedback-detail">
                      Correctas: {correctTexts}.
                      {respuesta.resultado === "bad" && ` Marcaste: ${respuesta.seleccionTextos.join(", ")}.`}
                    </p>
                  )}
                  <p className="feedback-text">{q.explicacion}</p>
                </div>
              )}

              {answered && (
                <button type="button" onClick={handleNext} className="btn-primary btn-block">
                  {idx < total - 1 ? "Siguiente pregunta" : "Ver resultados"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
