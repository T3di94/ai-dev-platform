import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

afterEach(() => { delete process.env.ADMIN_TOKEN; });

describe("backend security", () => {
  it("requires bearer authentication when ADMIN_TOKEN is configured", async () => {
    process.env.ADMIN_TOKEN = "test-secret";
    const app = buildApp();
    const unauthorized = await app.inject({ method: "POST", url: "/tasks", payload: { title: "test", agent: "Claude", runtime: "mock" } });
    expect(unauthorized.statusCode).toBe(401);
    const authorized = await app.inject({ method: "POST", url: "/tasks", headers: { authorization: "Bearer test-secret" }, payload: { title: "test", agent: "Claude", runtime: "mock" } });
    expect(authorized.statusCode).toBe(201);
    await app.close();
  });

  it("rejects oversized or unsafe task titles", async () => {
    const app = buildApp();
    const oversized = await app.inject({ method: "POST", url: "/tasks", payload: { title: "x".repeat(501), agent: "Claude", runtime: "mock" } });
    expect(oversized.statusCode).toBe(400);
    const nul = await app.inject({ method: "POST", url: "/tasks", payload: { title: "safe\u0000unsafe", agent: "Claude", runtime: "mock" } });
    expect(nul.statusCode).toBe(400);
    await app.close();
  });
});
