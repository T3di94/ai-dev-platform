import type { AgentName, RuntimeMode } from "./agent-router.js";

export type RuntimeConfig = {
  agent: AgentName;
  runtime: RuntimeMode;
  model?: string;
  configured: boolean;
  reason?: string;
};

const keyFor = (agent: AgentName) => agent.toUpperCase();

export function runtimeConfig(agent: AgentName, runtime: RuntimeMode): RuntimeConfig {
  if (runtime === "mock") return { agent, runtime, configured: true, reason: "Deterministic CI-safe runtime" };
  if (runtime === "local") {
    const model = process.env[`OLLAMA_MODEL_${keyFor(agent)}`]?.trim() || process.env.OLLAMA_MODEL?.trim() || "qwen2.5-coder:7b";
    return { agent, runtime, model, configured: true, reason: "Ollama local runtime" };
  }
  const key = agent === "Claude" ? "ANTHROPIC_API_KEY" : agent === "Codex" ? "OPENAI_API_KEY" : "DEVIN_API_KEY";
  return { agent, runtime, configured: Boolean(process.env[key]?.trim()), reason: process.env[key]?.trim() ? "Provider credentials configured" : `${key} is not configured` };
}
