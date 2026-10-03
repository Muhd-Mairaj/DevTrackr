import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { AppNav } from "@/components/nav/app-nav";
import { RootErrorComponent } from "@/components/root-error";
import {
  AuthProvider,
  getAuthRedirectTarget,
  isPublicPageRoute,
  useAuth,
} from "@/contexts/auth";

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

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
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user === null && !isPublic) {
    // redirect to /login is pending in the effect above
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user !== null && isPublic) {
    // redirect to / is pending in the effect above
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isPublic) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AuthShell />
    </AuthProvider>
  );
}
