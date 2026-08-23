import { describe, expect, it } from "vitest";
import { agents } from "./platform";

describe("AI agent ownership", () => {
  it("keeps the three responsibilities separated", () => {
    expect(agents).toEqual([
      { name: "Claude", role: "Frontend" },
      { name: "Devin", role: "Backend" },
      { name: "Codex", role: "QA & Testing" },
    ]);
  });
});
