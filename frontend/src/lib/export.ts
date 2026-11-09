import type { TimeEntryPublic } from "@/client/types.gen";

function escapeCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return escapeCell(String(value));
}

/**
 * Serializes entries to CSV (RFC 4180 quoting). Pure: no DOM access,
 * so it is unit-testable in jsdom or node.
 */
export function exportEntriesCsv(entries: TimeEntryPublic[]): string {
  const header = "id,description,start_time,end_time,duration_seconds";
  const rows = entries.map((e) =>
    [
      toCell(e.id),
      toCell(e.description),
      toCell(e.start_time),
      toCell(e.end_time),
      toCell(e.duration_seconds),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

/** Triggers a browser download of CSV text via a Blob URL. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
