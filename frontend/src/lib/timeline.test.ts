import { describe, expect, it } from "vitest";
import type { TimeEntryPublic } from "@/client/types.gen";
import { dayKey, groupByDay, lanePosition, minutesIntoDay, packRows, startOfDay } from "./timeline";

/** Local wall-clock moment, independent of the machine timezone. */
function at(hours: number, minutes = 0, day = 27): Date {
  return new Date(2026, 8, day, hours, minutes, 0, 0);
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

describe("startOfDay", () => {
  it("returns local midnight with all time fields cleared", () => {
    const result = startOfDay(at(15, 42));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(27);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe("dayKey", () => {
  it("formats a local date as YYYY-MM-DD with padding", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    expect(dayKey(at(9, 0))).toBe("2026-09-27");
  });

  it("accepts a date string and keeps the local calendar day", () => {
    expect(dayKey(at(23, 59).toISOString())).toBe("2026-09-27");
  });
});

describe("minutesIntoDay", () => {
  it("returns hours times 60 plus minutes", () => {
    expect(minutesIntoDay(at(9, 30))).toBe(9 * 60 + 30);
    expect(minutesIntoDay(at(0, 0))).toBe(0);
    expect(minutesIntoDay(at(23, 59))).toBe(23 * 60 + 59);
  });
});

describe("lanePosition", () => {
  it("maps a completed mid-day entry to left and width percentages", () => {
    const result = lanePosition(entry(at(9, 0), at(10, 0)));
    expect(result.left).toBeCloseTo(37.5, 5);
    expect(result.width).toBeCloseTo((60 / 1440) * 100, 5);
    expect(result.running).toBe(false);
  });

  it("extends a running entry to now and flags it as running", () => {
    const result = lanePosition(entry(at(9, 0), null), at(9, 30));
    expect(result.running).toBe(true);
    expect(result.left).toBeCloseTo(37.5, 5);
    expect(result.width).toBeCloseTo((30 / 1440) * 100, 5);
  });

  it("applies a minimum width so a zero-length entry stays visible", () => {
    const result = lanePosition(entry(at(9, 0), at(9, 0)));
    expect(result.width).toBeGreaterThan(0);
    expect(result.width).toBeCloseTo((0.4 / 1440) * 100, 5);
  });

  it("clamps an entry that crosses midnight to the start day", () => {
    const result = lanePosition(entry(at(23, 0, 27), at(1, 0, 28)));
    // Clamped end is local midnight, so the bar spans the last hour of the day.
    expect(result.left).toBeCloseTo((23 * 60) / 1440 * 100, 5);
    expect(result.width).toBeCloseTo((60 / 1440) * 100, 5);
    expect(result.running).toBe(false);
  });
});

describe("groupByDay", () => {
  it("groups by local day, newest day first, with entries sorted by start", () => {
    const late = entry(at(14, 0, 27), at(15, 0, 27), 3600);
    const early = entry(at(9, 0, 27), at(10, 0, 27), 3600);
    const nextDay = entry(at(8, 0, 28), at(9, 0, 28), 3600);

    const lanes = groupByDay([late, early, nextDay]);

    expect(lanes.map((lane) => lane.key)).toEqual(["2026-09-28", "2026-09-27"]);
    expect(lanes[1].entries.map((item) => item.id)).toEqual([
      early.id,
      late.id,
    ]);
  });

  it("sums duration_seconds into totalSeconds and treats missing durations as zero", () => {
    const lanes = groupByDay([
      entry(at(9, 0, 27), at(10, 0, 27), 3600),
      entry(at(11, 0, 27), at(12, 0, 27), 1800),
      entry(at(13, 0, 27), at(14, 0, 27), null),
    ]);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].totalSeconds).toBe(5400);
  });
});

describe("packRows", () => {
  it("places overlapping intervals on different rows", () => {
    const a = entry(at(9, 0), at(10, 0));
    const b = entry(at(9, 30), at(10, 30));
    const c = entry(at(10, 15), at(11, 0));

    const rows = packRows([a, b, c]);

    expect(rows).toHaveLength(2);
    expect(rows[0].map((item) => item.id)).toEqual([a.id, c.id]);
    expect(rows[1].map((item) => item.id)).toEqual([b.id]);
  });

  it("reuses the same row for non-overlapping intervals", () => {
    const a = entry(at(9, 0), at(10, 0));
    const b = entry(at(10, 0), at(11, 0));

    const rows = packRows([a, b]);

    expect(rows).toHaveLength(1);
    expect(rows[0].map((item) => item.id)).toEqual([a.id, b.id]);
  });

  it("uses as many rows as the maximum overlap", () => {
    const rows = packRows([
      entry(at(9, 0), at(12, 0)),
      entry(at(9, 30), at(12, 0)),
      entry(at(10, 0), at(12, 0)),
    ]);

    expect(rows).toHaveLength(3);
  });
});
