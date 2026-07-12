#!/usr/bin/env bash
# Engram Sync — sync GitHub issues to Engram memory
# Usage: ./scripts/ci/sync-engram.sh [--dry-run]
#
# Reads issues tagged with auto-generated labels and saves
# them as Engram observations for cross-session context.
# Falls back gracefully if Engram is not available.

set -euo pipefail

DRY_RUN=false
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

LABELS="auto-generated,merge-health,judgment-day"
REPO="arkelythex/Drenyra"

echo "=== Engram Sync ==="
echo "Labels: $LABELS"
echo "Dry run: $DRY_RUN"
echo ""

# Check if Engram CLI is available
ENGRAM_AVAILABLE=false
if command -v engram &>/dev/null; then
  ENGRAM_AVAILABLE=true
  echo "Engram CLI found"
else
  echo "Engram CLI not available — will use fallback (JSON output)"
fi

# Fetch recent issues with target labels
ISSUES=$(gh api "/repos/$REPO/issues" \
  --method GET \
  -f labels="$LABELS" \
  -f state="all" \
  -f per_page="10" \
  -f sort="updated" \
  -f direction="desc" \
  2>/dev/null) || echo "[]"

COUNT=$(echo "$ISSUES" | python3 -c "import sys,json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null || echo "0")

echo "Issues fetched: $COUNT"

if [ "$COUNT" = "0" ]; then
  echo "No issues to sync."
  exit 0
fi

# Process each issue
echo "$ISSUES" | python3 -c "
import sys, json, os

issues = json.load(sys.stdin)
dry_run = os.environ.get('DRY_RUN') == 'true'

for issue in issues:
    number = issue.get('number')
    title = issue.get('title', '')
    state = issue.get('state', '')
    labels = [l.get('name', '') for l in issue.get('labels', [])]
    body = issue.get('body', '')[:500]

    print(f'\\n--- Issue #{number}: {title}')
    print(f'  State: {state} | Labels: {\", \".join(labels)}')

    if dry_run:
        print(f'  [DRY RUN] Would save to Engram')
        continue

    # Save as Engram observation (if CLI is available)
    if $ENGRAM_AVAILABLE:
        import subprocess
        content = f'**What**: Issue #{number}: {title}\\n**State**: {state}\\n**Labels**: {\", \".join(labels)}\\n**Body**: {body[:200]}'
        try:
            result = subprocess.run(
                ['engram', 'save', '--title', f'Auto-generated: #{number} {title[:50]}',
                 '--content', content, '--type', 'discovery',
                 '--project', 'drenyra', '--topic-key', f'ci-auto/{number}'],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                print(f'  ✅ Saved to Engram')
            else:
                print(f'  ⚠️ Engram save failed: {result.stderr[:100]}')
        except Exception as e:
            print(f'  ⚠️ Engram error: {e}')
    else:
        # Fallback: output JSON for external processing
        record = {
            'source': 'github-issue',
            'issue_number': number,
            'title': title,
            'state': state,
            'labels': labels,
            'timestamp': os.popen('date -Iseconds').read().strip()
        }
        print(f'  📄 JSON fallback: {json.dumps(record, indent=2)[:200]}')
" 2>&1

echo ""
echo "=== Sync complete ==="