import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { GithubMark } from "@/components/github-mark";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/ii8n/strings";
import { startGithubInstall, useGithubStatus } from "@/lib/integrations";
import { cn } from "@/lib/utils";

export function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const { data: githubStatus, isError } = useGithubStatus();
  const onProjects =
    location.pathname === "/" || location.pathname.startsWith("/projects");

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight">
            {strings.login.brand}
          </span>
          <nav className="ml-3 flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground",
                onProjects && "bg-accent text-foreground",
              )}
            >
              {strings.nav.projects}
            </Link>
            <Link
              to="/settings"
              activeProps={{ className: "bg-accent text-foreground" }}
              className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
            >
              {strings.nav.settings}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              {user.email}
            </span>
          )}
          {isError ||
            (githubStatus &&
              !(githubStatus.account_linked && githubStatus.app_installed) && (
                <Button
                  id="install-github-nav-btn"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={startGithubInstall}
                >
                  <GithubMark />
                  {strings.integrations.githubInstallButton}
                </Button>
              ))}
          <Button
            id="logout-btn"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">{strings.common.signOut}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
