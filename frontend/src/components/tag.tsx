import { cn } from "@/lib/utils";

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.08em] whitespace-nowrap text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
