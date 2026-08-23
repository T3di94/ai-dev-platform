import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaAgentAdapter } from "./local-agent-provider.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("ollama local adapter", () => {
  it("calls Ollama without requiring a cloud API key", async () => {
    process.env.OLLAMA_BASE_URL = "http://ollama.test";
    process.env.OLLAMA_MODEL_CLAUDE = "qwen-test";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: { content: "local result" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new OllamaAgentAdapter("Claude").execute({ agent: "Claude", title: "Build UI", runtime: "local" });
    expect(result.output).toBe("local result");
    expect(fetchMock).toHaveBeenCalledWith("http://ollama.test/api/chat", expect.objectContaining({ method: "POST" }));
  });
});
