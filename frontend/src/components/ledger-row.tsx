import { Tag } from "@/components/tag";
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
        "grid grid-cols-[88px_44px_56px_1fr_auto] items-baseline gap-3 border-b border-border px-3 py-2 transition-colors hover:bg-primary/5 hover:shadow-[inset_2px_0_0_0_var(--primary)]",
        indented && "pl-8",
        className,
      )}
    >
      <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
        {time}
      </span>
      <span className="font-mono text-[10.5px] font-medium tabular-nums">
        {duration}
      </span>
      {hash ? (
        <span className="font-mono text-[10.5px] text-primary">{hash}</span>
      ) : (
        <span />
      )}
      <span className="truncate text-[12.5px] font-medium">{description}</span>
      {tag ? <Tag>{tag}</Tag> : <span />}
    </div>
  );
}
