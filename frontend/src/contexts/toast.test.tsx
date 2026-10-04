import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger({ onAction }: { onAction: () => void }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast("success", "Entry deleted", {
          actionLabel: "Undo",
          durationMs: 8000,
          onAction,
        })
      }
    >
      fire
    </button>
  );
}

function PlainTrigger() {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast("success", "Entry created")}>
      fire plain
    </button>
  );
}

describe("ToastProvider action", () => {
  it("renders the action button and runs onAction on click", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ToastProvider>
        <Trigger onAction={onAction} />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "fire" }));
    const undo = await screen.findByRole("button", { name: "Undo" });
    await user.click(undo);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Entry deleted")).not.toBeInTheDocument();
  });

  it("keeps backward compat: toasts without options render no action", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <PlainTrigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "fire plain" }));
    expect(await screen.findByText("Entry created")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
  });
});
