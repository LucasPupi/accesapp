// src/app/api/save/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========= Tipos ========= */
type DetalleItem = {
  preguntaId?: number;
  enunciado?: string;
  imagen?: string;         // "/fotos/baños.webp"
  imagenNombre?: string;   // "baños.webp"
  estado?: string;         // "correcto" | "incorrecto"
  ok?: boolean;            // true | false
  tiempoMs?: number;
  tiempoSeg?: number;
  seleccion?: Array<number | string>;
  seleccionTextos?: string[];
  correctas?: Array<number | string>;
  correctasTextos?: string[];
};

type ResumenCompat = {
  puntaje?: number;
  correctas?: number;
  total?: number;
  duracionSeg?: number;
  tiempoSeg?: number;
};

type Payload = {
  nombre?: string;
  apellido?: string;
  email?: string;

  resumen?: ResumenCompat;
  detalle?: DetalleItem[];

  // alias comunes por si cambió el cliente
  name?: string;
  surname?: string;
  mail?: string;
  score?: number;
  correctas?: number;
  total?: number;
  durationSec?: number;
  duracionSegundos?: number;

  details?: DetalleItem[];
  respuestas?: DetalleItem[];
};

type Normalized = {
  nombre: string;
  apellido: string;
  email: string;
  puntaje: number;
  correctas: number;
  total: number;
  duracionSeg: number;
  detalle: DetalleItem[];
};

/* ========= Helpers ========= */
function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function basename(path: string): string {
  if (!path) return "";
  // quita carpetas y deja solo el archivo
  const clean = path.split(/[\\/]/).pop() || path;
  return clean.startsWith("/") ? clean.slice(1) : clean;
}

function readServiceCreds(): { client_email: string; private_key: string } {
  // Opción 1: todo el JSON del service account en una sola env
  const svc = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (svc) {
    try {
      const json = JSON.parse(svc) as { client_email?: string; private_key?: string };
      const client_email = json.client_email ?? "";
      const private_key = (json.private_key ?? "").replace(/\\n/g, "\n");
      return { client_email, private_key };
    } catch (e) {
      console.error("[SAVE] GOOGLE_SERVICE_ACCOUNT JSON inválido:", e);
    }
  }

  // Opción 2: email + private_key por separado
  const client_email =
    process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_EMAIL || "";
  const private_key = (process.env.GOOGLE_PRIVATE_KEY ||
    process.env.GOOGLE_CLIENT_PRIVATE_KEY ||
    "").replace(/\\n/g, "\n");

  return { client_email, private_key };
}

async function getSheets() {
  const { client_email, private_key } = readServiceCreds();
  if (!client_email || !private_key) {
    throw new Error(
      "Faltan credenciales: definí GOOGLE_SERVICE_ACCOUNT o (GOOGLE_CLIENT_EMAIL/GOOGLE_SERVICE_EMAIL + GOOGLE_PRIVATE_KEY)"
    );
  }
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email, private_key },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function normalizeBody(body: unknown): Normalized {
  const b = (body ?? {}) as Payload;

  const detalle: DetalleItem[] = Array.isArray(b.detalle)
    ? b.detalle
    : Array.isArray(b.details)
    ? b.details
    : Array.isArray(b.respuestas)
    ? b.respuestas
    : [];

  const nombre = toStr(b.nombre ?? b.name ?? "");
  const apellido = toStr(b.apellido ?? b.surname ?? "");
  const email = toStr(b.email ?? b.mail ?? "");

  const puntaje = Number(b.resumen?.puntaje ?? b.score ?? 0) || 0;
  const correctas = Number(b.resumen?.correctas ?? b.correctas ?? puntaje) || 0;

  const totalFromBody = b.resumen?.total ?? b.total;
  const total =
    typeof totalFromBody === "number"
      ? totalFromBody
      : Number(totalFromBody) || (detalle.length || 0);

  const duracionSeg =
    Number(
      b.resumen?.duracionSeg ??
        b.resumen?.tiempoSeg ??
        b.durationSec ??
        b.duracionSegundos ??
        0
    ) || 0;

  return { nombre, apellido, email, puntaje, correctas, total, duracionSeg, detalle };
}

function buildDetalleResumen(detalle: DetalleItem[]): string {
  if (!detalle?.length) return "";
  return detalle
    .map((d, i) => {
      const idx = i + 1;
      const file =
        d.imagenNombre || (d.imagen ? basename(d.imagen) : `pregunta_${d.preguntaId ?? idx}`);
      const estado =
        typeof d.ok === "boolean"
          ? d.ok
            ? "correcto"
            : "incorrecto"
          : d.estado || "—";
      const sel =
        Array.isArray(d.seleccionTextos) && d.seleccionTextos.length
          ? d.seleccionTextos.join(", ")
          : Array.isArray(d.seleccion)
          ? d.seleccion.map(String).join(", ")
          : "—";
      const okTxt =
        Array.isArray(d.correctasTextos) && d.correctasTextos.length
          ? d.correctasTextos.join(", ")
          : Array.isArray(d.correctas)
          ? d.correctas.map(String).join(", ")
          : "—";
      const seg =
        typeof d.tiempoSeg === "number"
          ? d.tiempoSeg
          : typeof d.tiempoMs === "number"
          ? Math.round(d.tiempoMs / 1000)
          : 0;

      return `${idx}) ${file}: ${estado} — marcó: ${sel}; correctas: ${okTxt} | ${seg}s`;
    })
    .join("\n");
}

/* ========= Handlers ========= */
export async function POST(req: Request) {
  try {
    const sheets = await getSheets();

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // si no vino JSON, igual registramos mínimos
    }

    const n = normalizeBody(body);
    const detalleResumen = buildDetalleResumen(n.detalle);

    // ✅ SOLO 8 columnas exactas (en este orden)
    const values = [
      [
        new Date().toISOString(), // timestamp
        n.nombre,                 // nombre
        n.apellido,               // apellido
        n.email,                  // email
        n.puntaje,                // score (número)
        n.total,                  // total (número)
        n.duracionSeg,            // tiempo_segundos (número)
        detalleResumen,           // detalle_resumen (texto multilínea)
      ],
    ] as (string | number)[][];

    const spreadsheetId = process.env.SHEET_ID!;
    const tab = process.env.SHEET_TAB || "Respuestas";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Sheets error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  const has = (k: string) => !!(process.env[k] && String(process.env[k]).length > 0);
  return NextResponse.json({
    ok: true,
    route: "/api/save",
    env: {
      SHEET_ID: has("SHEET_ID"),
      SHEET_TAB: has("SHEET_TAB"),
      GOOGLE_SERVICE_ACCOUNT: has("GOOGLE_SERVICE_ACCOUNT"),
      GOOGLE_CLIENT_EMAIL: has("GOOGLE_CLIENT_EMAIL"),
      GOOGLE_PRIVATE_KEY: has("GOOGLE_PRIVATE_KEY"),
    },
  });
}
