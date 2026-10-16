/**
 * Sonidos del juego, generados en el navegador con Web Audio.
 * No usan archivos: son notas cortas armadas con código, así que no pesan nada.
 *
 * Para cambiar un sonido, tocá las notas de la lista SONIDOS
 * (frecuencia en Hz, duración en segundos y el momento en que empieza).
 */

type Nota = {
  f: number;          // frecuencia en Hz (más alto = más agudo)
  t: number;          // cuándo empieza, en segundos desde el inicio del sonido
  d: number;          // duración en segundos
  tipo?: OscillatorType; // "sine" (suave), "triangle", "square" (más áspero)
  vol?: number;       // volumen de 0 a 1
};

export type NombreSonido = "seleccionar" | "correcto" | "incorrecto" | "tiempo" | "aviso" | "final";

const SONIDOS: Record<NombreSonido, Nota[]> = {
  // "clic" corto al marcar una opción
  seleccionar: [{ f: 660, t: 0, d: 0.06, tipo: "triangle", vol: 0.25 }],
  // dos notas que suben: Do – Sol
  correcto: [
    { f: 523.25, t: 0, d: 0.12, tipo: "triangle" },
    { f: 783.99, t: 0.1, d: 0.22, tipo: "triangle" },
  ],
  // dos notas que bajan, suaves (no es un "error" agresivo)
  incorrecto: [
    { f: 392, t: 0, d: 0.14, tipo: "sine" },
    { f: 311.13, t: 0.13, d: 0.26, tipo: "sine" },
  ],
  // tres toques iguales
  tiempo: [
    { f: 440, t: 0, d: 0.09, tipo: "sine" },
    { f: 440, t: 0.16, d: 0.09, tipo: "sine" },
    { f: 330, t: 0.32, d: 0.3, tipo: "sine" },
  ],
  // un toque suave cuando quedan pocos segundos
  aviso: [{ f: 880, t: 0, d: 0.08, tipo: "sine", vol: 0.2 }],
  // pequeña melodía al terminar: Do – Mi – Sol – Do
  final: [
    { f: 523.25, t: 0, d: 0.12, tipo: "triangle" },
    { f: 659.25, t: 0.12, d: 0.12, tipo: "triangle" },
    { f: 783.99, t: 0.24, d: 0.12, tipo: "triangle" },
    { f: 1046.5, t: 0.36, d: 0.4, tipo: "triangle" },
  ],
};

const CLAVE = "accesapp-sonido";
const VOLUMEN_GENERAL = 0.18;

let ctx: AudioContext | null = null;

function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // Los navegadores arrancan el audio "dormido" hasta que la persona toca algo
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** ¿El sonido está activado? Se recuerda en este navegador. Por defecto: sí. */
export function sonidoActivado(): boolean {
  try {
    return localStorage.getItem(CLAVE) !== "no";
  } catch {
    return true;
  }
}

export function guardarSonido(activo: boolean) {
  try {
    localStorage.setItem(CLAVE, activo ? "si" : "no");
  } catch {
    /* modo privado o almacenamiento bloqueado: no pasa nada */
  }
}

export function reproducir(nombre: NombreSonido) {
  const ac = contexto();
  if (!ac) return;
  const ahora = ac.currentTime + 0.01;

  for (const n of SONIDOS[nombre]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.tipo ?? "sine";
    osc.frequency.value = n.f;

    // Volumen con subida y bajada rápidas para que no haga "clic"
    const vol = VOLUMEN_GENERAL * (n.vol ?? 1);
    const inicio = ahora + n.t;
    gain.gain.setValueAtTime(0, inicio);
    gain.gain.linearRampToValueAtTime(vol, inicio + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, inicio + n.d);

    osc.connect(gain).connect(ac.destination);
    osc.start(inicio);
    osc.stop(inicio + n.d + 0.02);
  }
}
