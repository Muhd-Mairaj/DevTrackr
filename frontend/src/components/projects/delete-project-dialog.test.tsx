import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProjectPublic } from "@/client/types.gen";
import { ToastProvider } from "@/contexts/toast";
import { DeleteProjectDialog } from "./delete-project-dialog";

const project: ProjectPublic = {
  id: "p1",
  name: "Website",
  description: "Marketing site",
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-02T00:00:00Z",
  deleted_at: null,
  user_id: "u1",
  repositories: [],
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe("DeleteProjectDialog", () => {
  it("names the project and entry count in the description", () => {
    render(
      <DeleteProjectDialog
        project={project}
        onOpenChange={() => {}}
        entryCount={3}
      />,
      { wrapper },
    );
    expect(screen.getByText(/Website/)).toBeInTheDocument();
    expect(screen.getByText(/3 entries/)).toBeInTheDocument();
  });

  it("keeps Delete disabled until the project name is typed", async () => {
    const user = userEvent.setup();
    render(<DeleteProjectDialog project={project} onOpenChange={() => {}} />, {
      wrapper,
    });
    const confirm = screen.getByRole("button", { name: "Delete project" });
    expect(confirm).toBeDisabled();

    await user.type(
      screen.getByLabelText("Type the project name to confirm deletion"),
      "Website!",
    );
    expect(confirm).toBeDisabled();

    await user.clear(
      screen.getByLabelText("Type the project name to confirm deletion"),
    );
    await user.type(
      screen.getByLabelText("Type the project name to confirm deletion"),
      "Website",
    );
    expect(confirm).toBeEnabled();
  });

  it("closes when cancelled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <DeleteProjectDialog project={project} onOpenChange={onOpenChange} />,
      { wrapper },
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
