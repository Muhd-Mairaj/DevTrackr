import { Pencil, Plus, Trash2 } from "lucide-react";
import type { ProjectColumnItem, TimeEntryPublic } from "@/client/types.gen";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";
import { PAGE_SIZE } from "@/lib/entries";
import { formatDuration, formatTimeRange } from "@/lib/utils";
import { Pagination } from "./pagination";

interface EntriesTableProps {
  columns: ProjectColumnItem[];
  entries: TimeEntryPublic[];
  page: number;
  total: number;
  onEdit: (entry: TimeEntryPublic) => void;
  onDelete: (entry: TimeEntryPublic) => void;
  onConfigureColumns: () => void;
  onPageChange: (page: number) => void;
}

function CellValue({
  column,
  entry,
}: {
  column: ProjectColumnItem;
  entry: TimeEntryPublic;
}) {
  switch (column.kind) {
    case "TIME":
      return (
        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {formatTimeRange(entry.start_time, entry.end_time)}
        </span>
      );
    case "DURATION":
      return (
        <span className="font-mono text-[10.5px] font-medium tabular-nums">
          {formatDuration(entry.duration_seconds)}
        </span>
      );
    case "DESCRIPTION":
      return (
        <span className="block truncate text-[12.5px] font-medium">
          {entry.description ?? "–"}
        </span>
      );
    case "SOURCE":
    case "CUSTOM":
      return <span className="text-muted-foreground">–</span>;
  }
}

export function EntriesTable({
  columns,
  entries,
  page,
  total,
  onEdit,
  onDelete,
  onConfigureColumns,
  onPageChange,
}: EntriesTableProps) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={`${column.kind}-${column.name}`}
                  scope="col"
                  className="px-3 py-2 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap"
                >
                  {column.name}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-left">
                <button
                  type="button"
                  onClick={onConfigureColumns}
                  aria-label={strings.entries.configureColumns}
                  title={strings.entries.configureColumns}
                  className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-dashed border-edge px-1.5 text-[9.5px] font-mono text-muted-foreground uppercase tracking-[0.1em] transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="size-3" />
                </button>
              </th>
              <th
                scope="col"
                aria-label={strings.entries.actions}
                className="w-16"
              />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border transition-colors last:border-b-0 hover:bg-primary/5 hover:shadow-[inset_2px_0_0_0_var(--primary)]"
              >
                {columns.map((column) => (
                  <td
                    key={`${column.kind}-${column.name}`}
                    className="max-w-64 px-3 py-2 align-middle text-[12.5px] whitespace-nowrap"
                  >
                    <CellValue column={column} entry={entry} />
                  </td>
                ))}
                <td className="px-3 py-2 align-middle text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(entry)}
                      aria-label={strings.entries.editLabel}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(entry)}
                      aria-label={strings.entries.deleteLabel}
                    >
                      <Trash2 className="size-3.5" />
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
