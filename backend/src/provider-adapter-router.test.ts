import { describe, expect, it } from "vitest";
import { createRoutedProviderExecutor } from "./provider-adapter-router.js";

describe("provider adapter router", () => {
  it("routes local to Ollama", async () => {
    const executor = createRoutedProviderExecutor({ mode: "local", model: "llama3" }, {});
    expect(executor).toBeTypeOf("function");
  });

  it("routes mock without network calls", async () => {
    const executor = createRoutedProviderExecutor({ mode: "mock" }, {});
    await expect(executor({ prompt: "hello" })).resolves.toMatchObject({ text: "mock:hello", provider: "mock" });
  });

  it("routes API providers to their adapters", () => {
    expect(() => createRoutedProviderExecutor({ mode: "api", provider: "claude" }, { ANTHROPIC_API_KEY: "test" })).not.toThrow();
    expect(() => createRoutedProviderExecutor({ mode: "api", provider: "codex" }, { OPENAI_API_KEY: "test" })).not.toThrow();
  });
});
