import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProjectPublic } from "@/client/types.gen";
import {
  RecentList,
  StatsStrip,
  TodaySection,
} from "@/components/console/console-modules";
import { DayStamp } from "@/components/day-stamp";
import { usePageCommands } from "@/components/nav/command-palette";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import {
  ProjectSearch,
  type ProjectStatusFilter,
} from "@/components/projects/project-search";
import {
  EmptyState,
  LoadingSkeleton,
  QueryError,
} from "@/components/projects/query-state";
import { ShortcutHelpDialog } from "@/components/shortcut-help-dialog";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { Panel } from "@/components/ui/panel";
import { Section, SectionHeading } from "@/components/ui/section";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { totalSeconds, useConsoleFeed } from "@/lib/console";
import { NEW_PROJECT_EVENT } from "@/lib/events";
import { consumeGithubReturn } from "@/lib/github-return";
import { integrationKeys, useGithubStatus } from "@/lib/integrations";
import { useCreateProject, useProjects } from "@/lib/projects";
import { repositoryKeys } from "@/lib/repositories";
import { focusSearchInput, useKeyboardShortcuts } from "@/lib/shortcuts";

export const Route = createFileRoute("/")({
  component: ConsolePage,
});

function ConsolePage() {
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProjectPublic | null>(null);
  const [editing, setEditing] = useState<ProjectPublic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: githubStatus } = useGithubStatus();
  const { running, today, entries } = useConsoleFeed(projects);
  const entryDone = (projects ?? []).some((p) => p.has_entries);
  const columnsDone = (projects ?? []).some((p) => p.has_custom_columns);
  const createProject = useCreateProject({
    onSuccess: () => toast("success", strings.onboarding.sampleCreatedToast),
  });

  useKeyboardShortcuts({
    onNew: () => setCreateOpen(true),
    onSearch: () => {
      focusSearchInput();
    },
  });

  usePageCommands("console", [
    {
      id: "console-new-project",
      label: strings.palette.newProject,
      group: strings.palette.actions,
      icon: FolderPlus,
      run: () => setCreateOpen(true),
    },
  ]);

  // Shell commands (command palette) open page-local dialogs via events.
  useEffect(() => {
    const openNew = () => setCreateOpen(true);
    window.addEventListener(NEW_PROJECT_EVENT, openNew);
    return () => window.removeEventListener(NEW_PROJECT_EVENT, openNew);
  }, []);

  // Landing back from the GitHub App install flow carries ?github_app=<outcome>
  // on the URL; refresh the synced repos, drop the param, report, then
  // navigate back to the stored returnTo (returnTo only; project-form drafts
  // stay dialog-local and are not restored).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("github_app");
    if (outcome === null) return;
    queryClient.invalidateQueries({ queryKey: repositoryKeys.all });
    queryClient.invalidateQueries({ queryKey: integrationKeys.githubStatus });
    queryClient.invalidateQueries({
      queryKey: integrationKeys.githubInstallations,
    });
    const stored = consumeGithubReturn();
    window.history.replaceState({}, "", window.location.pathname);

    const outcomeMessages: Record<
      string,
      { variant: "success" | "error"; message: string }
    > = {
      success: {
        variant: "success",
        message: strings.integrations.githubInstalledToast,
      },
      sync_partial: {
        variant: "success",
        message: strings.integrations.githubInstallSyncPartialToast,
      },
      sync_error: {
        variant: "error",
        message: strings.integrations.githubInstallSyncErrorToast,
      },
      unauthorized: {
        variant: "error",
        message: strings.integrations.githubInstallUnauthorizedToast,
      },
      conflict: {
        variant: "error",
        message: strings.integrations.githubInstallConflictToast,
      },
    };
    const msg = outcomeMessages[outcome] ?? {
      variant: "error" as const,
      message: strings.integrations.githubInstallErrorToast,
    };
    toast(msg.variant, msg.message);
    if (stored?.returnTo && stored.returnTo !== window.location.pathname) {
      const [pathname, search] = stored.returnTo.split("?");
      const searchParams = Object.fromEntries(
        new URLSearchParams(search ?? ""),
      );
      navigate({
        // returnTo is validated to start with "/" in github-return.ts
        to: pathname as "/",
        search: searchParams as never,
      });
    }
  }, [queryClient, toast, navigate]);

  const activeCount = useMemo(
    () => projects?.filter((p) => p.is_active).length ?? 0,
    [projects],
  );

  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (projects ?? []).filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (!q) return true;
      const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, searchQuery, statusFilter]);

  useEffect(() => {
    document.title = `${strings.console.title} · ${strings.common.brand}`;
  }, []);

  const githubDone = Boolean(
    githubStatus?.account_linked && githubStatus?.app_installed,
  );
  const projectDone = (projects?.length ?? 0) > 0;
  const doneCount = [githubDone, projectDone, entryDone, columnsDone].filter(
    Boolean,
  ).length;
  const showOnboarding =
    !isLoading && !isError && ((projects?.length ?? 0) === 0 || doneCount < 3);

  const todaySeconds = useMemo(() => totalSeconds(today), [today]);
  const recent = useMemo(() => entries.slice(0, 6), [entries]);
  const firstProjectId = projects?.[0]?.id;

  const createSampleProject = () => {
    createProject.mutate({
      name: strings.onboarding.sampleName,
      description: strings.onboarding.sampleDescription,
    });
  };

  return (
    <PageContainer>
      <DayStamp date={new Date()} />

      <div className="mt-4 mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-prose">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {strings.console.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {strings.console.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ShortcutHelpDialog />
          <Button
            id="new-project-btn"
            className="gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <FolderPlus className="size-4" aria-hidden="true" />
            {strings.projects.newProject}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-8">
          <Panel className="h-40 animate-pulse" />
          <LoadingSkeleton variant="list" count={3} />
        </div>
      )}

      {isError && (
        <QueryError
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-9">
          <TodaySection
            running={running}
            today={today}
            firstProjectId={firstProjectId}
            onNewProject={() => setCreateOpen(true)}
          />

          {showOnboarding && (
            <OnboardingChecklist
              githubDone={githubDone}
              projectDone={projectDone}
              entryDone={entryDone}
              columnsDone={columnsDone}
              firstProjectId={firstProjectId}
            />
          )}

          <StatsStrip
            projects={projects ?? []}
            todaySeconds={todaySeconds}
            activeCount={activeCount}
          />

          <Section>
            <SectionHeading
              title={strings.console.projectsTitle}
              meta={String(visibleProjects.length)}
            />
            {projects && projects.length > 0 ? (
              <Panel>
                <div className="border-b border-border p-4">
                  <ProjectSearch
                    query={searchQuery}
                    statusFilter={statusFilter}
                    onQueryChange={setSearchQuery}
                    onStatusChange={setStatusFilter}
                  />
                </div>
                <div>
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={(p) =>
                        navigate({
                          to: "/projects/$projectId",
                          params: { projectId: p.id },
                          search: { page: 1 },
                        })
                      }
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                  {visibleProjects.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                      {strings.console.noMatches}
                    </p>
                  )}
                </div>
              </Panel>
            ) : (
              <EmptyState
                title={strings.projects.emptyTitle}
                description={strings.projects.emptyDescription}
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      id="empty-new-project-btn"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setCreateOpen(true)}
                    >
                      <FolderPlus className="size-4" aria-hidden="true" />
                      {strings.projects.newProject}
                    </Button>
                    <Button
                      id="try-sample-project-btn"
                      variant="secondary"
                      onClick={createSampleProject}
                      disabled={createProject.isPending}
                    >
                      {strings.onboarding.trySample}
                    </Button>
                  </div>
                }
              />
            )}
          </Section>

          <Section>
            <SectionHeading
              title={strings.console.recentTitle}
              meta={String(recent.length)}
            />
            <RecentList entries={recent} />
          </Section>
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteProjectDialog
        project={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
      <EditProjectDialog
        project={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </PageContainer>
  );
}
