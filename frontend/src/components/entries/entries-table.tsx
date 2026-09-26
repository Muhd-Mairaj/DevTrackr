import { Pause, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import type { ProjectColumnItem, TimeEntryPublic } from "@/client/types.gen";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";
import { PAGE_SIZE } from "@/lib/entries";
import { formatDuration, formatTime, formatTimeRange } from "@/lib/utils";
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

const CellValue = memo(function CellValue({
  column,
  entry,
}: {
  column: ProjectColumnItem;
  entry: TimeEntryPublic;
}) {
  switch (column.kind) {
    case "TIME": {
      // Running entries have no end time: show the start plus an explicit
      // "Running" chip instead of a dangling "09:41–" dash.
      if (!entry.end_time) {
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(entry.start_time)}
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-px font-sans text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              {strings.entries.runningLabel}
            </span>
          </span>
        );
      }
      return (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatTimeRange(entry.start_time, entry.end_time)}
        </span>
      );
    }
    case "DURATION":
      return (
        <span className="font-mono text-xs font-medium tabular-nums">
          {formatDuration(entry.duration_seconds)}
        </span>
      );
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
      return <span className="text-muted-foreground">–</span>;
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
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column, index) => (
                <th
                  // biome-ignore lint/suspicious/noArrayIndexKey: duplicate column names make kind+name non-unique
                  key={`${column.kind}-${index}`}
                  scope="col"
                  className="px-3 py-2 text-left font-mono text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap"
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
                  className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-dashed border-edge px-1.5 font-mono text-xs text-muted-foreground uppercase tracking-[0.1em] transition-colors outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <Plus aria-hidden="true" className="size-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border transition-colors last:border-b-0 hover:bg-primary/5 hover:shadow-[inset_2px_0_0_0_var(--primary)]"
              >
                {columns.map((column, index) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: duplicate column names make kind+name non-unique
                    key={`${column.kind}-${index}`}
                    className="max-w-64 px-3 py-2 align-middle text-sm whitespace-nowrap"
                  >
                    <CellValue column={column} entry={entry} />
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
                        className="border-amber-500/50 bg-amber-500/10 text-amber-700 transition-colors hover:bg-amber-500/20 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <Pause aria-hidden="true" className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(entry)}
                      aria-label={`${strings.entries.editLabel}: ${entry.description ?? entry.id}`}
                      className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    >
                      <Pencil aria-hidden="true" className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(entry)}
                      aria-label={`${strings.entries.deleteLabel}: ${entry.description ?? entry.id}`}
                      className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
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
    </div>
  );
}
