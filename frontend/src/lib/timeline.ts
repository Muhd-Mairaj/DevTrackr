import type { TimeEntryPublic } from "@/client/types.gen";
import { getLocale } from "@/lib/utils";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

/** Local midnight for the given moment. */
export function startOfDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Local calendar day key, YYYY-MM-DD. */
export function dayKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const FALLBACK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const FALLBACK_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** "MON · 22 SEP" for a lane header. */
export function formatDayLabel(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  try {
    const locale = getLocale();
    const weekday = new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(date)
      .toUpperCase();
    const month = new Intl.DateTimeFormat(locale, { month: "short" })
      .format(date)
      .toUpperCase();
    return `${weekday} · ${date.getDate()} ${month}`;
  } catch {
    return `${FALLBACK_DAYS[date.getDay()]} · ${date.getDate()} ${FALLBACK_MONTHS[date.getMonth()]}`;
  }
}

/** Minutes since local midnight, clamped to the day. */
export function minutesIntoDay(value: Date | string): number {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.getHours() * 60 + date.getMinutes();
}

export interface LanePosition {
  /** Percent from the left edge of the 24h ruler. */
  left: number;
  /** Percent width, at least a hairline so short entries stay visible. */
  width: number;
  running: boolean;
}

/**
 * Position of an entry on a 24-hour ruler. A running entry extends to now. A
 * range that crosses midnight is clamped to the start day.
 */
export function lanePosition(
  entry: TimeEntryPublic,
  now: Date = new Date(),
): LanePosition {
  const start = new Date(entry.start_time);
  const startMinutes = minutesIntoDay(start);
  const running = entry.end_time == null;
  const endDate = running ? now : new Date(entry.end_time as string);
  const endMinutes = running ? minutesIntoDay(now) : minutesIntoDay(endDate);
  const sameDay = dayKey(start) === dayKey(endDate);
  const rawEnd = sameDay ? endMinutes : MINUTES_PER_DAY;
  const span = Math.max(rawEnd - startMinutes, 0.4);
  return {
    left: (startMinutes / MINUTES_PER_DAY) * 100,
    width: (span / MINUTES_PER_DAY) * 100,
    running,
  };
}

export interface DayLane {
  key: string;
  date: Date;
  entries: TimeEntryPublic[];
  totalSeconds: number;
}

/** Group entries into day lanes, newest day first. */
export function groupByDay(entries: TimeEntryPublic[]): DayLane[] {
  const lanes = new Map<string, DayLane>();
  for (const entry of entries) {
    const start = new Date(entry.start_time);
    const key = dayKey(start);
    let lane = lanes.get(key);
    if (!lane) {
      lane = { key, date: startOfDay(start), entries: [], totalSeconds: 0 };
      lanes.set(key, lane);
    }
    lane.entries.push(entry);
    lane.totalSeconds += entry.duration_seconds ?? 0;
  }
  for (const lane of lanes.values()) {
    lane.entries.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }
  return [...lanes.values()].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export const RULER_TICKS = [0, 6, 12, 18, 24];

/**
 * Pack overlapping entries into as few rows as possible (greedy interval
 * scheduling) so bars never sit on top of each other in a day lane.
 */
export function packRows(entries: TimeEntryPublic[]): TimeEntryPublic[][] {
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
  const rows: { end: number; items: TimeEntryPublic[] }[] = [];
  for (const entry of sorted) {
    const start = new Date(entry.start_time).getTime();
    const end = entry.end_time
      ? new Date(entry.end_time).getTime()
      : Number.POSITIVE_INFINITY;
    const row = rows.find((candidate) => candidate.end <= start);
    if (row) {
      row.items.push(entry);
      row.end = Math.max(row.end, end);
    } else {
      rows.push({ end, items: [entry] });
    }
  }
  return rows.map((row) => row.items);
}
