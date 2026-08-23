import { describe, expect, it } from "vitest";
import { createRoutedProviderExecutor } from "./provider-adapter-router.js";

describe("provider adapter integration", () => {
  it("routes mock end-to-end", async () => {
    const run = createRoutedProviderExecutor({ mode: "mock", model: "mock" }, {});
    await expect(run({ prompt: "hello" })).resolves.toEqual({ text: "mock:hello", provider: "mock", model: "mock" });
  });

  it("rejects unsupported API providers instead of silently falling back", () => {
    expect(() => createRoutedProviderExecutor({ mode: "api", provider: "devin" }, { DEVIN_API_KEY: "test" })).toThrow("Unsupported API provider: devin");
  });
});
