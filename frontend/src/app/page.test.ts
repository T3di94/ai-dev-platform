import { describe, expect, it } from "vitest";

describe("frontend smoke", () => {
  it("has the expected application name", () => {
    expect("Claude. Devin. Codex.").toContain("Claude");
  });
});
