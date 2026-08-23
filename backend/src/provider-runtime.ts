export type AiMode = "local" | "api" | "mock";
export type ApiProvider = "claude" | "codex" | "devin";
export type ProviderSelection = { mode: AiMode; provider?: ApiProvider; model?: string };
export type RuntimeProvider = { mode: AiMode; provider?: ApiProvider; model?: string; apiKeyEnv?: string };

const API_KEY_ENV: Record<ApiProvider, string> = {
  claude: "ANTHROPIC_API_KEY",
  codex: "OPENAI_API_KEY",
  devin: "DEVIN_API_KEY",
};

export function resolveProviderRuntime(selection: ProviderSelection, env: Record<string, string | undefined> = process.env): RuntimeProvider {
  if (selection.mode === "local") return { mode: "local", model: selection.model || "ollama" };
  if (selection.mode === "mock") return { mode: "mock", model: selection.model || "mock" };
  const provider = selection.provider;
  if (!provider) throw new Error("API provider is required");
  const apiKeyEnv = API_KEY_ENV[provider];
  if (!env[apiKeyEnv]) throw new Error(`Missing API credential: ${apiKeyEnv}`);
  return { mode: "api", provider, model: selection.model, apiKeyEnv };
}
