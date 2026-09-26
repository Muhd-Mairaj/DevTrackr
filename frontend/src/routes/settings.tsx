import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DayStamp } from "@/components/day-stamp";
import { GithubSettingsCard } from "@/components/settings/github-settings-card";
import { PageContainer } from "@/components/ui/page-container";
import { useToast } from "@/contexts/toast";
import { strings } from "@/ii8n/strings";
import { consumeGithubReturn } from "@/lib/github-return";
import { integrationKeys } from "@/lib/integrations";
import { repositoryKeys } from "@/lib/repositories";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${strings.settings.title} · ${strings.common.brand}`;
  }, []);

  // Same ?github_app landing handler as the home route: refresh, drop the
  // param, toast, then navigate back to the stored returnTo (returnTo only).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("github_app");
    if (outcome === null) return;
    queryClient.invalidateQueries({ queryKey: repositoryKeys.all });
    queryClient.invalidateQueries({ queryKey: integrationKeys.githubStatus });
    queryClient.invalidateQueries({
      queryKey: integrationKeys.githubInstallations,
    });
    const stored = consumeGithubReturn();
    window.history.replaceState({}, "", window.location.pathname);

    const outcomeMessages: Record<
      string,
      { variant: "success" | "error"; message: string }
    > = {
      success: {
        variant: "success",
        message: strings.integrations.githubInstalledToast,
      },
      sync_partial: {
        variant: "success",
        message: strings.integrations.githubInstallSyncPartialToast,
      },
      sync_error: {
        variant: "error",
        message: strings.integrations.githubInstallSyncErrorToast,
      },
      unauthorized: {
        variant: "error",
        message: strings.integrations.githubInstallUnauthorizedToast,
      },
      conflict: {
        variant: "error",
        message: strings.integrations.githubInstallConflictToast,
      },
    };
    const msg = outcomeMessages[outcome] ?? {
      variant: "error" as const,
      message: strings.integrations.githubInstallErrorToast,
    };
    toast(msg.variant, msg.message);
    if (stored?.returnTo && stored.returnTo !== window.location.pathname) {
      const [pathname, search] = stored.returnTo.split("?");
      const searchParams = Object.fromEntries(
        new URLSearchParams(search ?? ""),
      );
      navigate({
        to: pathname as "/",
        search: searchParams as never,
      });
    }
  }, [queryClient, toast, navigate]);

  return (
    <PageContainer>
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
    </PageContainer>
  );
}
