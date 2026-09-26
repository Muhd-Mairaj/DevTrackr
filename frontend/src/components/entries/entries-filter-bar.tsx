import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { strings } from "@/ii8n/strings";

interface EntriesFilterBarProps {
  query: string;
  from: string;
  to: string;
  runningOnly: boolean;
  filteredCount: number;
  totalCount: number;
  onQueryChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRunningOnlyChange: (value: boolean) => void;
  onClear: () => void;
}

export function EntriesFilterBar({
  query,
  from,
  to,
  runningOnly,
  filteredCount,
  totalCount,
  onQueryChange,
  onFromChange,
  onToChange,
  onRunningOnlyChange,
  onClear,
}: EntriesFilterBarProps) {
  // Pressing "/" focuses the search input when not already typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return;
      }
      event.preventDefault();
      document.getElementById("entries-search")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card px-3 py-2.5">
      <div className="min-w-44 flex-1">
        <Label htmlFor="entries-search" className="sr-only">
          {strings.entries.searchPlaceholder}
        </Label>
        <Input
          id="entries-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={strings.entries.searchPlaceholder}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Label htmlFor="entries-from">{strings.entries.fromLabel}</Label>
        <Input
          id="entries-from"
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-auto"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Label htmlFor="entries-to">{strings.entries.toLabel}</Label>
        <Input
          id="entries-to"
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-auto"
        />
      </div>
      <Label className="flex cursor-pointer items-center gap-1.5 font-normal">
        <input
          type="checkbox"
          checked={runningOnly}
          onChange={(e) => onRunningOnlyChange(e.target.checked)}
          className="size-4 accent-(--primary)"
        />
        {strings.entries.runningOnly}
      </Label>
      <span
        role="status"
        className="font-mono text-xs tabular-nums text-muted-foreground"
      >
        {strings.entries.resultCount(filteredCount, totalCount)}
      </span>
      <Button variant="ghost" size="sm" onClick={onClear}>
        {strings.entries.clearFilters}
      </Button>
    </div>
  );
}
