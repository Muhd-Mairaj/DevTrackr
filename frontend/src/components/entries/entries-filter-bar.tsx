import { Search } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { strings } from "@/i18n/strings";

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
    <Panel className="px-3 py-2.5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-44 flex-1">
          <Label htmlFor="entries-search" className="sr-only">
            {strings.entries.searchPlaceholder}
          </Label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="entries-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={strings.entries.searchPlaceholder}
            className="pl-8"
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
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={runningOnly}
            onChange={(e) => onRunningOnlyChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-5 w-[34px] shrink-0 rounded-full border border-edge bg-muted transition-colors peer-checked:border-signal/50 peer-checked:bg-signal/20 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-checked:[&>span]:translate-x-3.5"
          >
            <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-xs transition-transform" />
          </span>
          <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {strings.entries.runningOnly}
          </span>
        </label>
        <span
          role="status"
          className="ml-auto font-mono text-xs tabular-nums text-muted-foreground"
        >
          {strings.entries.resultCount(filteredCount, totalCount)}
        </span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {strings.entries.clearFilters}
        </Button>
      </div>
    </Panel>
  );
}
