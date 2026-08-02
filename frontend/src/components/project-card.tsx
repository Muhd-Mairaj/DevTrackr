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
              className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
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
              className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {project.description ?? (
            <span className="italic text-muted-foreground/60">
              {strings.projects.noDescription}
            </span>
          )}
        </p>
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
