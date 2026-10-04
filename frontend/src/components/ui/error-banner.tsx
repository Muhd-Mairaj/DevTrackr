import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  message: string | undefined | null;
  className?: string;
}

export function ErrorBanner({ message, className }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className={cn(
        "rounded border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive",
        className,
      )}
    >
      {message}
    </p>
  );
}
