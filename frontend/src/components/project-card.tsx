import { Clock, Pencil, Trash2 } from "lucide-react";
import type { ProjectPublic } from "@/client/types.gen";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

// TODO: remove after SDK regeneration includes repositories on ProjectPublic
type ProjectWithRepos = ProjectPublic & {
  repositories?: Array<{
    id: string;
    github_id: number;
    full_name: string;
    repo_name: string;
    url: string | null;
    description: string | null;
  }>;
};

interface ProjectCardProps {
  project: ProjectPublic;
  onClick?: (project: ProjectPublic) => void;
  onEdit?: (project: ProjectPublic) => void;
  onDelete?: (project: ProjectPublic) => void;
  className?: string;
}

export function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
  className,
}: ProjectCardProps) {
  const repos = (project as ProjectWithRepos).repositories ?? [];
  const isClickable = onClick !== undefined;
  return (
    <Card
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick?.(project) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (
                e.target === e.currentTarget &&
                !e.repeat &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                onClick?.(project);
              }
            }
          : undefined
      }
      className={cn(
        "group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md",
        isClickable &&
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-sm leading-tight">
            {project.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            <StatusChip tone={project.is_active ? "success" : "neutral"}>
              {project.is_active
                ? strings.projects.active
                : strings.projects.inactive}
            </StatusChip>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(project);
              }}
              aria-label={strings.projects.updateLabel}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(project);
              }}
              aria-label={strings.projects.deleteLabel}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-2">
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {project.description ?? (
            <span className="italic text-muted-foreground/60">
              {strings.projects.noDescription}
            </span>
          )}
        </p>
        {repos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.url ?? `https://github.com/${repo.full_name}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground no-underline"
              >
                {repo.full_name}
              </a>
            ))}
            <span className="ml-1 text-[11px] text-muted-foreground">
              {strings.integrations.reposCount(repos.length)}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 pb-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          <span className="tabular-nums">
            {strings.projects.updatedAt(project.updated_at)}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
