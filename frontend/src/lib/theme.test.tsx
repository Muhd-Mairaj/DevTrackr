import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installMatchMediaMock } from "@/test/match-media";
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from "./theme";

function Probe() {
  const { theme, resolvedTheme, cycleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={cycleTheme}>
        cycle
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        light
      </button>
      <button type="button" onClick={() => setTheme("dark")}>
        dark
      </button>
    </div>
  );
}

function renderWithTheme(storedValue?: string) {
  localStorage.clear();
  if (storedValue) localStorage.setItem(THEME_STORAGE_KEY, storedValue);
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("defaults to system and follows the OS preference", () => {
    installMatchMediaMock(true);
    renderWithTheme();

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("uses the stored theme over the OS preference", () => {
    installMatchMediaMock(true);
    renderWithTheme("light");

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("falls back to system for an invalid stored value", () => {
    installMatchMediaMock(false);
    renderWithTheme("purple");

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
  });

  it("persists and applies setTheme", async () => {
    const user = userEvent.setup();
    installMatchMediaMock(false);
    renderWithTheme("light");

    await user.click(screen.getByRole("button", { name: "dark" }));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("cycles light -> system -> dark -> light", async () => {
    const user = userEvent.setup();
    installMatchMediaMock(false);
    renderWithTheme("light");

    await user.click(screen.getByRole("button", { name: "cycle" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "cycle" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "cycle" }));
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("re-resolves live when the OS theme changes in system mode", () => {
    const { listeners } = installMatchMediaMock(true);
    renderWithTheme();

    expect(document.documentElement).toHaveClass("dark");

    act(() => {
      for (const listener of listeners) listener({ matches: false });
    });

    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("ignores OS changes when the user picked a theme manually", () => {
    const { listeners } = installMatchMediaMock(true);
    renderWithTheme("dark");

    act(() => {
      for (const listener of listeners) listener({ matches: false });
    });

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
  });
});
