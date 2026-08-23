import { describe, expect, it } from "vitest";
import { prepareWorkspaceAction } from "./git-workspace-actions.js";

const changes = [{ path: "src/app.ts", status: "modified" as const, additions: 3, deletions: 1 }];

describe("workspace git actions", () => {
  it("previews a bounded change set", () => {
    const result = prepareWorkspaceAction("preview", { branch: "feat/editor-save", base: "main", changes });
    expect(result.changeSet.changes).toHaveLength(1);
    expect(result.commitMessage).toBeUndefined();
  });

  it("prepares a commit and PR without writing to Git", () => {
    const result = prepareWorkspaceAction("prepare-pr", { branch: "feat/editor-save", base: "main", changes, scope: "workspace", summary: "save editor changes" });
    expect(result.commitMessage).toBe("feat(workspace): save editor changes");
    expect(result.prTitle).toBe(result.commitMessage);
  });
});
