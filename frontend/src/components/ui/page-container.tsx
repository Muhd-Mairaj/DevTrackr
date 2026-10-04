import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1120px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10",
        className,
      )}
      {...props}
    />
  );
}
