import { randomUUID } from "node:crypto";

export type GitChange = { path: string; status: "added" | "modified" | "deleted"; additions: number; deletions: number };
export type WorkspaceChangeSet = { id: string; branch: string; base: string; changes: GitChange[]; createdAt: string };

export function createChangeSet(branch: string, base: string, changes: GitChange[]): WorkspaceChangeSet {
  if (!branch || !base) throw new Error("branch and base are required");
  if (!changes.length) throw new Error("No changes to commit");
  if (changes.length > 200) throw new Error("Too many changes in one workspace operation");
  return { id: randomUUID(), branch, base, changes, createdAt: new Date().toISOString() };
}

export function validateBranchName(branch: string): boolean {
  return /^(feat|fix|chore|refactor|test|docs)\/[a-z0-9][a-z0-9._-]{1,62}$/.test(branch);
}

export function buildCommitMessage(scope: string, summary: string): string {
  const cleanScope = scope.trim().replace(/[^a-z0-9-]/gi, "-").slice(0, 32);
  const cleanSummary = summary.trim().replace(/\s+/g, " ").slice(0, 100);
  if (!cleanScope || !cleanSummary) throw new Error("Commit scope and summary are required");
  return `feat(${cleanScope}): ${cleanSummary}`;
}
