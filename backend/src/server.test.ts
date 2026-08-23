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

  it("executes a task and exposes execution logs", async () => {
    const app = buildApp();
    const createResponse = await app.inject({ method: "POST", url: "/tasks", payload: { title: "Add login page", agent: "Claude" } });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();

    const executeResponse = await app.inject({ method: "POST", url: `/tasks/${created.id}/execute` });
    expect(executeResponse.statusCode).toBe(200);
    expect(executeResponse.json()).toMatchObject({ id: created.id, status: "Completed" });
    expect(executeResponse.json().output).toContain("Claude prepared");

    const logsResponse = await app.inject({ method: "GET", url: `/tasks/${created.id}/logs` });
    expect(logsResponse.statusCode).toBe(200);
    expect(logsResponse.json().map((log: { message: string }) => log.message)).toEqual([
      "Assigned to Claude.",
      "Execution started.",
      "Execution completed successfully.",
    ]);
    await app.close();
  });

  it("rejects execution of an already running task", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/tasks/1/execute" });
    expect(response.statusCode).toBe(409);
    await app.close();
  });

  it("rejects invalid task input", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/tasks", payload: { title: "", agent: "Unknown" } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Task title is required" });
    await app.close();
  });
});
