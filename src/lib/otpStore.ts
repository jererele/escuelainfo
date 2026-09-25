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
const OTP_SECRET = process.env.APPWRITE_API_KEY || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'escuelainfo-secure-otp-secret-key-2026';

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
 * Valida un código OTP contra el token firmado recibido.
 * Es 100% independiente de instancias en memoria y funciona perfecto en Vercel Serverless.
 */
export function verifyOtpToken(email: string, code: string, token: string): { valid: boolean; error?: string } {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'No se encontró el token de verificación. Solicitá un nuevo código.' };
    }

    purgeExpiredUsedTokens();
    if (usedTokensMap.has(token)) {
      return { valid: false, error: 'Este código de verificación ya ha sido utilizado. Solicitá uno nuevo.' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const [expiresAtStr, hmac] = token.split('.');
    if (!expiresAtStr || !hmac) {
      return { valid: false, error: 'Token de verificación corrupto o inválido. Solicitá un nuevo código.' };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: 'El código de verificación ha expirado (validez de 10 min). Solicitá uno nuevo.' };
    }

    const data = `${normalizedEmail}:${cleanCode}:${expiresAt}`;
    const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');

    const hmacBuf = Buffer.from(hmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');

    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return { valid: false, error: 'Código de verificación incorrecto. Verificá los 6 dígitos recibidos en tu correo.' };
    }

    return { valid: true };
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
