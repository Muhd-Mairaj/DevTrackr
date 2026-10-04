import { describe, expect, it } from "vitest";
import { isTypingTarget } from "@/lib/shortcuts";

describe("isTypingTarget", () => {
  it("returns false for null and non-elements", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget("text" as unknown as EventTarget)).toBe(false);
  });

  it("flags inputs, textareas, and selects", () => {
    for (const tag of ["input", "textarea", "select"]) {
      const el = document.createElement(tag);
      expect(isTypingTarget(el)).toBe(true);
    }
  });

  it("ignores plain buttons and body", () => {
    expect(isTypingTarget(document.createElement("button"))).toBe(false);
    expect(isTypingTarget(document.body)).toBe(false);
  });
});
