import { describe, expect, it } from "vitest";
import { getAgentAdapter, routeAgent } from "./agent-router.js";

describe("agent router", () => {
  it.each(["Claude", "Devin", "Codex"] as const)("routes %s to its adapter", (agent) => {
    expect(routeAgent({ title: "test task", agent }).name).toBe(agent);
  });

  it("executes through the selected adapter", async () => {
    const result = await getAgentAdapter("Codex").execute({ title: "Run tests", agent: "Codex" });
    expect(result.output).toContain("Codex");
    expect(result.logs).toHaveLength(2);
  });

  it("rejects unsupported agents", () => {
    expect(() => routeAgent({ title: "test task", agent: "Unknown" as never })).toThrow("Unsupported agent");
  });
});
