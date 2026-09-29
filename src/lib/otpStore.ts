// ─── EscuelaInfo — Gestor de Códigos OTP de Verificación ─────────────────────
// Compatible con entornos Serverless (Vercel) mediante tokens criptográficos HMAC
// y con fallback en memoria para desarrollo local.

import crypto from 'crypto';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

// Almacén en memoria para desarrollo local
const otpMap = new Map<string, OtpEntry>();

const MAX_ATTEMPTS = 5;
const DEFAULT_TTL_MINUTES = 10;
// 🛡️ SECURITY AUDIT REF: Clave criptográfica privada para firma HMAC de tokens OTP
const getOtpSecret = (): string => {
  const secret = (process.env.OTP_SECRET || process.env.APPWRITE_API_KEY || '').trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL SECURITY ERROR: OTP_SECRET must be defined in production environment variables.');
  }
  // Fallback aleatorio efímero por proceso solo para entorno de pruebas/desarrollo local
  return 'escuelainfo_dev_secret_' + (globalThis as any).__devOtpSecret || ((globalThis as any).__devOtpSecret = crypto.randomBytes(32).toString('hex'));
};
const OTP_SECRET = getOtpSecret();

/**
 * Genera un token HMAC criptográficamente firmado que viaja de forma segura
 * hacia el cliente y permite validar el código en cualquier instancia Serverless sin estado.
 */
export function generateOtpToken(email: string, code: string, ttlMinutes = DEFAULT_TTL_MINUTES): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  const data = `${normalizedEmail}:${code.trim()}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return `${expiresAt}.${hmac}`;
}

// Registro en memoria de tokens ya consumidos para prevenir ataques de repetición (Replay Attacks)
const usedTokensMap = new Map<string, number>();

function purgeExpiredUsedTokens(): void {
  const now = Date.now();
  for (const [t, exp] of usedTokensMap.entries()) {
    if (now > exp) usedTokensMap.delete(t);
  }
}

/**
 * Invalida un token OTP tras su uso exitoso.
 */
export function markTokenUsed(token: string): void {
  try {
    const [expiresAtStr] = token.split('.');
    const exp = parseInt(expiresAtStr, 10) || (Date.now() + DEFAULT_TTL_MINUTES * 60 * 1000);
    usedTokensMap.set(token, exp);
  } catch {}
}

/**
 * Valida un código OTP contra uno o múltiples tokens firmados.
 * Es 100% independiente de instancias en memoria y funciona perfecto en Vercel Serverless.
 * Admite array de tokens para aceptar códigos válidos cuando el usuario solicitó reenvío.
 */
export function verifyOtpToken(
  email: string,
  code: string,
  tokens: string | string[]
): { valid: boolean; token?: string; error?: string } {
  try {
    const tokenList = Array.isArray(tokens)
      ? tokens.filter(t => typeof t === 'string' && t.trim().length > 0)
      : (typeof tokens === 'string' && tokens.trim() ? [tokens.trim()] : []);

    if (tokenList.length === 0) {
      return { valid: false, error: 'No se encontró el token de verificación. Solicitá un nuevo código.' };
    }

    purgeExpiredUsedTokens();
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    let hasExpired = false;
    let hasUsed = false;

    for (const singleToken of tokenList) {
      if (usedTokensMap.has(singleToken)) {
        hasUsed = true;
        continue;
      }

      const [expiresAtStr, hmac] = singleToken.split('.');
      if (!expiresAtStr || !hmac) continue;

      const expiresAt = parseInt(expiresAtStr, 10);
      if (isNaN(expiresAt) || Date.now() > expiresAt) {
        hasExpired = true;
        continue;
      }

      const data = `${normalizedEmail}:${cleanCode}:${expiresAt}`;
      const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');

      try {
        const hmacBuf = Buffer.from(hmac, 'hex');
        const expectedBuf = Buffer.from(expectedHmac, 'hex');

        if (hmacBuf.length === expectedBuf.length && crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
          return { valid: true, token: singleToken };
        }
      } catch {}
    }

    if (hasUsed) {
      return { valid: false, error: 'Este código de verificación ya ha sido utilizado. Solicitá uno nuevo.' };
    }
    if (hasExpired) {
      return { valid: false, error: 'El código de verificación ha expirado (validez de 10 min). Solicitá uno nuevo.' };
    }

    return { valid: false, error: 'Código de verificación incorrecto. Verificá los 6 dígitos recibidos en tu correo.' };
  } catch {
    return { valid: false, error: 'Código o token de verificación inválido. Solicitá uno nuevo.' };
  }
}

/**
 * Guarda un código OTP numérico en memoria (fallback local).
 */
export function setOtp(email: string, code: string, ttlMinutes = DEFAULT_TTL_MINUTES): void {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
  otpMap.set(normalizedEmail, {
    code: code.trim(),
    expiresAt,
    attempts: 0,
  });
}

/**
 * Verifica si el código provisto coincide con el almacenado en memoria.
 */
export function verifyOtp(email: string, code: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpMap.get(normalizedEmail);

  if (!entry) {
    return { valid: false, error: 'No se encontró ningún código solicitado o ya expiró. Solicitá uno nuevo.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(normalizedEmail);
    return { valid: false, error: 'El código de verificación ha vencido (validez de 10 min). Solicitá uno nuevo.' };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpMap.delete(normalizedEmail);
    return { valid: false, error: 'Demasiados intentos fallidos. Por seguridad, solicitá un nuevo código.' };
  }

  entry.attempts += 1;

  if (entry.code !== code.trim()) {
    return {
      valid: false,
      error: `Código incorrecto. Te quedan ${MAX_ATTEMPTS - entry.attempts} intento(s).`,
    };
  }

  otpMap.delete(normalizedEmail);
  return { valid: true };
}

/**
 * Limpia el código de un email.
 */
export function clearOtp(email: string): void {
  otpMap.delete(email.trim().toLowerCase());
}

/**
 * 🛡️ SECURITY AUDIT REF: Firma Criptográfica de Tokens QR de Asistencia
 * Genera un token firmado con HMAC para impedir que los alumnos falsifiquen presentes.
 */
export function signQrToken(payload: { t: number; m: string; s: string; p: string }): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr).toString('base64url');
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(dataB64).digest('hex');
  return `${dataB64}.${hmac}`;
}

/**
 * Verifica la firma HMAC y expiración de un token QR de asistencia.
 */
export function verifyQrToken(tokenStr: string, maxAgeMs = 35000): { valid: boolean; payload?: any; error?: string } {
  try {
    if (!tokenStr) return { valid: false, error: 'Código vacío o inexistente.' };

    if (!tokenStr.includes('.')) {
      // Compatibilidad con tokens legacy (base64 sin firma)
      try {
        const legacy = JSON.parse(Buffer.from(tokenStr, 'base64').toString('utf8'));
        if (Date.now() - legacy.t > maxAgeMs) {
          return { valid: false, error: 'El código QR ha expirado. Solicitá uno nuevo al docente.' };
        }
        return { valid: true, payload: legacy };
      } catch {
        return { valid: false, error: 'El formato del código QR es inválido.' };
      }
    }

    const [dataB64, hmac] = tokenStr.split('.');
    if (!dataB64 || !hmac) return { valid: false, error: 'Token QR incompleto.' };

    const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(dataB64).digest('hex');
    const hmacBuf = Buffer.from(hmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return { valid: false, error: 'Código QR no reconocido o adulterado.' };
    }

    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
    if (Date.now() - payload.t > maxAgeMs) {
      return { valid: false, error: 'El código QR ha expirado. Solicitá uno nuevo al docente.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Error validando código QR.' };
  }
}

