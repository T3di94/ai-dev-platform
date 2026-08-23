import { test, expect } from "@playwright/test";

test("homepage renders the AI development workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Agent Workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ship software with specialized AI agents." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Claude" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Devin" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Codex" })).toBeVisible();
  await expect(page.getByText("Create work", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create task" })).toBeVisible();
});
