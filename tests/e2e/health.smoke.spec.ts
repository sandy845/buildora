import { test, expect } from "@playwright/test";

test.describe("Production Health Check API", () => {
  test("GET /api/health returns HTTP 200 with service diagnostics", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(["healthy", "degraded"]).toContain(data.status);
    expect(data.timestamp).toBeTruthy();
    expect(typeof data.system.uptimeSeconds).toBe("number");

    // Database check
    expect(data.services.database.status).toBe("connected");
    expect(typeof data.services.database.latencyMs).toBe("number");
    expect(data.services.database.latencyMs).toBeGreaterThanOrEqual(0);

    // Storage & Email checks
    expect(data.services.storage).toHaveProperty("provider");
    expect(data.services.email).toHaveProperty("provider");
    expect(data.services.rateLimiter).toHaveProperty("backend");
  });
});
