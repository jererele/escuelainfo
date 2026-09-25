// ─── EscuelaInfo — Utilidad de Rate Limiting y Control de Abuso ────────────────
// Provee limitación de frecuencia por IP y clave (email/token) en memoria
// para proteger rutas de API contra ataques de fuerza bruta y saturación de servicios.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpieza periódica de registros vencidos cada 5 minutos
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredRecords(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Verifica si una acción excede la cuota de peticiones permitidas en una ventana de tiempo.
 *
 * @param key Identificador único (ej: `send-code:ip:1.2.3.4` o `send-code:email:user@mail.com`)
 * @param maxRequests Máximo número de intentos permitidos en la ventana
 * @param windowMs Duración de la ventana de tiempo en milisegundos
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  purgeExpiredRecords();

  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Resetea el conteo para una clave específica (por ejemplo tras una autenticación exitosa).
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Extrae la dirección IP del cliente a partir de los encabezados HTTP estándar de proxy/Vercel.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
