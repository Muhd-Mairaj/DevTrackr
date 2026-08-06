import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PAGE_SIZE, useEntries } from "./entries";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useEntries", () => {
  it("maps page to skip and returns the envelope", async () => {
    const { result } = renderHook(() => useEntries("p1", 1), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.items[0]?.description).toBe(
      "Fix migration order",
    );
    expect(PAGE_SIZE).toBe(25);
  });
});
