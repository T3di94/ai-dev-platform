export type Agent = { name: string; role: string };
export type RuntimeMode = "mock" | "local" | "api";
export type Runtime = { name: RuntimeMode; available: boolean; description: string };
export type TaskStatus = "Ready" | "In progress" | "Completed" | "Failed";
export type ExecutionLog = { timestamp: string; level: "info" | "success" | "error"; message: string };
export type Task = { id: number; title: string; agent: string; runtime: RuntimeMode; status: TaskStatus; output?: string; logs: ExecutionLog[] };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getAgents: () => request<Agent[]>("/agents"),
  getRuntimes: () => request<Runtime[]>("/runtimes"),
  getTasks: () => request<Task[]>("/tasks"),
  createTask: (title: string, agent: string, runtime: RuntimeMode) => request<Task>("/tasks", { method: "POST", body: JSON.stringify({ title, agent, runtime }) }),
  updateTask: (id: number, status: TaskStatus) => request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  executeTask: (id: number) => request<Task>(`/tasks/${id}/execute`, { method: "POST" }),
  getTaskLogs: (id: number) => request<ExecutionLog[]>(`/tasks/${id}/logs`),
};
