import { NextResponse } from 'next/server';
import { verifyOtp, verifyOtpToken } from '@/lib/otpStore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const { email, code, token, tokens } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Debes proporcionar el correo electrónico y el código de 6 dígitos.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { error: 'El código de verificación debe tener 6 dígitos numéricos.' },
        { status: 400 }
      );
    }

    // 🛡️ SECURITY AUDIT REF: Protección contra Fuerza Bruta en verificación de OTP
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`verify-code:ip:${clientIp}`, 10, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos desde esta conexión. Esperá ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    const emailCheck = checkRateLimit(`verify-code:email:${cleanEmail}`, 6, 10 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos fallidos para este correo. Solicitá un nuevo código en ${Math.ceil(emailCheck.retryAfterSeconds / 60)} minuto(s).` },
        { status: 429 }
      );
    }

    // 1. Validar por HMAC Token firmado (admite lista de tokens de reenvío)
    let tokensList: string[] = [];
    if (Array.isArray(tokens)) {
      tokensList = tokens.filter(t => typeof t === 'string' && t.trim().length > 0);
    } else if (typeof token === 'string' && token.trim()) {
      tokensList = [token.trim()];
    }

    if (tokensList.length === 0) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/escuelainfo_otp_token=([^;]+)/);
      if (match) {
        tokensList = [decodeURIComponent(match[1])];
      }
    }

    let verification: { valid: boolean; token?: string; error?: string } = { valid: false };

    if (tokensList.length > 0) {
      verification = verifyOtpToken(cleanEmail, cleanCode, tokensList);
    }

    // 2. Fallback de validación en memoria
    if (!verification.valid) {
      const memCheck = verifyOtp(cleanEmail, cleanCode);
      if (memCheck.valid) {
        verification = memCheck;
      } else if (!verification.error) {
        verification.error = memCheck.error;
      }
    }

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Código incorrecto o vencido. Verificá los 6 dígitos recibidos.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Correo electrónico verificado con éxito.',
    });
  } catch (error: any) {
    console.error('Error al validar código OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al validar el código de verificación.' },
      { status: 500 }
    );
  }
}
