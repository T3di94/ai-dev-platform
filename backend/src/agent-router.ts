import { createRealAdapter } from "./real-agent-providers.js";

export const AGENT_NAMES = ["Claude", "Devin", "Codex"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];
export type AgentTask = { title: string; agent: AgentName };
export type AgentExecutionResult = { output: string; logs: string[] };

export interface AgentAdapter {
  readonly name: AgentName;
  execute(task: AgentTask): Promise<AgentExecutionResult>;
}

export class MockAgentAdapter implements AgentAdapter {
  constructor(public readonly name: AgentName) {}
  async execute(task: AgentTask): Promise<AgentExecutionResult> {
    return { output: `${this.name} prepared an execution plan for: ${task.title}`, logs: [`${this.name} adapter accepted the task.`, `${this.name} adapter completed the task.`] };
  }
}

const mocks: Record<AgentName, AgentAdapter> = {
  Claude: new MockAgentAdapter("Claude"), Devin: new MockAgentAdapter("Devin"), Codex: new MockAgentAdapter("Codex"),
};

function realProviderEnabled(): boolean { return process.env.AGENT_PROVIDER_MODE === "real"; }

export function getAgentAdapter(agent: AgentName): AgentAdapter {
  return realProviderEnabled() ? createRealAdapter(agent) : mocks[agent];
}

export function routeAgent(task: AgentTask): AgentAdapter {
  if (!AGENT_NAMES.includes(task.agent)) throw new Error(`Unsupported agent: ${task.agent}`);
  return getAgentAdapter(task.agent);
}
