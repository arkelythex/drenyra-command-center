#!/usr/bin/env python3
"""
Replace all sudo apt-get git-lfs install steps with direct binary download (no sudo needed).
"""

import os
import re

REPO = "/home/dreamcoder08/Documents/PROYECTOS/arkelythex"
FILES = [
    ".github/actions/setup-bun/action.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/nightly.yml",
    ".github/workflows/reusable-e2e-supervisor-review.yml",
    ".github/workflows/quality-gates-self-hosted-pilot.yml",
    ".github/workflows/ci-optimized.yml",
    ".github/workflows/ci-self-hosted-pilot.yml",
    ".github/workflows/contracts-nightly.yml",
    ".github/workflows/documentation-quality.yml",
]

# The old 3-line apt-get block (with variable indentation)
# Pattern: <whitespace>sudo apt-get update -qq\n<whitespace>sudo apt-get install -y -qq git-lfs\n<whitespace>~/.local/bin/git-lfs install --skip-repo
OLD_BLOCK_RE = re.compile(
    r'( {2,}|-)(sudo apt-get update -qq\s+sudo apt-get install -y -qq git-lfs\s+~/.local/bin/git-lfs install --skip-repo)',
    re.MULTILINE | re.DOTALL
)

# Better: match the 3 lines as separate lines
# We need to capture the indentation of each line

GIT_LFS_VERSION = "3.6.1"

NEW_BLOCK_TEMPLATE = """\
mkdir -p ~/.local/bin
curl -sL "https://github.com/git-lfs/git-lfs/releases/download/v{VERSION}/git-lfs-linux-amd64-v{VERSION}.tar.gz" | tar -xz -C /tmp
cp /tmp/git-lfs-{VERSION}/git-lfs ~/.local/bin/
~/.local/bin/git-lfs install --skip-repo""".format(VERSION=GIT_LFS_VERSION)


def fix_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()
    
    # Match lines starting with whitespace + "sudo apt-get update -qq"
    # Followed by sudo apt-get install -y -qq git-lfs
    # Followed by ~/.local/bin/git-lfs install --skip-repo
    # All with same indentation
    
    lines = content.splitlines()
    new_lines = []
    i = 0
    changes = 0
    
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        
        # Check if this line is "sudo apt-get update -qq"
        if stripped == "sudo apt-get update -qq":
            indent = line[:len(line) - len(line.lstrip())]
            
            # Check if next 2 lines follow the pattern
            if (i + 2 < len(lines) and 
                lines[i + 1].strip() == "sudo apt-get install -y -qq git-lfs" and
                lines[i + 2].strip() == "~/.local/bin/git-lfs install --skip-repo"):
                
                # Replace all 3 lines with the download approach
                new_lines.append(f"{indent}mkdir -p ~/.local/bin")
                new_lines.append(f'{indent}curl -sL "https://github.com/git-lfs/git-lfs/releases/download/v{GIT_LFS_VERSION}/git-lfs-linux-amd64-v{GIT_LFS_VERSION}.tar.gz" | tar -xz -C /tmp')
                new_lines.append(f"{indent}cp /tmp/git-lfs-{GIT_LFS_VERSION}/git-lfs ~/.local/bin/")
                new_lines.append(f"{indent}~/.local/bin/git-lfs install --skip-repo")
                i += 3
                changes += 1
                continue
        
        new_lines.append(line)
        i += 1
    
    new_content = "\n".join(new_lines)
    
    if content != new_content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"✅ {filepath} — {changes} replacement(s)")
    else:
        print(f"⚠️  {filepath} — NO CHANGES (pattern not found)")


if __name__ == "__main__":
    for f in FILES:
        fix_file(os.path.join(REPO, f))
