import { useQuery } from "@tanstack/react-query";
import { RepositoriesService } from "@/client";
import type { RepositoryPublic } from "@/client/types.gen";

export const repositoryKeys = {
  all: ["repositories"] as const,
};

export function useRepositories() {
  return useQuery({
    queryKey: repositoryKeys.all,
    queryFn: async (): Promise<RepositoryPublic[]> => {
      const res = await RepositoriesService.getRepositories();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
