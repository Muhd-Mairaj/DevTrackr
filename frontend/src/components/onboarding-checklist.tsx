import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";
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

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
  ) : (
    <Circle className="size-4 text-muted-foreground" aria-hidden="true" />
  );
}

const rowClass =
  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring";

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

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARD_DISMISSED_KEY, "1");
    } catch {
      // Storage unavailable (private mode) — hide for this session only.
    }
    setDismissed(true);
  };

  return (
    <section
      aria-label={strings.onboarding.title}
      className={cn(
        "mb-6 rounded-md border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{strings.onboarding.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {strings.onboarding.progressLabel(doneCount, 4)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={dismiss}>
          {strings.onboarding.dismiss}
        </Button>
      </div>
      <ul className="mt-3 space-y-1">
        <li>
          <Link to="/settings" className={rowClass}>
            <StepIcon done={githubDone} />
            <span
              className={cn(githubDone && "text-muted-foreground line-through")}
            >
              {strings.onboarding.steps.github}
            </span>
          </Link>
        </li>
        <li>
          <Link to="/" className={rowClass}>
            <StepIcon done={projectDone} />
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
              <StepIcon done={entryDone} />
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
              <StepIcon done={entryDone} />
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
              <StepIcon done={columnsDone} />
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
              <StepIcon done={columnsDone} />
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
    </section>
  );
}
