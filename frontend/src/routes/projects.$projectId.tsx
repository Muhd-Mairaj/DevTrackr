import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { ActivityTab } from "@/components/activity-tab";
import { ColumnManagerDialog } from "@/components/columns/column-manager-dialog";
import { DayStamp } from "@/components/day-stamp";
import { DeleteEntryDialog } from "@/components/entries/delete-entry-dialog";
import { EntriesArea } from "@/components/entries/entries-area";
import { EntriesFilterBar } from "@/components/entries/entries-filter-bar";
import { EntriesSummary } from "@/components/entries/entries-summary";
import { EntryFormDialog } from "@/components/entries/entry-form-dialog";
import { NewEntryFab } from "@/components/entries/new-entry-fab";
import { LogbookTab } from "@/components/logbook-tab";
import { QueryError } from "@/components/projects/query-state";
import { ShortcutHelpDialog } from "@/components/shortcut-help-dialog";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { PAGE_SIZE, useEntries, usePauseEntry } from "@/lib/entries";
import { downloadCsv, exportEntriesCsv } from "@/lib/export";
import { useProject } from "@/lib/projects";
import { focusSearchInput, useKeyboardShortcuts } from "@/lib/shortcuts";

export const Route = createFileRoute("/projects/$projectId")({
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    const raw = search.page;
    const page = typeof raw === "string" ? Number(raw) : raw;
    return typeof page === "number" && Number.isInteger(page) && page >= 1
      ? { page }
      : { page: 1 };
  },
  component: ProjectPage,
});

