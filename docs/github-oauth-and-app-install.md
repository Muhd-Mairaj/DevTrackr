# GitHub OAuth & App Installation

How DevTrackr authenticates users with GitHub and links GitHub App
installations. The linking logic lives in `backend/app/integrations/github.py`
(pure functions, no FastAPI); the routes that drive it live in
`backend/app/api/routes/github.py` and
`backend/app/api/routes/integrations/github.py`.

## Overview

There are two separate flows, and keeping them separate is deliberate:

1. **OAuth login** (`/auth/github/authorize` → `/auth/github/callback`)
   Standard GitHub OAuth (authlib manages `state` + PKCE). Lets a user sign up
   or sign in with their GitHub account. No app installation happens here.
2. **App installation** (`/auth/github/install` → `/auth/github/setup-callback`)
   Links a GitHub App installation to a DevTrackr user.

The GitHub App's **Setup URL** must point at `/auth/github/setup-callback`.

> Do **not** enable "Request user authorization (OAuth) during installation" in
> the GitHub App settings. It merges the two flows into a single callback that
> arrives without a `state` parameter, weakening CSRF protection.

## Security model

### `state` — CSRF defense-in-depth

`/install` generates a random `state` (`secrets.token_urlsafe`), stores it in
the user's signed session cookie, and passes it to GitHub. GitHub echoes it back
to `/setup-callback`, where we compare the (untrusted) query param against the
(trusted, HMAC-signed) session value. An attacker can neither read nor forge the
victim's session state, so a forged callback fails the check.

States are kept in a session list (`gh_install_states`) so multiple tabs can
each hold a valid in-flight install; the matching value is removed on first use,
so replaying a callback fails. A state that is present but not in the list is
rejected as CSRF (`401`).

`state` is **present** only for website-initiated installs. GitHub **drops** it
for direct installs from github.com and for org-admin approvals on behalf of a
non-admin requester (see GitHub community discussions #53626, #64239). A missing
`state` is therefore expected and handled gracefully — it is not treated as an
attack.

### `GET /user/installations` — IDOR protection (non-negotiable)

Even when `state` is legitimately missing, we never trust the
`installation_id` query param on its own. Before linking, we call GitHub's
`GET /user/installations` **with the user's own token** and confirm the
`installation_id` appears in that list. A spoofed `installation_id` will never
show up under a different user, so it can't be bound to the attacker's account.

We authorize against the user's token, **never** the App JWT — the App JWT can
read *any* installation, which would defeat the check.

## `/setup-callback` scenarios

GitHub redirects here after an install with
`?installation_id=…&setup_action=install [&state=…]`.

| `state`            | User state                       | Action                                              |
| ------------------ | -------------------------------- | --------------------------------------------------- |
| present, valid     | —                                | Link after verifying via `GET /user/installations`  |
| present, mismatch  | —                                | Reject as CSRF (`401`)                              |
| absent             | not logged in                    | Stash installation, redirect to OAuth; link on `/callback` |
| absent             | logged in, no GitHub token       | Stash installation, redirect to OAuth; link on `/callback` |
| absent             | logged in with a GitHub token    | Link immediately                                    |

The pending `installation_id` is stored in the session
(`pending_gh_installations`) so it survives the OAuth round-trip; `/callback`
links it once the user has a token. The stash is a dict keyed by a **nonce**
(the OAuth `state` value): `/setup-callback` redirects to `/authorize?state=<nonce>`,
`/authorize` passes that `state` through to GitHub's OAuth consent page, and
`/callback` consumes only the entry whose nonce arrives back on the callback
URL. A plain login (no `state`) has nothing to consume, so one user's pending
installation can never be linked to whoever happens to log in next. Entries
expire after 15 minutes; an expired entry is reported as `expired` instead of
falsely succeeding.

## Link outcomes

`link_installation` returns `None` on success, or a short code surfaced to the
frontend via `?github_app=…`:

| Code             | Meaning                                  |
| ---------------- | ---------------------------------------- |
| `success`        | Installation linked                      |
| `unauthorized`   | `installation_id` is not one of the user's installations |
| `conflict`       | Installation is already linked to a different user |
| `expired`        | The stashed installation was older than 15 minutes |
| `error`          | GitHub API call failed                   |
