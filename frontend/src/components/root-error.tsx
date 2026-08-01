import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error?.message);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-6 shadow-xs">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-xl tracking-tight">
            {strings.error.rootTitle}
          </h2>
          <p className="text-muted-foreground text-sm">
            {strings.error.rootDescription}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          {reset && (
            <Button variant="outline" size="sm" onClick={() => reset()}>
              <RefreshCw className="mr-2 size-4" /> {strings.common.retry}
            </Button>
          )}
          <Button size="sm" onClick={() => window.location.assign("/")}>
            {strings.common.goHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
