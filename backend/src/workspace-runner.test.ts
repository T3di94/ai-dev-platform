import { describe, expect, it, vi } from "vitest";
import { runWorkspaceCheck } from "./workspace-runner.js";
import * as sandbox from "./sandbox.js";

describe("workspace runner", () => {
  it("allows only the supported test/build checks", async () => {
    const spy = vi.spyOn(sandbox, "runSandboxed").mockResolvedValue({ command: "npm test -- --runInBand", stdout: "ok", stderr: "", code: 0 });
    const result = await runWorkspaceCheck("test");
    expect(result.code).toBe(0);
    expect(spy).toHaveBeenCalledWith("npm", ["test", "--", "--runInBand"], 60_000);
    spy.mockRestore();
  });

  it("rejects unknown checks", async () => {
    await expect(runWorkspaceCheck("lint" as never)).rejects.toThrow("Unsupported workspace check");
  });
});
