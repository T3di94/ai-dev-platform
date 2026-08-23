import Fastify from "fastify";
import cors from "@fastify/cors";
import { AGENT_NAMES, AgentName, RUNTIME_NAMES, RuntimeMode, routeAgent } from "./agent-router.js";

type TaskStatus = "Ready" | "In progress" | "Completed" | "Failed";
type LogLevel = "info" | "success" | "error";
type ExecutionLog = { timestamp: string; level: LogLevel; message: string };
type Task = {
  id: number;
  title: string;
  agent: AgentName;
  runtime: RuntimeMode;
  status: TaskStatus;
  output?: string;
  logs: ExecutionLog[];
};

const agents = [
  { name: "Claude", role: "Frontend and UI engineering" },
  { name: "Devin", role: "Backend and API engineering" },
  { name: "Codex", role: "QA, testing, and regression verification" },
] as const;

const tasks: Task[] = [
  { id: 1, title: "Build authentication flow", agent: "Claude", runtime: "mock", status: "In progress", logs: [{ timestamp: new Date().toISOString(), level: "info", message: "Execution started." }] },
  { id: 2, title: "Design API health endpoint", agent: "Devin", runtime: "mock", status: "Ready", logs: [] },
  { id: 3, title: "Run regression suite", agent: "Codex", runtime: "mock", status: "Ready", logs: [] },
];

function addLog(task: Task, level: LogLevel, message: string) {
  task.logs.push({ timestamp: new Date().toISOString(), level, message });
}

export function buildApp() {
  const app = Fastify({ logger: true });
  app.register(cors, { origin: true });
  app.get("/health", async () => ({ status: "ok", service: "backend" }));
  app.get("/agents", async () => agents);
  app.get("/runtimes", async () => [
    { name: "mock", available: true, description: "Deterministic CI-safe runtime" },
    { name: "local", available: true, description: "Local Ollama runtime; no cloud API required" },
    { name: "api", available: true, description: "Configured cloud provider runtime" },
  ]);
  app.get("/tasks", async () => tasks);
  app.get<{ Params: { id: string } }>("/tasks/:id/logs", async (request, reply) => {
    const task = tasks.find((item) => item.id === Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    return task.logs;
  });
  app.post<{ Body: { title?: string; agent?: string; runtime?: string } }>("/tasks", async (request, reply) => {
    const title = request.body?.title?.trim();
    const agent = request.body?.agent;
    const runtime = (request.body?.runtime ?? "mock").toLowerCase();
    if (!title) return reply.code(400).send({ error: "Task title is required" });
    if (!AGENT_NAMES.includes(agent as AgentName)) return reply.code(400).send({ error: "A valid agent is required" });
    if (!RUNTIME_NAMES.includes(runtime as RuntimeMode)) return reply.code(400).send({ error: "A valid runtime is required" });
    const task: Task = { id: Date.now(), title, agent: agent as AgentName, runtime: runtime as RuntimeMode, status: "Ready", logs: [] };
    tasks.unshift(task);
    return reply.code(201).send(task);
  });
  app.patch<{ Params: { id: string }; Body: { status?: TaskStatus } }>("/tasks/:id", async (request, reply) => {
    const task = tasks.find((item) => item.id === Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    const status = request.body?.status;
    if (!["Ready", "In progress", "Completed", "Failed"].includes(status ?? "")) return reply.code(400).send({ error: "Invalid task status" });
    task.status = status as TaskStatus;
    addLog(task, status === "Failed" ? "error" : "info", `Status changed to ${status}.`);
    return task;
  });
  app.post<{ Params: { id: string } }>("/tasks/:id/execute", async (request, reply) => {
    const task = tasks.find((item) => item.id === Number(request.params.id));
    if (!task) return reply.code(404).send({ error: "Task not found" });
    if (task.status === "In progress") return reply.code(409).send({ error: "Task is already running" });
    task.status = "In progress";
    task.output = undefined;
    task.logs = [];
    addLog(task, "info", `Routing ${task.runtime} task to ${task.agent}.`);
    try {
      const adapter = routeAgent({ title: task.title, agent: task.agent, runtime: task.runtime });
      addLog(task, "info", `${adapter.name} ${task.runtime} adapter accepted the task.`);
      const result = await adapter.execute({ title: task.title, agent: task.agent, runtime: task.runtime });
      for (const message of result.logs) addLog(task, "info", message);
      task.output = result.output;
      task.status = "Completed";
      addLog(task, "success", "Execution completed successfully.");
    } catch (error) {
      task.status = "Failed";
      addLog(task, "error", error instanceof Error ? error.message : "Agent execution failed.");
      return reply.code(502).send(task);
    }
    return task;
  });
  return app;
}
