import type { ProjectPublic } from "@/client/types.gen";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/ii8n/strings";

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
  // Consumed by later tasks (entries table, columns dialog).
  void projectId;
  void page;

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
    <div className="mt-4 mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {strings.entries.metaLine(project.created_at, 0)}
        </p>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button id="columns-btn" variant="secondary" size="sm">
          {strings.entries.columnsButton}
        </Button>
        <Button id="new-entry-btn" size="sm">
          {strings.entries.newEntry}
        </Button>
      </div>
    </div>
  );
}
