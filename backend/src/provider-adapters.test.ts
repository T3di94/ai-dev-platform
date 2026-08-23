import { describe, expect, it } from "vitest";
import { createClaudeAdapter, createOllamaAdapter, createOpenAiAdapter } from "./provider-adapters.js";

describe("provider adapters", () => {
  it("creates an Ollama adapter without credentials", () => {
    expect(createOllamaAdapter({})).toBeTypeOf("function");
  });

  it("requires OpenAI credentials", () => {
    expect(() => createOpenAiAdapter({})).toThrow("OPENAI_API_KEY");
  });

  it("requires Claude credentials", () => {
    expect(() => createClaudeAdapter({})).toThrow("ANTHROPIC_API_KEY");
  });

  it("uses configurable Ollama endpoint", () => {
    const adapter = createOllamaAdapter({ OLLAMA_BASE_URL: "http://ollama.test", OLLAMA_MODEL: "llama3" });
    expect(adapter).toBeTypeOf("function");
  });
});
