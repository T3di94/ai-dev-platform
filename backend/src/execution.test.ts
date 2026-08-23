import { describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";

describe("task execution routing", () => {
  it("routes mock execution and records runtime logs", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/tasks/2/execute" });
    expect(response.statusCode).toBe(200);
    const task = response.json();
    expect(task.status).toBe("Completed");
    expect(task.runtime).toBe("mock");
    expect(task.output).toContain("Devin");
    expect(task.logs.some((log: { message: string }) => log.message.includes("mock adapter accepted"))).toBe(true);
    await app.close();
  });

  it("executes the local runtime without requiring a cloud API key", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify({ response: "Local model result" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as typeof fetch;
    try {
      const app = buildApp();
      const create = await app.inject({ method: "POST", url: "/tasks", payload: { title: "Local test", agent: "Codex", runtime: "local" } });
      expect(create.statusCode).toBe(201);
      const task = create.json();
      const response = await app.inject({ method: "POST", url: `/tasks/${task.id}/execute` });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ status: "Completed", runtime: "local", output: "Local model result" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const firstCall = fetchMock.mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(String(firstCall?.[0])).toContain("/api/generate");
      await app.close();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
