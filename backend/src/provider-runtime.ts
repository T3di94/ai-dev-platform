import type { AiMode, ApiProvider, ProviderSelection } from "../../frontend/src/components/provider-selector";

export type RuntimeProvider = { mode: AiMode; provider?: ApiProvider; model?: string; apiKeyEnv?: string };

const API_KEY_ENV: Record<ApiProvider, string> = {
  claude: "ANTHROPIC_API_KEY",
  codex: "OPENAI_API_KEY",
  devin: "DEVIN_API_KEY",
};

export function resolveProviderRuntime(selection: ProviderSelection, env: Record<string, string | undefined> = process.env): RuntimeProvider {
  if (selection.mode === "local") return { mode: "local", model: selection.model || "ollama" };
  if (selection.mode === "mock") return { mode: "mock", model: selection.model || "mock" };
  if (!selection.provider) throw new Error("API provider is required");
  const apiKeyEnv = API_KEY_ENV[selection.provider];
  if (!env[apiKeyEnv]) throw new Error(`Missing API credential: ${apiKeyEnv}`);
  return { mode: "api", provider: selection.provider, model: selection.model, apiKeyEnv };
}
