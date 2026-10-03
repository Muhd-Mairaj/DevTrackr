import { useMemo } from "react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { strings } from "@/i18n/strings";
import { formatDuration } from "@/lib/utils";

interface EntriesSummaryProps {
  /** Entries loaded on the current page (may be client-side filtered). */
  entries: TimeEntryPublic[];
  /** Server-side total entry count across all pages. */
  total: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function EntriesSummary({ entries, total }: EntriesSummaryProps) {
  const { totalSeconds, weekSeconds, days } = useMemo(() => {
    const timed = entries.filter(
      (e) => typeof e.duration_seconds === "number" && e.duration_seconds > 0,
    );
    const totalSeconds = timed.reduce(
      (sum, e) => sum + (e.duration_seconds ?? 0),
      0,
    );
    const weekStart = startOfDay(new Date()).getTime() - 6 * DAY_MS;
    const weekSeconds = timed
      .filter((e) => new Date(e.start_time).getTime() >= weekStart)
      .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
    const today = startOfDay(new Date()).getTime();
    const days = Array.from({ length: 7 }, (_, i) => {
      const dayStart = today - (6 - i) * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const seconds = timed
        .filter((e) => {
          const t = new Date(e.start_time).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
      return {
        key: dayStart,
        label: new Date(dayStart).toLocaleDateString(undefined, {
          weekday: "narrow",
        }),
        seconds,
      };
    });
    return { totalSeconds, weekSeconds, days };
  }, [entries]);

  const maxSeconds = Math.max(1, ...days.map((d) => d.seconds));

  return (
    <section
      aria-label="Entries summary"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-card sm:grid-cols-4"
    >
      <div className="px-4 py-3">
        <div className="font-mono text-lg font-medium tabular-nums">
          {formatDuration(totalSeconds)}
        </div>
        <div className="text-xs text-muted-foreground">
          {strings.entries.totalHours}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="font-mono text-lg font-medium tabular-nums">
          {formatDuration(weekSeconds)}
        </div>
        <div className="text-xs text-muted-foreground">
          {strings.entries.weekHours}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="font-mono text-lg font-medium tabular-nums">
          {total}
        </div>
        <div className="text-xs text-muted-foreground">
          {strings.entries.entryCountLabel}
        </div>
      </div>
      <div
        className="flex items-end gap-1 px-4 py-3"
        role="img"
        aria-label="Hours per day for the last 7 days"
      >
        {days.map((day, i) => (
          <div
            key={day.key}
            title={`${day.label}: ${formatDuration(day.seconds)}`}
            style={{
              height: `${Math.max(8, Math.round((day.seconds / maxSeconds) * 40))}px`,
              backgroundColor: `var(--chart-${(i % 5) + 1})`,
            }}
            className="w-full min-w-3 rounded-sm opacity-80"
          />
        ))}
      </div>
    </section>
  );
}
