import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/contexts/toast";
import { ColumnManagerDialog } from "./column-manager-dialog";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe("ColumnManagerDialog", () => {
  it("renders the configured columns with rename inputs", async () => {
    render(
      <ColumnManagerDialog open onOpenChange={() => {}} projectId="p1" />,
      {
        wrapper,
      },
    );
    expect(await screen.findByDisplayValue("Description")).toBeInTheDocument();
  });

  it("shows no remove buttons for builtins and one for a custom", async () => {
    const user = userEvent.setup();
    render(
      <ColumnManagerDialog open onOpenChange={() => {}} projectId="p1" />,
      {
        wrapper,
      },
    );
    await screen.findByDisplayValue("Description");
    // msw returns 4 builtins: none of them are removable
    expect(screen.queryAllByLabelText("Remove column")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Add column" }));
    expect(await screen.findByLabelText("Remove column")).toBeEnabled();
  });

  it("closes after a successful save via PUT", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ColumnManagerDialog open onOpenChange={onOpenChange} projectId="p1" />,
      { wrapper },
    );
    await screen.findByDisplayValue("Description");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    // The msw PUT handler echoes the body; the dialog closes on success.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
