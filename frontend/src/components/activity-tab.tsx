import { ExternalLink } from "lucide-react";
import type { ProjectPublic } from "@/client/types.gen";
import { GithubMark } from "@/components/github-mark";
import { EmptyState } from "@/components/projects/query-state";
import { Button } from "@/components/ui/button";
import { strings } from "@/ii8n/strings";

export function ActivityTab({ project }: { project: ProjectPublic }) {
  const repos = project.repositories ?? [];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label={strings.activity.title} id="linked-repos">
        <h2 className="text-sm font-semibold">{strings.activity.title}</h2>
        {repos.length === 0 ? (
          <div className="mt-1 flex flex-col items-start gap-2">
            <p className="text-xs text-muted-foreground">
              {strings.activity.noReposDescription}
            </p>
          </div>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {repos.map((repo) => (
              <li
                key={repo.github_id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <GithubMark size={14} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {repo.full_name}
                </span>
                {repo.url && (
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={strings.integrations.repoOpenLink(
                      repo.full_name,
                    )}
                  >
                    <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <EmptyState
        title={strings.activity.commitsUnavailableTitle}
        description={strings.activity.commitsUnavailableDescription}
        action={
          repos.length > 0 ? undefined : (
            <Button variant="outline" size="sm" asChild>
              <a href="#linked-repos">{strings.activity.manageRepos}</a>
            </Button>
          )
        }
      />
    </div>
  );
}
