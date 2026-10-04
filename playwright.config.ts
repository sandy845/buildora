import { defineConfig, devices } from "@playwright/test";

const testPort = process.env.PLAYWRIGHT_TEST_PORT || "3000";

/**
 * Buildora Playwright Smoke Test Configuration.
 * Configured for fast, reliable CI and local smoke test runs.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${testPort}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: `http://localhost:${testPort}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { E2E_TEST: "1" },
  },
});
