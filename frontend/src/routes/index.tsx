import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
import { useState } from "react";
import type { ProjectPublic } from "@/client/types.gen";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { DayStamp } from "@/components/day-stamp";
import { DeleteProjectDialog } from "@/components/delete-project-dialog";
import { ProjectCard } from "@/components/project-card";
import {
  EmptyState,
  LoadingSkeleton,
  QueryError,
} from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/projects";
import { strings } from "@/lib/strings";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProjectPublic | null>(null);

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
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteProjectDialog
        project={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
