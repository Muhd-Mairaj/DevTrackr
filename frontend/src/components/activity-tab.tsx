import { ExternalLink } from "lucide-react";
import type { ProjectPublic, TimeEntryPublic } from "@/client/types.gen";
import { GithubMark } from "@/components/github-mark";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelMeta,
  PanelTitle,
} from "@/components/ui/panel";
import { ROW_HOVER } from "@/components/ui/row-hover";
import { strings } from "@/i18n/strings";
import { dayKey, formatDayLabel, groupByDay, startOfDay } from "@/lib/timeline";
import { cn, formatDuration } from "@/lib/utils";

const ACTIVITY_WINDOW_DAYS = 14;

/** The trailing window of local days, oldest first, ending on today. */
function activityWindow(now: Date): Date[] {
  const end = startOfDay(now);
  return Array.from({ length: ACTIVITY_WINDOW_DAYS }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (ACTIVITY_WINDOW_DAYS - 1 - index));
    return date;
  });
}

/**
 * A 14-day readout: one vertical bar per day, scaled to the busiest day in the
 * window. A day with no tracked time keeps a 2px hairline stub so the grid
 * stays legible. Falls back to an honest empty line when nothing was tracked.
 */
function ActivityStrip({ entries }: { entries: TimeEntryPublic[] }) {
  const totals = new Map<string, number>();
  for (const lane of groupByDay(entries)) {
    totals.set(lane.key, lane.totalSeconds);
  }

  const days = activityWindow(new Date());
  const secondsByDay = days.map((date) => totals.get(dayKey(date)) ?? 0);
  const busiest = Math.max(0, ...secondsByDay);

  if (entries.length === 0 || busiest <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {strings.activity.noRecent}
      </p>
    );
  }

  return (
    <ol
      aria-label={strings.activity.recentTitle}
      className="flex list-none items-end gap-1"
    >
      {days.map((date, index) => {
        const seconds = secondsByDay[index];
        const tracked = seconds > 0;
        const tooltip = strings.activity.dayTooltip(
          formatDayLabel(date),
          formatDuration(seconds),
        );
        return (
          <li
            key={dayKey(date)}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <div className="flex h-20 w-full items-end justify-center rounded bg-muted">
              <span
                role="img"
                aria-label={tooltip}
                title={tooltip}
                style={
                  tracked
                    ? { height: `${Math.max((seconds / busiest) * 100, 4)}%` }
                    : undefined
                }
                className={cn(
                  "w-full rounded",
                  tracked ? "bg-signal" : "h-0.5 bg-border",
                )}
              />
            </div>
            <span
              aria-hidden="true"
              className="font-mono text-[11px] text-muted-foreground tabular-nums"
            >
              {String(date.getDate()).padStart(2, "0")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ActivityTab({
  project,
  entries,
}: {
  project: ProjectPublic;
  entries: TimeEntryPublic[];
}) {
  const repos = project.repositories ?? [];

  return (
    <div className="flex flex-col gap-5">
      <section aria-label={strings.activity.title} id="linked-repos">
        <Panel>
          <PanelHeader>
            <PanelTitle>{strings.activity.title}</PanelTitle>
            <PanelMeta>
              {strings.integrations.reposCount(repos.length)}
            </PanelMeta>
          </PanelHeader>
          {repos.length === 0 ? (
            <PanelBody>
              <p className="text-xs text-muted-foreground">
                {strings.activity.noReposDescription}
              </p>
            </PanelBody>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {repos.map((repo) => (
                <li
                  key={repo.github_id}
                  className={cn("flex items-center gap-3 px-5 py-3", ROW_HOVER)}
                >
                  <GithubMark size={14} />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium">
                    {repo.full_name}
                  </span>
                  {repo.url && (
                    <Button
                      asChild
                      variant="ghost"
                      size="icon-xs"
                      className="min-h-11 min-w-11 shrink-0 sm:min-h-0 sm:min-w-0"
                    >
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={strings.integrations.repoOpenLink(
                          repo.full_name,
                        )}
                      >
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <Panel>
        <PanelHeader>
          <PanelTitle>{strings.activity.recentTitle}</PanelTitle>
          <PanelMeta>{strings.activity.last14Days}</PanelMeta>
        </PanelHeader>
        <PanelBody>
          <ActivityStrip entries={entries} />
        </PanelBody>
      </Panel>

      <Panel>
        <PanelBody className="flex flex-col items-start gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight">
              {strings.activity.commitsUnavailableTitle}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {repos.length > 0
                ? strings.activity.commitsUnavailableLinkedDescription
                : strings.activity.commitsUnavailableDescription}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="#linked-repos">{strings.activity.manageRepos}</a>
          </Button>
        </PanelBody>
      </Panel>
    </div>
  );
}
