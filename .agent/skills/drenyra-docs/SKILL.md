---
name: drenyra-docs
description: "Trigger: docs, documentation, diataxis, cognitive-load, markdown, doc, readme. Drenyra documentation standards following the Gentleman Philosophy: cognitive load reduction, warm teaching, p..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Drenyra Documentation Skill

> **Trigger**: docs, documentation, diataxis, cognitive-load, markdown, doc, readme
> **Scope**: `project`

## Purpose

Drenyra documentation standards following the Gentleman Philosophy: cognitive load reduction, warm teaching, progressive disclosure.

## Standards

### Diátaxis Framework

Structure docs by user intent, not feature list:

- **Tutorials**: learning-oriented (step-by-step)
- **How-to guides**: task-oriented (specific problem)
- **Reference**: information-oriented (API, config, schema)
- **Explanation**: understanding-oriented (concepts, architecture)

Keep quadrants separate; cross-link don't embed.

### Cognitive Load Patterns

Every doc must follow at least 3 of 6:

1. Lead with answer (inverted pyramid)
2. Progressive disclosure
3. Chunking (max 7±2 items)
4. Signposting (clear section markers)
5. Recognition over recall
6. Review empathy (limit jargon per section)

### Docs-as-Code

- Update docs in the SAME PR as code changes
- Treat stale docs as a bug
- Run `bun run docs:verify` for markdownlint + lychee

### Date Freshness

Every doc has a `**Última actualización**` / `**Last updated**` line at the top.
Update the date when content changes.

### AI Agent-Consumable Docs

50% of doc traffic is now AI agents. Write:

- Clear section headers (h2/h3)
- Direct answers first
- Structured data (tables, JSON examples)
