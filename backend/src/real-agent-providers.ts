import type { AgentAdapter, AgentExecutionResult, AgentTask, AgentName } from "./agent-router.js";

type JsonRecord = Record<string, unknown>;

const REQUEST_TIMEOUT_MS = Number(process.env.AGENT_REQUEST_TIMEOUT_MS ?? 120_000);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

async function requestJson(url: string, init: RequestInit): Promise<JsonRecord> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    if (!response.ok) {
      const message = typeof body === "object" && body !== null && "error" in body
        ? JSON.stringify((body as JsonRecord).error)
        : `HTTP ${response.status}`;
      throw new Error(`Provider request failed: ${message}`);
    }
    return (typeof body === "object" && body !== null ? body : {}) as JsonRecord;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Provider request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function prompt(task: AgentTask): string {
  return `You are the ${task.agent} engineering agent in an AI development platform.\n\nTask:\n${task.title}\n\nReturn a concise implementation plan, key files/changes, validation steps, and risks. Do not claim code was changed unless tools actually changed it.`;
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromUnknown).filter(Boolean).join("\n");
  if (typeof value === "object" && value !== null) {
    const item = value as JsonRecord;
    if (typeof item.text === "string") return item.text;
    if (typeof item.content === "string") return item.content;
  }
  return "";
}

export class ClaudeAdapter implements AgentAdapter {
  readonly name = "Claude" as const;
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const apiKey = requireEnv("ANTHROPIC_API_KEY");
    const model = requireEnv("ANTHROPIC_MODEL");
    const body = await requestJson("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 2000, messages: [{ role: "user", content: prompt(task) }] }),
    });
    const output = textFromUnknown(body.content);
    if (!output) throw new Error("Claude returned an empty response");
    return { output, logs: ["Claude API request completed."] };
  }
}

export class OpenAICodexAdapter implements AgentAdapter {
  readonly name = "Codex" as const;
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const model = process.env.OPENAI_CODEX_MODEL?.trim() || "gpt-5.3-codex";
    const body = await requestJson("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: prompt(task) }),
    });
    const output = typeof body.output_text === "string" ? body.output_text : textFromUnknown(body.output);
    if (!output) throw new Error("OpenAI returned an empty response");
    return { output, logs: ["OpenAI Responses API request completed."] };
  }
}

export class DevinAdapter implements AgentAdapter {
  readonly name = "Devin" as const;
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const apiKey = requireEnv("DEVIN_API_KEY");
    const url = requireEnv("DEVIN_API_URL");
    const body = await requestJson(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ prompt: prompt(task), title: task.title }),
    });
    const output = textFromUnknown(body.output ?? body.message ?? body.result ?? body);
    if (!output) throw new Error("Devin returned an empty response");
    return { output, logs: ["Devin API request completed."] };
  }
}

export function createRealAdapter(agent: AgentName): AgentAdapter {
  if (agent === "Claude") return new ClaudeAdapter();
  if (agent === "Codex") return new OpenAICodexAdapter();
  return new DevinAdapter();
}
