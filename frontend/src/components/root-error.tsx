import type { ErrorComponentProps } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { strings } from "@/i18n/strings";

export function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error?.message);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <LogoMark size={34} />
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {strings.error.rootTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.error.rootDescription}
          </p>
          {error instanceof Error && error.message && (
            <ErrorBanner message={error.message} />
          )}
        </div>
        <div className="flex items-center gap-3 pt-1">
          {reset && (
            <Button variant="secondary" onClick={() => reset()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              {strings.common.retry}
            </Button>
          )}
          <Button onClick={() => window.location.assign("/")}>
            {strings.common.goHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
