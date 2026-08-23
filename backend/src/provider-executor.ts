import type { ProviderSelection } from "./provider-runtime.js";
import { resolveProviderRuntime } from "./provider-runtime.js";

export type ProviderExecutor = (input: { prompt: string; model?: string }) => Promise<{ text: string; provider: string; mode: string }>;

export function createProviderExecutor(selection: ProviderSelection, env: Record<string, string | undefined> = process.env): ProviderExecutor {
  const runtime = resolveProviderRuntime(selection, env);
  if (runtime.mode === "mock") return async ({ prompt }) => ({ text: `mock:${prompt}`, provider: "mock", mode: "mock" });
  if (runtime.mode === "local") return async ({ prompt, model }) => ({ text: `local:${model || runtime.model}:${prompt}`, provider: "ollama", mode: "local" });
  return async ({ prompt }) => ({ text: `api:${runtime.provider}:${runtime.model || "default"}:${prompt}`, provider: runtime.provider!, mode: "api" });
}
