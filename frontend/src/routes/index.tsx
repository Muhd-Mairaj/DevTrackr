import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProjectPublic } from "@/client/types.gen";
import { DayStamp } from "@/components/day-stamp";
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
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { consumeGithubReturn } from "@/lib/github-return";
import { integrationKeys, useGithubStatus } from "@/lib/integrations";
import { useCreateProject, useProjects } from "@/lib/projects";
import { repositoryKeys } from "@/lib/repositories";
import { focusSearchInput, useKeyboardShortcuts } from "@/lib/shortcuts";

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
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
  const [entryDone] = useState(() => readFlag("devtrackr-has-entry"));
  const [columnsDone] = useState(() => readFlag("devtrackr-has-columns"));
  const createProject = useCreateProject({
    onSuccess: () => toast("success", strings.onboarding.sampleCreatedToast),
  });

  useKeyboardShortcuts({
    onNew: () => setCreateOpen(true),
    onSearch: () => {
      focusSearchInput();
    },
  });

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
  const inactiveCount = (projects?.length ?? 0) - activeCount;

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
    document.title = `${strings.projects.title} · ${strings.common.brand}`;
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

  const createSampleProject = () => {
    createProject.mutate({
      name: strings.onboarding.sampleName,
      description: strings.onboarding.sampleDescription,
    });
  };

  return (
    <PageContainer>
      <DayStamp date={new Date()} />

      <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {strings.projects.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {strings.projects.subtitle}
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

      {showOnboarding && (
        <OnboardingChecklist
          githubDone={githubDone}
          projectDone={projectDone}
          entryDone={entryDone}
          columnsDone={columnsDone}
          firstProjectId={projects?.[0]?.id}
        />
      )}

      {isLoading && <LoadingSkeleton count={6} variant="grid" />}

      {isError && (
        <QueryError
          message={(error as Error)?.message}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="mb-6 grid grid-cols-1 overflow-hidden rounded-md border border-border sm:grid-cols-3">
          <div className="px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {projects.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {strings.projects.totalLabel}
            </div>
          </div>
          <div className="border-l border-border px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {activeCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {strings.projects.activeLabel}
            </div>
          </div>
          <div className="border-l border-border px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {inactiveCount}
            </div>
            <div className="text-xs text-muted-foreground">
              {strings.projects.inactiveLabel}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !isError && projects?.length === 0 && (
        <EmptyState
          title={strings.projects.emptyTitle}
          description={strings.projects.emptyDescription}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                id="empty-new-project-btn"
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

      {!isLoading && !isError && projects && projects.length > 0 && (
        <>
          <ProjectSearch
            query={searchQuery}
            statusFilter={statusFilter}
            onQueryChange={setSearchQuery}
            onStatusChange={setStatusFilter}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </>
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
