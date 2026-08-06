import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY, ThemeProvider } from "@/contexts/theme";
import { installMatchMediaMock } from "@/test/match-media";
import { ThemeToggle } from "./theme-toggle";

function renderWithTheme(storedValue?: string) {
  localStorage.clear();
  if (storedValue) localStorage.setItem(THEME_STORAGE_KEY, storedValue);
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  vi.unstubAllGlobals();
});

describe("ThemeToggle", () => {
  it("defaults to system and labels the next state", () => {
    installMatchMediaMock(false);
    renderWithTheme();

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("cycles through the states on click", async () => {
    const user = userEvent.setup();
    installMatchMediaMock(false);
    renderWithTheme("light");

    const button = screen.getByRole("button", {
      name: "Switch to system theme",
    });

    await user.click(button);
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");

    await user.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(
      screen.getByRole("button", { name: "Switch to system theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("respects a stored dark choice", () => {
    installMatchMediaMock(false);
    renderWithTheme("dark");

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });
});
