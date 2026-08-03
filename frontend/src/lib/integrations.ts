import { useQuery } from "@tanstack/react-query";
import { IntegrationsService } from "@/client";
import type { GithubStatus } from "@/client/types.gen";

const GITHUB_INSTALL_URL = "/api/integrations/github/install";

export const integrationKeys = {
  githubStatus: ["integrations", "github", "status"] as const,
};

export function startGithubInstall() {
  // The endpoint 302s to GitHub; setup-callback bounces back to the app
  // with ?github_app=<outcome>.
  window.location.href = GITHUB_INSTALL_URL;
}

export function useGithubStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: integrationKeys.githubStatus,
    queryFn: async (): Promise<GithubStatus> => {
      const res = await IntegrationsService.githubStatus();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    staleTime: 60 * 1000,
    enabled: options?.enabled,
  });
}
