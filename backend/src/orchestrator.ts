import type { AgentName, RuntimeMode } from "./agent-router.js";
import type { JsonStore, StoredTask } from "./persistence.js";

export type OrchestrationStatus = "Ready" | "In progress" | "Completed" | "Failed";
export type PlanStep = { key: string; title: string; agent: AgentName; runtime: RuntimeMode; dependsOn: string[]; taskId?: number };
export type Orchestration = {
  id: string;
  title: string;
  status: OrchestrationStatus;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
  error?: string;
};

const orchestrations = new Map<string, Orchestration>();

function pickRuntime(input?: string): RuntimeMode {
  const value = input?.toLowerCase();
  return value === "local" || value === "api" || value === "mock" ? value : "mock";
}

export function createPlan(title: string, runtime?: string): PlanStep[] {
  const normalized = title.toLowerCase();
  const selectedRuntime = pickRuntime(runtime);
  const steps: PlanStep[] = [
    { key: "plan", title: `Plan and analyze: ${title}`, agent: "Claude", runtime: selectedRuntime, dependsOn: [] },
  ];
  const needsBackend = /api|backend|server|database|auth|endpoint|service/.test(normalized);
  const needsFrontend = /ui|frontend|page|dashboard|web|login|design/.test(normalized);
  if (needsBackend) steps.push({ key: "backend", title: `Implement backend: ${title}`, agent: "Devin", runtime: selectedRuntime, dependsOn: ["plan"] });
  if (needsFrontend) steps.push({ key: "frontend", title: `Implement frontend: ${title}`, agent: "Claude", runtime: selectedRuntime, dependsOn: ["plan", ...(needsBackend ? ["backend"] : [])] });
  const dependencies = steps.slice(1).map((step) => step.key);
  steps.push({ key: "qa", title: `Verify and test: ${title}`, agent: "Codex", runtime: selectedRuntime, dependsOn: dependencies });
  return steps;
}

export function createOrchestration(store: JsonStore, title: string, runtime?: string): Orchestration {
  const now = new Date().toISOString();
  const plan = createPlan(title, runtime);
  for (const step of plan) {
    const task: StoredTask = store.addTask({
      title: step.title,
      agent: step.agent,
      runtime: step.runtime,
      status: "Ready",
      logs: [],
      output: undefined,
    });
    step.taskId = task.id;
  }
  const orchestration: Orchestration = { id: crypto.randomUUID(), title, status: "Ready", steps: plan, createdAt: now, updatedAt: now };
  orchestrations.set(orchestration.id, orchestration);
  return orchestration;
}

export function getOrchestration(id: string): Orchestration | undefined { return orchestrations.get(id); }
export function listOrchestrations(): Orchestration[] { return [...orchestrations.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function saveOrchestration(orchestration: Orchestration): void { orchestration.updatedAt = new Date().toISOString(); orchestrations.set(orchestration.id, orchestration); }
