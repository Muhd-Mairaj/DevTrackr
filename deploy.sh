#!/usr/bin/env bash
# DevTrackr staging deploy.
set -euo pipefail
cd "$(dirname "$0")"
docker network inspect devtrackr-edge >/dev/null 2>&1 || docker network create devtrackr-edge
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --pull missing "$@"
