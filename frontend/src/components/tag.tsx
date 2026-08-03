import { cn } from "@/lib/utils";

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="tag"
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-[3px] bg-accent px-1.5 py-0.5 font-mono text-[9.5px] font-medium tracking-[0.08em] whitespace-nowrap uppercase text-foreground",
        className,
      )}
      {...props}
    />
  );
}
