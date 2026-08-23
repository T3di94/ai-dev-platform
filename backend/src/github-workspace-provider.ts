import { buildCommitMessage, validateBranchName } from "./git-workflow.js";

export type WorkspaceCommitPlan = {
  branch: string;
  base: string;
  message: string;
  paths: string[];
};

export function createWorkspaceCommitPlan(input: {
  branch: string;
  base: string;
  scope: string;
  summary: string;
  paths: string[];
}): WorkspaceCommitPlan {
  if (!validateBranchName(input.branch)) throw new Error("Invalid workspace branch name");
  if (!input.base || input.base === input.branch) throw new Error("A distinct base branch is required");
  if (!input.paths.length) throw new Error("At least one changed path is required");
  if (input.paths.length > 100) throw new Error("Too many changed paths");
  if (input.paths.some((path) => !path || path.startsWith("/") || path.includes(".."))) {
    throw new Error("Unsafe workspace path");
  }
  return {
    branch: input.branch,
    base: input.base,
    message: buildCommitMessage(input.scope, input.summary),
    paths: [...new Set(input.paths)],
  };
}
