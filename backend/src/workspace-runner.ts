import { runSandboxed, type SandboxResult } from "./sandbox.js";

export type WorkspaceCommand = "test" | "build";

const COMMANDS: Record<WorkspaceCommand, { command: string; args: string[] }> = {
  test: { command: "npm", args: ["test", "--", "--runInBand"] },
  build: { command: "npm", args: ["run", "build"] },
};

export async function runWorkspaceCheck(check: WorkspaceCommand): Promise<SandboxResult> {
  const definition = COMMANDS[check];
  if (!definition) throw new Error(`Unsupported workspace check: ${check}`);
  return runSandboxed(definition.command, definition.args, 60_000);
}
