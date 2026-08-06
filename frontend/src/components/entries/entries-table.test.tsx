import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProjectColumnItem, TimeEntryPublic } from "@/client/types.gen";
import { EntriesTable } from "./entries-table";

const columns: ProjectColumnItem[] = [
  { kind: "TIME", name: "When", builtin: true },
  { kind: "DURATION", name: "Length", builtin: true },
  { kind: "SOURCE", name: "Source", builtin: true },
  { kind: "DESCRIPTION", name: "Details", builtin: true },
  { kind: "CUSTOM", name: "Ticket", builtin: false },
];

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

describe("EntriesTable", () => {
  it("renders the configured columns in order, including renames", () => {
    render(
      <EntriesTable
        columns={columns}
        entries={[entry]}
        page={1}
        total={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfigureColumns={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    const headers = ["When", "Length", "Source", "Details", "Ticket"];
    for (const name of headers) {
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("09:41–11:05")).toBeInTheDocument();
    expect(screen.getByText("01:24")).toBeInTheDocument();
    expect(screen.getByText("Fix migration order")).toBeInTheDocument();
    // custom and source have no data yet: render as dashes
    expect(screen.getAllByText("–").length).toBeGreaterThanOrEqual(2);
  });

  it("calls onEdit and onDelete from the row actions", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <EntriesTable
        columns={columns}
        entries={[entry]}
        page={1}
        total={1}
        onEdit={onEdit}
        onDelete={onDelete}
        onConfigureColumns={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText("Edit entry"));
    expect(onEdit).toHaveBeenCalledWith(entry);
    await user.click(screen.getByLabelText("Delete entry"));
    expect(onDelete).toHaveBeenCalledWith(entry);
  });

  it("calls onConfigureColumns from the header slot", async () => {
    const onConfigure = vi.fn();
    const user = userEvent.setup();
    render(
      <EntriesTable
        columns={columns}
        entries={[entry]}
        page={1}
        total={1}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfigureColumns={onConfigure}
        onPageChange={vi.fn()}
      />,
    );
    await user.click(screen.getByLabelText("Configure columns"));
    expect(onConfigure).toHaveBeenCalledTimes(1);
  });
});
