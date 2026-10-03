import { useNavigate } from "@tanstack/react-router";

/**
 * An in-app destination it is safe to navigate to after login. Rejects
 * protocol-relative URLs ("//evil.example") so the `next` query parameter
 * cannot turn a re-login into an open redirect.
 */
export function resolvePostLoginTarget(raw: string | null | undefined): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/";
}

/** The destination the user was headed to before being sent to /login. */
function readPostLoginTarget(): string {
  return resolvePostLoginTarget(
    new URLSearchParams(window.location.search).get("next"),
  );
}

/**
 * Returns a callback that navigates to the remembered destination, or home.
 * Shared by the login and register forms so both resume the same way.
 */
export function usePostLoginRedirect(): () => void {
  const navigate = useNavigate();
  return () => {
    const [pathname, search] = readPostLoginTarget().split("?");
    navigate({
      to: pathname as "/",
      search: Object.fromEntries(new URLSearchParams(search ?? "")) as never,
    });
  };
}
