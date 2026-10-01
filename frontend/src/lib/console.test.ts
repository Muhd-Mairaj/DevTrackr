import { describe, expect, it } from "vitest";
import type { TimeEntryPublic } from "@/client/types.gen";
import { totalSeconds } from "@/lib/console";

/** Local wall-clock moment, independent of the machine timezone. */
function at(hours: number, minutes = 0): Date {
  return new Date(2026, 8, 27, hours, minutes, 0, 0);
}

/** An entry whose start/end are the given local moments. */
function entry(
  start: Date,
  end: Date | null,
  durationSeconds: number | null = null,
): TimeEntryPublic {
  return {
    id: start.toISOString(),
    project_id: "p1",
    start_time: start.toISOString(),
    end_time: end ? end.toISOString() : null,
    duration_seconds: durationSeconds,
  };
}

describe("totalSeconds", () => {
  it("sums duration_seconds across entries", () => {
    const sum = totalSeconds([
      entry(at(9, 0), at(10, 0), 3600),
      entry(at(11, 0), at(11, 30), 1800),
      entry(at(13, 0), at(13, 15), 900),
    ]);

    expect(sum).toBe(6300);
  });

  it("treats a running entry as now minus its start", () => {
    const sum = totalSeconds([entry(at(9, 0), null)], at(10, 0));

    expect(sum).toBe(3600);
  });

  it("clamps a running entry with a future start to zero", () => {
    const sum = totalSeconds([entry(at(11, 0), null)], at(10, 0));

    expect(sum).toBe(0);
  });

  it("adds zero for a finished entry without a duration", () => {
    const sum = totalSeconds([entry(at(9, 0), at(10, 0), null)]);

    expect(sum).toBe(0);
  });
});
