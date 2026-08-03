import { useQuery } from "@tanstack/react-query";
import { IntegrationsService } from "@/client";
import type {
  GithubInstallationPublic,
  GithubStatus,
} from "@/client/types.gen";

const GITHUB_INSTALL_URL = "/api/integrations/github/install";

export const integrationKeys = {
  githubStatus: ["integrations", "github", "status"] as const,
  githubInstallations: ["integrations", "github", "installations"] as const,
};

export function githubManageUrl(
  installation: GithubInstallationPublic,
): string {
  // User and org installs have different settings paths on GitHub; both
  // pages carry the repo access toggles and the uninstall button.
  const base =
    installation.account_type === "Organization"
      ? `https://github.com/organizations/${installation.account_login}/settings/installations`
      : "https://github.com/settings/installations";
  return `${base}/${installation.installation_id}`;
}

export function useGithubInstallations() {
  return useQuery({
    queryKey: integrationKeys.githubInstallations,
    queryFn: async (): Promise<GithubInstallationPublic[]> => {
      const res = await IntegrationsService.githubInstallations();
      if (!res.data) throw new Error("No data returned from server");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
