import { createRealAdapter } from "./real-agent-providers.js";
import { OllamaAgentAdapter } from "./local-agent-provider.js";

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

export class MockAgentAdapter implements AgentAdapter {
  constructor(public readonly name: AgentName) {}
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    return { output: `${this.name} prepared an execution plan for: ${task.title}`, logs: [`${this.name} mock adapter accepted the task.`, `${this.name} mock adapter completed the task.`] };
  }
}

const mocks: Record<AgentName, AgentAdapter> = {
  Claude: new MockAgentAdapter("Claude"), Devin: new MockAgentAdapter("Devin"), Codex: new MockAgentAdapter("Codex"),
};

function configuredRuntime(): RuntimeMode {
  const mode = process.env.AGENT_PROVIDER_MODE?.trim().toLowerCase();
  if (mode === "local" || mode === "api" || mode === "mock") return mode;
  return "mock";
}

export function getAgentAdapter(agent: AgentName, runtime: RuntimeMode = configuredRuntime()): AgentAdapter {
  if (runtime === "local") return new OllamaAgentAdapter(agent);
  if (runtime === "api") return createRealAdapter(agent);
  return mocks[agent];
}

export function routeAgent(task: AgentTask): AgentAdapter {
  if (!AGENT_NAMES.includes(task.agent)) throw new Error(`Unsupported agent: ${task.agent}`);
  const runtime = task.runtime ?? configuredRuntime();
  if (!RUNTIME_NAMES.includes(runtime)) throw new Error(`Unsupported runtime: ${runtime}`);
  return getAgentAdapter(task.agent, runtime);
}
