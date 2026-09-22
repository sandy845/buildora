import { test, expect } from "@playwright/test";

test.describe("Lead Capture Smoke Tests", () => {
  test("contact page renders lead form and company details", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByRole("heading", { name: /Tell us about your project/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Reach us/i })).toBeVisible();
    await expect(page.getByPlaceholder("Your name")).toBeVisible();
    await expect(page.getByPlaceholder("name@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("+91 00000 00000")).toBeVisible();
    await expect(page.getByPlaceholder("City or locality")).toBeVisible();
    await expect(page.getByPlaceholder("Tell us about your project, timeline, or goals.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit enquiry" })).toBeVisible();
  });

  test("submitting empty lead form displays field errors", async ({ page }) => {
    await page.goto("/contact");

    await page.getByRole("button", { name: "Submit enquiry" }).click();

    await expect(page.getByText("Please enter your name.")).toBeVisible();
    await expect(page.getByText("Please enter your email.")).toBeVisible();
    await expect(page.getByText("Please enter your phone number.")).toBeVisible();
    await expect(page.getByText("Please enter the project location.")).toBeVisible();
    await expect(page.getByText("Please share a short project brief.")).toBeVisible();
  });

  test("submitting valid lead creates record and shows confirmation message", async ({ page }) => {
    await page.goto("/contact");

    const uniqueEmail = `test_lead_${Date.now()}@buildora-test.com`;

    await page.getByPlaceholder("Your name").fill("Aarav Mehta");
    await page.getByPlaceholder("name@example.com").fill(uniqueEmail);
    await page.getByPlaceholder("+91 00000 00000").fill("+91 98765 43210");
    await page.getByPlaceholder("City or locality").fill("Worli, Mumbai");
    await page.getByPlaceholder("Tell us about your project, timeline, or goals.").fill(
      "Looking for complete luxury duplex construction with high-end turnkey finishes."
    );

    await page.getByRole("button", { name: "Submit enquiry" }).click();

    // Verify submission success state
    await expect(page.getByText("Enquiry Submitted Successfully")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Our engineering and design team will review your specifications/i)).toBeVisible();
  });
});
