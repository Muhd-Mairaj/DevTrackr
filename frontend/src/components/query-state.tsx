import { AlertCircle, FolderSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/ii8n/strings";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
  variant?: "grid" | "list";
}

export function LoadingSkeleton({
  count = 6,
  className,
  variant = "grid",
}: LoadingSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            key={i}
            className="flex items-center gap-4 rounded-md border bg-card p-4"
          >
            <Skeleton className="size-10 shrink-0 rounded-[4px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-5 w-16 rounded-[4px]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton grid
          key={i}
          className="flex flex-col gap-3 rounded-md border bg-card p-5"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-5 w-14 rounded-[4px]" />
          </div>
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <div className="mt-auto flex items-center gap-2 pt-2">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryError({
  message = strings.error.defaultMessage,
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-destructive/35 bg-destructive/5 px-4 py-3",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold">{strings.error.loadFailed}</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          {strings.common.retry}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = strings.empty.defaultTitle,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-edge px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-md bg-muted">
        {icon ?? <FolderSearch className="size-5 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <p className="text-[13px] font-semibold">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
