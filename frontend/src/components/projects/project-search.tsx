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
      <div className="max-w-sm flex-1">
        <Label htmlFor="project-search" className="sr-only">
          {strings.projects.searchPlaceholder}
        </Label>
        <Input
          id="project-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={strings.projects.searchPlaceholder}
        />
      </div>
      <fieldset className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
        <legend className="sr-only">
          {strings.projects.filterStatusLabel}
        </legend>
        {OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="ghost"
            size="sm"
            aria-pressed={statusFilter === option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              statusFilter === option.value &&
                "bg-accent font-semibold text-accent-foreground",
            )}
          >
            {option.label}
          </Button>
        ))}
      </fieldset>
    </div>
  );
}
