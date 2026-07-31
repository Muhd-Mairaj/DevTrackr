import { Clock, FolderGit2, MoreHorizontal } from "lucide-react";
import type { ProjectPublic } from "@/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectPublic;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Subtle top accent line */}
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FolderGit2 className="size-4 text-primary" />
            </div>
            <CardTitle className="truncate text-base leading-tight">
              {project.name}
            </CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge
              variant={project.is_active ? "default" : "secondary"}
              className="text-xs"
            >
              {project.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Project options"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <CardDescription className="line-clamp-2 text-sm leading-relaxed">
          {project.description ?? (
            <span className="italic text-muted-foreground/60">
              No description
            </span>
          )}
        </CardDescription>
      </CardContent>

      <CardFooter className="border-t pt-3 pb-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Clock className="size-3" />
          <span>Updated {formatDate(project.updated_at)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
