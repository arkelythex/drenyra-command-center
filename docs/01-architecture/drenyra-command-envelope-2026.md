---
title: 'Drenyra Command Envelope 2026'
description: 'Shared CLI/Web/API output envelope for scoped fiscal commands in Drenyra.'
version: '1.0'
last-updated: '2026-05-26'
tags: ['architecture', 'drenyra', 'cli', 'web', 'command-center']
audience: ['architecture', 'engineering', 'product']
status: 'active'
---

# Drenyra Command Envelope 2026

## Purpose

Phase 4 needs CLI and Web to show the same fiscal truth for every operator command.
The command envelope is the shared output contract: evidence, deterministic checks,
risk, approval state, diff and trace travel together instead of being rendered as
surface-specific fragments.

## Canonical implementation

Framework-free contracts live in:

- `packages/domain/src/drenyra/command-envelope-types.ts`
- `packages/domain/src/drenyra/command-envelope.ts`
- `packages/domain/src/drenyra/command-envelope.test.ts`

Consumers import through:

```ts
import { createDrenyraCommandEnvelope } from "@arkelythex/domain/drenyra";
```

## Supported command IDs

- `review-sunat`
- `analyze-invoice`
- `explain-risk`
- `prepare-evidence`
- `propose-ledger-entry`

## Required envelope sections

Every envelope carries:

1. fiscal scope: organization, company, RUC, period and country;
2. command status: `ready`, `needs_approval`, `blocked` or `failed`;
3. evidence references with stable IDs and optional content hash;
4. deterministic checks referencing known evidence IDs;
5. fiscal risk level;
6. approval state;
7. diff summary for before/after review;
8. trace ID and creation timestamp.

## Safety rules

The factory fails closed when:

- fiscal scope is incomplete or has an invalid RUC/period;
- title, summary or trace ID is blank;
- duplicate evidence IDs are provided;
- a deterministic check references missing evidence;
- a command marked `needs_approval` has no approval requirement.


## API producer v0

The first envelope producer is:

```text
POST /api/drenyra/commands/review-sunat
POST /api/drenyra/commands/prepare-evidence
POST /api/drenyra/commands/analyze-invoice
POST /api/drenyra/commands/explain-risk
POST /api/drenyra/commands/propose-ledger-entry
GET /api/drenyra/commands/audit-events
```

It returns a scoped `review-sunat` envelope for CLI/Web rendering and is guarded by
the Drenyra capability matrix using `SIRE_AGENT.run_agent_review`. It does not submit
to SUNAT and it returns `approval.required=false`; it only prepares advisory review
state with evidence refs, deterministic checks and trace context.

`prepare-evidence` is guarded by `EVIDENCE_AGENT.explain_evidence`. It prepares an advisory evidence-bundle envelope, proposes no material fiscal mutation, and returns `approval.required=false` until the bundle is attached to an approval request.

`analyze-invoice` is guarded by `CPE_AGENT.validate_cpe`. It prepares an advisory invoice risk-profile envelope with a CPE/UBL warning check; it does not create ledger entries or approve fiscal use.

`explain-risk` is guarded by `FISCAL_REVIEWER_AGENT.explain_risk`. It prepares an advisory high-risk risk-profile explanation envelope and explicitly records that the command cannot approve, post, or submit fiscal state. It verifies `riskRef`/`sourceRef` ownership against the scoped fiscal case before marking its source-scope deterministic check as `passed`; out-of-period or missing sources fail closed. Command producers propagate a valid incoming `x-trace-id` or generate a UUID trace for CLI/Web/audit correlation. Capability decisions for these producers are persisted as scoped `CAPABILITY_ALLOWED` / `CAPABILITY_DENIED` Drenyra audit events with command, tool, reason and trace metadata. `GET /commands/audit-events` reads those command-level events by fiscal scope and optional `caseId`, `commandId` or `eventType`, including events that intentionally have no case id.

`propose-ledger-entry` is guarded by `LEDGER_AGENT.propose_ledger_entry` and requires an existing approval context. It returns `status=needs_approval`, never posts ledger state, and only carries a proposed `ledger_entry` diff for fiscal reviewer approval.

## Surface contract

CLI and Web should render this envelope directly. They may add surface-specific
layout, but must not drop evidence, deterministic checks, risk, approval state,
diff or trace context.

## Related docs

- [Drenyra Agent Capability Matrix](./drenyra-agent-capability-matrix-2026.md)
- [Fiscal Agentic Ledger Event Envelope](./fiscal-agentic-ledger-event-envelope-2026.md)
- [Fiscal Intelligence Platform Architecture](./fiscal-intelligence-platform-architecture-2026.md)
