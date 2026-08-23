import { API_PROVIDERS, normalizeProviderSelection, type AiMode, type ApiProvider, type ProviderSelection } from "./provider-selector";

export function providerOptions(): Array<{ value: AiMode; label: string }> {
  return [
    { value: "local", label: "Local (Ollama)" },
    { value: "api", label: "API" },
    { value: "mock", label: "Mock (CI)" },
  ];
}

export function apiProviderOptions(): Array<{ value: ApiProvider; label: string; model: string }> {
  return (Object.entries(API_PROVIDERS) as Array<[ApiProvider, (typeof API_PROVIDERS)[ApiProvider]]>).map(([value, config]) => ({
    value,
    label: config.label,
    model: config.defaultModel,
  }));
}

export function selectProvider(mode: AiMode, provider?: ApiProvider, model?: string): ProviderSelection {
  return normalizeProviderSelection({ mode, provider, model });
}
