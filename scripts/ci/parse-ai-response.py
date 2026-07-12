#!/usr/bin/env python3
"""Parse AI response and write generated files to output/ directory."""
import json
import os
import sys

response_file = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ai-response.json'
output_dir = sys.argv[2] if len(sys.argv) > 2 else 'output'

os.makedirs(output_dir, exist_ok=True)

with open(response_file) as f:
    raw = f.read()

try:
    data = json.loads(raw)
    content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
except json.JSONDecodeError:
    content = raw

try:
    files = json.loads(content)
    if isinstance(files, dict):
        for path, file_content in files.items():
            full_path = os.path.join(output_dir, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(file_content)
            print(f'Generated: {path} ({len(file_content)} bytes)')
        sys.exit(0)
except json.JSONDecodeError:
    pass

# Fallback: save as markdown
with open(os.path.join(output_dir, 'ai-implementation.md'), 'w') as f:
    f.write(content)
print(f'Saved AI response as markdown ({len(content)} bytes)')
