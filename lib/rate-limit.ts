// In-memory sliding window rate limiter
// Mencegah brute force attack pada endpoint sensitif (seperti login)
// Dapat dihubungkan ke Upstash Redis jika aplikasi di-deploy multi-instance/serverless

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Bersihkan entri kedaluwarsa secara berkala untuk mencegah kebocoran memori
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Memeriksa apakah request dari key (misal: IP address atau email) melampaui batas yang diizinkan.
 * @param key Identifier unik (misal: `login_ip_${ip}`)
 * @param maxAttempts Jumlah maksimum request dalam kurun waktu windowMs
 * @param windowMs Durasi time window dalam milidetik (default: 60 detik)
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxAttempts) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetSeconds,
  };
}

/**
 * Reset rate limit untuk key tertentu (misal setelah login berhasil)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
