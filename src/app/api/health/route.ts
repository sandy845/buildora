import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStorageProviderName, isStorageConfigured } from "@/lib/storage";
import { getEmailProviderStatus } from "@/lib/email";
import { isRedisConfigured } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatencyMs = -1;
  let dbError: string | undefined;

  // 1. Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRawUnsafe("SELECT 1");
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (err: unknown) {
    dbStatus = "disconnected";
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[health] Database ping failed:", dbError);
  }

  // 2. Storage status
  const storageConfigured = isStorageConfigured();
  const storageProvider = getStorageProviderName();

  // 3. Email provider status
  const emailStatus = getEmailProviderStatus();

  // 4. Rate limiter backend
  const rateLimitBackend = isRedisConfigured() ? "redis" : "in-memory";

  // 5. System memory & process stats
  const memoryUsage = process.memoryUsage();
  const memory = {
    rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
  };

  const isHealthy = dbStatus === "connected";
  const overallStatus = !isHealthy
    ? "unhealthy"
    : storageConfigured && emailStatus.configured
      ? "healthy"
      : "degraded";

  const totalDurationMs = Date.now() - startTime;

  const payload = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    durationMs: totalDurationMs,
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        error: dbError,
      },
      storage: {
        provider: storageProvider,
        configured: storageConfigured,
      },
      email: {
        provider: emailStatus.provider,
        configured: emailStatus.configured,
      },
      rateLimiter: {
        backend: rateLimitBackend,
      },
    },
    system: {
      nodeVersion: process.version,
      memory,
    },
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
