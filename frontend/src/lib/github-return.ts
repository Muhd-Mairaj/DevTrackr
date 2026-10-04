export interface GithubReturnState {
  returnTo: string;
  draftKey?: string;
  draft?: unknown;
  ts: number;
}

const STORAGE_KEY = "devtrackr-gh-return";

function isValidReturnTo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  );
}

export function saveGithubReturn(state: {
  returnTo: string;
  draftKey?: string;
  draft?: unknown;
}): void {
  try {
    if (!isValidReturnTo(state.returnTo)) return;
    const payload: GithubReturnState = { ...state, ts: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage unavailable (private mode); install flow still works,
    // just without return-to restoration.
  }
}

export function consumeGithubReturn(): GithubReturnState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<GithubReturnState>;
    if (!isValidReturnTo(parsed.returnTo)) return null;
    return {
      returnTo: parsed.returnTo,
      draftKey:
        typeof parsed.draftKey === "string" ? parsed.draftKey : undefined,
      draft: parsed.draft,
      ts: typeof parsed.ts === "number" ? parsed.ts : Date.now(),
    };
  } catch {
    return null;
  }
}
