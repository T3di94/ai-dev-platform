import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

export type SandboxResult = { command: string; stdout: string; stderr: string; code: number };

const ALLOWED_COMMANDS = new Set(["node", "npm", "pnpm", "npx"]);

export async function runSandboxed(command: string, args: string[] = [], timeoutMs = 30_000): Promise<SandboxResult> {
  if (!ALLOWED_COMMANDS.has(command)) throw new Error(`Sandbox command is not allowed: ${command}`);
  if (args.length > 30 || args.some((arg) => arg.length > 500)) throw new Error("Sandbox arguments are invalid or too large");
  const workspace = await mkdtemp(join(tmpdir(), "ai-dev-sandbox-"));
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { cwd: workspace, timeout: timeoutMs, maxBuffer: 1024 * 1024, env: { PATH: process.env.PATH ?? "", NODE_ENV: "test" } });
    return { command: [command, ...args].join(" "), stdout, stderr, code: 0 };
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string; code?: number; signal?: string };
    return { command: [command, ...args].join(" "), stdout: e.stdout ?? "", stderr: e.stderr ?? e.signal ?? "Sandbox execution failed", code: typeof e.code === "number" ? e.code : 1 };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
