import { google } from "googleapis";

/** ===== Tipos ===== */
type ReadableRow = {
  preguntaId?: string | number;
  enunciado?: string;
  imagen?: string;
  imagenNombre?: string;
  estado?: "correcto" | "incorrecto" | "tiempo" | string;
  ok?: boolean;
  tiempoMs?: number;
  tiempoSeg?: number;
  seleccionIndices?: number[];
  seleccionTextos?: string[];
  correctasIndices?: number[];
  correctasTextos?: string[];
};

type Body = {
  nombre: string;
  apellido: string;
  email: string;
  score: number;
  total: number;
  tiempoSegundos: number;
  respuestas: ReadableRow[];    // versión legible que manda el front
  userAgent?: string;           // opcional; ignorado al guardar
};

/** ===== CORS ===== */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // si querés, cambiá por tu dominio
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** ===== Util ===== */
function errorToString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

/** Forzamos dinámico (evita que Next estaticar la ruta) */
export const dynamic = "force-dynamic";

/** ===== Handlers ===== */
export async function GET() {
  return new Response(JSON.stringify({ ok: true, route: "/api/save" }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Lee credenciales Google desde variables de entorno de forma robusta
function getGoogleCreds() {
  // Opción A: TODO el JSON del service account en base64
  const jsonB64 = process.env.GOOGLE_CREDENTIALS_BASE64;

  if (jsonB64 && jsonB64.trim() !== "") {
    const json = Buffer.from(jsonB64, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return {
      client_email: parsed.client_email as string,
      private_key: String(parsed.private_key).replace(/\\n/g, "\n"),
    };
  }

  // Opción B: email + private key (texto plano o base64)
  const client_email = process.env.GOOGLE_SERVICE_EMAIL || "";
  let key =
    process.env.GOOGLE_PRIVATE_KEY ||
    (process.env.GOOGLE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, "base64").toString(
          "utf8"
        )
      : "");

  // Arregla los saltos de línea escapados
  key = key.replace(/\\n/g, "\n");

  if (!client_email || !key) {
    throw new Error(
      "Faltan credenciales: defina GOOGLE_CREDENTIALS_BASE64 o GOOGLE_SERVICE_EMAIL + (GOOGLE_PRIVATE_KEY | GOOGLE_PRIVATE_KEY_BASE64)"
    );
  }

  return { client_email, private_key: key };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // Validación mínima
    if (!body?.email || !body?.nombre || !body?.apellido) {
      return new Response(JSON.stringify({ ok: false, error: "Faltan datos" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    /** Auth (Service Account) */
    /**const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!; */
    /** const privateKeyRaw = process.env.GOOGLE_SHEETS_PRIVATE_KEY || ""; */
    /** const privateKey = privateKeyRaw.replace(/\\n/g, "\n"); */

    // ✅ versión nueva
    const { client_email, private_key } = getGoogleCreds();

    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });


    const sheets = google.sheets({ version: "v4", auth });

    /** IDs y pestañas */
    const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID!;
    const tab = process.env.GOOGLE_SHEETS_TAB_NAME || "Respuestas";

    /** == Construimos un RESUMEN legible para verlo en Excel == */
    const filas: ReadableRow[] = Array.isArray(body.respuestas) ? body.respuestas : [];
    const sep = process.env.GOOGLE_SHEETS_RESUMEN_SEP ?? "\n"; // "\n" = varias líneas en una celda; usa " / " si preferís una sola línea

    const resumen =
      filas.length === 0
        ? "(sin preguntas)"
        : filas
            .map((r, i) => {
              const ref = r.imagenNombre || r.imagen || String(r.preguntaId ?? i + 1);
              const est = r.estado ?? (r.ok ? "correcto" : "incorrecto");
              const sel = (r.seleccionTextos || []).join(", ") || "(sin selección)";
              const cor = (r.correctasTextos || []).join(", ");
              const t = typeof r.tiempoSeg === "number" ? ` | ${r.tiempoSeg}s` : "";
              return `${i + 1}) ${ref}: ${est} — marcó: ${sel}; correctas: ${cor}${t}`;
            })
            .join(sep);

    /** == Fila principal (pestaña Respuestas) ==
     * Solo 8 columnas: A:H
     */
    const mainValues = [
      [
        new Date().toISOString(), // timestamp ISO
        body.nombre,
        body.apellido,
        body.email,
        Number(body.score) || 0,
        Number(body.total) || 0,
        Number(body.tiempoSegundos) || 0,
        resumen, // 👈 detalle_resumen
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A:H`, // ahora guardamos hasta H (detalle_resumen). No más JSON ni userAgent.
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: mainValues },
    });

    /** == (Opcional) Detalle por pregunta en otra pestaña ==
     * Activalo creando la variable de entorno GOOGLE_SHEETS_DETAIL_TAB=Detalle
     * y creando una pestaña llamada "Detalle" con cabeceras:
     * timestamp | nombre | apellido | email | # | preguntaId | imagen | enunciado | estado | ok | tiempo_seg | seleccion | correctas
     */
    const detalleTab = process.env.GOOGLE_SHEETS_DETAIL_TAB; // ej: "Detalle"
    if (detalleTab && filas.length) {
      const detalleValues = filas.map((r, i) => [
        new Date().toISOString(),
        body.nombre,
        body.apellido,
        body.email,
        i + 1, // orden
        r.preguntaId ?? "",
        r.imagenNombre || r.imagen || "",
        r.enunciado || "",
        r.estado ?? (r.ok ? "correcto" : "incorrecto"),
        r.ok ? "TRUE" : "FALSE",
        r.tiempoSeg ?? "",
        (r.seleccionTextos || []).join(" | "),
        (r.correctasTextos || []).join(" | "),
      ]);

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${detalleTab}!A:M`, // 13 columnas
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: detalleValues },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err: unknown) {
    const msg = errorToString(err);
    console.error("Sheets error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}
