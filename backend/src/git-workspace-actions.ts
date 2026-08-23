import { buildCommitMessage, createChangeSet, validateBranchName, type GitChange, type WorkspaceChangeSet } from "./git-workflow.js";

export type WorkspaceAction = "preview" | "prepare-commit" | "prepare-pr";
export type WorkspaceActionResult = { action: WorkspaceAction; changeSet: WorkspaceChangeSet; commitMessage?: string; prTitle?: string };

export function prepareWorkspaceAction(action: WorkspaceAction, input: { branch: string; base: string; changes: GitChange[]; scope?: string; summary?: string }): WorkspaceActionResult {
  if (!validateBranchName(input.branch)) throw new Error("Invalid workspace branch name");
  const changeSet = createChangeSet(input.branch, input.base, input.changes);
  if (action === "preview") return { action, changeSet };
  if (!input.scope || !input.summary) throw new Error("scope and summary are required for commit preparation");
  const commitMessage = buildCommitMessage(input.scope, input.summary);
  return { action, changeSet, commitMessage, prTitle: action === "prepare-pr" ? commitMessage : undefined };
}
