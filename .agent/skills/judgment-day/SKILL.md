# Judgment Day: Adversarial Dual Review

> **Trigger**: judgment-day, judgement day, adversarial review, dual review, juzgar
> **Scope**: `project`

## Purpose

Run blind dual review on SDD design or apply phases. Two independent review perspectives compare findings, confirmed issues are fixed, and the result is re-judged.

## Process

### Phase 1: Blind Dual Review

Two independent reviewers (or review passes) examine the same diff/artifact without seeing each other's results.

**Viewpoint A — Fiscal Correctness lens:**
Focus on: SUNAT/SIRE compliance, IGV calculations, RUC isolation, audit trail, evidence logging, confidence thresholds, reversal paths.

**Viewpoint B — Engineering Quality lens:**
Focus on: type safety, test coverage, architecture boundaries, error handling, performance, naming, structure, dependencies.

### Phase 2: Compare & Merge Findings

- Compare both ledgers
- Deduplicate overlapping findings
- Categorize conflict: `confirmed` (both found it), `disputed` (one found, one missed), `unique` (only one found)
- Merge into a single findings ledger

### Phase 3: Fix Confirmed Issues

- Apply `jd-fix-agent` on confirmed findings
- Fix only BLOCKER and CRITICAL findings
- Record the fix in the ledger with `status: fixed`

### Phase 4: Scoped Re-Judge

- Run `judgment-day` again on the fix diff only
- Verify each fix-touched line
- A finding on an untouched line is logged as `info` (quality signal)
- If new findings emerge, loop back to Phase 3 (max 2 loops)

## Ledger Format

```json
{
  "id": "JD-001",
  "lens": "risk | readability | reliability | resilience | judgment-day",
  "location": "path/to/file.ts:42",
  "severity": "BLOCKER | CRITICAL | WARNING | SUGGESTION",
  "status": "open | fixed | verified | wont-fix | info",
  "evidence": "Why it matters",
  "viewpoint": "A | B",
  "consensus": "confirmed | disputed | unique"
}
```

## Persistence

- **openspec**: write to `openspec/changes/{change-name}/review-ledger.md`
- **engram**: upsert topic `sdd/{change-name}/review-ledger`
- **none**: keep inline, complete loop in session
