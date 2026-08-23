import type { ProviderSelection } from "./provider-runtime.js";
import { createRoutedProviderExecutor } from "./provider-adapter-router.js";

export type ProviderE2EResult = { ok: true; text: string; provider: string; model?: string };

export async function runProviderE2E(selection: ProviderSelection, prompt: string, env: Record<string, string | undefined> = process.env): Promise<ProviderE2EResult> {
  if (!prompt.trim()) throw new Error("Prompt is required");
  const execute = createRoutedProviderExecutor(selection, env);
  const result = await execute({ prompt });
  if (!result.text.trim()) throw new Error(`Provider ${result.provider} returned an empty response`);
  return { ok: true, ...result };
}
