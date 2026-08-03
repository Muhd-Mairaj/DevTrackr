#!/bin/bash
# generate-dbml.sh
# Generates devtrackr.dbml from the live SQLModel metadata.
#
# Usage:
#   ./scripts/generate-dbml.sh              # writes backend/devtrackr.dbml
#   ./scripts/generate-dbml.sh --output /path/to/schema.dbml

set -e

cd "$(dirname "$0")/.."

ARGS=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --output|-o)
            if [[ $# -lt 2 ]]; then
                echo "error: $1 requires a path argument" >&2
                exit 1
            fi
            ARGS+=("--output" "$2")
            shift 2
            ;;
        *)
            echo "error: unknown argument: $1" >&2
            echo "usage: $0 [--output PATH]" >&2
            exit 1
            ;;
    esac
done

echo "⏳ Generating DBML schema from backend/app/models..."

cd backend
uv run python generate_dbml.py "${ARGS[@]}"
cd ..
