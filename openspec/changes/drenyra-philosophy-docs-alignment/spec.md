# Specification — Drenyra Philosophy Docs Alignment

## Requirements

### Requirement 1: Canonical philosophy document

Drenyra SHALL have one canonical product philosophy document.

#### Acceptance criteria

- The document lives under `docs/products/` unless a stronger existing docs convention is selected during apply.
- It includes north star, web philosophy, CLI philosophy, agentic accounting guardrails, fiscal safety, human control, non-goals, and review implications.
- It uses cognitive documentation patterns: answer first, chunking, signposting, checklists, and review empathy.

### Requirement 2: Root discoverability

The philosophy SHALL be discoverable from root navigation and OpenSpec strategy docs.

#### Acceptance criteria

- `CODEX-MAP.md` links to the canonical philosophy.
- `openspec/master-index.md` includes the philosophy track.
- `openspec/config.yaml` registers the SDD plans.

### Requirement 3: Agent guidance alignment

`AGENTS.md` SHALL include concise philosophy-aware guidance for future AI and human contributors.

#### Acceptance criteria

- Guidance reinforces fiscal correctness, tenant scope, auditability, and human approval.
- Guidance references the canonical philosophy without duplicating the full document.
- Guidance warns against vague AI polish without evidence and tests.

### Requirement 4: App MAP alignment

Web and CLI MAP files SHALL explain their surface-specific philosophy.

#### Acceptance criteria

- `apps/web/MAP.md` explains the agentic fiscal command center model.
- `apps/cli/MAP.md` explains the Gentleman Fiscal Terminal model.
- Both app maps link back to the canonical philosophy.

### Requirement 5: Reviewable docs rollout

Docs alignment SHALL be split if it exceeds the review budget.

#### Acceptance criteria

- Each PR has a clear review path.
- No unrelated docs cleanup is bundled into the philosophy rollout.
- Broken links are checked with the project's docs verification command where available.
