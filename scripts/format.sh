#!/bin/bash
set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo "🎨 Formatting Frontend..."
cd frontend
bun run format
cd ..

echo "🐍 Formatting Backend..."
cd backend
# Run ruff formatter
uv run ruff format .
# Run ruff linter with auto-fix
uv run ruff check --fix .
cd ..

echo "✅ All formatting complete!"
