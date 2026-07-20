import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PingStatus } from "./PingStatus";

describe("PingStatus component with MSW", () => {
  it("fetches ping response via OpenAPI client and renders mocked data", async () => {
    render(<PingStatus />);

    expect(screen.getByTestId("ping-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("ping-status")).toHaveTextContent("ok");
      expect(screen.getByTestId("ping-message")).toHaveTextContent("pong");
    });
  });
});
