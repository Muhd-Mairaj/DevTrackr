import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center rounded-sm border-transparent px-2 py-0.5 font-mono text-xs font-semibold tracking-[0.12em] whitespace-nowrap uppercase",
  {
    variants: {
      tone: {
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        error: "bg-destructive/15 text-destructive",
        info: "bg-primary/15 text-primary",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

interface StatusChipProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof chipVariants> {}

export function StatusChip({ tone, className, ...props }: StatusChipProps) {
  return (
    <span
      data-slot="status-chip"
      className={cn(chipVariants({ tone }), className)}
      {...props}
    />
  );
}
