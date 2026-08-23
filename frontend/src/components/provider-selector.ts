export type AiMode = "local" | "api" | "mock";
export type ApiProvider = "claude" | "codex" | "devin";

export type ProviderSelection = {
  mode: AiMode;
  provider?: ApiProvider;
  model?: string;
};

export const API_PROVIDERS: Record<ApiProvider, { label: string; defaultModel: string }> = {
  claude: { label: "Claude", defaultModel: "claude-sonnet" },
  codex: { label: "Codex", defaultModel: "codex" },
  devin: { label: "Devin", defaultModel: "devin" },
};

export function normalizeProviderSelection(input: ProviderSelection): ProviderSelection {
  if (input.mode === "local" || input.mode === "mock") return { mode: input.mode };
  if (!input.provider || !API_PROVIDERS[input.provider]) throw new Error("A valid API provider is required");
  return {
    mode: "api",
    provider: input.provider,
    model: input.model?.trim() || API_PROVIDERS[input.provider].defaultModel,
  };
}
