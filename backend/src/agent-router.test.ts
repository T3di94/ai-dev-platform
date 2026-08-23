import { describe, expect, it } from "vitest";
import { getAgentAdapter, routeAgent } from "./agent-router.js";

describe("agent router", () => {
  it.each(["Claude", "Devin", "Codex"] as const)("routes %s to its adapter", (agent) => {
    expect(routeAgent({ title: "test task", agent }).name).toBe(agent);
  });

  it("executes mock tasks without network access", async () => {
    const result = await getAgentAdapter("Codex", "mock").execute({ title: "Run tests", agent: "Codex", runtime: "mock" });
    expect(result.output).toContain("Codex");
    expect(result.logs).toHaveLength(2);
  });

  it("routes local tasks through the Ollama-backed adapter", () => {
    expect(getAgentAdapter("Claude", "local").name).toBe("Claude");
  });

  it("routes Claude and Codex API tasks through unified provider adapters", () => {
    expect(() => getAgentAdapter("Claude", "api")).toThrow("ANTHROPIC_API_KEY");
    expect(() => getAgentAdapter("Codex", "api")).toThrow("OPENAI_API_KEY");
  });

  it("retains the explicit Devin API adapter", () => {
    expect(getAgentAdapter("Devin", "api").name).toBe("Devin");
  });

  it("rejects unsupported agents", () => {
    expect(() => routeAgent({ title: "test task", agent: "Unknown" as never })).toThrow("Unsupported agent");
  });
});
