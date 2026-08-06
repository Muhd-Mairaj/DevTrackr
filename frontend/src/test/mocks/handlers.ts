import { HttpResponse, http } from "msw";

export const handlers = [
  http.get("*/api/utils/ping", () => {
    return HttpResponse.json({ status: "ok", message: "pong" });
  }),
  http.get("*/api/projects/:id/entries", ({ request }) => {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get("skip") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 25);
    const all = [
      {
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
      },
    ];
    const items = all.slice(skip, skip + limit);
    return HttpResponse.json({ items, total: all.length });
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
