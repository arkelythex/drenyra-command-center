"""Add echo $HOME/.local/bin >> $GITHUB_PATH after each git-lfs install step."""
import os, glob

WORKFLOW_DIR = os.path.join(os.path.dirname(__file__), "workflows")
FILES = list(glob.glob(f"{WORKFLOW_DIR}/*.yml")) + [
    os.path.join(os.path.dirname(__file__), "actions", "setup-bun", "action.yml"),
]

for path in sorted(FILES):
    if not os.path.exists(path):
        continue
    with open(path) as f:
        lines = f.readlines()

    new_lines = []
    count = 0
    for i, line in enumerate(lines):
        new_lines.append(line)
        stripped = line.rstrip()
        if stripped.lstrip().startswith("~/.local/bin/git-lfs install --skip-repo"):
            # Check if the next line already has GITHUB_PATH
            next_line = lines[i + 1] if i + 1 < len(lines) else ""
            if "GITHUB_PATH" not in next_line:
                indent = line[:len(line) - len(line.lstrip())]
                new_lines.append(f"{indent}echo \"$HOME/.local/bin\" >> $GITHUB_PATH\n")
                count += 1

    with open(path, "w") as f:
        f.writelines(new_lines)

    status = "added PATH" if count > 0 else "no changes"
    print(f"  {os.path.basename(path)}: {status} ({count} step(s))")

print("Done.")
