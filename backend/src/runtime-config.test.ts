import { describe, expect, it, afterEach } from "vitest";
import { runtimeConfig } from "./runtime-config.js";

afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DEVIN_API_KEY;
});

describe("runtime config", () => {
  it("marks mock and local as available without cloud credentials", () => {
    expect(runtimeConfig("Claude", "mock").configured).toBe(true);
    expect(runtimeConfig("Claude", "local").configured).toBe(true);
  });

  it("reports API credentials without exposing their value", () => {
    process.env.ANTHROPIC_API_KEY = "secret";
    const config = runtimeConfig("Claude", "api");
    expect(config.configured).toBe(true);
    expect(JSON.stringify(config)).not.toContain("secret");
  });
});
