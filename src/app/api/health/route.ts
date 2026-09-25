import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
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

  // 1. Check Firebase Firestore database connectivity
  try {
    const dbStart = Date.now();
    const db = getAdminDb();
    if (db) {
      // Light check to test connectivity
      await db.collection("users").limit(1).get();
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "connected";
    } else {
      // In-memory fallback mode
      dbLatencyMs = 0;
      dbStatus = "connected";
    }
  } catch (err: unknown) {
    dbStatus = "disconnected";
    dbError = err instanceof Error ? err.message : String(err);
    console.error("[health] Firebase Firestore ping notice:", dbError);
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
  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latencyMs: totalDurationMs,
      services: {
        database: {
          type: "firebase_firestore",
          status: dbStatus,
          latencyMs: dbLatencyMs,
          adminConfigured: isFirebaseAdminConfigured(),
          clientConfigured: isFirebaseClientConfigured(),
          error: dbError,
        },
        storage: {
          status: storageConfigured ? "configured" : "unconfigured",
          provider: storageProvider,
        },
        email: emailStatus,
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
