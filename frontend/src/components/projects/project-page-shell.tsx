import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectPublic, TimeEntryPublic } from "@/client/types.gen";
import { ColumnManagerDialog } from "@/components/columns/column-manager-dialog";
import { DeleteEntryDialog } from "@/components/entries/delete-entry-dialog";
import { EntriesArea } from "@/components/entries/entries-area";
import { EntryFormDialog } from "@/components/entries/entry-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/ii8n/strings";
import { PAGE_SIZE, useEntries } from "@/lib/entries";

interface ProjectPageShellProps {
  projectId: string;
  page: number;
  project: ProjectPublic | undefined;
  projectLoading: boolean;
  projectError: boolean;
}

export function ProjectPageShell({
  projectId,
  page,
  project,
  projectLoading,
  projectError,
}: ProjectPageShellProps) {
  const navigate = useNavigate({ from: "/projects/$projectId" });
  const entriesQuery = useEntries(projectId, page);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntryPublic | null>(null);
  const [deleting, setDeleting] = useState<TimeEntryPublic | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const total = entriesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // A URL with a page past the last one clamps back to the last page.
  useEffect(() => {
    if (entriesQuery.data && page > totalPages) {
      navigate({ search: { page: totalPages } });
    }
  }, [page, totalPages, entriesQuery.data, navigate]);

  const openNewEntry = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDeleteSuccess = (deleted: TimeEntryPublic) => {
    // Deleting the last row of a non-first page steps back one page.
    const items = entriesQuery.data?.items ?? [];
    if (items.length === 1 && items[0]?.id === deleted.id && page > 1) {
      navigate({ search: { page: page - 1 } });
    }
  };

  if (projectLoading) {
    return (
      <div className="mt-4 mb-6 flex flex-col gap-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
    );
  }
  if (projectError || !project) {
    return (
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {strings.entries.projectNotFoundTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {strings.entries.projectNotFoundDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {strings.entries.metaLine(project.created_at, total)}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            id="columns-btn"
            variant="secondary"
            size="sm"
            onClick={() => setColumnsOpen(true)}
          >
            {strings.entries.columnsButton}
          </Button>
          <Button
            id="new-entry-btn"
            size="sm"
            className="gap-1.5"
            onClick={openNewEntry}
          >
            <Plus className="size-3.5" />
            {strings.entries.newEntry}
          </Button>
        </div>
      </div>

      <EntriesArea
        entriesQuery={entriesQuery}
        projectId={projectId}
        page={page}
        onEdit={(entry) => {
          setEditing(entry);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
        onConfigureColumns={() => setColumnsOpen(true)}
        onPageChange={(next) => navigate({ search: { page: next } })}
        onNewEntry={openNewEntry}
      />

      <EntryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        entry={editing}
        onCreated={() => {
          // A new entry lands at the top of page 1 (newest first).
          if (page !== 1) navigate({ search: { page: 1 } });
        }}
      />
      <DeleteEntryDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        projectId={projectId}
        entry={deleting}
        onDeleted={handleDeleteSuccess}
      />
      <ColumnManagerDialog
        open={columnsOpen}
        onOpenChange={setColumnsOpen}
        projectId={projectId}
      />
    </div>
  );
}
