import { describe, expect, it } from "vitest";
import { formatDuration, formatTimeRange } from "./utils";

describe("formatTimeRange", () => {
  it("renders an open range when the end is missing", () => {
    expect(formatTimeRange("2026-08-05T09:41:00Z")).toBe("09:41–");
  });

  it("renders start and end with an en dash", () => {
    expect(
      formatTimeRange("2026-08-05T09:41:00Z", "2026-08-05T11:05:00Z"),
    ).toBe("09:41–11:05");
  });
});

describe("formatDuration", () => {
  it("renders a dash for missing durations", () => {
    expect(formatDuration(null)).toBe("–");
    expect(formatDuration(undefined)).toBe("–");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(5040)).toBe("01:24");
    expect(formatDuration(3600)).toBe("01:00");
  });

  it("pads to two-digit hours", () => {
    expect(formatDuration(25 * 3600)).toBe("25:00");
  });
});
