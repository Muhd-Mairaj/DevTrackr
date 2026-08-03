import { useQuery } from "@tanstack/react-query";
import { IntegrationsService } from "@/client";
import type { GithubRepo } from "@/types/github";

export const integrationKeys = {
  githubRepos: ["integrations", "github", "repositories"] as const,
};

export function useGithubRepositories() {
  return useQuery({
    queryKey: integrationKeys.githubRepos,
    queryFn: async (): Promise<GithubRepo[]> => {
      const res = await IntegrationsService.getGithubRepositories();
      if (!res.data) throw new Error("No data returned from server");
      return res.data as GithubRepo[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
