import { Tag } from "@/components/tag";
import { ROW_HOVER } from "@/components/ui/row-hover";
import { cn } from "@/lib/utils";

export interface LedgerEntry {
  time: string;
  duration: string;
  hash?: string;
  description: string;
  tag?: string;
}

interface LedgerRowProps extends LedgerEntry {
  indented?: boolean;
  className?: string;
}

export function LedgerRow({
  time,
  duration,
  hash,
  description,
  tag,
  indented = false,
  className,
}: LedgerRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[88px_44px_56px_1fr_auto] items-baseline gap-3 border-b border-border px-3 py-2 transition-colors last:border-b-0",
        ROW_HOVER,
        indented && "pl-8",
        className,
      )}
    >
      <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
        {time}
      </span>
      <span className="font-mono text-[13px] font-medium tabular-nums">
        {duration}
      </span>
      {hash ? (
        <span className="font-mono text-[13px] tabular-nums text-signal">
          {hash}
        </span>
      ) : (
        <span />
      )}
      <span className="truncate text-[13px] font-medium">{description}</span>
      {tag ? <Tag>{tag}</Tag> : <span />}
    </div>
  );
}
