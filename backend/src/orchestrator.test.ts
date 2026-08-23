import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("orchestrator", () => {
  it("decomposes a full-stack task into ordered agent steps", async () => {
    const app = buildApp();
    const response = await app.inject({ method: "POST", url: "/orchestrations", payload: { title: "Build login page and authentication API", runtime: "mock" } });
    expect(response.statusCode).toBe(201);
    const orchestration = response.json();
    expect(orchestration.steps.map((step: { key: string }) => step.key)).toEqual(["plan", "backend", "frontend", "qa"]);
    expect(orchestration.steps[1].dependsOn).toEqual(["plan"]);
    expect(orchestration.steps[2].dependsOn).toEqual(["plan", "backend"]);
    expect(orchestration.steps[3].dependsOn).toEqual(["plan", "backend", "frontend"]);
    await app.close();
  });

  it("executes all steps in dependency order", async () => {
    const app = buildApp();
    const create = await app.inject({ method: "POST", url: "/orchestrations", payload: { title: "Build API endpoint", runtime: "mock" } });
    const orchestration = create.json();
    const response = await app.inject({ method: "POST", url: `/orchestrations/${orchestration.id}/execute` });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("Completed");
    const tasks = await app.inject({ method: "GET", url: "/tasks" });
    const taskIds = new Set(orchestration.steps.map((step: { taskId: number }) => step.taskId));
    for (const task of tasks.json().filter((item: { id: number }) => taskIds.has(item.id))) expect(task.status).toBe("Completed");
    await app.close();
  });
});
