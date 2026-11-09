import { Loader2 } from "lucide-react";
import { GithubMark } from "@/components/github-mark";
import { Button } from "@/components/ui/button";
import { strings } from "@/i18n/strings";

interface GitHubButtonProps {
  disabled?: boolean;
}

export function GitHubButton({ disabled = false }: GitHubButtonProps) {
  return (
    <Button
      id="github-login-btn"
      type="button"
      variant="secondary"
      className="w-full gap-2"
      disabled={disabled}
      onClick={() => {
        window.location.href = "/api/auth/github/authorize";
      }}
    >
      {disabled ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GithubMark size={16} />
      )}
      {strings.login.continueWithGithub}
    </Button>
  );
}
