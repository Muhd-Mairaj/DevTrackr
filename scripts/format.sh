#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

FIX=false
if [[ "$1" == "--fix" ]]; then
    FIX=true
fi

if [ "$FIX" = true ]; then
    echo "🎨 Formatting and Fixing Frontend..."
    cd frontend
    bun run format --fix
    bun run check --fix
    cd ..

    echo "🐍 Formatting and Fixing Backend..."
    cd backend
    uv run ruff format .
    uv run ruff check --fix .
    cd ..
else
    echo "🔍 Checking Frontend..."
    cd frontend
    bun run format
    bun run check
    cd ..

    echo "🔍 Checking Backend..."
    cd backend
    uv run ruff format --check .
    uv run ruff check .
    cd ..
fi

echo "✅ Done!"
