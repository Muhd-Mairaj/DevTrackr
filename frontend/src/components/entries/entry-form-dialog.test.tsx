import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/contexts/toast";
import { EntryFormDialog } from "./entry-form-dialog";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("EntryFormDialog", () => {
  it("shows validation errors for empty description and end before start", async () => {
    const user = userEvent.setup();
    render(
      <EntryFormDialog
        open
        onOpenChange={() => {}}
        projectId="p1"
        entry={null}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole("button", { name: "Create entry" }));
    expect(
      await screen.findByText("Description is required"),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText("Description"), "Fix ordering");
    await user.type(screen.getByLabelText("Start date"), "2026-08-05");
    await user.type(screen.getByLabelText("Start time"), "10:00");
    await user.type(screen.getByLabelText("End date"), "2026-08-05");
    await user.type(screen.getByLabelText("End time"), "09:00");
    await user.click(screen.getByRole("button", { name: "Create entry" }));
    expect(
      await screen.findByText("End must be after start"),
    ).toBeInTheDocument();
  });

  it("prefills the start with the current time, floored to five minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T03:23:00Z"));
    render(
      <EntryFormDialog
        open
        onOpenChange={() => {}}
        projectId="p1"
        entry={null}
      />,
      { wrapper },
    );
    expect(
      (screen.getByLabelText("Start date") as HTMLInputElement).value,
    ).toBe("2026-08-07");
    expect(
      (screen.getByLabelText("Start time") as HTMLInputElement).value,
    ).toBe("03:20");
    expect((screen.getByLabelText("End date") as HTMLInputElement).value).toBe(
      "",
    );
  });
});
