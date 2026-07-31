import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { AuthProvider, isPublicPageRoute, useAuth } from "@/lib/auth";

export const Route = createRootRoute({
  component: RootComponent,
});

function AuthShell() {
  const { user } = useAuth();
  const { location } = useRouterState();
  const navigate = useNavigate();
  const isPublic = isPublicPageRoute(location.pathname);

  // undefined = session still resolving
  if (user === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user === null && !isPublic) {
    // navigate() cannot be called during render, so defer to next tick
    setTimeout(() => navigate({ to: "/login", replace: true }), 0);
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user !== null && isPublic) {
    setTimeout(() => navigate({ to: "/", replace: true }), 0);
    return null;
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
