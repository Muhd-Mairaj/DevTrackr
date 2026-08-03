import { useQuery } from "@tanstack/react-query";
import { RepositoriesService } from "@/client";
import type { RepositoryPublic } from "@/client/types.gen";

export const integrationKeys = {
  githubRepos: ["integrations", "github", "repositories"] as const,
};

export function useGithubRepositories() {
  return useQuery({
    queryKey: integrationKeys.githubRepos,
    queryFn: async (): Promise<RepositoryPublic[]> => {
      const res = await RepositoriesService.getRepositories();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
