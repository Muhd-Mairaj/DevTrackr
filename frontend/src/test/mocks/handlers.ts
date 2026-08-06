import { HttpResponse, http } from "msw";

const seedEntry = {
  id: "00000000-0000-0000-0000-000000000001",
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

// Mutable so mutation handlers can change it and tests can reset it.
let entriesStore: Record<string, unknown>[] = [seedEntry];

export function resetEntriesStore() {
  entriesStore = [seedEntry];
}

export const handlers = [
  http.get("*/api/utils/ping", () => {
    return HttpResponse.json({ status: "ok", message: "pong" });
  }),
  http.get("*/api/projects/:id/entries", ({ request }) => {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get("skip") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 25);
    const items = entriesStore.slice(skip, skip + limit);
    return HttpResponse.json({ items, total: entriesStore.length });
  }),
  http.patch("*/api/projects/:id/entries/:entryId", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const entryId = request.url.split("/").pop();
    const index = entriesStore.findIndex((e) => e.id === entryId);
    const updated = { ...entriesStore[index], ...body };
    if (index >= 0) entriesStore[index] = updated;
    return HttpResponse.json(updated);
  }),
  http.delete("*/api/projects/:id/entries/:entryId", ({ request }) => {
    const entryId = request.url.split("/").pop();
    const entry = entriesStore.find((e) => e.id === entryId);
    entriesStore = entriesStore.filter((e) => e.id !== entryId);
    return HttpResponse.json(entry);
  }),
  http.get("*/api/projects/:id/columns", () => {
    return HttpResponse.json([
      { kind: "TIME", name: "Time", builtin: true },
      { kind: "DURATION", name: "Duration", builtin: true },
      { kind: "SOURCE", name: "Source", builtin: true },
      { kind: "DESCRIPTION", name: "Description", builtin: true },
    ]);
  }),
  http.put("*/api/projects/:id/columns", async ({ request }) => {
    const body = (await request.json()) as { kind: string; name: string }[];
    return HttpResponse.json(
      body.map((c) => ({ ...c, builtin: c.kind !== "CUSTOM" })),
    );
  }),
];
