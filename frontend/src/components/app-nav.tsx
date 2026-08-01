import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { strings } from "@/lib/strings";

export function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight">
            {strings.login.brand}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              {user.email}
            </span>
          )}
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
