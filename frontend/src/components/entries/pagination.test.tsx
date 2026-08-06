import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("shows the page range and total", () => {
    render(
      <Pagination page={2} pageCount={6} total={142} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("26–50 of 142")).toBeInTheDocument();
  });

  it("calls onPageChange for prev, next, and a numbered page", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={2} pageCount={6} total={142} onPageChange={onChange} />,
    );
    await user.click(screen.getByLabelText("Previous page"));
    expect(onChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByLabelText("Next page"));
    expect(onChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole("button", { name: "6" }));
    expect(onChange).toHaveBeenLastCalledWith(6);
  });

  it("disables prev on the first page and next on the last", () => {
    render(
      <Pagination page={1} pageCount={1} total={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });
});

describe("Pagination page windows", () => {
  it("renders two ellipses and the current page in the middle", () => {
    render(
      <Pagination page={5} pageCount={12} total={300} onPageChange={vi.fn()} />,
    );
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("clamps the window to the start", () => {
    render(
      <Pagination page={2} pageCount={12} total={300} onPageChange={vi.fn()} />,
    );
    expect(screen.getAllByText("…")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
  });

  it("clamps the window to the end", () => {
    render(
      <Pagination
        page={11}
        pageCount={12}
        total={300}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("…")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "8" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });
});
