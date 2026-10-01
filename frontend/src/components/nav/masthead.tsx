import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Search, Settings } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { useCommandPalette } from "@/components/nav/command-palette";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { strings } from "@/i18n/strings";
import { isMacPlatform } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

const NAV =
  "inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";
const NAV_ACTIVE = "bg-muted text-foreground";

/**
 * Global masthead: the wordmark, the two primary destinations, the command
 * palette field, the theme switch, and the account. Replaces the old left
 * sidebar and top status bar (design.md · app family).
 */
export function Masthead() {
  const { open } = useCommandPalette();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const onOverview = location.pathname === "/";
  const onSettings = location.pathname.startsWith("/settings");

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-2 px-5 sm:px-8 lg:px-10">
        <Link
          to="/"
          className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        >
          <BrandLockup size={24} wordmarkClassName="hidden sm:inline" />
        </Link>

        <nav
          aria-label={strings.nav.primary}
          className="ml-1 flex items-center gap-1"
        >
          <Link
            to="/"
            aria-current={onOverview ? "page" : undefined}
            className={cn(NAV, onOverview && NAV_ACTIVE)}
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{strings.nav.console}</span>
          </Link>
          <Link
            to="/settings"
            aria-current={onSettings ? "page" : undefined}
            className={cn(NAV, onSettings && NAV_ACTIVE)}
          >
            <Settings className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{strings.nav.settings}</span>
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={open}
            aria-label={strings.nav.openCommand}
            className="inline-flex h-9 items-center gap-2 rounded border border-border bg-card px-3 text-sm text-muted-foreground shadow-2xs transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden lg:inline">
              {strings.nav.commandPalette}
            </span>
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-px font-mono text-[10px] sm:inline">
              {isMacPlatform() ? "⌘K" : "Ctrl K"}
            </kbd>
          </button>
          <ThemeToggle />
          {user && (
            <span className="hidden max-w-40 truncate font-mono text-[11px] text-muted-foreground xl:inline">
              {user.email}
            </span>
          )}
          <Button
            id="logout-btn"
            variant="ghost"
            size="icon-sm"
            aria-label={strings.common.signOut}
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  );
}
