import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectPublic } from "@/client/types.gen";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DayStamp } from "@/components/day-stamp";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { EditProjectDialog } from "@/components/edit-project-dialog";
import { ProjectCard } from "@/components/project-card";
import {
  EmptyState,
  LoadingSkeleton,
  QueryError,
} from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { integrationKeys } from "@/lib/integrations";
import { projectKeys, useProject, useProjects } from "@/lib/projects";
import { repositoryKeys } from "@/lib/repositories";
import { strings } from "@/lib/strings";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProjectPublic | null>(null);
  const [editing, setEditing] = useState<ProjectPublic | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const projectDetails = useProject(selectedId);

  const handleViewProject = (project: ProjectPublic) => {
    queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) });
    setSelectedId(project.id);
  };

  useEffect(() => {
    if (projectDetails.data) {
      toast("success", strings.projects.detailToast(projectDetails.data));
    }
  }, [projectDetails.data, toast]);

  useEffect(() => {
    if (projectDetails.error) {
      toast("error", strings.projects.detailErrorToast);
    }
  }, [projectDetails.error, toast]);

  // Landing back from the GitHub App install flow carries ?github_app=<outcome>
  // on the URL; refresh the synced repos, drop the param, and report.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("github_app");
    if (outcome === null) return;
    queryClient.invalidateQueries({ queryKey: repositoryKeys.all });
    queryClient.invalidateQueries({ queryKey: integrationKeys.githubStatus });
    queryClient.invalidateQueries({
      queryKey: integrationKeys.githubInstallations,
    });
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
  }, [queryClient, toast]);

  if (isLoading) {
    return <LoadingSkeleton count={6} variant="grid" />;
  }

  if (isError) {
    return (
      <QueryError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );
  }

  const activeCount = projects?.filter((p) => p.is_active).length ?? 0;
  const inactiveCount = (projects?.length ?? 0) - activeCount;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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
        <Button
          id="new-project-btn"
          className="gap-2 self-start sm:self-auto"
          onClick={() => setCreateOpen(true)}
        >
          <FolderPlus className="size-4" />
          {strings.projects.newProject}
        </Button>
      </div>

      {projects && projects.length > 0 && (
        <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-md border border-border">
          <div className="px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {projects.length}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {strings.projects.totalLabel}
            </div>
          </div>
          <div className="border-l border-border px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {activeCount}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {strings.projects.activeLabel}
            </div>
          </div>
          <div className="border-l border-border px-4 py-3">
            <div className="font-mono text-lg font-medium tabular-nums">
              {inactiveCount}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {strings.projects.inactiveLabel}
            </div>
          </div>
        </div>
      )}

      {projects?.length === 0 && (
        <EmptyState
          title={strings.projects.emptyTitle}
          description={strings.projects.emptyDescription}
          action={
            <Button
              id="empty-new-project-btn"
              className="gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <FolderPlus className="size-4" />
              {strings.projects.newProject}
            </Button>
          }
        />
      )}

      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleViewProject}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteProjectDialog
        project={deleting}
        onOpenChange={(open) => {
          if (!open) {
            if (deleting?.id === selectedId) setSelectedId(null);
            setDeleting(null);
          }
        }}
      />
      <EditProjectDialog
        project={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}
