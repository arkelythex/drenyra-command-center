"""
CI/CD LFS Fix — Step 2: Install git-lfs before checkout (revised).
Inserts an Install git-lfs step IMMEDIATELY BEFORE each actions/checkout step.
For YAML correctness, the new step goes BEFORE the - name: line of the checkout.
"""

import re
import os
import sys

FILES = [
    ".github/actions/setup-bun/action.yml",
    ".github/workflows/ci-optimized.yml",
    ".github/workflows/ci-self-hosted-pilot.yml",
    ".github/workflows/ci.yml",
    ".github/workflows/contracts-nightly.yml",
    ".github/workflows/documentation-quality.yml",
    ".github/workflows/nightly.yml",
    ".github/workflows/quality-gates-self-hosted-pilot.yml",
    ".github/workflows/reusable-e2e-supervisor-review.yml",
]

INSTALL_STEP_TEMPLATE = """{indent}- name: Install git-lfs
{indent}  run: |
{indent}    sudo apt-get update -qq
{indent}    sudo apt-get install -y -qq git-lfs
{indent}    ~/.local/bin/git-lfs install --skip-repo
"""

def is_checkout_step(lines, start_idx):
    """Check if the step starting at start_idx uses actions/checkout@v6."""
    indent = None
    for i in range(start_idx, min(start_idx + 8, len(lines))):
        stripped = lines[i].rstrip()
        if stripped == '':
            continue
        # Get indentation of this line
        line_indent = len(lines[i]) - len(lines[i].lstrip())
        if indent is None:
            indent = line_indent
        elif line_indent <= indent:
            # We've gone past the step's keys (next step or end of block)
            break
        # Check if this is a uses: line
        if re.match(r'^\s+uses:\s+actions/checkout@v6\s*$', stripped):
            return True
    return False

def process_file(filepath):
    with open(filepath) as f:
        lines = f.readlines()
    
    out = []
    modified = False
    
    # Detect all step indexes that are checkout steps
    checkouts = []  # (line_index, indent)
    
    i = 0
    while i < len(lines):
        stripped = lines[i].rstrip()
        # Detect start of a step: "- name:" or bare "- uses:"
        if re.match(r'^(\s+)-\s+name:\s+', stripped):
            m = re.match(r'^(\s+)', stripped)
            indent = m.group(1)
            if is_checkout_step(lines, i):
                checkouts.append((i, indent))
        i += 1
    
    # Build output, inserting before checkout steps
    skip_until = -1
    for i, line in enumerate(lines):
        stripped = line.rstrip()
        
        # Check if this starts a checkout step that we should insert before
        insert_before = None
        for ci, (c_idx, c_indent) in enumerate(checkouts):
            if c_idx == i:
                insert_before = c_indent
                break
        
        if insert_before is not None:
            # Check if there's already an Install git-lfs step before this checkout
            already = False
            for j in range(max(0, len(out) - 6), len(out)):
                if "Install git-lfs" in out[j]:
                    already = True
                    break
            if not already:
                out.append(INSTALL_STEP_TEMPLATE.format(indent=insert_before))
                modified = True
        
        out.append(line)
    
    if modified:
        with open(filepath, 'w') as f:
            f.writelines(out)
        return True
    return False

def main():
    ok = True
    for fp in FILES:
        if not os.path.exists(fp):
            print(f"  SKIP: {fp}")
            continue
        changed = process_file(fp)
        print(f"  {'CHANGED' if changed else 'NO CHANGE'}: {fp}")
    
    # Validate all YAML
    import yaml
    for fp in glob.glob('.github/actions/**/*.yml', recursive=True) + glob.glob('.github/workflows/*.yml'):
        try:
            yaml.safe_load(open(fp))
        except Exception as e:
            print(f"  YAML FAIL: {fp} -> {e}")
            ok = False
    
    if ok:
        print("\nAll YAML valid. Commit and push.")
    else:
        print("\nSome files have YAML errors. Fix before committing.")
        sys.exit(1)

import glob
if __name__ == "__main__":
    main()
