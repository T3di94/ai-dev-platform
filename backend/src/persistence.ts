import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentName, RuntimeMode } from "./agent-router.js";

export type StoredExecution = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "In progress" | "Completed" | "Failed";
  attempt: number;
  runtime: RuntimeMode;
  agent: AgentName;
  output?: string;
  error?: string;
};

export type StoredLog = { timestamp: string; level: "info" | "success" | "error"; message: string };
export type StoredTask = {
  id: number;
  title: string;
  agent: AgentName;
  runtime: RuntimeMode;
  status: "Ready" | "In progress" | "Completed" | "Failed";
  output?: string;
  logs: StoredLog[];
  executions: StoredExecution[];
  createdAt: string;
  updatedAt: string;
};

export type StoreState = { nextTaskId: number; tasks: StoredTask[] };

export class JsonStore {
  private state: StoreState = { nextTaskId: 1, tasks: [] };
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();
  private readonly filePath: string;

  constructor(filePath = process.env.AI_DEV_DATA_FILE ?? join(process.cwd(), ".data", "store.json")) {
    this.filePath = filePath;
  }

  async init(seed: StoredTask[] = []): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as StoreState;
      if (!Array.isArray(this.state.tasks) || !Number.isInteger(this.state.nextTaskId)) throw new Error("Invalid store format");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.state = { nextTaskId: seed.reduce((max, task) => Math.max(max, task.id), 0) + 1, tasks: seed };
      await this.persist();
    }
    this.loaded = true;
  }

  get tasks(): StoredTask[] { return this.state.tasks; }
  getTask(id: number): StoredTask | undefined { return this.state.tasks.find((task) => task.id === id); }

  addTask(input: Omit<StoredTask, "id" | "createdAt" | "updatedAt" | "executions">): StoredTask {
    const now = new Date().toISOString();
    const task: StoredTask = { ...input, id: this.state.nextTaskId++, executions: [], createdAt: now, updatedAt: now };
    this.state.tasks.unshift(task);
    return task;
  }

  async save(): Promise<void> { await this.persist(); }

  private async persist(): Promise<void> {
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const temp = `${this.filePath}.${process.pid}.tmp`;
      await writeFile(temp, JSON.stringify(this.state, null, 2), "utf8");
      await rename(temp, this.filePath);
    });
    await this.writeQueue;
  }
}
