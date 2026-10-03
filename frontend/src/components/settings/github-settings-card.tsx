import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { GithubMark } from "@/components/github-mark";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/toast";
import { strings } from "@/i18n/strings";
import {
  githubManageUrl,
  integrationKeys,
  startGithubInstall,
  useGithubInstallations,
  useGithubStatus,
} from "@/lib/integrations";
import { repositoryKeys } from "@/lib/repositories";

const SYNCED_KEY = "devtrackr-gh-synced";

function readSyncedTs(): string | null {
  try {
    return localStorage.getItem(SYNCED_KEY);
  } catch {
    return null;
  }
}

export function GithubSettingsCard() {
  const {
    data: installations,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useGithubInstallations();
  const { refetch: refetchStatus } = useGithubStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [syncedTs, setSyncedTs] = useState<string | null>(() => readSyncedTs());
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        refetch(),
        refetchStatus(),
        queryClient.invalidateQueries({ queryKey: repositoryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: integrationKeys.githubStatus,
        }),
      ]);
      const now = new Date().toISOString();
      try {
        localStorage.setItem(SYNCED_KEY, now);
      } catch {
        // storage unavailable; timestamp still shown from query below
      }
      setSyncedTs(now);
      toast("success", strings.integrations.githubSyncNowToast);
    } catch (err) {
      toast("error", (err as Error)?.message ?? strings.error.defaultMessage);
    } finally {
      setSyncing(false);
    }
  };

  const lastSynced =
    syncedTs ?? (dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null);
  const hasInstallations = Boolean(installations && installations.length > 0);

  return (
    <Panel className="mt-4 max-w-xl">
      <PanelHeader>
        <PanelTitle>{strings.settings.githubTitle}</PanelTitle>
        <div className="flex items-center gap-2">
          {!isLoading && !isError && (
            <StatusChip tone={hasInstallations ? "success" : "neutral"}>
              {hasInstallations
                ? strings.projects.active
                : strings.projects.inactive}
            </StatusChip>
          )}
          {!isLoading && !isError && hasInstallations && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={handleSyncNow}
              disabled={syncing}
            >
              <RefreshCw
                className={syncing ? "size-3.5 animate-spin" : "size-3.5"}
                aria-hidden="true"
              />
              {strings.integrations.githubSyncNowButton}
            </Button>
          )}
        </div>
      </PanelHeader>
      <PanelBody>
        {lastSynced && !isLoading && !isError && (
          <p className="mb-3 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase tabular-nums">
            {strings.integrations.githubLastSynced(
              new Date(lastSynced).toLocaleString(),
            )}
          </p>
        )}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs text-muted-foreground">
              {strings.integrations.githubInstallationsError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => refetch()}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {strings.common.retry}
            </Button>
          </div>
        ) : !hasInstallations ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs text-muted-foreground">
              {strings.integrations.githubSetupPrompt}
            </p>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={() => startGithubInstall("/settings")}
            >
              <GithubMark size={14} />
              {strings.integrations.githubInstallButton}
            </Button>
          </div>
        ) : (
          <div>
            <ul className="flex flex-col divide-y divide-border">
              {(installations ?? []).map((installation) => (
                <li
                  key={installation.installation_id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-[26px] shrink-0 items-center justify-center rounded bg-muted text-muted-foreground"
                    >
                      <GithubMark size={14} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {installation.account_login}
                        </span>
                        {installation.suspended_at && (
                          <StatusChip tone="warning">
                            {strings.settings.githubSuspended}
                          </StatusChip>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                        {installation.account_type === "Organization"
                          ? strings.settings.githubAccountTypeOrg
                          : strings.settings.githubAccountTypeUser}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="shrink-0 gap-1.5"
                  >
                    <a
                      href={githubManageUrl(installation)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {strings.settings.githubManageLink}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {strings.settings.githubManageHint}
            </p>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
