import { describe, expect, it } from "vitest";
import { normalizeProviderSelection } from "./provider-selector";

describe("provider selector", () => {
  it("supports local and mock modes without API credentials", () => {
    expect(normalizeProviderSelection({ mode: "local" })).toEqual({ mode: "local" });
    expect(normalizeProviderSelection({ mode: "mock" })).toEqual({ mode: "mock" });
  });

  it("normalizes API provider and default model", () => {
    expect(normalizeProviderSelection({ mode: "api", provider: "claude" })).toEqual({ mode: "api", provider: "claude", model: "claude-sonnet" });
  });

  it("rejects an API mode without a provider", () => {
    expect(() => normalizeProviderSelection({ mode: "api" })).toThrow("valid API provider");
  });
});
