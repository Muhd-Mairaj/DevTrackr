import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TimeEntryPublic } from "@/client/types.gen";
import { ToastProvider } from "@/contexts/toast";
import { DeleteEntryDialog } from "./delete-entry-dialog";

const entry: TimeEntryPublic = {
  id: "e1",
  description: "Fix migration order",
  start_time: "2026-08-05T09:41:00Z",
  end_time: "2026-08-05T11:05:00Z",
  duration_seconds: 5040,
  project_id: "p1",
  is_active: true,
  created_at: "2026-08-05T09:41:00Z",
  updated_at: "2026-08-05T09:41:00Z",
  deleted_at: null,
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe("DeleteEntryDialog", () => {
  it("interpolates the entry description, date, and duration", () => {
    render(
      <DeleteEntryDialog
        open
        onOpenChange={() => {}}
        projectId="p1"
        entry={entry}
      />,
      { wrapper },
    );
    expect(screen.getByText(/Fix migration order/)).toBeInTheDocument();
    expect(screen.getByText(/Duration 01:24/)).toBeInTheDocument();
  });

  it("falls back to the untitled label when the entry has no description", () => {
    render(
      <DeleteEntryDialog
        open
        onOpenChange={() => {}}
        projectId="p1"
        entry={{ ...entry, description: null }}
      />,
      { wrapper },
    );
    expect(screen.getByText(/Untitled entry/)).toBeInTheDocument();
  });

  it("closes without deleting when cancelled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <DeleteEntryDialog
        open
        onOpenChange={onOpenChange}
        projectId="p1"
        entry={entry}
      />,
      { wrapper },
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
