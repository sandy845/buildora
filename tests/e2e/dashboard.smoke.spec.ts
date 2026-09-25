import { test, expect, Page } from "@playwright/test";

async function loginAsCustomer(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("name@example.com").fill("test_customer@buildora.in");
  await page.getByPlaceholder("••••••••").fill("Password123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/.*\/client\/dashboard/, { timeout: 15_000 });
}

async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("name@example.com").fill("test_admin@buildora.in");
  await page.getByPlaceholder("••••••••").fill("Password123!");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/.*\/admin\/dashboard/, { timeout: 15_000 });
}

test.describe("Dashboard & Workspace Smoke Tests", () => {
  test("client dashboard renders KPIs, projects, and navigation", async ({ page }) => {
    await loginAsCustomer(page);

    await expect(page.getByText("Active projects")).toBeVisible();
    await expect(page.getByText("Overall progress")).toBeVisible();
    await expect(page.getByText("Pending approvals")).toBeVisible();
    await expect(page.getByText("Outstanding payment", { exact: true }).first()).toBeVisible();

    // Verify navigation links
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("link", { name: /My Projects/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Documents/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Payments/i })).toBeVisible();
  });

  test("project workspace loads with tabs and upload dropzone controls", async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto("/client/projects/11111111-1111-1111-1111-111111111111");

    // Project title
    await expect(page.getByRole("heading", { name: "Residence 01" })).toBeVisible();

    // Blueprint upload button & modal
    const uploadBlueprintBtn = page.getByRole("button", { name: "+ Upload blueprint" });
    await expect(uploadBlueprintBtn).toBeVisible();
    await uploadBlueprintBtn.click();

    // Modal should be open with blueprint heading
    await expect(
      page.getByRole("heading", { name: /Upload Blueprint \/ CAD Drawing/i })
    ).toBeVisible();
    await expect(page.getByText(/AutoCAD DWG, DXF, PDF, or high-res renderings/i)).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancel" }).click();

    // Document upload button & modal
    const uploadDocBtn = page.getByRole("button", { name: "+ Upload file" });
    await expect(uploadDocBtn).toBeVisible();
    await uploadDocBtn.click();

    await expect(
      page.getByRole("heading", { name: /Upload Project Document/i })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("admin dashboard renders high-level operations metrics", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByText("Total projects", { exact: true })).toBeVisible();
    await expect(page.getByText("Active projects", { exact: true })).toBeVisible();
    await expect(page.getByText("New leads", { exact: true }).first()).toBeVisible();
  });
});
