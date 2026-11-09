import { describe, expect, it } from "vitest";
import { resolvePostLoginTarget } from "./login-redirect";

describe("resolvePostLoginTarget", () => {
  it("keeps an absolute in-app path, including its query string", () => {
    expect(resolvePostLoginTarget("/projects/p1?page=2")).toBe(
      "/projects/p1?page=2",
    );
  });

  it("rejects external and protocol-relative targets", () => {
    expect(resolvePostLoginTarget("//evil.example")).toBe("/");
    expect(resolvePostLoginTarget("https://evil.example")).toBe("/");
    expect(resolvePostLoginTarget("relative/path")).toBe("/");
  });

  it("falls back to home when the target is missing", () => {
    expect(resolvePostLoginTarget(null)).toBe("/");
    expect(resolvePostLoginTarget(undefined)).toBe("/");
  });
});
