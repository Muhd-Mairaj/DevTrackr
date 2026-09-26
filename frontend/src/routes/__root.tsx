import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/nav/app-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { RootErrorComponent } from "@/components/root-error";
import { Button } from "@/components/ui/button";
import {
  AuthProvider,
  getAuthRedirectTarget,
  isPublicPageRoute,
  useAuth,
} from "@/contexts/auth";
import { strings } from "@/ii8n/strings";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function LoadingSpinner() {
  const [stuck, setStuck] = useState(false);

  // If the session probe hangs, offer a manual retry instead of an
  // endless spinner.
  useEffect(() => {
    const timer = window.setTimeout(() => setStuck(true), 12_000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3">
      <div role="status" aria-label="Loading">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      {stuck && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {strings.error.sessionStillLoading}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            {strings.error.staleRetry}
          </Button>
        </div>
      )}
    </div>
  );
}

function AuthShell() {
  const { user } = useAuth();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const isPublic = isPublicPageRoute(location.pathname);

  // Redirect based on auth state once the session probe has resolved.
  useEffect(() => {
    const target = getAuthRedirectTarget(user, isPublic);
    if (target) {
      navigate({ to: target, replace: true });
    }
  }, [user, isPublic, navigate]);

  // undefined = session still resolving
  if (user === undefined) {
    return <LoadingSpinner />;
  }

  if (user === null && !isPublic) {
    // redirect to /login is pending in the effect above
    return <LoadingSpinner />;
  }

  if (user !== null && isPublic) {
    // redirect to / is pending in the effect above
    return <LoadingSpinner />;
  }

  if (isPublic) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <OfflineBanner />
    </div>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1"
      >
        {strings.common.skipToContent}
      </a>
      <AuthShell />
    </AuthProvider>
  );
}
