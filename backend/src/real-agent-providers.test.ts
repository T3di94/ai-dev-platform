import { afterEach, describe, expect, it, vi } from "vitest";
import { ClaudeAdapter, DevinAdapter, OpenAICodexAdapter } from "./real-agent-providers.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("real agent providers", () => {
  it("calls Claude Messages API and extracts text", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.ANTHROPIC_MODEL = "test-model";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ content: [{ type: "text", text: "Claude result" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new ClaudeAdapter().execute({ agent: "Claude", title: "Build UI" });
    expect(result.output).toBe("Claude result");
    expect(fetchMock).toHaveBeenCalledWith("https://api.anthropic.com/v1/messages", expect.objectContaining({ method: "POST" }));
  });

  it("calls OpenAI Responses API and extracts output_text", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: "Codex result" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new OpenAICodexAdapter().execute({ agent: "Codex", title: "Add tests" });
    expect(result.output).toBe("Codex result");
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({ method: "POST" }));
  });

  it("uses the configured Devin endpoint", async () => {
    process.env.DEVIN_API_KEY = "test-key";
    process.env.DEVIN_API_URL = "https://devin.example.test/session";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: "Devin result" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new DevinAdapter().execute({ agent: "Devin", title: "Build API" });
    expect(result.output).toBe("Devin result");
    expect(fetchMock).toHaveBeenCalledWith("https://devin.example.test/session", expect.objectContaining({ method: "POST" }));
  });

  it("fails clearly when credentials are missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(new OpenAICodexAdapter().execute({ agent: "Codex", title: "Test" })).rejects.toThrow("OPENAI_API_KEY is not configured");
  });
});
