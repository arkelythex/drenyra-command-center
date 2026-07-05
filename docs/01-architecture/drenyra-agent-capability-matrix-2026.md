---
title: 'Drenyra Agent Capability Matrix 2026'
description: 'Phase 3 deny-by-default capability policy for Drenyra agents, scoped tools, risk levels, approvals, redaction and audit decisions.'
version: '1.0'
last-updated: '2026-05-26'
tags: ['architecture', 'drenyra', 'agents', 'capabilities', 'governance']
audience: ['architecture', 'engineering', 'security', 'compliance']
status: 'active'
---

# Drenyra Agent Capability Matrix 2026

## Purpose

Drenyra agents are governed operators, not free actors. Phase 3 defines the canonical deny-by-default contract for agent tool use before it can be wired into app routes, `agent-swarm`, `ai-swarm`, MCP or FAL flows.

## Canonical implementation

Framework-free domain contracts live in:

- `packages/domain/src/drenyra/capability-types.ts`
- `packages/domain/src/drenyra/capability-policies.ts`
- `packages/domain/src/drenyra/capabilities.ts`
- `packages/domain/src/drenyra/capabilities.test.ts`

Consumers import through:

```ts
import { evaluateDrenyraCapability } from "@drenyra/domain/drenyra";
```

## Deny-by-default rules

A tool call is denied unless all are true:

1. agent + tool pair is registered in `DRENYRA_CAPABILITY_POLICIES`;
2. request has complete fiscal scope: organization, company, RUC, period and country;
3. requested scope exactly matches a capability grant;
4. redaction succeeded when required;
5. approval is present when the policy requires it.

Every evaluation returns an audit event type: `CAPABILITY_ALLOWED` or `CAPABILITY_DENIED`.

## Capability classes

| Action | Purpose | Default risk | Material state? |
|---|---|---:|---|
| `read` | read scoped case/profile data | low | no |
| `explain` | explain evidence or existing state | low | no |
| `draft` | prepare advisory outputs | medium | no |
| `propose` | propose ledger/fiscal action | high | no direct posting |
| `request_approval` | create an approval request | high | no direct posting |
| `material_action` | promote/post/submit material fiscal state | critical | requires approval and deterministic evidence |

## Initial policy rows

| Agent | Tool | Action | Risk | Approval | Redaction |
|---|---|---|---:|---:|---:|
| `FISCAL_REVIEWER_AGENT` | `list_fiscal_cases` | read | low | no | yes |
| `EVIDENCE_AGENT` | `explain_evidence` | explain | low | no | yes |
| `SIRE_AGENT` | `run_agent_review` | draft | medium | no | yes |
| `FISCAL_REVIEWER_AGENT` | `calculate_igv` | explain | low | no | yes |
| `CPE_AGENT` | `validate_cpe` | draft | medium | no | yes |
| `FISCAL_REVIEWER_AGENT` | `get_tax_calendar` | read | low | no | yes |
| `LEDGER_AGENT` | `propose_ledger_entry` | propose | high | yes | yes |
| `FISCAL_REVIEWER_AGENT` | `request_approval` | request approval | high | no | yes |
| `FISCAL_REVIEWER_AGENT` | `promote_fiscal_truth` | material action | critical | yes | yes |

`submit_sunat_sire` exists as a tool identifier but intentionally has no policy row in v0, so it remains denied until a future SDD defines its deterministic bundle and approval prerequisites.

## Scope and grant model

Capability grants are scoped. A grant for one RUC or period cannot be reused for another.

Required scope tuple:

```text
organizationId + companyId + companyRuc + period + countryCode
```

## API bridge v0

The Drenyra command-center API now calls the canonical evaluator before scoped reads,
evidence explanation, deterministic agent review and approval-request creation.

Required request headers for guarded command-center routes:

- `x-company-id`
- `x-company-ruc`
- `x-fiscal-period`
- `x-user-id`
- `x-drenyra-capability-grant: scoped`
- `x-drenyra-redaction-ok: true`

If the grant or redaction proof is missing, the route returns
`DRENYRA_CAPABILITY_DENIED` with `CAPABILITY_DENIED` audit metadata.

## Legacy chat bridge v0

Legacy `/api/drenyra/chat` and `/api/drenyra/chat/stream` now require RUC and fiscal
period before execution. The orchestrator exposes an optional authorization hook that
the API uses to guard fiscal compliance tools with the same capability evaluator.

Initial guarded legacy tool mapping:

- `compliance.calculate_igv` → `FISCAL_REVIEWER_AGENT.calculate_igv`
- `compliance.validate_cpe` → `CPE_AGENT.validate_cpe`
- `compliance.get_tax_calendar` → `FISCAL_REVIEWER_AGENT.get_tax_calendar`
- `compliance.submit_sire` → `SIRE_AGENT.submit_sunat_sire`

`submit_sunat_sire` is still intentionally unregistered, so chat cannot submit SIRE
even when scoped grant and redaction proof are present.

## Phase 3 completion criteria

- [x] Inventory existing Drenyra/AI tools.
- [x] Classify tools as read, explain, draft, propose, request approval or material action.
- [x] Add risk levels: low, medium, high, critical.
- [x] Define per-tool required scope and approval behavior.
- [x] Document redaction failure policy.
- [x] Add unit tests for default-denied tools.
- [x] Add tests for tenant/company/RUC/period mismatch through scoped grants.
- [x] Emit audit event type from every capability evaluation.
- [x] Wire the command-center API to deny missing grants/redaction before execution.
- [x] Wire legacy Drenyra chat fiscal tools to the same scoped capability bridge.

## Related docs

- [Fiscal Intelligence Platform Architecture](./fiscal-intelligence-platform-architecture-2026.md)
- [FAL Non-Negotiable Controls](./fiscal-agentic-ledger-controls-2026.md)
- [Fiscal Agentic Ledger Event Envelope](./fiscal-agentic-ledger-event-envelope-2026.md)
- [ADR-025: Fiscal Intelligence Platform and FAL](../02-adr/adr-025-fiscal-intelligence-platform.md)
