#!/usr/bin/env bash
# Deploy DevTrackr for an environment (staging by default).
set -euo pipefail

SCRIPT_PATH="$(readlink -f -- "${BASH_SOURCE[0]}")"
cd -- "$(dirname -- "$SCRIPT_PATH")"

ENVIRONMENT="${1:-staging}"
case "$ENVIRONMENT" in
  staging|prod) ;;
  *)
    echo "Usage: $0 [staging|prod]" >&2
    exit 2
    ;;
esac

docker network inspect devtrackr-edge >/dev/null 2>&1 || docker network create devtrackr-edge
exec docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" up -d --pull missing
