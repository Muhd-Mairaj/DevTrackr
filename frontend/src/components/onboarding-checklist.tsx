import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { strings } from "@/i18n/strings";
import { cn } from "@/lib/utils";

export const ONBOARD_DISMISSED_KEY = "devtrackr-onboard-dismissed";

export function isOnboardingDismissed(): boolean {
  try {
    return localStorage.getItem(ONBOARD_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export interface OnboardingChecklistProps {
  githubDone: boolean;
  projectDone: boolean;
  entryDone: boolean;
  columnsDone: boolean;
  firstProjectId?: string;
  className?: string;
}

// A done step carries a signal check lamp; a pending step shows a muted mono
// step number. No other step decoration.
function StepMarker({ done, step }: { done: boolean; step: number }) {
  if (done) {
    return (
      <span
        aria-hidden="true"
        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal"
      >
        <Check className="size-3" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-4 shrink-0 items-center justify-center font-mono text-[11px] font-medium text-muted-foreground tabular-nums"
    >
      {step}
    </span>
  );
}

const rowClass =
  "flex min-h-[44px] items-center gap-2 rounded px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0";

export function OnboardingChecklist({
  githubDone,
  projectDone,
  entryDone,
  columnsDone,
  firstProjectId,
  className,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(isOnboardingDismissed);
  if (dismissed) return null;

  const doneCount = [githubDone, projectDone, entryDone, columnsDone].filter(
    Boolean,
  ).length;
  const progress = Math.round((doneCount / 4) * 100);

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARD_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable (private mode), so hide for this session only.
    }
    setDismissed(true);
  };

  return (
    <section
      aria-label={strings.onboarding.title}
      className={cn("mb-0", className)}
    >
      <Panel>
        <PanelHeader>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold tracking-tight">
              {strings.onboarding.title}
            </h2>
            <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase tabular-nums">
              {strings.onboarding.progressLabel(doneCount, 4)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {strings.onboarding.dismiss}
          </Button>
        </PanelHeader>
        <PanelBody className="space-y-3">
          <div
            role="progressbar"
            aria-label={strings.onboarding.progressLabel(doneCount, 4)}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={doneCount}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full origin-left rounded-full bg-signal transition-transform duration-150"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <ul className="space-y-1">
            <li>
              <Link to="/settings" className={rowClass}>
                <StepMarker done={githubDone} step={1} />
                <span
                  className={cn(
                    githubDone && "text-muted-foreground line-through",
                  )}
                >
                  {strings.onboarding.steps.github}
                </span>
              </Link>
            </li>
            <li>
              <Link to="/" className={rowClass}>
                <StepMarker done={projectDone} step={2} />
                <span
                  className={cn(
                    projectDone && "text-muted-foreground line-through",
                  )}
                >
                  {strings.onboarding.steps.project}
                </span>
              </Link>
            </li>
            <li>
              {firstProjectId ? (
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: firstProjectId }}
                  search={{ page: 1 }}
                  className={rowClass}
                >
                  <StepMarker done={entryDone} step={3} />
                  <span
                    className={cn(
                      entryDone && "text-muted-foreground line-through",
                    )}
                  >
                    {strings.onboarding.steps.entry}
                  </span>
                </Link>
              ) : (
                <Link to="/" className={rowClass}>
                  <StepMarker done={entryDone} step={3} />
                  <span
                    className={cn(
                      entryDone && "text-muted-foreground line-through",
                    )}
                  >
                    {strings.onboarding.steps.entry}
                  </span>
                </Link>
              )}
            </li>
            <li>
              {firstProjectId ? (
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: firstProjectId }}
                  search={{ page: 1 }}
                  className={rowClass}
                >
                  <StepMarker done={columnsDone} step={4} />
                  <span
                    className={cn(
                      columnsDone && "text-muted-foreground line-through",
                    )}
                  >
                    {strings.onboarding.steps.columns}
                  </span>
                </Link>
              ) : (
                <Link to="/" className={rowClass}>
                  <StepMarker done={columnsDone} step={4} />
                  <span
                    className={cn(
                      columnsDone && "text-muted-foreground line-through",
                    )}
                  >
                    {strings.onboarding.steps.columns}
                  </span>
                </Link>
              )}
            </li>
          </ul>
        </PanelBody>
      </Panel>
    </section>
  );
}
