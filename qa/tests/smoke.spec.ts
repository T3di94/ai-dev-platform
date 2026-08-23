import { test, expect } from "@playwright/test";

test("homepage renders the AI development platform", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Claude. Devin. Codex." })).toBeVisible();
  await expect(page.getByText("Frontend", { exact: true })).toBeVisible();
  await expect(page.getByText("Backend", { exact: true })).toBeVisible();
  await expect(page.getByText("QA & Testing", { exact: true })).toBeVisible();
});
