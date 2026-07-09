# Drenyra Philosophy Docs Alignment

**Date:** 2026-07-08
**Author:** el Gentleman
**Parent:** `drenyra-north-star-philosophy`
**Scope:** Documentation, maps, and agent guidance
**Review budget:** 400 changed lines per PR

## Problem

A product philosophy only changes behavior when it is visible in the places where humans and agents start work. Drenyra has strong root guidance and MAP files, but the new north star must be connected to repository navigation, app guidance, and agent operating rules.

Without docs alignment, future work may continue optimizing local features without enforcing fiscal-safe agentic accounting principles.

## Goals

1. Create or update canonical product philosophy documentation.
2. Link philosophy from root navigation and app MAP files.
3. Update agent guidance so future AI work respects the north star.
4. Keep docs reviewable under the 400-line budget.

## Non-goals

- No product implementation.
- No API, database, fiscal rule, or UI behavior changes.
- No broad documentation rewrite unrelated to the philosophy.
- No duplication of long philosophy text across every file.

## Proposed docs structure

```text
docs/products/drenyra-product-philosophy.md   # canonical source
AGENTS.md                                     # operating rules and delivery contract
CODEX-MAP.md                                  # discoverability
apps/web/MAP.md                               # web surface philosophy
apps/cli/MAP.md                               # CLI surface philosophy
openspec/master-index.md                      # SDD track visibility
openspec/config.yaml                          # SDD plan registry
```

## Documentation principles

- Lead with the answer: what Drenyra is trying to become.
- Progressive disclosure: root docs link to canonical philosophy instead of duplicating everything.
- Review empathy: explain exactly what changed and what is out of scope.
- AI-agent consumability: use explicit headings, tables, and checklists.
- Fiscal safety first: mention risks before inspiration.

## Success metrics

- A new contributor can discover the philosophy from `CODEX-MAP.md` and app MAP files.
- An AI agent working in the repo sees the philosophy guardrails in `AGENTS.md`.
- Docs avoid vague inspiration by using explicit requirements and non-goals.
- The docs change can be reviewed without reading unrelated historical material.

## Risks

- Overloading root docs with manifesto content.
- Creating conflicting product language across docs.
- Expanding docs beyond the review budget.
