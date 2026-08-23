import { describe, expect, it } from "vitest";
import { listProviderOptions, selectProvider } from "./ai-provider-selector.js";

describe("AI provider selector", () => {
  it("lists local, API and mock choices", () => {
    const options = listProviderOptions();
    expect(options).toHaveLength(9);
    expect(options.some((option) => option.runtime === "local")).toBe(true);
    expect(options.some((option) => option.runtime === "api")).toBe(true);
    expect(options.some((option) => option.runtime === "mock")).toBe(true);
  });

  it("allows deterministic mock selection", () => {
    expect(selectProvider("Codex", "mock").available).toBe(true);
  });

  it("rejects invalid selections", () => {
    expect(() => selectProvider("Unknown", "local")).toThrow("Unsupported AI agent");
    expect(() => selectProvider("Claude", "unknown")).toThrow("Unsupported runtime");
  });
});
