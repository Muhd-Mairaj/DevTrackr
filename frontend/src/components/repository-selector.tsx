import { AlertCircle, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useGithubRepositories } from "@/lib/integrations";
import { strings } from "@/lib/strings";
import type { GithubRepo } from "@/types/github";

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
  const { data: repos, isLoading, isError, error } = useGithubRepositories();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{strings.integrations.repoSelectorLabel}</Label>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (isError) {
    const isNotConnected =
      (error as { response?: { status?: number } } | null)?.response?.status ===
      404;
    return (
      <div className="space-y-2">
        <Label>{strings.integrations.repoSelectorLabel}</Label>
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground">
          <AlertCircle className="size-3.5 shrink-0 text-destructive" />
          {isNotConnected
            ? strings.integrations.githubNoConnection
            : strings.integrations.githubError}
        </div>
      </div>
    );
  }

  const filtered = (repos ?? []).filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggle = (githubId: number) => {
    if (disabled) return;
    if (selected.includes(githubId)) {
      onChange(selected.filter((id) => id !== githubId));
    } else {
      onChange([...selected, githubId]);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label>{strings.integrations.repoSelectorLabel}</Label>
        <p className="text-xs text-muted-foreground">
          {strings.integrations.repoSelectorDescription}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
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
                key={repo.id}
                repo={repo}
                checked={selected.includes(repo.id)}
                onToggle={() => toggle(repo.id)}
                disabled={disabled}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RepoRow({
  repo,
  checked,
  onToggle,
  disabled,
}: {
  repo: GithubRepo;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <input
        type="checkbox"
        id={`repo-${repo.id}`}
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="size-3.5 shrink-0 accent-primary"
      />
      <label
        htmlFor={`repo-${repo.id}`}
        className="min-w-0 flex-1 cursor-pointer text-xs"
      >
        <span className="block truncate font-medium">{repo.full_name}</span>
        {repo.description && (
          <span className="block truncate text-muted-foreground">
            {repo.description}
          </span>
        )}
      </label>
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={strings.integrations.repoOpenLink(repo.full_name)}
      >
        <ExternalLink className="size-3" />
      </a>
    </li>
  );
}
