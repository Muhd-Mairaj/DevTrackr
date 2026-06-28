import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const inputClass =
  "h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

// Bare-bones auth controls for manual testing. Design is owned elsewhere.
function HomeComponent() {
  const [status, setStatus] = useState("checking…");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isAuthed = status.startsWith("logged in");

  // Probe the current session so we can see whether login/logout worked.
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((user) => setStatus(`logged in as ${user.email}`))
      .catch(() => setStatus("not logged in"));
  }, []);

  // GitHub OAuth login. Same-tab navigation so the session cookie round-trips.
  const githubLogin = () => {
    window.location.href = "/api/auth/github/authorize";
  };

  // Email/password login. Sets the auth cookies on success.
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setStatus(`login failed (${res.status})`);
    }
  };

  // Create an email/password user (needs username too). Logs in on success.
  const register = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setStatus(`register failed (${res.status})`);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-sm">
      <p className="mb-3 rounded-md border border-dashed px-3 py-2 text-center text-xs text-muted-foreground">
        ⚠️ Temporary Auth and GitHub flow test page.
      </p>
      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight">DevTrackr</h1>
        <div className="mt-1 mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={`size-1.5 shrink-0 rounded-full ${
              isAuthed ? "bg-emerald-500" : "bg-muted-foreground/40"
            }`}
          />
          <span className="truncate">{status}</span>
        </div>

        <form onSubmit={login} className="flex flex-col gap-2.5">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="username (register only)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <div className="mt-1 flex gap-2">
            <Button type="submit" className="flex-1">
              Login
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={register}
            >
              Register
            </Button>
          </div>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button onClick={githubLogin} variant="outline" className="w-full">
          Login with GitHub
        </Button>

        <div className="mt-4 flex items-center justify-between text-sm">
          {/* Go through the backend so it sets the CSRF `state` before
              redirecting to GitHub's install page. Must be same-tab (no
              target=_blank) so the session cookie round-trips. */}
          <a
            href="/api/auth/github/install"
            target="_self"
            className="text-blue-500 hover:underline"
          >
            Install GitHub App
          </a>
          <Button onClick={logout} variant="ghost" size="sm">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
