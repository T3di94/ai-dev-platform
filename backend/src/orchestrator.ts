import type { AgentName, RuntimeMode } from "./agent-router.js";
import type { JsonStore, StoredTask } from "./persistence.js";

export type OrchestrationStatus = "Ready" | "In progress" | "Completed" | "Failed";
export type PlanStep = {
  key: string;
  title: string;
  agent: AgentName;
  runtime: RuntimeMode;
  dependsOn: string[];
  taskId?: number;
  parallelizable?: boolean;
  risk?: "low" | "medium" | "high";
};
export type Orchestration = {
  id: string;
  title: string;
  status: OrchestrationStatus;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
  error?: string;
  verification?: { required: boolean; passed?: boolean; checks: string[] };
};

const orchestrations = new Map<string, Orchestration>();

function pickRuntime(input?: string): RuntimeMode {
  const value = input?.toLowerCase();
  return value === "local" || value === "api" || value === "mock" ? value : "mock";
}

export function analyzeRequest(title: string) {
  const normalized = title.toLowerCase();
  return {
    needsBackend: /api|backend|server|database|auth|endpoint|service/.test(normalized),
    needsFrontend: /ui|frontend|page|dashboard|web|login|design/.test(normalized),
    needsSecurity: /auth|login|password|token|permission|payment|secret/.test(normalized),
    needsDocs: /docs|documentation|readme|guide/.test(normalized),
    risk: /payment|password|secret|permission/.test(normalized) ? "high" as const : /auth|database|api/.test(normalized) ? "medium" as const : "low" as const,
  };
}

export function createPlan(title: string, runtime?: string): PlanStep[] {
  const selectedRuntime = pickRuntime(runtime);
  const analysis = analyzeRequest(title);
  const steps: PlanStep[] = [
    { key: "plan", title: `Plan and analyze: ${title}`, agent: "Claude", runtime: selectedRuntime, dependsOn: [], parallelizable: false, risk: analysis.risk },
  ];
  if (analysis.needsBackend) steps.push({ key: "backend", title: `Implement backend: ${title}`, agent: "Devin", runtime: selectedRuntime, dependsOn: ["plan"], parallelizable: false, risk: analysis.risk });
  if (analysis.needsFrontend) steps.push({ key: "frontend", title: `Implement frontend: ${title}`, agent: "Claude", runtime: selectedRuntime, dependsOn: ["plan", ...(analysis.needsBackend ? ["backend"] : [])], parallelizable: !analysis.needsBackend, risk: analysis.risk });
  if (analysis.needsSecurity) {
    const implementationDependencies = steps.slice(1).map((step) => step.key);
    steps.push({ key: "security", title: `Security review: ${title}`, agent: "Codex", runtime: selectedRuntime, dependsOn: ["plan", ...implementationDependencies], parallelizable: false, risk: "high" });
  }
  if (analysis.needsDocs) steps.push({ key: "docs", title: `Document implementation: ${title}`, agent: "Claude", runtime: selectedRuntime, dependsOn: ["plan"], parallelizable: true, risk: "low" });
  const dependencies = steps.slice(1).map((step) => step.key);
  steps.push({ key: "qa", title: `Verify and test: ${title}`, agent: "Codex", runtime: selectedRuntime, dependsOn: ["plan", ...dependencies], parallelizable: false, risk: analysis.risk });
  return steps;
}

export function createOrchestration(store: JsonStore, title: string, runtime?: string): Orchestration {
  const now = new Date().toISOString();
  const plan = createPlan(title, runtime);
  for (const step of plan) {
    const task: StoredTask = store.addTask({ title: step.title, agent: step.agent, runtime: step.runtime, status: "Ready", logs: [], output: undefined });
    step.taskId = task.id;
  }
  const orchestration: Orchestration = {
    id: crypto.randomUUID(), title, status: "Ready", steps: plan, createdAt: now, updatedAt: now,
    verification: { required: true, checks: ["All planned steps completed", "No task failed", "QA step completed"] },
  };
  orchestrations.set(orchestration.id, orchestration);
  return orchestration;
}

export function getOrchestration(id: string): Orchestration | undefined { return orchestrations.get(id); }
export function listOrchestrations(): Orchestration[] { return [...orchestrations.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
export function saveOrchestration(orchestration: Orchestration): void { orchestration.updatedAt = new Date().toISOString(); orchestrations.set(orchestration.id, orchestration); }
