import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const env = process.env;

  const rawJson   = env.GOOGLE_SERVICE_ACCOUNT || "";
  const b64Json   = env.GOOGLE_CREDENTIALS_BASE64 || "";
  const emailA    = env.GOOGLE_SERVICE_EMAIL || "";
  const emailB    = env.GOOGLE_CLIENT_EMAIL || "";
  const keyPlainA = env.GOOGLE_PRIVATE_KEY || "";
  const keyPlainB = env.GOOGLE_CLIENT_PRIVATE_KEY || "";
  const keyB64    = env.GOOGLE_PRIVATE_KEY_BASE64 || "";
  const sheetId   = env.SHEET_ID || "";
  const sheetTab  = env.SHEET_TAB || "";

  return NextResponse.json({
    // ¿Qué variables EXISTEN? (true/false) + longitud para ver si están vacías
    GOOGLE_SERVICE_ACCOUNT: { present: !!rawJson,   len: rawJson.length   },
    GOOGLE_CREDENTIALS_BASE64: { present: !!b64Json, len: b64Json.length  },
    GOOGLE_SERVICE_EMAIL: { present: !!emailA,      len: emailA.length    },
    GOOGLE_CLIENT_EMAIL: { present: !!emailB,       len: emailB.length    },
    GOOGLE_PRIVATE_KEY: { present: !!keyPlainA,     len: keyPlainA.length },
    GOOGLE_CLIENT_PRIVATE_KEY: { present: !!keyPlainB, len: keyPlainB.length },
    GOOGLE_PRIVATE_KEY_BASE64: { present: !!keyB64, len: keyB64.length    },
    SHEET_ID: { present: !!sheetId,                 len: sheetId.length   },
    SHEET_TAB: { present: !!sheetTab,               len: sheetTab.length  },
    // Nota: NO devolvemos los valores reales, solo si están y su longitud.
  });
}
