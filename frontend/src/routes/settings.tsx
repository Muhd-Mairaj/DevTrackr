import { createFileRoute } from "@tanstack/react-router";
import { DayStamp } from "@/components/day-stamp";
import { GithubSettingsCard } from "@/components/settings/github-settings-card";
import { strings } from "@/ii8n/strings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DayStamp date={new Date()} />
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {strings.settings.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {strings.settings.subtitle}
        </p>
      </div>

      <GithubSettingsCard />
    </div>
  );
}
