import type { AgentAdapter, AgentExecutionResult, AgentTask, AgentName } from "./agent-router.js";

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "qwen2.5-coder:7b";
const REQUEST_TIMEOUT_MS = Number(process.env.AGENT_REQUEST_TIMEOUT_MS ?? 120_000);

function getModel(agent: AgentName): string {
  const key = `OLLAMA_MODEL_${agent.toUpperCase()}`;
  return process.env[key]?.trim() || process.env.OLLAMA_MODEL?.trim() || DEFAULT_MODEL;
}

function getBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
}

function buildPrompt(task: AgentTask): string {
  return `You are the ${task.agent} engineering agent in a local AI development platform.\n\nTask:\n${task.title}\n\nReturn a concise implementation plan, key files/changes, validation steps, and risks. Do not claim code was changed unless tools actually changed it.`;
}

export class OllamaAgentAdapter implements AgentAdapter {
  constructor(public readonly name: AgentName) {}

  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${getBaseUrl()}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ model: getModel(this.name), stream: false, messages: [{ role: "user", content: buildPrompt(task) }] }),
      });
      const body = await response.json().catch(() => ({})) as { message?: { content?: unknown }; error?: unknown };
      if (!response.ok) throw new Error(`Ollama request failed: ${typeof body.error === "string" ? body.error : `HTTP ${response.status}`}`);
      const output = typeof body.message?.content === "string" ? body.message.content.trim() : "";
      if (!output) throw new Error("Ollama returned an empty response");
      return { output, logs: [`Ollama local model ${getModel(this.name)} completed the task.`] };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new Error("Ollama request timed out");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
