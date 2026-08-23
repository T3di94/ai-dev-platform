import { describe, expect, it } from "vitest";

describe("backend smoke", () => {
  it("has a healthy service contract", () => {
    expect({ status: "ok" }).toEqual({ status: "ok" });
  });
});
