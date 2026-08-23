import { describe, expect, it } from "vitest";
import { runSandboxed } from "./sandbox.js";

describe("sandbox", () => {
  it("rejects commands outside the allowlist", async () => {
    await expect(runSandboxed("sh", ["-c", "echo unsafe"])).rejects.toThrow("not allowed");
  });

  it("runs a permitted node command in an isolated temporary workspace", async () => {
    const result = await runSandboxed("node", ["-e", "process.stdout.write('sandbox-ok')"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("sandbox-ok");
  });
});
