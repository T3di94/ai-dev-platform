import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("backend API", () => {
  it("has a healthy service contract", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok", service: "backend", persistence: "json" });
    await app.close();
  });

  it("lists agents and runtimes", async () => {
    const app = buildApp();
    const agents = await app.inject({ method: "GET", url: "/agents" });
    expect(agents.statusCode).toBe(200);
    expect(agents.json()).toHaveLength(3);
    const runtimes = await app.inject({ method: "GET", url: "/runtimes" });
    expect(runtimes.statusCode).toBe(200);
    expect(runtimes.json().map((item: { name: string }) => item.name)).toEqual(["mock", "local", "api"]);
    await app.close();
  });

  it("executes a task and exposes runtime-aware logs", async () => {
    const app = buildApp();
    const createResponse = await app.inject({ method: "POST", url: "/tasks", payload: { title: "Add login page", agent: "Claude", runtime: "mock" } });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();
    expect(created.runtime).toBe("mock");

    const executeResponse = await app.inject({ method: "POST", url: `/tasks/${created.id}/execute` });
    expect(executeResponse.statusCode).toBe(200);
    const executed = executeResponse.json();
    expect(executed).toMatchObject({ id: created.id, status: "Completed", runtime: "mock" });
    expect(executed.output).toContain("Claude");

    const logsResponse = await app.inject({ method: "GET", url: `/tasks/${created.id}/logs` });
    const messages = logsResponse.json().map((log: { message: string }) => log.message);
    expect(messages[0]).toBe("Routing mock task to Claude.");
    expect(messages).toContain("Claude mock adapter accepted the task.");
    expect(messages).toContain("Claude mock adapter completed the task.");
    expect(messages).toContain("Execution completed successfully with Claude.");
    await app.close();
  });

  it("rejects invalid runtime", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/tasks", payload: { title: "Test", agent: "Claude", runtime: "remote" } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "A valid runtime is required" });
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
    expect(response.json()).toEqual({ error: "Task title is required and must be <= 500 characters" });
    await app.close();
  });
});
