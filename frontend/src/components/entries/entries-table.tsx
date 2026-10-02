import { Pause, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import type { ProjectColumnItem, TimeEntryPublic } from "@/client/types.gen";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ROW_HOVER } from "@/components/ui/row-hover";
import { strings } from "@/i18n/strings";
import { PAGE_SIZE } from "@/lib/entries";
import { formatDayLabel, groupByDay } from "@/lib/timeline";
import { cn, formatDuration, formatTime, formatTimeRange } from "@/lib/utils";
import { Pagination } from "./pagination";

interface EntriesTableProps {
  columns: ProjectColumnItem[];
  entries: TimeEntryPublic[];
  page: number;
  total: number;
  onEdit: (entry: TimeEntryPublic) => void;
  onDelete: (entry: TimeEntryPublic) => void;
  onPause?: (entry: TimeEntryPublic) => void;
  /** True while a table pause request is in flight. */
  isPausing?: boolean;
  onConfigureColumns: () => void;
  onPageChange: (page: number) => void;
}

function DurationCell({
  entry,
  maxSeconds,
}: {
  entry: TimeEntryPublic;
  maxSeconds: number;
}) {
  if (entry.end_time == null) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-mono text-sm font-medium tabular-nums">
          {formatDuration(entry.duration_seconds)}
        </span>
        <span
          aria-hidden="true"
          className="h-1 w-10 overflow-hidden rounded bg-muted"
        >
          <span className="block h-full w-full rounded bg-signal live-pulse" />
        </span>
      </span>
    );
  }
  const seconds = entry.duration_seconds ?? 0;
  const ratio = maxSeconds > 0 ? seconds / maxSeconds : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-sm font-medium tabular-nums">
        {formatDuration(entry.duration_seconds)}
      </span>
      <span
        aria-hidden="true"
        className="h-1 w-10 overflow-hidden rounded bg-muted"
      >
        <span
          className="block h-full rounded bg-info"
          style={{ width: `${Math.max(ratio * 100, 4)}%` }}
        />
      </span>
    </span>
  );
}

const CellValue = memo(function CellValue({
  column,
  entry,
  maxSeconds,
}: {
  column: ProjectColumnItem;
  entry: TimeEntryPublic;
  maxSeconds: number;
}) {
  switch (column.kind) {
    case "TIME": {
      // Running entries have no end time: show the start plus the live
      // running lamp instead of a dangling "09:41–" dash.
      if (!entry.end_time) {
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums text-muted-foreground">
            {formatTime(entry.start_time)}
            <StatusChip tone="success" pulse>
              {strings.entries.runningLabel}
            </StatusChip>
          </span>
        );
      }
      return (
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {formatTimeRange(entry.start_time, entry.end_time)}
        </span>
      );
    }
    case "DURATION":
      return <DurationCell entry={entry} maxSeconds={maxSeconds} />;
    case "DESCRIPTION":
      return (
        <span
          className="block truncate text-sm font-medium"
          title={entry.description ?? undefined}
        >
          {entry.description ?? "–"}
        </span>
      );
    case "SOURCE":
    case "CUSTOM":
      return <span className="text-sm text-muted-foreground">–</span>;
  }
});

export function EntriesTable({
  columns,
  entries,
  page,
  total,
  onEdit,
  onDelete,
  onPause,
  isPausing,
  onConfigureColumns,
  onPageChange,
}: EntriesTableProps) {
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );
  const maxSeconds = useMemo(
    () =>
      entries.reduce(
        (max, entry) => Math.max(max, entry.duration_seconds ?? 0),
        0,
      ),
    [entries],
  );
  const days = useMemo(() => groupByDay(entries), [entries]);
  const columnCount = columns.length + 1;

  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column, index) => (
                <th
                  // biome-ignore lint/suspicious/noArrayIndexKey: duplicate column names make kind+name non-unique
                  key={`${column.kind}-${index}`}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 text-left font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase"
                >
                  {column.name}
                </th>
              ))}
              <th
                scope="col"
                className="sticky right-0 bg-card px-3 py-2 text-left"
              >
                <button
                  type="button"
                  onClick={onConfigureColumns}
                  aria-label={strings.entries.configureColumns}
                  title={strings.entries.configureColumns}
                  className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-dashed border-edge px-1.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors outline-none hover:border-signal hover:text-signal focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <Plus aria-hidden="true" className="size-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <DayGroup
                key={day.key}
                day={day}
                columns={columns}
                columnCount={columnCount}
                maxSeconds={maxSeconds}
                onEdit={onEdit}
                onDelete={onDelete}
                onPause={onPause}
                isPausing={isPausing}
              />
            ))}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </Panel>
  );
}

function DayGroup({
  day,
  columns,
  columnCount,
  maxSeconds,
  onEdit,
  onDelete,
  onPause,
  isPausing,
}: {
  day: ReturnType<typeof groupByDay>[number];
  columns: ProjectColumnItem[];
  columnCount: number;
  maxSeconds: number;
  onEdit: (entry: TimeEntryPublic) => void;
  onDelete: (entry: TimeEntryPublic) => void;
  onPause?: (entry: TimeEntryPublic) => void;
  isPausing?: boolean;
}) {
  return (
    <>
      <tr className="border-b border-border bg-muted/50">
        <td colSpan={columnCount} className="px-3 py-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {formatDayLabel(day.date)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {strings.timeline.totalLabel} · {formatDuration(day.totalSeconds)}
            </span>
          </div>
        </td>
      </tr>
      {day.entries.map((entry) => (
        <tr
          key={entry.id}
          className={cn(
            "border-b border-border transition-colors last:border-b-0",
            ROW_HOVER,
          )}
        >
          {columns.map((column, index) => (
            <td
              // biome-ignore lint/suspicious/noArrayIndexKey: duplicate column names make kind+name non-unique
              key={`${column.kind}-${index}`}
              className="max-w-64 px-3 py-2 align-middle text-sm whitespace-nowrap"
            >
              <CellValue
                column={column}
                entry={entry}
                maxSeconds={maxSeconds}
              />
            </td>
          ))}
          <td className="sticky right-0 bg-card px-3 py-2 align-middle text-right whitespace-nowrap">
            <div className="flex items-center justify-end gap-0.5">
              {entry.end_time == null && onPause && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onPause(entry)}
                  disabled={isPausing}
                  aria-label={`${strings.entries.pauseButton}: ${entry.description ?? entry.id}`}
                  title={strings.entries.pauseTitle}
                  className="border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
                >
                  <Pause aria-hidden="true" className="size-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(entry)}
                aria-label={`${strings.entries.editLabel}: ${entry.description ?? entry.id}`}
              >
                <Pencil aria-hidden="true" className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(entry)}
                aria-label={`${strings.entries.deleteLabel}: ${entry.description ?? entry.id}`}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
              </Button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
