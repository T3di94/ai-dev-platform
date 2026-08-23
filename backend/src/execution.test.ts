import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("task execution routing", () => {
  it("routes execution and records adapter logs", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/tasks/2/execute" });
    expect(response.statusCode).toBe(200);
    const task = response.json();
    expect(task.status).toBe("Completed");
    expect(task.output).toContain("Devin");
    expect(task.logs.some((log: { message: string }) => log.message.includes("adapter accepted"))).toBe(true);
    await app.close();
  });
});
