export type AdapterRequest = { prompt: string; model?: string; timeoutMs?: number };
export type AdapterResponse = { text: string; provider: string; model?: string };
export type ProviderAdapter = (request: AdapterRequest) => Promise<AdapterResponse>;

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Provider request timed out after ${ms}ms`)), ms)),
  ]);
}

function configuredTimeout(env: Record<string, string | undefined>, fallback = 30000): number {
  const value = Number(env.AGENT_REQUEST_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number): Promise<unknown> {
  const response = await timeout(fetch(url, { method: "POST", headers, body: JSON.stringify(body) }), timeoutMs);
  if (!response.ok) throw new Error(`Provider request failed with HTTP ${response.status}`);
  return response.json();
}

export function createOllamaAdapter(env: Record<string, string | undefined> = process.env): ProviderAdapter {
  const baseUrl = env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  return async ({ prompt, model = env.OLLAMA_MODEL || "llama3", timeoutMs = configuredTimeout(env) }) => {
    const data = await postJson(`${baseUrl}/api/generate`, { "Content-Type": "application/json" }, { model, prompt, stream: false }, timeoutMs) as { response?: string };
    return { text: data.response || "", provider: "ollama", model };
  };
}

export function createOpenAiAdapter(env: Record<string, string | undefined> = process.env): ProviderAdapter {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing API credential: OPENAI_API_KEY");
  const baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  return async ({ prompt, model = env.OPENAI_CODEX_MODEL || "gpt-4o-mini", timeoutMs = configuredTimeout(env) }) => {
    const data = await postJson(`${baseUrl}/chat/completions`, { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, { model, messages: [{ role: "user", content: prompt }] }, timeoutMs) as { choices?: Array<{ message?: { content?: string } }> };
    return { text: data.choices?.[0]?.message?.content || "", provider: "codex", model };
  };
}

export function createClaudeAdapter(env: Record<string, string | undefined> = process.env): ProviderAdapter {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing API credential: ANTHROPIC_API_KEY");
  const baseUrl = env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";
  return async ({ prompt, model = env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", timeoutMs = configuredTimeout(env) }) => {
    const data = await postJson(`${baseUrl}/messages`, { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, { model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] }, timeoutMs) as { content?: Array<{ text?: string }> };
    return { text: data.content?.map((item) => item.text || "").join("") || "", provider: "claude", model };
  };
}
