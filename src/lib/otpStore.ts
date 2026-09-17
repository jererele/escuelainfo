// ─── EscuelaInfo — Gestor en Memoria de Códigos OTP de Verificación ───────────

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

// Almacén en memoria global para el proceso de Node.js
const otpMap = new Map<string, OtpEntry>();

const MAX_ATTEMPTS = 5;
const DEFAULT_TTL_MINUTES = 10;

/**
 * Guarda un código OTP numérico para un correo electrónico dado.
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
 * Verifica si el código provisto coincide con el almacenado y si aún está vigente.
 */
export function verifyOtp(email: string, code: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpMap.get(normalizedEmail);

  if (!entry) {
    return { valid: false, error: "No se encontró ningún código solicitado o ya expiró. Solicitá uno nuevo." };
  }

  if (Date.now() > entry.expiresAt) {
    otpMap.delete(normalizedEmail);
    return { valid: false, error: "El código de verificación ha vencido (validez de 10 min). Solicitá uno nuevo." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpMap.delete(normalizedEmail);
    return { valid: false, error: "Demasiados intentos fallidos. Por seguridad, solicitá un nuevo código." };
  }

  entry.attempts += 1;

  if (entry.code !== code.trim()) {
    return {
      valid: false,
      error: `Código incorrecto. Te quedan ${MAX_ATTEMPTS - entry.attempts} intento(s).`,
    };
  }

  // Código correcto: eliminar para que sea de un solo uso
  otpMap.delete(normalizedEmail);
  return { valid: true };
}

/**
 * Limpia el código de un email.
 */
export function clearOtp(email: string): void {
  otpMap.delete(email.trim().toLowerCase());
}
