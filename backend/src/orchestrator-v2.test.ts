import { describe, expect, it } from "vitest";
import { analyzeRequest, createPlan } from "./orchestrator.js";

describe("orchestrator v2 planner", () => {
  it("detects security-sensitive work and adds a security gate", () => {
    const analysis = analyzeRequest("Build login API with password authentication");
    expect(analysis.needsBackend).toBe(true);
    expect(analysis.needsSecurity).toBe(true);
    expect(analysis.risk).toBe("high");
    expect(createPlan("Build login API with password authentication", "mock").map((step) => step.key)).toEqual(["plan", "backend", "security", "qa"]);
  });

  it("keeps independent documentation work parallelizable", () => {
    const steps = createPlan("Build dashboard and update documentation", "local");
    const docs = steps.find((step) => step.key === "docs");
    expect(docs?.parallelizable).toBe(true);
    expect(docs?.dependsOn).toEqual(["plan"]);
    expect(docs?.runtime).toBe("local");
  });

  it("preserves the existing full-stack dependency contract", () => {
    const steps = createPlan("Build login page and authentication API", "mock");
    expect(steps.map((step) => step.key)).toEqual(["plan", "backend", "frontend", "security", "qa"]);
    expect(steps.at(-1)?.dependsOn).toEqual(["plan", "backend", "frontend", "security"]);
  });
});
