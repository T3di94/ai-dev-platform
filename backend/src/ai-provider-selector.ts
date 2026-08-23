import type { AgentName, RuntimeMode } from "./agent-router.js";
import { AGENT_NAMES, RUNTIME_NAMES } from "./agent-router.js";
import { runtimeConfig } from "./runtime-config.js";

export type ProviderOption = { agent: AgentName; runtime: RuntimeMode; label: string; model?: string; available: boolean; reason?: string };

export function listProviderOptions(): ProviderOption[] {
  return AGENT_NAMES.flatMap((agent) => RUNTIME_NAMES.map((runtime) => {
    const config = runtimeConfig(agent, runtime);
    return { agent, runtime, label: runtime === "local" ? `${agent} · Local` : runtime === "api" ? `${agent} · API` : `${agent} · Mock`, model: config.model, available: config.configured, reason: config.reason };
  }));
}

export function selectProvider(agent: string, runtime: string): ProviderOption {
  if (!AGENT_NAMES.includes(agent as AgentName)) throw new Error("Unsupported AI agent");
  if (!RUNTIME_NAMES.includes(runtime as RuntimeMode)) throw new Error("Unsupported runtime");
  const option = listProviderOptions().find((candidate) => candidate.agent === agent && candidate.runtime === runtime)!;
  if (!option.available) throw new Error(option.reason ?? "Selected provider is not configured");
  return option;
}
