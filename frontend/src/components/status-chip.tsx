import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info" | "neutral";

// Status chips: a pill carrying a small tone dot and a mono label. The dot
// carries the tone color; the label stays readable in both modes.
const TONES: Record<Tone, { chip: string; dot: string }> = {
  success: {
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  warning: {
    chip: "border-warning/30 bg-warning/12 text-warning",
    dot: "bg-warning",
  },
  error: {
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  info: {
    chip: "border-info/30 bg-info/10 text-info",
    dot: "bg-info",
  },
  neutral: {
    chip: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

interface StatusChipProps extends ComponentProps<"span"> {
  tone?: Tone;
  /** Soft pulse on the lamp dot, for a live state such as a running entry. */
  pulse?: boolean;
}

export function StatusChip({
  tone = "neutral",
  pulse = false,
  className,
  children,
  ...props
}: StatusChipProps) {
  const styles = TONES[tone];
  return (
    <span
      data-slot="status-chip"
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.1em] whitespace-nowrap uppercase tabular-nums",
        styles.chip,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          styles.dot,
          pulse && "live-pulse",
        )}
      />
      {children}
    </span>
  );
}
