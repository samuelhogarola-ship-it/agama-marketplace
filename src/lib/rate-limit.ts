/**
 * Rate limiting por ventana fija, en memoria del proceso.
 *
 * Limitación conocida: el estado no se comparte entre instancias ni sobrevive a
 * un reinicio. Suficiente para frenar abuso desde un solo cliente; si el deploy
 * pasa a varias réplicas hay que moverlo a Redis o a un contador en BD.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Purga entradas vencidas para que el Map no crezca sin límite. */
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

export type RateLimitOptions = {
  /** Identificador del cliente: user id, IP, o `${userId}:${accion}`. */
  key: string;
  /** Peticiones permitidas dentro de la ventana. */
  max: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
};

/**
 * Registra una petición y devuelve `true` si supera el límite.
 * Cuenta la petición actual, así que llamarla ya consume cupo.
 */
export function isRateLimited({ key, max, windowMs }: RateLimitOptions): boolean {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    sweep(now);
    lastSweep = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count++;
  return bucket.count > max;
}
