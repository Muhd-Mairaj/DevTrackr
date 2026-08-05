import { ExternalLink, RefreshCw } from "lucide-react";
import { GithubMark } from "@/components/github-mark";
import { StatusChip } from "@/components/status-chip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  githubManageUrl,
  startGithubInstall,
  useGithubInstallations,
} from "@/lib/integrations";
import { strings } from "@/lib/strings";

export function GithubSettingsCard() {
  const {
    data: installations,
    isLoading,
    isError,
    refetch,
  } = useGithubInstallations();

  return (
    <section className="mt-4 max-w-xl rounded-md border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">{strings.settings.githubTitle}</h2>
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-start gap-2.5">
            <p className="text-xs text-muted-foreground">
              {strings.integrations.githubInstallationsError}
            </p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-3.5" />
              {strings.common.retry}
            </Button>
          </div>
        ) : !installations || installations.length === 0 ? (
          <div className="flex flex-col items-start gap-2.5">
            <p className="text-xs text-muted-foreground">
              {strings.integrations.githubSetupPrompt}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={startGithubInstall}
            >
              <GithubMark />
              {strings.integrations.githubInstallButton}
            </Button>
          </div>
        ) : (
          <div>
            <ul className="flex flex-col gap-3">
              {installations.map((installation) => (
                <li
                  key={installation.installation_id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <GithubMark size={16} />
                      <span className="truncate text-sm font-medium">
                        {installation.account_login}
                      </span>
                      {installation.suspended_at && (
                        <StatusChip tone="warning">
                          {strings.settings.githubSuspended}
                        </StatusChip>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {installation.account_type === "Organization"
                        ? strings.settings.githubAccountTypeOrg
                        : strings.settings.githubAccountTypeUser}
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <a
                      href={githubManageUrl(installation)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {strings.settings.githubManageLink}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              {strings.settings.githubManageHint}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
