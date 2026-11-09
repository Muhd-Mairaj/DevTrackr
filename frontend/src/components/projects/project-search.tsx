import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { strings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

export type ProjectStatusFilter = "all" | "active" | "inactive";

interface ProjectSearchProps {
  query: string;
  statusFilter: ProjectStatusFilter;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: ProjectStatusFilter) => void;
}

const OPTIONS: { value: ProjectStatusFilter; label: string }[] = [
  { value: "all", label: strings.projects.filterAll },
  { value: "active", label: strings.projects.filterActive },
  { value: "inactive", label: strings.projects.filterInactive },
];

export function ProjectSearch({
  query,
  statusFilter,
  onQueryChange,
  onStatusChange,
}: ProjectSearchProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <Label htmlFor="project-search" className="sr-only">
          {strings.projects.searchPlaceholder}
        </Label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={strings.projects.searchPlaceholder}
          className="pl-9"
        />
      </div>
      <fieldset className="flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
        <legend className="sr-only">
          {strings.projects.filterStatusLabel}
        </legend>
        {OPTIONS.map((option) => {
          const active = statusFilter === option.value;
          return (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={active}
              onClick={() => onStatusChange(option.value)}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                active &&
                  "border border-border bg-card font-medium text-foreground shadow-2xs hover:bg-card",
              )}
            >
              {option.label}
            </Button>
          );
        })}
      </fieldset>
    </div>
  );
}
