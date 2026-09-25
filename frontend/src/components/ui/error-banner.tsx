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
        "rounded-md bg-destructive/10 px-3 py-2 text-center text-destructive text-xs",
        className,
      )}
    >
      {message}
    </p>
  );
}
