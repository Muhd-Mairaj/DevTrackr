import type { UseQueryResult } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { EntriesTable } from "@/components/entries/entries-table";
import { EmptyState, QueryError } from "@/components/projects/query-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/ii8n/strings";
import { useColumns } from "@/lib/columns";
import type { EntryPageData } from "@/lib/entries";

interface EntriesAreaProps {
  entriesQuery: UseQueryResult<EntryPageData, Error>;
  projectId: string;
  page: number;
  onEdit: (entry: TimeEntryPublic) => void;
  onDelete: (entry: TimeEntryPublic) => void;
  onConfigureColumns: () => void;
  onPageChange: (page: number) => void;
  onNewEntry: () => void;
}

export function EntriesArea({
  entriesQuery,
  projectId,
  page,
  onEdit,
  onDelete,
  onConfigureColumns,
  onPageChange,
  onNewEntry,
}: EntriesAreaProps) {
  const { data: columns } = useColumns(projectId);

  if (entriesQuery.isLoading) {
    return (
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
            key={i}
            className="flex gap-3 border-b border-border px-3 py-2.5"
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
            <Plus className="size-3.5" />
            {strings.entries.newEntry}
          </Button>
        }
      />
    );
  }

  return (
    <EntriesTable
      columns={columns ?? []}
      entries={entriesQuery.data?.items ?? []}
      page={page}
      total={entriesQuery.data?.total ?? 0}
      onEdit={onEdit}
      onDelete={onDelete}
      onConfigureColumns={onConfigureColumns}
      onPageChange={onPageChange}
    />
  );
}
