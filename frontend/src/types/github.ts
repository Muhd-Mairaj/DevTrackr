/** Fields extracted from the GitHub /user/repos API response. */
export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
}
