import { describe, expect, it } from "vitest";
import { createProviderExecutor } from "./provider-executor.js";

describe("provider executor", () => {
  it("executes mock without credentials", async () => {
    await expect(createProviderExecutor({ mode: "mock" }, {})({ prompt: "hello" })).resolves.toEqual({ text: "mock:hello", provider: "mock", mode: "mock" });
  });

  it("executes local without credentials", async () => {
    await expect(createProviderExecutor({ mode: "local", model: "llama3" }, {})({ prompt: "hello" })).resolves.toEqual({ text: "local:llama3:hello", provider: "ollama", mode: "local" });
  });

  it("fails closed for API without credentials", () => {
    expect(() => createProviderExecutor({ mode: "api", provider: "claude" }, {})).toThrow("ANTHROPIC_API_KEY");
  });
});
