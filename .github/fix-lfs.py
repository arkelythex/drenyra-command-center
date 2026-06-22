#!/usr/bin/env python3
"""Add lfs: true to all actions/checkout@v6 blocks in self-hosted workflow files."""

import re
import sys
from pathlib import Path

WF = Path(__file__).parent / "workflows"

FILES = [
    "ci-optimized.yml",
    "ci-self-hosted-pilot.yml",
    "documentation-quality.yml",
    "nightly.yml",
    "reusable-e2e-supervisor-review.yml",
    "contracts-nightly.yml",
    "quality-gates-self-hosted-pilot.yml",
    "ci.yml",
]

def fix_file(path: Path) -> bool:
    original = path.read_text()
    lines = original.split("\n")
    result = []
    i = 0
    modified = False

    while i < len(lines):
        line = lines[i]

        # Detect a `uses: actions/checkout@v6` line
        m = re.match(r'^(\s*)uses:\s+actions/checkout@v6', line)
        if not m:
            result.append(line)
            i += 1
            continue

        indent = m.group(1)  # e.g. "        " (8 spaces)
        uses_line = line

        # Skip to next non-blank line after uses
        j = i + 1
        while j < len(lines) and lines[j].strip() == "":
            j += 1

        # Check if there's an existing `with:` block
        has_with = j < len(lines) and re.match(rf'^{re.escape(indent)}with:', lines[j])
        
        if not has_with:
            # Case 1: No `with:` block — emit uses + with + lfs: true
            result.append(uses_line)
            result.append(f"{indent}with:")
            result.append(f"{indent}  lfs: true")
            modified = True
            i += 1
            continue

        # Case 2: Has existing `with:` block
        # Collect the with block lines
        with_indent = indent + "  "
        with_lines = []
        k = j + 1  # first line after `with:`
        while k < len(lines):
            if lines[k].strip() == "" or lines[k].startswith(with_indent):
                with_lines.append(lines[k])
                k += 1
            else:
                break

        # Check if lfs is already in with block
        has_lfs = any(re.match(rf'^{re.escape(with_indent)}lfs:', wl) for wl in with_lines if wl.strip())

        # Emit the complete block
        result.append(uses_line)
        result.append(f"{indent}with:")
        for wl in with_lines:
            if wl.strip():
                result.append(wl)
            # else skip blank lines inside with block
        if not has_lfs:
            result.append(f"{with_indent}lfs: true")
            modified = True

        # Skip all processed lines (uses + with block)
        i = k  # k is past all with block lines
        # i should point to the first line AFTER the with block

    if modified:
        cleaned = "\n".join(result)
        path.write_text(cleaned)
    return modified


def main():
    fixed = []
    ok = []
    skipped = []
    for fname in FILES:
        path = WF / fname
        if not path.exists():
            skipped.append(fname)
            continue
        if fix_file(path):
            fixed.append(fname)
        else:
            ok.append(fname)

    if fixed:
        print(f"FIXED ({len(fixed)}):", ", ".join(fixed))
    if ok:
        print(f"OK ({len(ok)}):", ", ".join(ok))
    if skipped:
        print(f"SKIPPED ({len(skipped)}):", ", ".join(skipped))
    if fixed:
        print("\nVerify with: for f in ...; python3 -c \"import yaml; yaml.safe_load(open(f'...'))\" ...; end")


if __name__ == "__main__":
    main()
