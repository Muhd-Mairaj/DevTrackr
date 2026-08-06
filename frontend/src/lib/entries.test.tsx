import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetEntriesStore } from "@/test/mocks/handlers";
import {
  entryKeys,
  PAGE_SIZE,
  useDeleteEntry,
  useEntries,
  useUpdateEntry,
} from "./entries";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  resetEntriesStore();
});

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

describe("useUpdateEntry", () => {
  it("optimistically applies the update and keeps it after success", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result: entries } = renderHook(() => useEntries("p1", 1), {
      wrapper,
    });
    await waitFor(() => expect(entries.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useUpdateEntry("p1"), { wrapper });
    await result.current.mutateAsync({
      id: "00000000-0000-0000-0000-000000000001",
      body: { description: "Rewritten order" },
    });

    const data = queryClient.getQueryData(entryKeys.page("p1", 1)) as {
      items: { description: string }[];
    };
    expect(data.items[0]?.description).toBe("Rewritten order");
  });
});

describe("useDeleteEntry", () => {
  it("removes the entry after a successful delete", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result: entries } = renderHook(() => useEntries("p1", 1), {
      wrapper,
    });
    await waitFor(() => expect(entries.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useDeleteEntry("p1"), { wrapper });
    await result.current.mutateAsync("00000000-0000-0000-0000-000000000001");

    await waitFor(() => {
      const data = queryClient.getQueryData(entryKeys.page("p1", 1)) as {
        items: unknown[];
      };
      expect(data.items).toHaveLength(0);
    });
  });
});
