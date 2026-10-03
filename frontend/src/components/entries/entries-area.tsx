import type { UseQueryResult } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { EntriesTable } from "@/components/entries/entries-table";
import { EmptyState, QueryError } from "@/components/projects/query-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/i18n/strings";
import { useColumns } from "@/lib/columns";
import type { EntryPageData } from "@/lib/entries";

interface EntriesAreaProps {
  entriesQuery: UseQueryResult<EntryPageData, Error>;
  projectId: string;
  page: number;
  onEdit: (entry: TimeEntryPublic) => void;
  onDelete: (entry: TimeEntryPublic) => void;
  onPause?: (entry: TimeEntryPublic) => void;
  isPausing?: boolean;
  onConfigureColumns: () => void;
  onPageChange: (page: number) => void;
  onNewEntry: () => void;
  /** Client-side filtered view of the current page. Pagination keeps
   * using the server total so out-of-range clamp logic is unaffected. */
  entriesOverride?: TimeEntryPublic[];
}

export function EntriesArea({
  entriesQuery,
  projectId,
  page,
  onEdit,
  onDelete,
  onPause,
  isPausing,
  onConfigureColumns,
  onPageChange,
  onNewEntry,
  entriesOverride,
}: EntriesAreaProps) {
  const columnsQuery = useColumns(projectId);

  if (entriesQuery.isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading entries"
        className="overflow-hidden rounded-md border border-border bg-card"
      >
        <div className="flex gap-3 border-b border-border bg-muted/40 px-3 py-2.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            key={i}
            className="flex gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  if (entriesQuery.isError) {
    return (
      <QueryError
        message={(entriesQuery.error as Error)?.message}
        onRetry={() => entriesQuery.refetch()}
      />
    );
  }

  if (entriesQuery.data && entriesQuery.data.items.length === 0) {
    return (
      <EmptyState
        title={strings.entries.emptyTitle}
        description={strings.entries.emptyDescription}
        action={
          <Button
            id="empty-new-entry-btn"
            className="gap-1.5"
            onClick={onNewEntry}
          >
            <Plus aria-hidden="true" className="size-3.5" />
            {strings.entries.newEntry}
          </Button>
        }
      />
    );
  }

  if (columnsQuery.isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading columns"
        className="overflow-hidden rounded-md border border-border bg-card"
      >
        <div className="flex gap-3 border-b border-border bg-muted/40 px-3 py-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            key={i}
            className="flex gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {columnsQuery.isError && (
        <div
          role="alert"
          className="mb-2 flex items-center gap-2 rounded-md border border-destructive/35 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
        >
          <span className="flex-1">{strings.entries.columnsFailed}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => columnsQuery.refetch()}
          >
            {strings.common.retry}
          </Button>
        </div>
      )}
      <EntriesTable
        columns={columnsQuery.data ?? []}
        entries={entriesOverride ?? entriesQuery.data?.items ?? []}
        page={page}
        total={entriesQuery.data?.total ?? 0}
        onEdit={onEdit}
        onDelete={onDelete}
        onPause={onPause}
        isPausing={isPausing}
        onConfigureColumns={onConfigureColumns}
        onPageChange={onPageChange}
      />
    </>
  );
}
