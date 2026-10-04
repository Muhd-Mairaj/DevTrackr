import { cn } from "@/lib/utils";

/** A page section: a titled block separated by a ruled heading. */
export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

interface SectionHeadingProps {
  title: string;
  meta?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Ruled section heading: a display title, optional mono meta, optional action. */
export function SectionHeading({
  title,
  meta,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3",
        className,
      )}
    >
      <h2 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h2>
      <div className="flex items-center gap-3">
        {meta && (
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {meta}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
