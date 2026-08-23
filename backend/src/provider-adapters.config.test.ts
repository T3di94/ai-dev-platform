import { describe, expect, it } from "vitest";
import { createOpenAiAdapter, createOllamaAdapter } from "./provider-adapters.js";

describe("provider adapter configuration", () => {
  it("uses the documented Codex model environment variable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (_input, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("gpt-5.3-codex");
      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
    }) as typeof fetch;
    try {
      const adapter = createOpenAiAdapter({ OPENAI_API_KEY: "test", OPENAI_CODEX_MODEL: "gpt-5.3-codex" });
      await adapter({ prompt: "hello" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses configured request timeout", () => {
    expect(createOllamaAdapter({ AGENT_REQUEST_TIMEOUT_MS: "120000" })).toBeTypeOf("function");
  });
});
