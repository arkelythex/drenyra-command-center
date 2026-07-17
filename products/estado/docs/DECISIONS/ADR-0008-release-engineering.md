# ADR-0008: Release engineering baseline

## Status
Accepted

## Decision
Adopt release-please-driven semantic releases with:
- automated release PRs
- changelog generation from Conventional Commits
- tag format `vX.Y.Z`

## Why
Open-source projects need predictable releases and traceable change history.
Automated release PRs reduce manual errors and improve contributor trust.

## Consequences
- Commit and PR title quality directly impacts changelog quality.
- Maintainers must review release PR content before merge.
