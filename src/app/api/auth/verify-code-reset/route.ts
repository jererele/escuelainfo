import { NextResponse } from 'next/server';
import { Client, Users, Databases, ID, Query } from 'node-appwrite';
import { verifyOtp, verifyOtpToken, markTokenUsed, clearOtp } from '@/lib/otpStore';
import { checkRateLimit, resetRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { email, code, token, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Debes completar el correo, el código de 6 dígitos y la nueva contraseña.' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 🛡️ SECURITY AUDIT REF: Detección y bloqueo contra Ataques de Fuerza Bruta en Códigos OTP
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`verify-otp:ip:${clientIp}`, 10, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos fallidos desde esta conexión. Por favor esperá ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const emailAttemptCheck = checkRateLimit(`verify-otp:email:${cleanEmail}`, 6, 10 * 60 * 1000);
    if (!emailAttemptCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos fallidos para esta cuenta. Por seguridad, solicitá un nuevo código en ${Math.ceil(emailAttemptCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    // Conectar a Appwrite Server SDK con Admin Key
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'escuelainfodb';

    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: 'Error de configuración del servidor Appwrite.' }, { status: 500 });
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const users = new Users(client);
    const databases = new Databases(client);

    // 1. Triple validación del código OTP:
    // A) Token criptográfico HMAC (compatible con Serverless Vercel)
    let verificationToken = typeof token === 'string' ? token.trim() : '';
    if (!verificationToken) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/escuelainfo_otp_token=([^;]+)/);
      if (match) {
        verificationToken = decodeURIComponent(match[1]);
      }
    }

    let verification: { valid: boolean; error?: string } = { valid: false };

    if (verificationToken) {
      verification = verifyOtpToken(cleanEmail, cleanCode, verificationToken);
    }

    // B) Almacén en memoria (fallback local)
    if (!verification.valid) {
      const memCheck = verifyOtp(cleanEmail, cleanCode);
      if (memCheck.valid) {
        verification = memCheck;
      } else if (!verification.error) {
        verification.error = memCheck.error;
      }
    }

    // C) Respaldo persistente en Base de Datos de Appwrite
    if (!verification.valid) {
      try {
        const uDocs = await databases.listDocuments(dbId, 'usuarios', [Query.equal('email', cleanEmail)]);
        if (uDocs.total > 0 && uDocs.documents[0].otpCode) {
          const [storedCode, expiresAtStr] = (uDocs.documents[0].otpCode as string).split(':');
          const expiresAt = parseInt(expiresAtStr, 10);
          if (Date.now() <= expiresAt && storedCode === cleanCode) {
            verification = { valid: true };
            // Invalida el código para evitar reutilización
            await databases.updateDocument(dbId, 'usuarios', uDocs.documents[0].$id, { otpCode: null }).catch(() => {});
          } else if (Date.now() > expiresAt) {
            verification = { valid: false, error: 'El código de verificación ha expirado. Solicitá uno nuevo.' };
          }
        }
      } catch (dbErr: any) {
        console.warn('Error verificando otpCode en base de datos:', dbErr?.message);
      }
    }

    if (!verification.valid) {
      return NextResponse.json({
        error: verification.error || 'Código incorrecto o expirado. Solicitá uno nuevo.'
      }, { status: 400 });
    }

    // 2. Buscar el usuario por email
    const list = await users.list([Query.equal('email', cleanEmail)]);
    if (list.total === 0 || !list.users[0]) {
      return NextResponse.json({ error: 'No se encontró la cuenta de usuario para actualizar la contraseña.' }, { status: 404 });
    }

    const targetUser = list.users[0];

    // 4. Actualizar la contraseña en el servicio de Auth de Appwrite
    await users.updatePassword(targetUser.$id, newPassword);

    // 🛡️ SECURITY AUDIT REF: Invalida el token de un solo uso y limpia el caché de verificación
    if (verificationToken) {
      markTokenUsed(verificationToken);
    }
    clearOtp(cleanEmail);
    resetRateLimit(`verify-otp:email:${cleanEmail}`);

    // 5. Registrar log de auditoría
    try {
      await databases.createDocument(dbId, 'logs', ID.unique(), {
        usuarioEmail: cleanEmail,
        accion: 'CAMBIO_PASSWORD_OTP',
        detalles: 'Contraseña actualizada con éxito mediante código de verificación por correo.',
        fecha: new Date().toISOString(),
        ip: 'API_ROUTE',
      });
    } catch (logErr) {
      console.warn('No se pudo registrar el log de auditoría de cambio de password:', logErr);
    }

    const response = NextResponse.json({
      success: true,
      message: '¡Tu contraseña ha sido actualizada con éxito! Ya podés ingresar.',
    });
    response.cookies.delete('escuelainfo_otp_token');
    return response;
  } catch (error: any) {
    console.error('Error al verificar código y actualizar contraseña:', error);
    return NextResponse.json(
      { error: error?.message || 'Ocurrió un error al actualizar la contraseña. Intentá nuevamente.' },
      { status: 500 }
    );
  }
}
