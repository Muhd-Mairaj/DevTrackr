import { AlertCircle, FolderSearch, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/lib/strings";
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
            className="flex items-center gap-4 rounded-xl border bg-card p-4"
          >
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
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
          className="flex flex-col gap-3 rounded-xl border bg-card p-5"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-5 w-14 rounded-full" />
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
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{strings.error.loadFailed}</p>
        <p className="text-muted-foreground text-xs">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
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
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        {icon ?? <FolderSearch className="size-6 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
