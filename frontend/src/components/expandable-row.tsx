import { ChevronDown } from "lucide-react";
import { type LedgerEntry, LedgerRow } from "@/components/ledger-row";
import { StatusChip } from "@/components/status-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

interface ExpandableRowProps {
  time: string;
  duration: string;
  summary: string;
  summaryLoading?: boolean;
  entries: LedgerEntry[];
  defaultOpen?: boolean;
  className?: string;
}

export function ExpandableRow({
  time,
  duration,
  summary,
  summaryLoading = false,
  entries,
  defaultOpen = false,
  className,
}: ExpandableRowProps) {
  return (
    <div className={cn("border-b border-border", className)}>
      <button
        type="button"
        className="grid w-full grid-cols-[88px_44px_1fr_auto] items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-primary/5 hover:shadow-[inset_2px_0_0_0_var(--primary)]"
        aria-expanded={defaultOpen}
      >
        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {time}
        </span>
        <span className="font-mono text-[10.5px] font-medium tabular-nums">
          {duration}
        </span>
        {summaryLoading ? (
          <Skeleton className="h-3 w-3/4" />
        ) : (
          <span className="truncate text-[12.5px] font-medium">{summary}</span>
        )}
        <span className="flex items-center gap-2">
          <StatusChip tone="neutral">
            {`${entries.length} ${strings.common.entries}`}
          </StatusChip>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
              defaultOpen && "rotate-180",
            )}
          />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
          defaultOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden border-l border-edge pl-4">
          {entries.map((entry, i) => (
            <LedgerRow
              // biome-ignore lint/suspicious/noArrayIndexKey: static entry list
              key={i}
              {...entry}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
