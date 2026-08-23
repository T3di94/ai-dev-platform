import Fastify from "fastify";
import cors from "@fastify/cors";

const agents = [
  { name: "Claude", role: "Frontend and UI engineering" },
  { name: "Devin", role: "Backend and API engineering" },
  { name: "Codex", role: "QA, testing, and regression verification" },
] as const;

type TaskStatus = "Ready" | "In progress";

type Task = {
  id: number;
  title: string;
  agent: (typeof agents)[number]["name"];
  status: TaskStatus;
};

const tasks: Task[] = [
  { id: 1, title: "Build authentication flow", agent: "Claude", status: "In progress" },
  { id: 2, title: "Design API health endpoint", agent: "Devin", status: "Ready" },
  { id: 3, title: "Run regression suite", agent: "Codex", status: "Ready" },
];

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });

  app.get("/health", async () => ({
    status: "ok",
    service: "backend",
  }));

  app.get("/agents", async () => agents);

  app.get("/tasks", async () => tasks);

  app.post<{ Body: { title?: string; agent?: string } }>("/tasks", async (request, reply) => {
    const title = request.body?.title?.trim();
    const agent = request.body?.agent;

    if (!title) {
      return reply.code(400).send({ error: "Task title is required" });
    }

    if (!agents.some((item) => item.name === agent)) {
      return reply.code(400).send({ error: "A valid agent is required" });
    }

    const task: Task = {
      id: Date.now(),
      title,
      agent: agent as Task["agent"],
      status: "Ready",
    };

    tasks.unshift(task);
    return reply.code(201).send(task);
  });

  app.patch<{ Params: { id: string }; Body: { status?: TaskStatus } }>("/tasks/:id", async (request, reply) => {
    const id = Number(request.params.id);
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return reply.code(404).send({ error: "Task not found" });
    }

    if (request.body?.status !== "Ready" && request.body?.status !== "In progress") {
      return reply.code(400).send({ error: "Invalid task status" });
    }

    task.status = request.body.status;
    return task;
  });

  return app;
}
