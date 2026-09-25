import { test, expect } from "@playwright/test";

test.describe("Responsive and accessibility smoke checks", () => {
  test("request project form is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/request-project");
    await expect(page.getByRole("heading", { name: /Let’s shape the right project/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send project brief/i })).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
  });

  test("primary pages expose headings and form labels", async ({ page }) => {
    for (const path of ["/", "/services", "/request-project", "/auth/login"]) {
      await page.goto(path);
      await expect(page.locator("main").first()).toBeVisible();
      await expect(page.locator("h1, h2").first()).toBeVisible();
    }
    await page.goto("/request-project");
    await expect(page.getByLabel("Your name *")).toBeVisible();
    await expect(page.getByLabel("Email address *")).toBeVisible();
  });
});
