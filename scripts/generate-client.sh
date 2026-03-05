#!/bin/bash

set -e

# Navigate to project root
cd "$(dirname "$0")/.."

echo "Generating openapi spec"
cd backend && uv run generate_openapi.py
cp openapi.json ..
cd ..

echo "Generating client"
cd frontend && bun run generate-client
cd ..

echo "Done"
