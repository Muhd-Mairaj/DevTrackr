import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Theme, useTheme } from "@/contexts/theme";
import { strings } from "@/ii8n/strings";

const THEME_ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

// The label names the next state in the cycle, not the current one
const NEXT_LABEL: Record<Theme, string> = {
  light: strings.theme.toSystem,
  system: strings.theme.toDark,
  dark: strings.theme.toLight,
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const Icon = THEME_ICONS[theme];
  const label = NEXT_LABEL[theme];

  return (
    <Button
      id="theme-toggle"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-foreground"
      aria-label={label}
      title={label}
      onClick={cycleTheme}
    >
      <Icon className="size-4" />
    </Button>
  );
}
