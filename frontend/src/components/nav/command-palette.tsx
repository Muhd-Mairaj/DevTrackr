import { useNavigate } from "@tanstack/react-router";
import {
  Keyboard,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";
import { strings } from "@/i18n/strings";
import { dispatchAppEvent, SHORTCUTS_EVENT } from "@/lib/events";
import { isTypingTarget } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
export interface Command {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  icon?: typeof Search;
  run: () => void;
}

interface CommandPaletteContextValue {
  open: () => void;
  register: (id: string, commands: Command[]) => void;
  unregister: (id: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

/** Register page-local commands while a page is mounted. */
export function usePageCommands(id: string, commands: Command[]) {
  const ctx = useContext(CommandPaletteContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.register(id, commands);
    return () => ctx.unregister(id);
  }, [ctx, id, commands]);
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within provider");
  return ctx;
}

function matches(command: Command, query: string): boolean {
  if (!query) return true;
  const haystack = `${command.label} ${command.keywords ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { cycleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Page-local commands live in a ref: registering never re-renders the
  // provider, so usePageCommands cannot create a render loop.
  const extrasRef = useRef(new Map<string, Command[]>());

  const register = useCallback((id: string, commands: Command[]) => {
    extrasRef.current.set(id, commands);
  }, []);
  const unregister = useCallback((id: string) => {
    extrasRef.current.delete(id);
  }, []);

  const baseCommands = useMemo<Command[]>(
    () => [
      {
        id: "go-console",
        label: strings.nav.console,
        group: strings.palette.navigate,
        icon: LayoutDashboard,
        run: () => navigate({ to: "/" }),
      },
      {
        id: "go-settings",
        label: strings.nav.settings,
        group: strings.palette.navigate,
        icon: Settings,
        run: () => navigate({ to: "/settings" }),
      },
      {
        id: "toggle-theme",
        label: strings.palette.toggleTheme,
        group: strings.palette.view,
        icon: Moon,
        run: () => cycleTheme(),
      },
      {
        id: "shortcuts",
        label: strings.palette.shortcuts,
        group: strings.palette.view,
        icon: Keyboard,
        run: () => dispatchAppEvent(SHORTCUTS_EVENT),
      },
      {
        id: "sign-out",
        label: strings.palette.signOut,
        group: strings.palette.actions,
        icon: LogOut,
        run: () => {
          void logout().then(() => navigate({ to: "/login" }));
        },
      },
    ],
    [navigate, cycleTheme, logout],
  );

  const filtered = [
    ...baseCommands,
    ...[...extrasRef.current.values()].flat(),
  ].filter((command) => matches(command, query.trim().toLowerCase()));

  const grouped = new Map<string, Command[]>();
  for (const command of filtered) {
    const list = grouped.get(command.group) ?? [];
    list.push(command);
    grouped.set(command.group, list);
  }
  const groups = [...grouped.entries()];
  const flat = groups.flatMap(([, list]) => list);

  // Cmd/Ctrl-K, and a plain "k" when not typing, toggle the palette.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || event.isComposing) return;
      const withModifier = event.metaKey || event.ctrlKey;
      const plain = !withModifier && !event.altKey && !event.shiftKey;
      if (!withModifier && !plain) return;
      if (plain && isTypingTarget(event.target)) return;
      event.preventDefault();
      setIsOpen((prev) => !prev);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActive(0);
    // The palette is a keyboard surface; focus belongs in the field.
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(
    () => ({ open, register, unregister }),
    [open, register, unregister],
  );

  const runCommand = (command: Command) => {
    setIsOpen(false);
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => (flat.length ? (prev + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) =>
        flat.length ? (prev - 1 + flat.length) % flat.length : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = flat[active];
      if (command) runCommand(command);
    }
  };

  let index = -1;

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showClose={false}
          className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">
            {strings.nav.commandPalette}
          </DialogTitle>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={strings.palette.placeholder}
              aria-label={strings.palette.placeholder}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {flat.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {strings.palette.empty}
              </p>
            )}
            {groups.map(([group, list]) => (
              <div key={group} className="mb-1">
                <p className="px-2 pt-2 pb-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  {group}
                </p>
                {list.map((command) => {
                  index += 1;
                  const Icon = command.icon;
                  const isActive = index === active;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runCommand(command)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm outline-none",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {Icon && (
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1 truncate">{command.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="border-t border-border px-3 py-2 font-mono text-[10px] text-muted-foreground">
            {strings.palette.hint}
          </p>
        </DialogContent>
      </Dialog>
    </CommandPaletteContext.Provider>
  );
}
