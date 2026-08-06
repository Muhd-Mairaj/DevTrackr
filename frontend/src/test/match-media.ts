import { vi } from "vitest";

type ChangeListener = (event: { matches: boolean }) => void;

/**
 * Installs a controllable matchMedia mock for jsdom (which has none).
 * Returns the fake MediaQueryList plus the set of registered change listeners.
 * Fire a listener with `{ matches: boolean }` to simulate an OS theme flip.
 */
export function installMatchMediaMock(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: vi.fn((_type: string, listener: ChangeListener) =>
      listeners.add(listener),
    ),
    removeEventListener: vi.fn((_type: string, listener: ChangeListener) =>
      listeners.delete(listener),
    ),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mql),
  );
  return { mql, listeners };
}
