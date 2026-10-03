import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { GithubMark } from "@/components/github-mark";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/i18n/strings";
import { startGithubInstall, useGithubStatus } from "@/lib/integrations";
import { cn } from "@/lib/utils";

export function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const { data: githubStatus } = useGithubStatus();
  const onProjects =
    location.pathname === "/" || location.pathname.startsWith("/projects");

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex min-h-12 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-1 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight">
            {strings.login.brand}
          </span>
          <nav
            aria-label="Primary"
            className="ml-3 flex flex-wrap items-center gap-1"
          >
            <Link
              to="/"
              aria-current={onProjects ? "page" : undefined}
              className={cn(
                "flex min-h-[44px] items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-h-0",
                onProjects && "bg-accent text-foreground",
              )}
            >
              {strings.nav.projects}
            </Link>
            <Link
              to="/settings"
              activeProps={{
                className: "bg-accent text-foreground",
                "aria-current": "page",
              }}
              className="flex min-h-[44px] items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-h-0"
            >
              {strings.nav.settings}
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          {user && (
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              {user.email}
            </span>
          )}
          {githubStatus &&
            !(githubStatus.account_linked && githubStatus.app_installed) && (
              <Button
                id="install-github-nav-btn"
                variant="ghost"
                size="sm"
                className="min-h-[44px] gap-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-h-0"
                onClick={() =>
                  startGithubInstall(`${location.pathname}${location.search}`)
                }
              >
                <GithubMark />
                {strings.integrations.githubInstallButton}
              </Button>
            )}
          <Button
            id="logout-btn"
            variant="ghost"
            size="sm"
            className="min-h-[44px] gap-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-h-0"
            onClick={handleLogout}
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{strings.common.signOut}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
