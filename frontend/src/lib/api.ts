export type Agent = {
  name: string;
  role: string;
};

export type Task = {
  id: number;
  title: string;
  agent: string;
  status: "Ready" | "In progress";
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getAgents: () => request<Agent[]>("/agents"),
  getTasks: () => request<Task[]>("/tasks"),
  createTask: (title: string, agent: string) => request<Task>("/tasks", { method: "POST", body: JSON.stringify({ title, agent }) }),
  updateTask: (id: number, status: Task["status"]) => request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
