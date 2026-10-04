import { AlertCircle, ExternalLink, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { RepositoryPublic } from "@/client/types.gen";
import { GithubMark } from "@/components/github-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { strings } from "@/i18n/strings";
import { startGithubInstall } from "@/lib/integrations";
import { useRepositories } from "@/lib/repositories";

interface RepositorySelectorProps {
  selected: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function RepositorySelector({
  selected,
  onChange,
  disabled = false,
}: RepositorySelectorProps) {
  const { data: repos, isLoading, isError, error, refetch } = useRepositories();
  const [search, setSearch] = useState("");
  const reposErrorStatus = isError
    ? (error as { response?: { status?: number } } | null)?.response?.status
    : undefined;
  const filtered = useMemo(
    () =>
      (repos ?? []).filter(
        (r) =>
          r.full_name.toLowerCase().includes(search.toLowerCase()) ||
          r.repo_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [repos, search],
  );

  if (isLoading) {
    return (
      <div className="min-w-0 space-y-2">
        <Label>{strings.integrations.repoSelectorLabel}</Label>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (isError) {
    // 428 covers both missing requisites (account not linked, app not
    // installed): the install flow routes through OAuth when the account is
    // missing, so one prompt and one CTA cover both. A state to act on, not
    // an error, so no destructive styling.
    const isSetupRequired = reposErrorStatus === 428;
    if (isSetupRequired) {
      return (
        <div className="min-w-0 space-y-2">
          <Label>{strings.integrations.repoSelectorLabel}</Label>
          <div className="flex flex-col items-start gap-2.5 rounded-md border bg-card px-3 py-3">
            <p className="text-xs text-muted-foreground">
              {strings.integrations.githubSetupPrompt}
            </p>
            <Button
              id="install-github-picker-btn"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                startGithubInstall(
                  `${window.location.pathname}${window.location.search}`,
                )
              }
            >
              <GithubMark />
              {strings.integrations.githubInstallButton}
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-w-0 space-y-2">
        <Label>{strings.integrations.repoSelectorLabel}</Label>
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle
            aria-hidden="true"
            className="size-3.5 shrink-0 text-destructive"
          />
          {strings.integrations.githubError}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 gap-1 px-2 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw aria-hidden="true" className="size-3" />
            {strings.common.retry}
          </Button>
        </div>
      </div>
    );
  }

  const toggle = (githubId: number) => {
    if (disabled) return;
    if (selected.includes(githubId)) {
      onChange(selected.filter((id) => id !== githubId));
    } else {
      onChange([...selected, githubId]);
    }
  };

  return (
    <fieldset className="min-w-0 space-y-2">
      <div>
        <legend className="flex items-center gap-2 text-xs leading-none font-semibold select-none">
          {strings.integrations.repoSelectorLabel}
        </legend>
        <p className="mt-1 text-xs text-muted-foreground">
          {strings.integrations.repoSelectorDescription}
        </p>
      </div>

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor="repo-search" className="sr-only">
          {strings.integrations.repoSearchPlaceholder}
        </label>
        <Input
          id="repo-search"
          type="search"
          placeholder={strings.integrations.repoSearchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          disabled={disabled}
        />
      </div>

      <div className="max-h-48 overflow-y-auto rounded-md border">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            {strings.integrations.noReposFound}
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((repo) => (
              <RepoRow
                key={repo.github_id}
                repo={repo}
                checked={selected.includes(repo.github_id)}
                onToggle={() => toggle(repo.github_id)}
                disabled={disabled}
              />
            ))}
          </ul>
        )}
      </div>
    </fieldset>
  );
}

function RepoRow({
  repo,
  checked,
  onToggle,
  disabled,
}: {
  repo: RepositoryPublic;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <input
        type="checkbox"
        id={`repo-${repo.github_id}`}
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="size-5 shrink-0 accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      />
      <label
        htmlFor={`repo-${repo.github_id}`}
        className="min-w-0 flex-1 cursor-pointer text-xs"
      >
        <span className="block truncate font-medium">{repo.full_name}</span>
        {repo.description && (
          <span className="block truncate text-muted-foreground">
            {repo.description}
          </span>
        )}
      </label>
      {repo.url && (
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={strings.integrations.repoOpenLink(repo.full_name)}
        >
          <ExternalLink aria-hidden="true" className="size-3" />
        </a>
      )}
    </li>
  );
}
