import type { ProviderSelection } from "./provider-runtime.js";
import { resolveProviderRuntime } from "./provider-runtime.js";
import { createClaudeAdapter, createOllamaAdapter, createOpenAiAdapter, type AdapterRequest, type AdapterResponse, type ProviderAdapter } from "./provider-adapters.js";

export function createRoutedProviderExecutor(selection: ProviderSelection, env: Record<string, string | undefined> = process.env): (request: AdapterRequest) => Promise<AdapterResponse> {
  const runtime = resolveProviderRuntime(selection, env);
  let adapter: ProviderAdapter;
  if (runtime.mode === "local") adapter = createOllamaAdapter(env);
  else if (runtime.mode === "mock") adapter = async ({ prompt, model }) => ({ text: `mock:${prompt}`, provider: "mock", model });
  else if (runtime.provider === "claude") adapter = createClaudeAdapter(env);
  else if (runtime.provider === "codex") adapter = createOpenAiAdapter(env);
  else throw new Error(`Unsupported API provider: ${runtime.provider}`);
  return (request) => adapter({ ...request, model: request.model || runtime.model });
}
