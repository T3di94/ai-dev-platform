import { createClaudeAdapter, createOllamaAdapter, createOpenAiAdapter } from "./provider-adapters.js";
import { DevinAdapter } from "./real-agent-providers.js";

export const AGENT_NAMES = ["Claude", "Devin", "Codex"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];
export const RUNTIME_NAMES = ["mock", "local", "api"] as const;
export type RuntimeMode = (typeof RUNTIME_NAMES)[number];
export type AgentTask = { title: string; agent: AgentName; runtime?: RuntimeMode };
export type AgentExecutionResult = { output: string; logs: string[] };

export interface AgentAdapter {
  readonly name: AgentName;
  execute(task: AgentTask): Promise<AgentExecutionResult>;
}

class MockAgentAdapter implements AgentAdapter {
  constructor(public readonly name: AgentName) {}
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    return { output: `${this.name} prepared an execution plan for: ${task.title}`, logs: [`${this.name} mock adapter accepted the task.`, `${this.name} mock adapter completed the task.`] };
  }
}

class ProviderBackedAdapter implements AgentAdapter {
  constructor(public readonly name: AgentName, private readonly executeProvider: (prompt: string) => Promise<{ text: string; provider: string; model?: string }>) {}
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    const result = await this.executeProvider(task.title);
    return { output: result.text, logs: [`${result.provider}${result.model ? ` (${result.model})` : ""} provider completed the task.`] };
  }
}

const mocks: Record<AgentName, AgentAdapter> = {
  Claude: new MockAgentAdapter("Claude"),
  Devin: new MockAgentAdapter("Devin"),
  Codex: new MockAgentAdapter("Codex"),
};

export function getAgentAdapter(agent: AgentName, runtime: RuntimeMode = "mock"): AgentAdapter {
  if (runtime === "mock") return mocks[agent];
  if (runtime === "local") {
    const adapter = createOllamaAdapter();
    return new ProviderBackedAdapter(agent, async (prompt) => adapter({ prompt }));
  }
  if (agent === "Claude") {
    const adapter = createClaudeAdapter();
    return new ProviderBackedAdapter(agent, async (prompt) => adapter({ prompt }));
  }
  if (agent === "Codex") {
    const adapter = createOpenAiAdapter();
    return new ProviderBackedAdapter(agent, async (prompt) => adapter({ prompt }));
  }
  return new DevinAdapter();
}

export function routeAgent(task: AgentTask): AgentAdapter {
  if (!AGENT_NAMES.includes(task.agent)) throw new Error(`Unsupported agent: ${task.agent}`);
  const runtime = task.runtime ?? "mock";
  if (!RUNTIME_NAMES.includes(runtime)) throw new Error(`Unsupported runtime: ${runtime}`);
  return getAgentAdapter(task.agent, runtime);
}
