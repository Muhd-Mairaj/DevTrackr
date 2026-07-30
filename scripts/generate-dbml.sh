#!/bin/bash
# generate-dbml.sh
# Generates devtrackr.dbml from the live SQLModel metadata.
#
# Usage:
#   ./scripts/generate-dbml.sh              # writes backend/devtrackr.dbml
#   ./scripts/generate-dbml.sh --output /path/to/schema.dbml

set -e

cd "$(dirname "$0")/.."

OUTPUT_ARG=""
if [[ -n "$1" ]]; then
    OUTPUT_ARG="--output $1"
fi

echo "⏳ Generating DBML schema from backend/app/models..."

cd backend
uv run python generate_dbml.py $OUTPUT_ARG
cd ..
