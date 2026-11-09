import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/i18n/strings";
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
      <div role="status" className={cn("flex flex-col gap-3", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Panel
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            key={i}
          >
            <PanelBody className="flex items-center gap-4">
              <Skeleton className="size-10 shrink-0 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-5 w-16 rounded-sm" />
            </PanelBody>
          </Panel>
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Panel
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton grid
          key={i}
        >
          <PanelBody className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-5 w-14 rounded-sm" />
            </div>
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <div className="mt-auto flex items-center gap-2 pt-2">
              <Skeleton className="h-3 w-20" />
            </div>
          </PanelBody>
        </Panel>
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
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3",
        className,
      )}
    >
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-destructive"
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-destructive">
          {strings.error.loadFailed}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="gap-1.5"
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {strings.common.retry}
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = strings.empty.defaultTitle,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed border-edge px-6 py-14 text-center",
        className,
      )}
    >
      <div aria-hidden="true" className="rule w-16" />
      <div className="space-y-1">
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {description && (
          <p className="mx-auto max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
