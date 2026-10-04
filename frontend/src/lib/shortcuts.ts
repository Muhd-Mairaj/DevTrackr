import { useEffect } from "react";

/** localStorage-backed selectors the "/" shortcut tries, in order. */
export const SEARCH_SELECTORS = [
  "#entries-search",
  "#repo-search",
  "#project-search",
] as const;

export interface ShortcutHandlers {
  onNew?: () => void;
  onSearch?: () => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onHelp?: () => void;
}

/**
 * True when keyboard shortcuts should be ignored because the user is
 * typing, choosing an option, or composing text (IME).
 * Pure helper kept separate for unit testing.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Focus the first visible search input known to the app. Returns true if focused. */
export function focusSearchInput(): boolean {
  for (const selector of SEARCH_SELECTORS) {
    const el = document.querySelector<HTMLInputElement>(selector);
    if (el && !el.disabled) {
      el.focus();
      return true;
    }
  }
  return false;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { onNew, onSearch, onPrevPage, onNextPage, onHelp } = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.isComposing) return;
      const target = e.target as EventTarget | null;

      if (e.key === "?") {
        if (isTypingTarget(target)) return;
        e.preventDefault();
        onHelp?.();
        return;
      }

      if (e.key === "/" && !isTypingTarget(target)) {
        e.preventDefault();
        if (onSearch) onSearch();
        else focusSearchInput();
        return;
      }

      if (isTypingTarget(target)) return;

      if (e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        onNew?.();
      } else if (e.key === "ArrowLeft") {
        onPrevPage?.();
      } else if (e.key === "ArrowRight") {
        onNextPage?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNew, onSearch, onPrevPage, onNextPage, onHelp]);
}
