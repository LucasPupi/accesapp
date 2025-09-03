// src/app/api/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs"; // asegura Node (no Edge)

// ==============================
// 1) Lectura robusta de credenciales
//    (acepta JSON base64 o email+key con nombres nuevos o viejos)
// ==============================
function getGoogleCreds() {
  // A1) Todo el JSON del service account en BASE64 (RECOMENDADO)
  const jsonB64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (jsonB64 && jsonB64.trim() !== "") {
    const json = Buffer.from(jsonB64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return {
      client_email: String(parsed.client_email),
      private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
    };
  }

  // A2) Todo el JSON crudo en UNA variable (multilínea)
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (rawJson && rawJson.trim().startsWith("{")) {
    const parsed = JSON.parse(rawJson);
    return {
      client_email: String(parsed.client_email),
      private_key: String(parsed.private_key),
    };
  }

  // B) Email + Private Key por separado (acepta nombres nuevos y los que venías usando)
  const client_email =
    process.env.GOOGLE_SERVICE_EMAIL ||
    process.env.GOOGLE_CLIENT_EMAIL || // fallback
    "";

  let key =
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.GOOGLE_CLIENT_PRIVATE_KEY || // por si usaste este nombre
    (process.env.GOOGLE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString(
          "utf8"
        )
      : "");

  // Arregla saltos de línea escapados por env
  key = key.replace(/\\n/g, "\n");

  if (!client_email || !key) {
    throw new Error(
      "Faltan credenciales: defina GOOGLE_CREDENTIALS_BASE64 o GOOGLE_SERVICE_ACCOUNT o (GOOGLE_SERVICE_EMAIL/GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)"
    );
  }

  return { client_email, private_key: key };
}

// ==============================
// 2) Tipos del payload que envía el juego
// ==============================
type DetalleItem = {
  imagenNombre: string;
  estado: "correcto" | "incorrecto";
  tiempoSeg: number;
  seleccionTextos: string[];
  correctasTextos: string[];
};

type SavePayload = {
  nombre: string;
  apellido: string;
  email: string;
  resumen?: string;
  detalle: DetalleItem[];
};

// ==============================
// 3) Helpers
// ==============================
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno: ${name}`);
  return v;
}

function formatResumenHumano(p: SavePayload) {
  const total = p.detalle.length;
  const correctas = p.detalle.filter((d) => d.estado === "correcto").length;
  const totalTiempo = Math.round(
    p.detalle.reduce((acc, d) => acc + (Number(d.tiempoSeg) || 0), 0)
  );

  // Resumen corto
  const resumenCorto = `Puntaje: ${correctas}/${total}  •  Tiempo total: ${totalTiempo}s`;

  // Detalle legible (una línea por pregunta)
  const lineas = p.detalle.map((d, i) => {
    const sel = d.seleccionTextos.join(", ") || "-";
    const cor = d.correctasTextos.join(", ") || "-";
    return `${i + 1}) ${d.imagenNombre} — ${d.estado}. Selección: ${sel}. Correctas: ${cor}. ${d.tiempoSeg}s`;
  });

  const detalleLegible = lineas.join("\n");

  return { resumenCorto, detalleLegible, correctas, total, totalTiempo };
}

// ==============================
// 4) GET simple (salud)
// ==============================
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/save" });
}

// ==============================
// 5) POST: guarda en Google Sheets
// ==============================
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;

    // Validación MUY básica sin libs externas
    const p = body as Partial<SavePayload>;
    if (
      !p ||
      typeof p.nombre !== "string" ||
      typeof p.apellido !== "string" ||
      typeof p.email !== "string" ||
      !Array.isArray(p.detalle)
    ) {
      return NextResponse.json(
        { ok: false, error: "Payload inválido" },
        { status: 400 }
      );
    }

    const { client_email, private_key } = getGoogleCreds();

    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const SHEET_ID = requiredEnv("SHEET_ID");
    const SHEET_TAB = process.env.SHEET_TAB || "Respuestas";

    // Armar resumen humano legible (sin user-agent, sin JSON crudo)
    const { resumenCorto, detalleLegible, correctas, total, totalTiempo } =
      formatResumenHumano(p as SavePayload);

    // Fila a insertar (podés ajustar el orden/columnas a gusto)
    // Fecha ISO, Nombre, Apellido, Email, Puntaje, TiempoTotal(s), ResumenCorto, Detalle (multilínea)
    const nowIso = new Date().toISOString();
    const values: (string | number)[][] = [
      [
        nowIso,
        p.nombre,
        p.apellido,
        p.email,
        `${correctas}/${total}`,
        totalTiempo,
        p.resumen || resumenCorto,
        detalleLegible,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Error inesperado en /api/save";
    console.error("Sheets error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
