import { useQueries } from "@tanstack/react-query";
import { EntriesService } from "@/client";
import type { ProjectPublic, TimeEntryPublic } from "@/client/types.gen";
import { type EntryPageData, entryKeys, PAGE_SIZE } from "@/lib/entries";
import { startOfDay } from "@/lib/timeline";

/** A time entry annotated with the project it belongs to. */
export interface ConsoleEntry extends TimeEntryPublic {
  projectName: string;
  projectId: string;
}

/**
 * Cap the per-project fan-out so the console stays responsive on accounts with
 * many projects. The rack renders every project; only the recent-activity feed
 * is capped.
 */
const MAX_PROJECTS = 12;

function flatten(
  projects: ProjectPublic[],
  pages: (EntryPageData | undefined)[],
): ConsoleEntry[] {
  const entries: ConsoleEntry[] = [];
  projects.forEach((project, index) => {
    const page = pages[index];
    if (!page) return;
    for (const entry of page.items) {
      entries.push({
        ...entry,
        projectName: project.name,
        projectId: project.id,
      });
    }
  });
  entries.sort(
    (a, b) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
  );
  return entries;
}

/**
 * The console feed: the newest entries across projects, used by the Now,
 * Today, and Recent modules. It fans out one page of entries per project.
 */
export function useConsoleFeed(projects: ProjectPublic[] | undefined) {
  const list = (projects ?? []).slice(0, MAX_PROJECTS);
  const results = useQueries({
    queries: list.map((project) => ({
      queryKey: entryKeys.page(project.id, 1),
      queryFn: async (): Promise<EntryPageData> => {
        const res = await EntriesService.getEntriesForProject({
          path: { id: project.id },
          query: { skip: 0, limit: PAGE_SIZE },
        });
        if (!res.data) throw new Error("No data returned from server");
        return res.data;
      },
      staleTime: 30_000,
    })),
  });

  const entries = flatten(
    list,
    results.map((result) => result.data),
  );
  const running = entries.find((entry) => entry.end_time == null) ?? null;
  const todayStart = startOfDay(new Date()).getTime();
  const today = entries.filter(
    (entry) => new Date(entry.start_time).getTime() >= todayStart,
  );
  const hasData = results.some((result) => result.data !== undefined);

  return {
    entries,
    running,
    today,
    hasData,
    isLoading: list.length > 0 && results.some((r) => r.isLoading),
    isError:
      list.length > 0 && results.length > 0 && results.every((r) => r.isError),
    refetch: () => {
      for (const result of results) void result.refetch();
    },
  };
}

/** Sum of duration_seconds across entries, treating a running entry as now. */
export function totalSeconds(
  entries: TimeEntryPublic[],
  now: Date = new Date(),
): number {
  return entries.reduce((sum, entry) => {
    if (typeof entry.duration_seconds === "number") {
      return sum + entry.duration_seconds;
    }
    if (!entry.end_time) {
      const elapsed =
        (now.getTime() - new Date(entry.start_time).getTime()) / 1000;
      return sum + Math.max(0, Math.floor(elapsed));
    }
    return sum;
  }, 0);
}
