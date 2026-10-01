import { Clock, Pencil, Trash2 } from "lucide-react";
import type { ProjectPublic } from "@/client/types.gen";
import { StatusChip } from "@/components/status-chip";
import { Tag } from "@/components/tag";
import { Button } from "@/components/ui/button";
import { strings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectPublic;
  onClick?: (project: ProjectPublic) => void;
  onEdit?: (project: ProjectPublic) => void;
  onDelete?: (project: ProjectPublic) => void;
  className?: string;
}

/**
 * Project rack row. A full-width console row, not a card: name and meta on the
 * left, repo tags in the middle, lamp and actions on the right.
 */
export function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
  className,
}: ProjectCardProps) {
  const repos = project.repositories ?? [];
  return (
    <article
      className={cn(
        "group flex items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-b-0 hover:bg-foreground/[0.035]",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {onClick ? (
          <button
            type="button"
            onClick={() => onClick(project)}
            className="block max-w-full truncate rounded text-left text-sm leading-tight font-semibold tracking-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {project.name}
          </button>
        ) : (
          <span className="block truncate text-sm leading-tight font-semibold tracking-tight">
            {project.name}
          </span>
        )}
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase tabular-nums">
            <Clock className="size-3" aria-hidden="true" />
            {strings.projects.updatedAt(project.updated_at)}
          </span>
          {repos.length > 0 && (
            <span className="flex min-w-0 flex-wrap items-center gap-1">
              {repos.slice(0, 2).map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url ?? `https://github.com/${repo.full_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Tag className="transition-colors hover:border-edge hover:text-foreground">
                    {repo.full_name}
                  </Tag>
                </a>
              ))}
              {repos.length > 2 && (
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  +{repos.length - 2}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <StatusChip tone={project.is_active ? "success" : "neutral"}>
          {project.is_active
            ? strings.projects.active
            : strings.projects.inactive}
        </StatusChip>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit?.(project)}
          aria-label={`${strings.projects.updateLabel}: ${project.name}`}
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete?.(project)}
          aria-label={`${strings.projects.deleteLabel}: ${project.name}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
        {onClick && (
          <Button
            variant="link"
            size="sm"
            onClick={() => onClick(project)}
            aria-label={`${strings.projects.openLabel}: ${project.name}`}
            className="h-auto min-h-[44px] px-1 py-1 sm:min-h-0"
          >
            {strings.console.openProject}
          </Button>
        )}
      </div>
    </article>
  );
}
