#!/bin/bash
set -e

# Navigate to backend (outside of scripts folder)
cd "$(dirname "$0")/.."

FIX=false
if [[ "$1" == "--fix" ]]; then
    FIX=true
fi

if [ "$FIX" = true ]; then
    echo "🐍 Formatting and Fixing Backend..."
    uv run ruff format .
    uv run ruff check --fix .
else
    echo "🔍 Checking Backend..."
    uv run ruff format --check .
    uv run ruff check .
fi

echo "✅ Done!"
