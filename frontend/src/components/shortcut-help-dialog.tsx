import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/i18n/strings";
import { SHORTCUTS_EVENT } from "@/lib/events";
import { isMacPlatform, useKeyboardShortcuts } from "@/lib/shortcuts";

export function ShortcutHelpDialog() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts({ onHelp: () => setOpen(true) });

  // The command palette opens this dialog through a window event.
  useEffect(() => {
    const openDialog = () => setOpen(true);
    window.addEventListener(SHORTCUTS_EVENT, openDialog);
    return () => window.removeEventListener(SHORTCUTS_EVENT, openDialog);
  }, []);

  const rows: Array<{ keys: string; label: string }> = [
    {
      keys: isMacPlatform() ? "⌘ K" : "Ctrl K",
      label: strings.shortcuts.commandPalette,
    },
    { keys: "n", label: strings.shortcuts.newItem },
    { keys: "/", label: strings.shortcuts.search },
    { keys: "←", label: strings.shortcuts.prevPage },
    { keys: "→", label: strings.shortcuts.nextPage },
    { keys: "?", label: strings.shortcuts.openLabel },
    { keys: "Esc", label: strings.shortcuts.closeDialog },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={strings.shortcuts.openLabel}
        className="text-muted-foreground hover:text-foreground"
      >
        <CircleHelp className="size-4" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.shortcuts.title}</DialogTitle>
            <DialogDescription>
              {strings.shortcuts.description}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1">
            {rows.map((row) => (
              <li
                key={row.keys}
                className="flex items-center justify-between gap-4 border-b border-border py-1.5 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground tabular-nums">
                  {row.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
