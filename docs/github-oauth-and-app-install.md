# GitHub OAuth & App Installation

How DevTrackr authenticates users with GitHub and links GitHub App
installations. The implementation lives in `backend/app/api/routes/github.py`.

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

The pending `installation_id` is stored in the session so it survives the OAuth
round-trip; `/callback` links it once the user has a token.

## Link outcomes

`_link_installation` returns `None` on success, or a short code surfaced to the
frontend via `?github_app=…`:

| Code             | Meaning                                  |
| ---------------- | ---------------------------------------- |
| `success`        | Installation linked                      |
| `unauthorized`   | `installation_id` is not one of the user's installations |
| `conflict`       | Installation is already linked to a different user |
| `error`          | GitHub API call failed                   |
