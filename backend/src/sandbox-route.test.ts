import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("sandbox endpoint", () => {
  it("rejects unsafe commands", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/sandbox/run", payload: { command: "sh", args: ["-c", "echo unsafe"] }, headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN ?? ""}` } });
    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
