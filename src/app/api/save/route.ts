// src/app/api/save/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===================== Tipos ===================== */
type DetalleItem = {
  preguntaId?: number;
  enunciado?: string;
  imagen?: string;
  imagenNombre?: string;
  estado?: string;          // "correcto" | "incorrecto"
  ok?: boolean;
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
  usoTiempo?: boolean | string;
  agotados?: number;
};

type Payload = {
  nombre?: string;
  apellido?: string;
  email?: string;
  resumen?: ResumenCompat;
  detalle?: DetalleItem[];

  // alias comunes
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
  puntaje: number;       // score
  correctas: number;
  total: number;
  duracionSeg: number;   // tiempo_segundos
  imagenes: string[];
};

/* ===================== Helpers ===================== */
function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function readServiceCreds(): { client_email: string; private_key: string } {
  const svc = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (svc) {
    try {
      const json = JSON.parse(svc) as { client_email?: string; private_key?: string };
      const client_email = json.client_email ?? "";
      const private_key = (json.private_key ?? "").replace(/\\n/g, "\n");
      return { client_email, private_key };
    } catch (e) {
      console.error("[SAVE] GOOGLE_SERVICE_ACCOUNT no es JSON válido:", e);
    }
  }

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

  const detalleArr: DetalleItem[] = Array.isArray(b.detalle)
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
  const correctas = Number(b.resumen?.correctas ?? b.correctas ?? 0) || 0;

  const totalFromBody = b.resumen?.total ?? b.total;
  const total =
    typeof totalFromBody === "number"
      ? totalFromBody
      : Number(totalFromBody) || (detalleArr.length || 0);

  const duracionSeg =
    Number(
      b.resumen?.duracionSeg ??
        b.resumen?.tiempoSeg ??
        b.durationSec ??
        b.duracionSegundos ??
        0
    ) || 0;

  const imagenes = detalleArr
    .map((d) => d.imagenNombre || d.imagen || "")
    .filter((s) => !!s);

  return {
    nombre,
    apellido,
    email,
    puntaje,
    correctas,
    total,
    duracionSeg,
    imagenes,
  };
}

/* ===================== Handlers ===================== */
export async function POST(req: Request) {
  try {
    const sheets = await getSheets();

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      // si no es JSON, guardamos fila mínima igual
    }

    const n = normalizeBody(body);

    // ✅ SOLO estas 8 columnas (en este orden)
    const detalleResumen = `Puntaje: ${n.puntaje}/${n.total} · Duración: ${n.duracionSeg}s`;
    const values = [
      [
        new Date().toISOString(), // timestamp
        n.nombre,
        n.apellido,
        n.email,
        n.puntaje,               // score (numérico)
        n.total,                 // total (numérico)
        n.duracionSeg,           // tiempo_segundos (numérico)
        detalleResumen,          // detalle_resumen (texto corto)
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
  const has = (k: string) =>
    !!(process.env[k] && String(process.env[k]).length > 0);
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
