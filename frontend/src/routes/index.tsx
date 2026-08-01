import { createFileRoute } from "@tanstack/react-router";
import { FolderPlus } from "lucide-react";
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

  if (isLoading) {
    return <LoadingSkeleton count={6} variant="grid" />;
  }

  if (isError) {
    console.log("error", error);
    return (
      <QueryError
        message={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {strings.projects.title}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {strings.projects.subtitle}
          </p>
        </div>
        <Button id="new-project-btn" className="gap-2 self-start sm:self-auto">
          <FolderPlus className="size-4" />
          {strings.projects.newProject}
        </Button>
      </div>

      {projects?.length === 0 && (
        <EmptyState
          title={strings.projects.emptyTitle}
          description={strings.projects.emptyDescription}
          action={
            <Button id="empty-new-project-btn" className="gap-2">
              <FolderPlus className="size-4" />
              {strings.projects.newProject}
            </Button>
          }
        />
      )}

      {projects && projects?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
