import { test, expect } from "@playwright/test";

test.describe("Authentication Smoke Tests", () => {
  test("login page renders with all elements and links", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create one" })).toBeVisible();
  });

  test("submitting empty form triggers validation feedback", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByRole("button", { name: "Log in" }).click();

    // Validation messages should appear
    await expect(page.getByText("Please enter your email.")).toBeVisible();
    await expect(page.getByText("Please enter your password.")).toBeVisible();
  });

  test("submitting invalid credentials displays rejection error", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByPlaceholder("name@example.com").fill("nonexistent_user@buildora.in");
    await page.getByPlaceholder("••••••••").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Log in" }).click();

    // Rejection notification
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 10_000 });
  });

  test("register link navigates to register page", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Create one" }).click();
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  });

  test("successful login redirects customer to client dashboard", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByPlaceholder("name@example.com").fill("test_customer@buildora.in");
    await page.getByPlaceholder("••••••••").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/.*\/client\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText("Active projects")).toBeVisible();
  });
});
