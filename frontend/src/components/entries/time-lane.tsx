import { useEffect, useState } from "react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { EmptyState } from "@/components/projects/query-state";
import { strings } from "@/i18n/strings";
import {
  dayKey,
  formatDayLabel,
  groupByDay,
  lanePosition,
  minutesIntoDay,
  packRows,
  RULER_TICKS,
} from "@/lib/timeline";
import { cn, formatDuration, formatTimeRange } from "@/lib/utils";

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function NowMarker({ now }: { now: Date }) {
  const left = (minutesIntoDay(now) / 1440) * 100;
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 z-20 w-px bg-signal"
      style={{ left: `${left}%` }}
    />
  );
}

function LaneBar({
  entry,
  now,
  onEdit,
}: {
  entry: TimeEntryPublic;
  now: Date;
  onEdit?: (entry: TimeEntryPublic) => void;
}) {
  const position = lanePosition(entry, now);
  const label = entry.description ?? strings.entries.untitledEntry;
  const range = formatTimeRange(entry.start_time, entry.end_time);
  return (
    <button
      type="button"
      onClick={onEdit ? () => onEdit(entry) : undefined}
      disabled={!onEdit}
      title={`${label} · ${range}`}
      aria-label={`${label}, ${range}`}
      style={{ left: `${position.left}%`, width: `${position.width}%` }}
      className={cn(
        "absolute inset-y-1 z-10 flex min-w-[2px] items-center gap-1 overflow-hidden rounded border px-1.5 text-left font-mono text-[11px] tabular-nums transition-colors",
        position.running
          ? "border-signal/60 bg-signal/25 text-foreground"
          : "border-info/40 bg-info/15 text-foreground",
        onEdit &&
          "hover:border-info/70 focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {position.running && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-signal live-pulse"
        />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

interface TimeLaneProps {
  entries: TimeEntryPublic[];
  onEdit?: (entry: TimeEntryPublic) => void;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * The signature surface: entries as bars on a 24-hour ruler, one lane per day.
 * Overlapping entries stack into sub-rows. Running entries extend to now and
 * carry a pulsing lamp.
 */
export function TimeLane({
  entries,
  onEdit,
  className,
  emptyTitle,
  emptyDescription,
}: TimeLaneProps) {
  const now = useNow();

  if (entries.length === 0) {
    return (
      <EmptyState
        title={emptyTitle ?? strings.timeline.emptyTitle}
        description={emptyDescription ?? strings.timeline.emptyDescription}
      />
    );
  }

  const lanes = groupByDay(entries);
  const todayKey = dayKey(now);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[620px]">
        <div className="flex gap-3">
          <span className="w-[92px] shrink-0 font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {strings.timeline.axisLabel}
          </span>
          <div className="relative h-4 min-w-0 flex-1 border-b border-border">
            {RULER_TICKS.map((tick) => (
              <span
                key={tick}
                className="absolute top-0 font-mono text-[11px] text-muted-foreground tabular-nums"
                style={{
                  left: `${(tick / 24) * 100}%`,
                  transform:
                    tick === 0
                      ? "translateX(0)"
                      : tick === 24
                        ? "translateX(-100%)"
                        : "translateX(-50%)",
                }}
              >
                {String(tick).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>

        {lanes.map((lane) => {
          const isToday = lane.key === todayKey;
          const rows = packRows(lane.entries);
          return (
            <div
              key={lane.key}
              className="flex items-start gap-3 border-b border-border py-2 last:border-b-0"
            >
              <div className="w-[92px] shrink-0">
                <div className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                  {formatDayLabel(lane.date)}
                </div>
                <div className="font-mono text-xs font-medium tabular-nums">
                  {formatDuration(lane.totalSeconds)}
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {rows.map((row, rowIndex) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional lane packs
                    key={rowIndex}
                    className="relative h-8 overflow-hidden rounded border border-border bg-muted/40"
                  >
                    {RULER_TICKS.slice(1, -1).map((tick) => (
                      <span
                        key={tick}
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-border"
                        style={{ left: `${(tick / 24) * 100}%` }}
                      />
                    ))}
                    {isToday && <NowMarker now={now} />}
                    {row.map((entry) => (
                      <LaneBar
                        key={entry.id ?? entry.start_time}
                        entry={entry}
                        now={now}
                        onEdit={onEdit}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
