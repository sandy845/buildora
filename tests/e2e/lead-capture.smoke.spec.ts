import { test, expect } from "@playwright/test";

test.describe("Project intake smoke tests", () => {
  test("request project page renders the current lead form", async ({ page }) => {
    await page.goto("/request-project");
    await expect(page.getByRole("heading", { name: /Let’s shape the right project/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /A considered start/i })).toBeVisible();
    await expect(page.getByPlaceholder("Aarav Mehta")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("+91 98765 43210")).toBeVisible();
    await expect(page.getByPlaceholder("City or neighbourhood")).toBeVisible();
    await expect(page.getByPlaceholder("What are you hoping to build, renovate, or transform?")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send project brief/i })).toBeVisible();
  });

  test("submitting empty project brief displays field errors", async ({ page }) => {
    await page.goto("/request-project");
    await page.getByRole("button", { name: /Send project brief/i }).click();
    await expect(page.getByText("Please fill in all required fields.")).toBeVisible();
  });

  test("submitting a valid project brief shows confirmation", async ({ page }) => {
    await page.goto("/request-project");
    await page.getByPlaceholder("Aarav Mehta").fill("Aarav Mehta");
    await page.getByPlaceholder("you@example.com").fill(`test_lead_${Date.now()}@buildora-test.com`);
    await page.getByPlaceholder("+91 98765 43210").fill("+91 98765 43210");
    await page.getByPlaceholder("City or neighbourhood").fill("Worli, Mumbai");
    await page.getByPlaceholder("What are you hoping to build, renovate, or transform?").fill("Complete luxury duplex construction.");
    await page.getByRole("button", { name: /Send project brief/i }).click();
    await expect(page.getByText("Your project is on our radar.")).toBeVisible({ timeout: 15_000 });
  });
});
