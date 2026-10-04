import { test, expect } from "@playwright/test";

test.describe("Registration Smoke Tests", () => {
  test("successful registration directs the user to verify their email", async ({ page }) => {
    await page.goto("/auth/register");

    await page.getByPlaceholder("Your full name").fill("Buildora Test User");
    await page.getByPlaceholder("+91 00000 00000").fill("+91 98765 43210");
    await page.getByPlaceholder("name@example.com").fill(`e2e-${Date.now()}@example.com`);
    await page.locator('input[placeholder="••••••••"]').nth(0).fill("Password123!");
    await page.locator('input[placeholder="••••••••"]').nth(1).fill("Password123!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/Check your email for the verification code/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "verify your account" })).toHaveAttribute("href", "/auth/verify");
    await expect(page.getByRole("button", { name: "Create account" })).toBeEnabled();
  });
});
