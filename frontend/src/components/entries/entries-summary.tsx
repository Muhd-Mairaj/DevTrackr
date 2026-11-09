import { useMemo } from "react";
import type { TimeEntryPublic } from "@/client/types.gen";
import { Panel, PanelBody } from "@/components/ui/panel";
import { strings } from "@/i18n/strings";
import { formatDuration } from "@/lib/utils";

interface EntriesSummaryProps {
  /** Entries loaded on the current page (may be client-side filtered). */
  entries: TimeEntryPublic[];
  /** Server-side total entry count across all pages. */
  total: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const labelClass =
  "mt-1.5 font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase";
const numberClass = "font-mono text-2xl font-medium tabular-nums";

export function EntriesSummary({ entries, total }: EntriesSummaryProps) {
  const { totalSeconds, weekSeconds } = useMemo(() => {
    const timed = entries.filter(
      (e) => typeof e.duration_seconds === "number" && e.duration_seconds > 0,
    );
    const totalSeconds = timed.reduce(
      (sum, e) => sum + (e.duration_seconds ?? 0),
      0,
    );
    const weekStart = startOfDay(new Date()).getTime() - 6 * DAY_MS;
    const weekSeconds = timed
      .filter((e) => new Date(e.start_time).getTime() >= weekStart)
      .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);
    return { totalSeconds, weekSeconds };
  }, [entries]);

  return (
    <section aria-label={strings.entries.summaryLabel}>
      <Panel>
        <PanelBody className="grid grid-cols-1 p-0 sm:grid-cols-3">
          <div className="px-5 py-4">
            <div className={numberClass}>{formatDuration(totalSeconds)}</div>
            <div className={labelClass}>{strings.entries.totalHours}</div>
          </div>
          <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:border-l">
            <div className={numberClass}>{formatDuration(weekSeconds)}</div>
            <div className={labelClass}>{strings.entries.weekHours}</div>
          </div>
          <div className="border-t border-border px-5 py-4 sm:border-t-0 sm:border-l">
            <div className={numberClass}>{total}</div>
            <div className={labelClass}>{strings.entries.entryCountLabel}</div>
          </div>
        </PanelBody>
      </Panel>
    </section>
  );
}
