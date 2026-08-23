import { describe, expect, it } from "vitest";
import { createWorkspaceCommitPlan } from "./github-workspace-provider.js";

describe("github workspace provider", () => {
  const base = { branch: "feat/editor-save", base: "main", scope: "workspace", summary: "save editor changes", paths: ["src/app.ts", "src/app.ts"] };

  it("creates a safe commit plan", () => {
    const plan = createWorkspaceCommitPlan(base);
    expect(plan.message).toBe("feat(workspace): save editor changes");
    expect(plan.paths).toEqual(["src/app.ts"]);
  });

  it("rejects unsafe paths", () => {
    expect(() => createWorkspaceCommitPlan({ ...base, paths: ["../secrets.env"] })).toThrow("Unsafe workspace path");
    expect(() => createWorkspaceCommitPlan({ ...base, paths: ["/etc/passwd"] })).toThrow("Unsafe workspace path");
  });
});
