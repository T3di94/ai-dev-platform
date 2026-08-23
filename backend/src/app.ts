import Fastify from "fastify";
import cors from "@fastify/cors";
import { AGENT_NAMES, AgentName, RUNTIME_NAMES, RuntimeMode, routeAgent } from "./agent-router.js";
import { JsonStore, StoredTask } from "./persistence.js";
import { createOrchestration, getOrchestration, listOrchestrations, saveOrchestration } from "./orchestrator.js";
import { rateLimit, requireAdminToken, validateTaskTitle } from "./security.js";

type TaskStatus = StoredTask["status"];
type LogLevel = "info" | "success" | "error";

const agents = [
  { name: "Claude", role: "Frontend and UI engineering" },
  { name: "Devin", role: "Backend and API engineering" },
  { name: "Codex", role: "QA, testing, and regression verification" },
] as const;

const seedTasks = (): StoredTask[] => [
  { id: 1, title: "Build authentication flow", agent: "Claude", runtime: "mock", status: "In progress", logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Execution started." }], executions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, title: "Design API health endpoint", agent: "Devin", runtime: "mock", status: "Ready", logs: [], executions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, title: "Run regression suite", agent: "Codex", runtime: "mock", status: "Ready", logs: [], executions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function addLog(task: StoredTask, level: LogLevel, message: string) {
  task.logs.push({ timestamp: new Date().toISOString(), level, message });
  task.updatedAt = new Date().toISOString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Execution timed out after ${timeoutMs}ms.`)), timeoutMs);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

async function executeTask(store: JsonStore, task: StoredTask): Promise<StoredTask> {
  if (task.status === "In progress") throw new Error("Task is already running");
  task.status = "In progress";
  task.output = undefined;
  task.logs = [];
  addLog(task, "info", `Routing ${task.runtime} task to ${task.agent}.`);

  const maxAttempts = Math.max(1, Math.min(3, Number(process.env.AGENT_MAX_ATTEMPTS ?? 2)));
  const timeoutMs = Math.max(1_000, Math.min(300_000, Number(process.env.AGENT_TIMEOUT_MS ?? 45_000)));
  const fallbackAgents: AgentName[] = [task.agent, ...AGENT_NAMES.filter((agent) => agent !== task.agent)];
  let lastError: unknown = new Error("Agent execution failed.");

  for (let agentIndex = 0; agentIndex < fallbackAgents.length; agentIndex += 1) {
    const agent = fallbackAgents[agentIndex];
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const execution = { id: crypto.randomUUID(), startedAt: new Date().toISOString(), status: "In progress" as const, attempt, runtime: task.runtime, agent };
      task.executions.push(execution);
      addLog(task, "info", `Attempt ${attempt}/${maxAttempts} using ${agent}.`);
      try {
        const adapter = routeAgent({ title: task.title, agent, runtime: task.runtime });
        addLog(task, "info", `${adapter.name} ${task.runtime} adapter accepted the task.`);
        const result = await withTimeout(adapter.execute({ title: task.title, agent, runtime: task.runtime }), timeoutMs);
        for (const message of result.logs) addLog(task, "info", message);
        task.output = result.output;
        task.status = "Completed";
        execution.status = "Completed";
        execution.finishedAt = new Date().toISOString();
        execution.output = result.output;
        addLog(task, "success", `Execution completed successfully with ${agent}.`);
        await store.save();
        return task;
      } catch (error) {
        lastError = error;
        execution.status = "Failed";
        execution.finishedAt = new Date().toISOString();
        execution.error = error instanceof Error ? error.message : "Agent execution failed.";
        addLog(task, "error", `${agent} attempt ${attempt} failed: ${execution.error}`);
        await store.save();
      }
    }
    if (agentIndex < fallbackAgents.length - 1) addLog(task, "info", `Falling back from ${agent} to ${fallbackAgents[agentIndex + 1]}.`);
  }

  task.status = "Failed";
  const message = lastError instanceof Error ? lastError.message : "Agent execution failed.";
  addLog(task, "error", `Execution failed after recovery attempts: ${message}`);
  await store.save();
  return task;
}

export function buildApp(options: { store?: JsonStore } = {}) {
  const app = Fastify({ logger: true, bodyLimit: 32 * 1024 });
  const store = options.store ?? new JsonStore(process.env.NODE_ENV === "test" ? undefined : undefined);
  const initialize = store.init(store.tasks.length ? [] : seedTasks());

  app.register(cors, { origin: true });
  app.addHook("onRequest", async (request, reply) => {
    if (!rateLimit(request, reply)) return;
    if (["POST", "PATCH", "DELETE"].includes(request.method) && !requireAdminToken(request, reply)) return;
  });
  app.get("/health", async () => ({ status: "ok", service: "backend", persistence: "json" }));
  app.get("/agents", async () => agents);
  app.get("/runtimes", async () => [
    { name: "mock", available: true, description: "Deterministic CI-safe runtime" },
    { name: "local", available: true, description: "Local Ollama runtime; no cloud API required" },
    { name: "api", available: true, description: "Configured cloud provider runtime" },
  ]);
  app.get("/tasks", async () => { await initialize; return store.tasks; });
  app.get<{ Params: { id: string } }>("/tasks/:id/logs", async (request, reply) => {
    await initialize;
    const task = store.getTask(Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return task.logs;
  });
  app.get<{ Params: { id: string } }>("/tasks/:id/executions", async (request, reply) => {
    await initialize;
    const task = store.getTask(Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return task.executions;
  });
  app.post<{ Body: { title?: string; agent?: string; runtime?: string } }>("/tasks", async (request, reply) => {
    await initialize;
    const title = validateTaskTitle(request.body?.title);
    const agent = request.body?.agent;
    const runtime = (request.body?.runtime ?? "mock").toLowerCase();
    if (!title) return reply.code(400).send({ error: "Task title is required and must be <= 500 characters" });
    if (!AGENT_NAMES.includes(agent as AgentName)) return reply.code(400).send({ error: "A valid agent is required" });
    if (!RUNTIME_NAMES.includes(runtime as RuntimeMode)) return reply.code(400).send({ error: "A valid runtime is required" });
    const task = store.addTask({ title, agent: agent as AgentName, runtime: runtime as RuntimeMode, status: "Ready", logs: [], output: undefined });
    await store.save();
    return reply.code(201).send(task);
  });
  app.patch<{ Params: { id: string }; Body: { status?: TaskStatus } }>("/tasks/:id", async (request, reply) => {
    await initialize;
    const task = store.getTask(Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    const status = request.body?.status;
    if (!["Ready", "In progress", "Completed", "Failed"].includes(status ?? "")) return reply.code(400).send({ error: "Invalid task status" });
    task.status = status as TaskStatus;
    addLog(task, status === "Failed" ? "error" : "info", `Status changed to ${status}.`);
    await store.save();
    return task;
  });
  app.post<{ Params: { id: string } }>("/tasks/:id/execute", async (request, reply) => {
    await initialize;
    const task = store.getTask(Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    if (task.status === "In progress") return reply.code(409).send({ error: "Task is already running" });
    const result = await executeTask(store, task);
    return reply.code(result.status === "Failed" ? 502 : 200).send(result);
  });
  app.post<{ Body: { title?: string; runtime?: string } }>("/orchestrations", async (request, reply) => {
    await initialize;
    const title = validateTaskTitle(request.body?.title);
    if (!title) return reply.code(400).send({ error: "Orchestration title is required and must be <= 500 characters" });
    const orchestration = createOrchestration(store, title, request.body?.runtime);
    await store.save();
    return reply.code(201).send(orchestration);
  });
  app.get("/orchestrations", async () => listOrchestrations());
  app.get<{ Params: { id: string } }>("/orchestrations/:id", async (request, reply) => {
    const orchestration = getOrchestration(request.params.id);
    if (!orchestration) return reply.code(404).send({ error: "Orchestration not found" });
    return orchestration;
  });
  app.post<{ Params: { id: string } }>("/orchestrations/:id/execute", async (request, reply) => {
    await initialize;
    const orchestration = getOrchestration(request.params.id);
    if (!orchestration) return reply.code(404).send({ error: "Orchestration not found" });
    if (orchestration.status === "In progress") return reply.code(409).send({ error: "Orchestration is already running" });
    orchestration.status = "In progress";
    saveOrchestration(orchestration);
    try {
      for (const step of orchestration.steps) {
        for (const dependency of step.dependsOn) {
          const dependencyStep = orchestration.steps.find((candidate) => candidate.key === dependency);
          if (!dependencyStep?.taskId) throw new Error(`Missing dependency: ${dependency}`);
          const dependencyTask = store.getTask(dependencyStep.taskId);
          if (dependencyTask?.status !== "Completed") throw new Error(`Dependency ${dependency} did not complete.`);
        }
        if (!step.taskId) throw new Error(`Missing task for step ${step.key}`);
        const task = store.getTask(step.taskId);
        if (!task) throw new Error(`Task ${step.taskId} not found.`);
        const result = await executeTask(store, task);
        if (result.status !== "Completed") throw new Error(`Step ${step.key} failed.`);
      }
      orchestration.status = "Completed";
      saveOrchestration(orchestration);
      return orchestration;
    } catch (error) {
      orchestration.status = "Failed";
      orchestration.error = error instanceof Error ? error.message : "Orchestration failed.";
      saveOrchestration(orchestration);
      return reply.code(502).send(orchestration);
    }
  });
  return app;
}
