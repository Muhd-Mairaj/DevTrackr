import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocale(): string {
  return typeof navigator !== "undefined" && navigator.language
    ? navigator.language
    : "en";
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso?: string | null) {
  const timeFormat = new Intl.DateTimeFormat(getLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const start = timeFormat.format(new Date(startIso));
  if (!endIso) return `${start}–`;
  return `${start}–${timeFormat.format(new Date(endIso))}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "–";
  const totalMinutes = Math.floor(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parse a free-text duration into whole minutes. Accepts "H:MM" ("1:30"),
 * hour suffixes ("1.5h", "2h", "2 hours"), minute suffixes ("90m",
 * "90 min"), and plain minutes ("90"). Returns null when unparseable.
 */
export function parseDurationInput(str: string): number | null {
  const raw = str.trim().toLowerCase();
  if (!raw) return null;
  const colon = raw.match(/^(\d+):([0-5]?\d)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const minutes = raw.match(/^(\d+(?:\.\d+)?)\s*m(in(ute)?s?)?$/);
  if (minutes) {
    const n = Number(minutes[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const hours = raw.match(/^(\d+(?:\.\d+)?)\s*h(rs?|ours?)?$/);
  if (hours) {
    const n = Number(hours[1]);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  if (/^\d+(?:\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

/** Format whole minutes as "H:MM" for the duration text input. */
export function formatDurationInput(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}
