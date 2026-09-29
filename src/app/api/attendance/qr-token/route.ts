import { NextResponse } from 'next/server';
import { Client, Account, Databases, Query } from 'node-appwrite';
import { signQrToken } from '@/lib/otpStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      return NextResponse.json({ error: "No autorizado: se requiere sesión activa para emitir códigos QR." }, { status: 401 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6a2af00d002d86d3dd20";
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    // Validar sesión del emisor
    const authClient = new Client().setEndpoint(endpoint).setProject(projectId).setJWT(jwt);
    const authAccount = new Account(authClient);
    let sessionUser;
    try {
      sessionUser = await authAccount.get();
    } catch {
      return NextResponse.json({ error: "Sesión inválida o expirada." }, { status: 401 });
    }

    if (!sessionUser || !sessionUser.email) {
      return NextResponse.json({ error: "Usuario emisor no válido." }, { status: 401 });
    }

    // Validar rol del emisor (profesor, preceptor, directivo, admin)
    if (apiKey) {
      const adminClient = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
      const db = new Databases(adminClient);
      const userDocs = await db.listDocuments(dbId, 'usuarios', [Query.equal('email', sessionUser.email.toLowerCase().trim())]);
      if (userDocs.total > 0 && userDocs.documents[0]) {
        const rol = (userDocs.documents[0].rol || '').toLowerCase();
        const allowed = ['admin', 'directivo', 'preceptor', 'profesor', 'ad', 'd', 'pp', 'p'];
        if (!allowed.includes(rol)) {
          return NextResponse.json({ error: "Solo docentes, preceptores y directivos pueden emitir códigos QR de asistencia." }, { status: 403 });
        }
      }
    }

    const { mode = "jornada", selectedMateria = "jornada", issuerId = "" } = await request.json();

    const payload = {
      t: Date.now(),
      m: String(mode),
      s: String(selectedMateria),
      p: String(issuerId || sessionUser.$id || sessionUser.email),
    };

    const token = signQrToken(payload);

    return NextResponse.json({
      success: true,
      token,
      expiresInSeconds: 20
    });
  } catch (error: any) {
    console.error("[qr-token] Error al generar token QR firmado:", error);
    return NextResponse.json({ error: error.message || "Error al emitir código QR" }, { status: 500 });
  }
}
