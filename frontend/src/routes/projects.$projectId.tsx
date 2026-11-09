import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { TimeLane } from "@/components/entries/time-lane";
import { LogbookTab } from "@/components/logbook-tab";
import { usePageCommands } from "@/components/nav/command-palette";
import { QueryError } from "@/components/projects/query-state";
import { ShortcutHelpDialog } from "@/components/shortcut-help-dialog";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Section, SectionHeading } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import {
  PAGE_SIZE,
  useEntries,
  usePauseEntry,
  useRecentDescriptions,
} from "@/lib/entries";
import { NEW_ENTRY_EVENT } from "@/lib/events";
import { downloadCsv, exportEntriesCsv } from "@/lib/export";
import { useProject, useProjects } from "@/lib/projects";
import { focusSearchInput, useKeyboardShortcuts } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

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
      className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden="true">←</span>
      {strings.nav.console}
    </Link>
  );
}

const SECTION_IDS = ["summary", "timeline", "entries", "activity", "notes"];

const CONTENTS = [
  { id: "summary", label: strings.timeline.summaryTab },
  { id: "timeline", label: strings.timeline.tab },
  { id: "entries", label: strings.logbook.entriesTab },
  { id: "activity", label: strings.activity.tab },
  { id: "notes", label: strings.logbook.notesTab },
];

/** Highlights the section currently in the reading position. */
function useActiveSection(): string {
  const [active, setActive] = useState(SECTION_IDS[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);
  return active;
}

/** Sticky contents index for the project document. */
function ContentsNav() {
  const active = useActiveSection();
  return (
    <nav
      aria-label={strings.nav.primary}
      className="sticky top-14 z-30 -mx-5 border-y border-border bg-background px-5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {CONTENTS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(item.id)
                  ?.scrollIntoView({ block: "start" })
              }
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                active === item.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ProjectSwitcher({ currentId }: { currentId: string }) {
  const { data: projects } = useProjects();
  if (!projects || projects.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {projects.map((project) => (
        <Link
          key={project.id}
          to="/projects/$projectId"
          params={{ projectId: project.id }}
          search={{ page: 1 }}
          aria-current={project.id === currentId ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            project.id === currentId
              ? "border-edge bg-muted font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {project.name}
        </Link>
      ))}
    </div>
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
  const { data: recentDescriptions } = useRecentDescriptions(projectId);
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

  const openNewEntry = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const handlePageChange = (next: number) => {
    navigate({ search: { page: next } });
    document.getElementById("entries")?.scrollIntoView({ block: "start" });
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

  usePageCommands("project", [
    {
      id: "project-new-entry",
      label: strings.palette.newEntry,
      group: strings.palette.actions,
      icon: Plus,
      run: openNewEntry,
    },
  ]);

  // Shell commands (command palette) open the entry dialog via an event.
  useEffect(() => {
    const openNew = () => openNewEntry();
    window.addEventListener(NEW_ENTRY_EVENT, openNew);
    return () => window.removeEventListener(NEW_ENTRY_EVENT, openNew);
  }, [openNewEntry]);

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
        <DayStamp date={new Date()} />
        <div className="mt-5 mb-6 flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
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
        <div className="mt-5 mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {strings.entries.projectNotFoundTitle}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {strings.entries.projectNotFoundDescription}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
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

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1.5 font-mono text-xs text-muted-foreground tabular-nums">
              {strings.entries.metaLine(project.created_at, total)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

        <ProjectSwitcher currentId={projectId} />
      </div>

      <div className="mt-5">
        <ContentsNav />
      </div>

      <div className="flex flex-col gap-12 pt-8">
        <Section id="summary" className="scroll-mt-32">
          <SectionHeading title={strings.timeline.summaryTab} />
          <EntriesSummary entries={pageItems} total={total} />
        </Section>

        <Section id="timeline" className="scroll-mt-32">
          <SectionHeading
            title={strings.timeline.tab}
            meta={String(pageItems.length)}
          />
          <Panel>
            <PanelBody>
              <TimeLane
                entries={pageItems}
                onEdit={(entry) => {
                  setEditing(entry);
                  setFormOpen(true);
                }}
              />
            </PanelBody>
          </Panel>
        </Section>

        <Section id="entries" className="scroll-mt-32">
          <SectionHeading
            title={strings.logbook.entriesTab}
            meta={String(total)}
          />
          <div className="flex flex-col gap-4">
            {entriesQuery.data && total > 0 && (
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
          </div>
        </Section>

        <Section id="activity" className="scroll-mt-32">
          <SectionHeading title={strings.activity.tab} />
          <ActivityTab project={project} entries={pageItems} />
        </Section>

        <Section id="notes" className="scroll-mt-32">
          <SectionHeading title={strings.logbook.notesTab} />
          <LogbookTab projectId={projectId} />
        </Section>
      </div>

      <EntryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        entry={editing}
        recentDescriptions={recentDescriptions}
        existingEntries={pageItems}
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
    </PageContainer>
  );
}
