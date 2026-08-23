import { describe, expect, it } from "vitest";
import { buildCommitMessage, createChangeSet, validateBranchName } from "./git-workflow.js";

describe("git workspace workflow", () => {
  it("accepts safe workspace branch names", () => {
    expect(validateBranchName("feat/editor-save")).toBe(true);
    expect(validateBranchName("main")).toBe(false);
    expect(validateBranchName("feature/unsafe space")).toBe(false);
  });

  it("creates a bounded change set", () => {
    const changeSet = createChangeSet("feat/editor-save", "main", [{ path: "src/app.ts", status: "modified", additions: 4, deletions: 1 }]);
    expect(changeSet.branch).toBe("feat/editor-save");
    expect(changeSet.changes).toHaveLength(1);
  });

  it("normalizes commit messages", () => {
    expect(buildCommitMessage("workspace", "save editor changes")).toBe("feat(workspace): save editor changes");
  });

  it("rejects empty change sets", () => {
    expect(() => createChangeSet("feat/editor-save", "main", [])).toThrow("No changes");
  });
});
