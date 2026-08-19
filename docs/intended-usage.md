# Intended Usage — Drenyra Command Center

> **Last updated:** 2026-08-19.

## Definition

Drenyra Command Center (this repository) is the **product surface of the Drenyra ecosystem**: the web application, API, and terminal through which accountants and operators run fiscal workflows — workspaces, companies (RUC), fiscal periods, documents, closure, reconciliation, and approvals — against a headless core that lives in `drenyra-ai`.

It is a **projection of the Core, never a second authority**. The Command Center renders only the `status` and `nextTransition` returned by `drenyra-ai` and never reconstructs the state machine.

- **Status:** in development (public repository).
- **Surface:** `apps/web` (React 19 + TanStack Router), `apps/api` (Bun + Elysia), `apps/cli` (Go terminal), `apps/data-engine` (Python analytics).
- **Consumes:** released, versioned `drenyra-ai` artifacts (missions, candidates, gates, receipts, ledger) and `drenyra-engram` for institutional context.

## The philosophy, translated

Financial operations across Latin America are fragmented across ERPs, Excel, SUNAT portals, email, and manual knowledge. The Command Center replaces that with one operational pipeline:

```
Workspace → Agents → Deterministic Validation → Evidence →
Professional Review → Controlled Execution → Immutable Receipt
```

Two ideas carry the product:

1. **Agents propose; the deterministic core and the professional decide** (ADR-011). No agent, mission, or orchestrator inside this repo holds fiscal authority.
2. **Every material action produces an immutable receipt** (RED — Receipt-Driven Execution). Auditability is a product guarantee, not a post-hoc export.

## The golden rule

The accountant never operates agents, terminals, or CLIs. They work in the web Command Center and ask for outcomes — "prepare the July 2026 close for Company X". The Command Center invokes agents (Pi, Codex, Claude, OpenCode) as internal infrastructure, and the professional receives reviewable candidates, evidence, explicit decisions, and verifiable receipts.

Only developers, operators, and integrators use the Drenyra CLI (`apps/cli`).

## What the Command Center is not

| The Command Center is NOT | Because that belongs to |
| --- | --- |
| The verification core. Missions, candidates, review lenses, gates, receipts, and the ledger core are **not re-implemented here** — they are consumed from `drenyra-ai`. | `drenyra-ai` (the fiscal authority lives there) |
| A memory engine. Observations, scope-first search, and provenance are read through `drenyra-engram` surfaces; memory informs, never authorizes. | `drenyra-engram` |
| The Pi operator harness. This repo is the product surface; the Pi-native operator layer is a separate harness over the `drenyra-ai` runtime. | `drenyra-pi` |
| A standalone receipt verifier for external ERPs. That is `drenyra-ai`'s public surface. | `drenyra-ai` |
| An independent agent runtime. Missions and their state machines run in the Core; the Command Center only presents their status. | `drenyra-ai` |

**Consequence:** a PR that re-implements `drenyra-ai` or `drenyra-engram` logic inside this repo is rejected and redirected to the owning repo (see [Ecosystem Boundaries](architecture/ecosystem-boundaries.md) and [ADR-013](11-adr/ADR-013-consume-drenyra-ai-remove-duplicate-authority.md)).

## The responsibility split

| Component | Responsibility | Must never |
| --- | --- | --- |
| **Command Center** | Interface, inboxes, visualization, review and approval workflows | Re-implement gates or mutate authoritative state |
| **Drenyra-AI** | Missions, candidates, materiality, authority, gates, receipts, ledger and recovery | Depend on the UI or trust agent narratives |
| **Drenyra-Engram** | Institutional memory and context retrieval | Authorize actions or treat memories as evidence |
| **Human professional** | Final authority: approves material decisions (R0–R3, risk-proportional) | Delegate approval to an agent |

## The target experience

- The professional requests an outcome; the Command Center creates a mission through the published `drenyra-ai` contract.
- Agents research, propose, and prepare candidates; the Core computes identity, scope, and materiality; gates determine required evidence and approval.
- The professional reviews and approves **candidates, not intentions**. Materiality scales the gate: read-only work is high-autonomy (R0); irreversible actions require explicit approval (R3, dual).
- Every approved execution lands as a signed receipt and a verifiable ledger entry; the Command Center only represents that authoritative state.

## Next steps

- [README.md](../README.md) — positioning, quick start, repo structure.
- [CODEBASE-GUIDE.md](CODEBASE-GUIDE.md) — repository map, layering, invariants, testing.
- [architecture.md](architecture.md) — ecosystem position, authority model, consumer contract.
- [Ecosystem Boundaries](architecture/ecosystem-boundaries.md) — the approved boundary and authority contract (Design 1).
- [Product Philosophy](products/drenyra-product-philosophy.md) — product direction and guardrails.
- [Documentation Index](00-INDEX.md) — full navigation.
