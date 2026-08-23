import { describe, expect, it } from "vitest";
import { apiProviderOptions, providerOptions, selectProvider } from "./provider-selector-ui";

describe("provider selector ui helpers", () => {
  it("exposes all execution modes", () => {
    expect(providerOptions().map((item) => item.value)).toEqual(["local", "api", "mock"]);
  });

  it("exposes API providers", () => {
    expect(apiProviderOptions().map((item) => item.value)).toEqual(["claude", "codex", "devin"]);
  });

  it("selects local without requiring an API provider", () => {
    expect(selectProvider("local")).toEqual({ mode: "local" });
  });
});
