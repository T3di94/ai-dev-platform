import { describe, expect, it } from "vitest";
import { runProviderE2E } from "./provider-e2e.js";

describe("provider E2E flow", () => {
  it("runs the complete Mock flow", async () => {
    await expect(runProviderE2E({ mode: "mock" }, "hello", {})).resolves.toMatchObject({ ok: true, text: "mock:hello", provider: "mock", model: "mock" });
  });

  it("rejects an empty prompt", async () => {
    await expect(runProviderE2E({ mode: "mock" }, "   ", {})).rejects.toThrow("Prompt is required");
  });

  it("fails closed when an API credential is missing", async () => {
    await expect(runProviderE2E({ mode: "api", provider: "claude" }, "hello", {})).rejects.toThrow("ANTHROPIC_API_KEY");
  });
});
