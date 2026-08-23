import { describe, expect, it } from "vitest";
import { resolveProviderRuntime } from "./provider-runtime.js";

describe("provider runtime", () => {
  it("runs local without credentials", () => {
    expect(resolveProviderRuntime({ mode: "local" }, {})).toEqual({ mode: "local", model: "ollama" });
  });

  it("runs mock without credentials", () => {
    expect(resolveProviderRuntime({ mode: "mock" }, {})).toEqual({ mode: "mock", model: "mock" });
  });

  it("requires the correct credential for API mode", () => {
    expect(() => resolveProviderRuntime({ mode: "api", provider: "claude" }, {})).toThrow("ANTHROPIC_API_KEY");
    expect(resolveProviderRuntime({ mode: "api", provider: "claude", model: "claude-sonnet" }, { ANTHROPIC_API_KEY: "test" })).toEqual({ mode: "api", provider: "claude", model: "claude-sonnet", apiKeyEnv: "ANTHROPIC_API_KEY" });
  });
});
