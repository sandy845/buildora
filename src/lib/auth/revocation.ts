import { isRedisConfigured } from "@/lib/rate-limit";

// In-memory revocation cache for single-instance, local dev, and testing
const inMemoryRevokedSessions = new Map<string, number>(); // sessionId -> expiresAt
const inMemoryUserRevocations = new Map<string, number>(); // userId -> revokedBeforeTimestamp

/**
 * Revokes an individual session token by its unique sessionId until its expiry.
 */
export async function revokeSessionToken(sessionId: string, expiresAt: number): Promise<void> {
  if (!sessionId) return;
  inMemoryRevokedSessions.set(sessionId, expiresAt);

  if (isRedisConfigured()) {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      const ttlSec = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));

      await fetch(`${redisUrl}/set/revoked_session:${sessionId}/1/EX/${ttlSec}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
    } catch (err) {
      console.warn("[auth/revocation] Failed to write session revocation to Redis:", err);
    }
  }
}

/**
 * Checks whether a specific sessionId has been revoked.
 */
export async function isSessionTokenRevoked(sessionId: string): Promise<boolean> {
  if (!sessionId) return true;

  const localExpiry = inMemoryRevokedSessions.get(sessionId);
  if (localExpiry) {
    if (localExpiry > Date.now()) {
      return true;
    }
    inMemoryRevokedSessions.delete(sessionId);
  }

  if (isRedisConfigured()) {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      const res = await fetch(`${redisUrl}/get/revoked_session:${sessionId}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json() as { result?: string | null };
        return Boolean(data.result);
      }
    } catch (err) {
      console.warn("[auth/revocation] Failed to check session revocation in Redis:", err);
    }
  }

  return false;
}

/**
 * Revokes all sessions for a user issued prior to this moment (e.g., after password reset).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  const now = Date.now();
  inMemoryUserRevocations.set(userId, now);

  if (isRedisConfigured()) {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      // Keep revocation timestamp for 7 days (max session duration)
      const ttlSec = 7 * 24 * 60 * 60;

      await fetch(`${redisUrl}/set/user_revoked_before:${userId}/${now}/EX/${ttlSec}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
    } catch (err) {
      console.warn("[auth/revocation] Failed to record user session revocation in Redis:", err);
    }
  }
}

/**
 * Checks whether a session created at `sessionCreatedAt` is invalidated by a user-wide revocation.
 */
export async function isUserSessionRevoked(userId: string, sessionCreatedAt: number): Promise<boolean> {
  if (!userId) return true;

  const localTimestamp = inMemoryUserRevocations.get(userId);
  if (localTimestamp && sessionCreatedAt <= localTimestamp) {
    return true;
  }

  if (isRedisConfigured()) {
    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      const res = await fetch(`${redisUrl}/get/user_revoked_before:${userId}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json() as { result?: string | null };
        if (data.result) {
          const revokedBefore = Number(data.result);
          if (Number.isFinite(revokedBefore) && sessionCreatedAt <= revokedBefore) {
            return true;
          }
        }
      }
    } catch (err) {
      console.warn("[auth/revocation] Failed to check user revocation in Redis:", err);
    }
  }

  return false;
}

