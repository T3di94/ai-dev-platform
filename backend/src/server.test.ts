import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("backend API", () => {
  it("has a healthy service contract", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "backend" });
    await app.close();
  });

  it("lists the available agents", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/agents" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { name: "Claude", role: "Frontend and UI engineering" },
      { name: "Devin", role: "Backend and API engineering" },
      { name: "Codex", role: "QA, testing, and regression verification" },
    ]);
    await app.close();
  });

  it("creates and starts a task", async () => {
    const app = buildApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Add login page", agent: "Claude" },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();
    expect(created).toMatchObject({ title: "Add login page", agent: "Claude", status: "Ready" });

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/tasks/${created.id}`,
      payload: { status: "In progress" },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({ id: created.id, status: "In progress" });
    await app.close();
  });

  it("rejects invalid task input", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "", agent: "Unknown" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Task title is required" });
    await app.close();
  });
});
