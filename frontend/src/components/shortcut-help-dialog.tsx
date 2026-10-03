import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { strings } from "@/i18n/strings";
import { useKeyboardShortcuts } from "@/lib/shortcuts";

export function ShortcutHelpDialog() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts({ onHelp: () => setOpen(true) });

  const rows: Array<{ keys: string; label: string }> = [
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
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={strings.shortcuts.openLabel}
        title="?"
      >
        ?
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.shortcuts.title}</DialogTitle>
            <DialogDescription>
              {strings.shortcuts.description}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.keys}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
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
