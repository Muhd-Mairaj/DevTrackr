import json
import os
import sys

# Ensure we can import from 'app'
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app

print("⏳ Generating OpenAPI schema...")

openapi_data = app.openapi()

# Define output path (root of backend)
output_path = "openapi.json"

# Write to file
with open(output_path, "w") as f:
    json.dump(openapi_data, f, indent=2)

print(f"✅ Schema exported to: {os.path.abspath(output_path)}")
