import { createFileRoute } from "@tanstack/react-router";
import { DayStamp } from "@/components/day-stamp";
import { ProjectPageShell } from "@/components/projects/project-page-shell";
import { useProject } from "@/lib/projects";

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

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { page } = Route.useSearch();
  const { data: project, isLoading, isError } = useProject(projectId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DayStamp date={new Date()} />
      <ProjectPageShell
        projectId={projectId}
        page={page}
        project={project}
        projectLoading={isLoading}
        projectError={isError}
      />
    </div>
  );
}
