import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useColumns } from "./columns";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useColumns", () => {
  it("returns the configured columns", async () => {
    const { result } = renderHook(() => useColumns("p1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((c) => c.kind)).toEqual([
      "TIME",
      "DURATION",
      "SOURCE",
      "DESCRIPTION",
    ]);
  });
});
