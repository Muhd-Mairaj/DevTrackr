import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { TimeEntryPublic } from "@/client/types.gen";
import { resetEntriesStore } from "@/test/mocks/handlers";
import {
  distinctRecentDescriptions,
  entryKeys,
  PAGE_SIZE,
  useDeleteEntry,
  useEntries,
  useRecentDescriptions,
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

function makeEntry(description: string | null, id: string): TimeEntryPublic {
  return {
    id,
    description,
    start_time: "2026-09-20T09:00:00Z",
    end_time: "2026-09-20T10:00:00Z",
    duration_seconds: 3600,
    project_id: "p1",
    is_active: true,
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
    deleted_at: null,
  };
}

describe("distinctRecentDescriptions", () => {
  it("keeps newest-first order and dedupes case-insensitively", () => {
    const items = [
      makeEntry("Deploy", "1"),
      makeEntry("fix bug", "2"),
      makeEntry("deploy", "3"),
      makeEntry("Code review", "4"),
      makeEntry("FIX BUG", "5"),
    ];
    expect(distinctRecentDescriptions(items)).toEqual([
      "Deploy",
      "fix bug",
      "Code review",
    ]);
  });

  it("drops missing and blank descriptions and trims the rest", () => {
    const items = [
      makeEntry(null, "1"),
      makeEntry("   ", "2"),
      makeEntry("  Write tests  ", "3"),
    ];
    expect(distinctRecentDescriptions(items)).toEqual(["Write tests"]);
  });

  it("respects the limit", () => {
    const items = [
      makeEntry("one", "1"),
      makeEntry("two", "2"),
      makeEntry("three", "3"),
    ];
    expect(distinctRecentDescriptions(items, 2)).toEqual(["one", "two"]);
  });
});

describe("useRecentDescriptions", () => {
  it("returns distinct descriptions from the project's entries", async () => {
    const { result } = renderHook(() => useRecentDescriptions("p1"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(["Fix migration order"]);
  });
});