function BackToProjectsLink() {
  return (
    <Link
      to="/"
      aria-label={strings.nav.projects}
      className="mb-2 inline-block text-sm text-muted-foreground hover:text-foreground"
    >
      {strings.nav.backToProjects}
    </Link>
  );
}

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { page } = Route.useSearch();
  const {
    data: project,
    isLoading,
    isError,
    error,
    refetch,
  } = useProject(projectId);
  const navigate = Route.useNavigate();
  const entriesQuery = useEntries(projectId, page);
  const { pause, isPausing } = usePauseEntry(projectId);
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntryPublic | null>(null);
  const [deleting, setDeleting] = useState<TimeEntryPublic | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [runningOnly, setRunningOnly] = useState(false);
  // Item count of the page when the delete dialog opened. The optimistic
  // filter removes the row before the mutation resolves, so a handler that
  // reads the live query at that point sees the row already gone.
  const deleteOpenItemCountRef = useRef(0);

  const total = entriesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = entriesQuery.data?.items ?? [];

  // Client-side filter over the loaded page. Pagination and the
  // out-of-range clamp above keep using the server total.
  const filteredItems = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return pageItems.filter((entry) => {
      if (q && !(entry.description ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (filterFrom && entry.start_time.slice(0, 10) < filterFrom) {
        return false;
      }
      if (filterTo && entry.start_time.slice(0, 10) > filterTo) {
        return false;
      }
      if (runningOnly && entry.end_time != null) return false;
      return true;
    });
  }, [pageItems, filterQuery, filterFrom, filterTo, runningOnly]);

  const clearFilters = () => {
    setFilterQuery("");
    setFilterFrom("");
    setFilterTo("");
    setRunningOnly(false);
  };

  const handleExportCsv = () => {
    downloadCsv(
      `entries-${projectId}-page${page}.csv`,
      exportEntriesCsv(pageItems),
    );
  };

  // A URL with a page past the last one clamps back to the last page.
  useEffect(() => {
    if (entriesQuery.data && page > totalPages) {
      navigate({ search: { page: totalPages } });
    }
  }, [page, totalPages, entriesQuery.data, navigate]);

  useEffect(() => {
    document.title = project
      ? `${project.name} · ${strings.common.brand}`
      : `${strings.entries.projectNotFoundTitle} · ${strings.common.brand}`;
  }, [project]);

  const openNewEntry = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handlePageChange = (next: number) => {
    navigate({ search: { page: next } });
    window.scrollTo({ top: 0 });
  };

  useKeyboardShortcuts({
    onNew: openNewEntry,
    onSearch: () => {
      focusSearchInput();
    },
    onPrevPage: page > 1 ? () => handlePageChange(page - 1) : undefined,
    onNextPage:
      page < totalPages ? () => handlePageChange(page + 1) : undefined,
  });

  const handleDeleteSuccess = () => {
    // Deleting the last row of a non-first page steps back one page.
    if (deleteOpenItemCountRef.current === 1 && page > 1) {
      navigate({ search: { page: page - 1 } });
    }
  };

  // Pausing a running entry from the table stamps its end with now.
  const handlePauseEntry = (entry: TimeEntryPublic) => {
    if (!entry.id || entry.end_time != null || isPausing) return;
    pause(entry.id, {
      onSuccess: () => toast("success", strings.entries.updatedToast),
      onError: (err) => toast("error", err.message),
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mt-4 mb-6 flex flex-col gap-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </PageContainer>
    );
  }
  if (isError) {
    return (
      <PageContainer>
        <BackToProjectsLink />
        <div className="mt-4">
          <QueryError
            message={(error as Error)?.message}
            onRetry={() => refetch()}
          />
        </div>
      </PageContainer>
    );
  }
  if (!project) {
    return (
      <PageContainer>
        <BackToProjectsLink />
        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            {strings.entries.projectNotFoundTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {strings.entries.projectNotFoundDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {strings.common.retry}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              {strings.nav.backToProjects}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">{strings.common.goHome}</Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackToProjectsLink />
      <DayStamp date={new Date()} />
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
            <ShortcutHelpDialog />
            <Button
              id="columns-btn"
              variant="secondary"
              size="sm"
              onClick={() => setColumnsOpen(true)}
            >
              {strings.entries.columnsButton}
            </Button>
            <Button
              id="export-csv-btn"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handleExportCsv}
              disabled={pageItems.length === 0}
              title={strings.entries.exportCsvTitle}
            >
              <Download className="size-3.5" aria-hidden="true" />
              {strings.entries.exportCsv}
            </Button>
            <Button
              id="new-entry-btn"
              size="sm"
              className="gap-1.5"
              onClick={openNewEntry}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {strings.entries.newEntry}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="entries">
          <TabsList>
            <TabsTrigger value="entries">
              {strings.logbook.entriesTab}
            </TabsTrigger>
            <TabsTrigger value="activity">{strings.activity.tab}</TabsTrigger>
            <TabsTrigger value="logbook">{strings.logbook.tab}</TabsTrigger>
          </TabsList>
          <TabsContent value="entries">
            {entriesQuery.data && total > 0 && (
              <div className="mb-4 flex flex-col gap-4">
                <EntriesSummary entries={pageItems} total={total} />
                <EntriesFilterBar
                  query={filterQuery}
                  from={filterFrom}
                  to={filterTo}
                  runningOnly={runningOnly}
                  filteredCount={filteredItems.length}
                  totalCount={pageItems.length}
                  onQueryChange={setFilterQuery}
                  onFromChange={setFilterFrom}
                  onToChange={setFilterTo}
                  onRunningOnlyChange={setRunningOnly}
                  onClear={clearFilters}
                />
              </div>
            )}
            <EntriesArea
              entriesQuery={entriesQuery}
              projectId={projectId}
              page={page}
              entriesOverride={filteredItems}
              onEdit={(entry) => {
                setEditing(entry);
                setFormOpen(true);
              }}
              onDelete={(entry) => {
                deleteOpenItemCountRef.current =
                  entriesQuery.data?.items.length ?? 0;
                setDeleting(entry);
              }}
              onPause={handlePauseEntry}
              isPausing={isPausing}
              onConfigureColumns={() => setColumnsOpen(true)}
              onPageChange={handlePageChange}
              onNewEntry={openNewEntry}
            />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab project={project} />
          </TabsContent>
          <TabsContent value="logbook">
            <LogbookTab projectId={projectId} />
          </TabsContent>
        </Tabs>

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
        <NewEntryFab onClick={openNewEntry} />
      </div>
    </PageContainer>
  );
}
