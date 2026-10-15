import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isFirebaseClientConfigured, isFirebaseAdminConfigured } from "@/lib/firebase/config";
import { getStorageProviderName, isStorageConfigured } from "@/lib/storage";
import { getEmailProviderStatus } from "@/lib/email";
import { isRedisConfigured } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatencyMs = -1;
  let dbError: string | undefined;

  // 1. Check PostgreSQL database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (err: unknown) {
    dbStatus = "disconnected";
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[health] PostgreSQL connectivity check failed:", dbError);
  }

  // 2. Storage status
  const storageConfigured = isStorageConfigured();
  const storageProvider = getStorageProviderName();

  // 3. Email provider status
  const emailStatus = getEmailProviderStatus();
  const sessionSecretConfigured = Boolean(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32
  );

  // 4. Rate limiter backend
  const rateLimitBackend = isRedisConfigured() ? "redis" : "in-memory";

  // 5. System memory & process stats
  const memoryUsage = process.memoryUsage();
  const memory = {
    rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
  };

  const isHealthy = dbStatus === "connected" && sessionSecretConfigured;
  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latencyMs: totalDurationMs,
      services: {
        database: {
          type: "postgresql",
          status: dbStatus,
          latencyMs: dbLatencyMs,
          configured: Boolean(process.env.DATABASE_URL),
          firebaseAdminConfigured: isFirebaseAdminConfigured(),
          firebaseClientConfigured: isFirebaseClientConfigured(),
          error: dbError,
        },
        storage: {
          status: storageConfigured ? "configured" : "unconfigured",
          provider: storageProvider,
        },
        email: emailStatus,
        auth: {
          sessionSecretConfigured,
        },
        rateLimiter: {
          backend: rateLimitBackend,
        },
      },
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memory,
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
