#!/usr/bin/env bash
# Deploy DevTrackr for an environment (staging by default).
set -euo pipefail

# Resolve the repo root from the script location.
cd "$(dirname "$0")/.."

ENVIRONMENT="${1:-staging}"
case "$ENVIRONMENT" in
  staging|prod) ;;
  *)
    echo "Usage: $0 [staging|prod]" >&2
    exit 2
    ;;
esac

exec docker compose -f docker-compose.yml -f "docker-compose.${ENVIRONMENT}.yml" up -d --pull missing
