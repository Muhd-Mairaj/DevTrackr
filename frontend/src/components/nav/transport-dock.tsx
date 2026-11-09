import { Link } from "@tanstack/react-router";
import { Pause } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import { type ConsoleEntry, useConsoleFeed } from "@/lib/console";
import { usePauseEntry } from "@/lib/entries";
import { useProjects } from "@/lib/projects";
import { formatDuration, formatTimeRange } from "@/lib/utils";

function useTicker(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function RunningTransport({ running }: { running: ConsoleEntry }) {
  const { pause, isPausing } = usePauseEntry(running.projectId);
  const { toast } = useToast();
  const now = useTicker();
  const elapsed = Math.max(
    0,
    Math.floor((now.getTime() - new Date(running.start_time).getTime()) / 1000),
  );

  return (
    <>
      <span className="flex shrink-0 items-center gap-2">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-signal live-pulse"
        />
        <span className="sr-only">{strings.entries.runningLabel}</span>
        <span className="hidden font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase sm:inline">
          {strings.entries.runningLabel}
        </span>
      </span>

      <Link
        to="/projects/$projectId"
        params={{ projectId: running.projectId }}
        search={{ page: 1 }}
        className="flex min-w-0 flex-1 items-baseline gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <span className="truncate text-sm font-semibold">
          {running.projectName}
        </span>
        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
          {running.description ?? strings.entries.untitledEntry}
        </span>
      </Link>

      <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums md:inline">
        {formatTimeRange(running.start_time, running.end_time)}
      </span>
      <span className="shrink-0 font-mono text-base font-medium tabular-nums">
        {formatDuration(elapsed)}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"
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
        <span className="hidden sm:inline">{strings.entries.pauseButton}</span>
      </Button>
    </>
  );
}

function IdleTransport() {
  return (
    <>
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full border border-edge"
      />
      <span className="truncate text-sm text-muted-foreground">
        {strings.console.dockIdle}
      </span>
      <Link
        to="/"
        className="ml-auto shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {strings.nav.console}
      </Link>
    </>
  );
}

/**
 * The transport dock: the running session, docked at the bottom of every
 * authenticated page. A live timer should not need a page to be open.
 */
export function TransportDock() {
  const { data: projects } = useProjects();
  const { running } = useConsoleFeed(projects);

  return (
    <div
      data-slot="transport-dock"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-md"
    >
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-3 px-5 sm:px-8 lg:px-10">
        {running ? <RunningTransport running={running} /> : <IdleTransport />}
      </div>
    </div>
  );
}
