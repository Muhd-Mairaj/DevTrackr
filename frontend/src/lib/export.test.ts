import { describe, expect, it } from "vitest";
import type { TimeEntryPublic } from "@/client/types.gen";
import { exportEntriesCsv } from "./export";

const base: TimeEntryPublic = {
  id: "abc",
  description: "plain work",
  start_time: "2026-09-20T09:00:00Z",
  end_time: "2026-09-20T10:30:00Z",
  duration_seconds: 5400,
  project_id: "p1",
  is_active: true,
  created_at: "2026-09-20T10:30:00Z",
  updated_at: "2026-09-20T10:30:00Z",
  deleted_at: null,
};

describe("exportEntriesCsv", () => {
  it("writes a header plus one row per entry", () => {
    const running: TimeEntryPublic = {
      ...base,
      id: "run-1",
      description: null,
      end_time: null,
      duration_seconds: null,
    };
    expect(exportEntriesCsv([base, running])).toBe(
      [
        "id,description,start_time,end_time,duration_seconds",
        "abc,plain work,2026-09-20T09:00:00Z,2026-09-20T10:30:00Z,5400",
        "run-1,,2026-09-20T09:00:00Z,,",
      ].join("\n"),
    );
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    const tricky: TimeEntryPublic = {
      ...base,
      id: "x",
      description: 'said "hi", then\nleft',
    };
    expect(exportEntriesCsv([tricky])).toBe(
      [
        "id,description,start_time,end_time,duration_seconds",
        'x,"said ""hi"", then\nleft",2026-09-20T09:00:00Z,2026-09-20T10:30:00Z,5400',
      ].join("\n"),
    );
  });
});
