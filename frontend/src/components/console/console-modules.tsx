import { Link } from "@tanstack/react-router";
import { Pause } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectPublic, TimeEntryPublic } from "@/client/types.gen";
import { TimeLane } from "@/components/entries/time-lane";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelMeta,
  PanelTitle,
} from "@/components/ui/panel";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { type ConsoleEntry, totalSeconds } from "@/lib/console";
import { usePauseEntry } from "@/lib/entries";
import { cn, formatDuration, formatTimeRange } from "@/lib/utils";

function useTicker(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function LiveRow({ running }: { running: ConsoleEntry }) {
  const { pause, isPausing } = usePauseEntry(running.projectId);
  const { toast } = useToast();
  const now = useTicker();
  const elapsed = Math.max(
    0,
    Math.floor((now.getTime() - new Date(running.start_time).getTime()) / 1000),
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-2 size-2 shrink-0 rounded-full bg-signal live-pulse"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold tracking-tight">
            {running.projectName}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {running.description ?? strings.entries.untitledEntry}
          </p>
          <p className="mt-1.5 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase tabular-nums">
            {strings.console.runningIn} ·{" "}
            {formatTimeRange(running.start_time, null)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-3xl leading-none font-medium tabular-nums">
            {formatDuration(elapsed)}
          </div>
          <div className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {strings.console.elapsed}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
          disabled={isPausing || !running.id}
          onClick={() => {
            if (!running.id) return;
            pause(running.id, {
              onSuccess: () => toast("success", strings.entries.updatedToast),
              onError: (error) => toast("error", error.message),
            });
          }}
        >
          <Pause className="size-3.5" aria-hidden="true" />
          {strings.console.pauseSession}
        </Button>
      </div>
    </div>
  );
}

function IdleRow({
  firstProjectId,
  onNewProject,
}: {
  firstProjectId?: string;
  onNewProject: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">
          {strings.console.noSessionTitle}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {strings.console.noSessionDescription}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {firstProjectId && (
          <Button size="sm" asChild>
            <Link
              to="/projects/$projectId"
              params={{ projectId: firstProjectId }}
              search={{ page: 1 }}
            >
              {strings.console.openProject}
            </Link>
          </Button>
        )}
        {!firstProjectId && (
          <Button size="sm" onClick={onNewProject}>
            {strings.projects.newProject}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The day document: the running session and today's lane on one surface. This
 * is the working hero of the Overview, not a dashboard tile.
 */
export function TodaySection({
  running,
  today,
  firstProjectId,
  onNewProject,
}: {
  running: ConsoleEntry | null;
  today: TimeEntryPublic[];
  firstProjectId?: string;
  onNewProject: () => void;
}) {
  const total = totalSeconds(today);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{strings.console.todayTitle}</PanelTitle>
        <PanelMeta>{formatDuration(total)}</PanelMeta>
      </PanelHeader>
      <PanelBody className="flex flex-col gap-5">
        {running ? (
          <LiveRow running={running} />
        ) : (
          <IdleRow
            firstProjectId={firstProjectId}
            onNewProject={onNewProject}
          />
        )}
        <div className="rule" aria-hidden="true" />
        <TimeLane entries={today} emptyTitle={strings.console.todayEmpty} />
      </PanelBody>
    </Panel>
  );
}

/** A bare three-cell readout. No card: the numbers are the surface. */
export function StatsStrip({
  projects,
  todaySeconds,
  activeCount,
}: {
  projects: ProjectPublic[];
  todaySeconds: number;
  activeCount: number;
}) {
  const cells = [
    { value: String(projects.length), label: strings.projects.totalLabel },
    { value: String(activeCount), label: strings.projects.activeLabel },
    { value: formatDuration(todaySeconds), label: strings.console.todayTitle },
  ];
  return (
    <dl className="grid grid-cols-1 border-y border-border sm:grid-cols-3">
      {cells.map((cell, index) => (
        <div
          key={cell.label}
          className={cn(
            "px-1 py-5 sm:px-6",
            index > 0 && "border-t border-border sm:border-t-0 sm:border-l",
            index === 0 && "sm:pl-0",
          )}
        >
          <dd className="font-mono text-3xl font-medium tabular-nums">
            {cell.value}
          </dd>
          <dt className="mt-1.5 font-mono text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {cell.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/** The newest entries across projects, as a ruled list. */
export function RecentList({ entries }: { entries: ConsoleEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {strings.console.recentEmpty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {entries.map((entry) => (
        <li key={entry.id ?? entry.start_time}>
          <Link
            to="/projects/$projectId"
            params={{ projectId: entry.projectId }}
            search={{ page: 1 }}
            className="flex flex-col gap-1 px-5 py-3 outline-none transition-colors hover:bg-foreground/[0.035] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {entry.description ?? strings.entries.untitledEntry}
              </span>
              {entry.end_time == null ? (
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full bg-signal live-pulse"
                />
              ) : (
                <span className="shrink-0 font-mono text-xs tabular-nums">
                  {formatDuration(entry.duration_seconds)}
                </span>
              )}
            </span>
            <span className="truncate font-mono text-[11px] tracking-[0.02em] text-muted-foreground tabular-nums">
              {formatTimeRange(entry.start_time, entry.end_time)} ·{" "}
              {entry.projectName}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
