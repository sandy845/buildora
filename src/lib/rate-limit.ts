/**
 * Buildora Rate Limiter.
 *
 * Dual-backend architecture:
 *   1. Redis backend (Upstash REST or standard Redis) when UPSTASH_REDIS_REST_URL is configured.
 *   2. High-performance sliding-window in-memory store (default fallback for single-instance,
 *      development, and test environments).
 *
 * Pre-configured limiters:
 *   - authLoginLimiter: 10 attempts / 15 min per IP
 *   - authRegisterLimiter: 5 registrations / 1 hour per IP
 *   - leadFormLimiter: 5 submissions / 10 min per IP
 */

type RateLimitEntry = { count: number; resetAt: number };

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number; retryAfterMs?: never }
  | { success: false; remaining: 0; retryAfterMs: number; resetAt: number };

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export class RateLimiter {
  readonly limit: number;
  readonly windowMs: number;
  private readonly store = new Map<string, RateLimitEntry>();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;

  constructor({ limit, windowMs }: { limit: number; windowMs: number }) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** Start background pruning so expired keys don't accumulate in memory. */
  startPruning(intervalMs = 60_000) {
    if (this.pruneTimer) return this;
    this.pruneTimer = setInterval(() => this.prune(), intervalMs);
    if (typeof this.pruneTimer === "object" && "unref" in this.pruneTimer) {
      (this.pruneTimer as NodeJS.Timeout).unref();
    }
    return this;
  }

  /**
   * Fast synchronous rate-limit check using the in-memory sliding window.
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { success: true, remaining: this.limit - 1, resetAt };
    }

    if (entry.count >= this.limit) {
      return {
        success: false,
        remaining: 0,
        retryAfterMs: entry.resetAt - now,
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    return {
      success: true,
      remaining: this.limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Async rate-limit check with automatic Redis integration (Upstash REST)
   * and fallback to in-memory store.
   */
  async checkAsync(key: string): Promise<RateLimitResult> {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        const windowSec = Math.ceil(this.windowMs / 1000);
        const redisKey = `ratelimit:${key}`;

        // Atomic pipeline: INCR and EXPIRE if new key
        const response = await fetch(`${redisUrl}/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${redisToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            ["INCR", redisKey],
            ["EXPIRE", redisKey, windowSec],
          ]),
          // Short timeout so Redis issues never hang user requests
          signal: AbortSignal.timeout(1500),
        });

        if (response.ok) {
          const results = await response.json();
          const currentCount = Number(results[0]?.result ?? 1);
          const now = Date.now();
          const resetAt = now + this.windowMs;

          if (currentCount > this.limit) {
            return {
              success: false,
              remaining: 0,
              retryAfterMs: this.windowMs,
              resetAt,
            };
          }

          return {
            success: true,
            remaining: Math.max(0, this.limit - currentCount),
            resetAt,
          };
        }
      } catch (redisErr) {
        console.warn("[rate-limit] Redis unavailable, falling back to in-memory limiter:", redisErr);
      }
    }

    // Default to in-memory sliding window
    return this.check(key);
  }

  /** Reset a key (useful for testing or after successful verification) */
  reset(key: string) {
    this.store.delete(key);
  }

  private prune() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt <= now) this.store.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Standard HTTP headers generator for Rate Limiting
// ---------------------------------------------------------------------------

export function getRateLimitHeaders(
  result: RateLimitResult,
  limit: number
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.success) {
    headers["Retry-After"] = String(Math.ceil(result.retryAfterMs / 1000));
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** Contact / lead form: max 5 submissions per IP per 10 minutes. */
export const leadFormLimiter = new RateLimiter({
  limit: 5,
  windowMs: 10 * 60_000,
}).startPruning();

/** Auth login: max 10 attempts per IP per 15 minutes. */
export const authLoginLimiter = new RateLimiter({
  limit: 10,
  windowMs: 15 * 60_000,
}).startPruning();

/** Auth register: max 5 registrations per IP per hour. */
export const authRegisterLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 60_000,
}).startPruning();

/**
 * Extract the real client IP from a Next.js request or headers context.
 */
export function getClientIp(headerMap: Headers | null | undefined): string {
  if (!headerMap) return "127.0.0.1";
  return (
    headerMap.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerMap.get("x-real-ip") ??
    "127.0.0.1"
  );
}
