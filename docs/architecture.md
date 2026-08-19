# Drenyra Command Center — Architecture

> **Last updated:** 2026-08-19.

## Documentation index

| Doc | What it covers |
| --- | --- |
| [00-INDEX.md](00-INDEX.md) | Full documentation index and navigation |
| [arkelythex-architecture.md](arkelythex-architecture.md) | Org-level 5-layer model (Arkelythex fabric → edge) |
| [architecture/ecosystem-boundaries.md](architecture/ecosystem-boundaries.md) | Approved boundary & authority contract (Design 1) |
| [architecture/dependency-direction.md](architecture/dependency-direction.md) | Ecosystem dependency graph and direction rules |
| [architecture/trust-model.md](architecture/trust-model.md) | Who may authorize what; fail-closed default |
| [architecture/orchestration-roles.md](architecture/orchestration-roles.md) | Mastra vs `packages/pi` vs `drenyra-pi` (three layers, not duplicates) |
| [11-adr/](11-adr/) | ADRs — notably ADR-010 (boundary/authority), ADR-011 (AI proposes, Core decides), ADR-012 (persistence/security/recovery), ADR-013 (consume `drenyra-ai`, remove duplicate authority) |
| [products/drenyra-product-philosophy.md](products/drenyra-product-philosophy.md) | Product direction and guardrails |
| [01-foundation/](01-foundation/) | Ecosystem constitution, canonical stack, program taxonomy, capability map |
| [06-fiscal/peru/](06-fiscal/peru/) | Peruvian fiscal reference (SUNAT, IGV, SIRE, PLE, CDR, detracciones) |
| [10-development/](10-development/) | Development guides (setup, tests, conventions) |

## Position in the ecosystem

Drenyra Command Center is the **mature product surface** of the Drenyra ecosystem: the web application, API, and terminal through which professionals run fiscal workflows, review candidates, approve material decisions, and operate the accounting ledger. **Status: in development (public).**

It is a **consumer, never a producer of core logic**. The ecosystem dependency graph is one-way:

```
drenyra-engram (memory)        drenyra-ai (agent ecosystem + fiscal core)
      │  reads/context                ▲  consumed as released artifacts
      │                               │
      └──────► Command Center ◄───────┘
```

| Repo | Relationship to Command Center |
| --- | --- |
| `drenyra-ai` | Consumed: Receipt-Driven Accounting runtime — missions, candidates, reviews, gates, receipts, ledger (Alpha, v0.5.0 published) |
| `drenyra-engram` | Consumed: institutional accounting memory — scope-first observations, policies (Alpha, v0.2.1) |
| `drenyra-pi` | Sibling: Pi-native operator harness over the same `drenyra-ai` runtime |
| `drenyra-skills` | Sibling: versioned accounting/tax/operational knowledge |
| `drenyra-guardian-angel` | Sibling: independent adversarial verification of consumed contracts |

**The Command Center is a projection of the Core — never a second authority.** It renders only `status` and `nextTransition` from `drenyra-ai` and never reconstructs the state machine.

Product programs this repo delivers (per the Drenyra Dominion Program master in `drenyra-ai`):

- **SDD-100 — Professional Command Center:** web UI projection of the Core (flagship).
- **SDD-060 — Multi-Operator Control Plane:** org-scoped views and approval chains for firms.
- **SDD-050 — Peruvian Monthly Close:** the first complete vertical (ERP/SIRE/banks → verifiable close).

## Core invariants

1. **Money is BigInt cents, never floats** (`packages/domain/src/value-objects/Money.ts`, cents pattern). Version/sequence numbers are JSON integers.
2. **RUC/period scope is mandatory** — tenant-isolated PostgreSQL as the transactional source of truth; every surface is scoped to organization/company (RUC)/period.
3. **Every material action produces a signed, append-only receipt** (RED, Ed25519-signed), verifiable offline.
4. **The evidence graph is explicit:** `source → normalized → validated → proposed → approved → promoted`.
5. **Agents propose; the deterministic Core decides** (ADR-011). No orchestrator inside this repo accepts transitions.
6. **Memory informs, never authorizes** (`drenyra-engram`).
7. **Fail-closed default:** no consumer may convert a Core rejection into an approval.

## Layer model

### Ecosystem planes

The product is organized across the 8 FEOS planes; no upper plane bypasses a lower one (an agent cannot call SUNAT directly):

```
1. Experience    — web, CLI, API, embedded UI
2. Workspace     — portfolio, companies, periods, change sets
3. Intelligence  — agent runtime, skills, model routing, memory
4. Trust         — evidence, policy, materiality, approval, receipts
5. Execution     — durable workflows, idempotency, recovery
6. Financial     — ledger, close, tax, treasury, AP/AR
7. Integration   — SUNAT, banks, ERPs, documents
8. Country       — Peru first, then LATAM
```

### Repository layers

```
apps/web (React 19 + TanStack Router)
   │   renders status/nextTransition only
apps/api (Bun + Elysia — input adapter, vertical slices + CQRS)
   │
packages/application (use cases, ports)
   │
packages/domain (framework-free entities, value objects, fiscal rules)
   │
packages/persistence · infrastructure · ai (adapters at the edges)
   │
drenyra-ai (consumed artifact: missions, gates, receipts, ledger)
```

- Modular monolith with hexagonal boundaries per domain; no premature microservices.
- The core does not depend on the UI; the UI can go down and rebuild from Core state.

### Authority model

**The human decides.** Approval gates are risk-proportional (R0–R3):

| Level | Work | Gate |
| --- | --- | --- |
| R0 | Read / high autonomy | No approval |
| R1–R2 | Material actions with bounded risk | Professional approval (single) |
| R3 | Irreversible actions | Explicit approval (dual) |

Chain of authority (from [ecosystem-boundaries.md](architecture/ecosystem-boundaries.md)):

1. The professional requests an outcome from the Command Center.
2. The Command Center creates a mission through the published `drenyra-ai` contract.
3. Agents research, propose, and prepare candidates.
4. `drenyra-ai` computes identity, scope, and materiality.
5. Gates determine which evidence and approval are required.
6. The professional approves when appropriate.
7. An adapter executes or confirms the external action.
8. `drenyra-ai` records the result with a signed receipt and verifiable ledger.
9. The Command Center only represents the authoritative state returned by the Core.

## Consumer contract

The Command Center consumes `drenyra-ai` as **released, versioned artifacts** — today a vendored tarball (`vendored/drenyra-ai-0.2.0.tgz`), moving to the npm registry when published (ADR-013); never a checkout and never copy-pasted source.

| Rule | Detail |
| --- | --- |
| Import, don't fork | Contract types come from `drenyra-ai` / `drenyra-engram`; canonical copies do not live here |
| Pin released versions | Upgrades are explicit, tested, and receipted |
| Zero duplicated authority | No local gates, transitions, materiality, receipts, or ledger implementations (verified, ADR-013) |
| Conformance governs | Receipt conformance suites run against the consumed artifact |
| File defects upstream | A defect in a consumed artifact is filed in the owning repo, with consumer evidence attached |

## Repository scope

**In scope (this repo):** product UI and surfaces, workspaces/companies/periods, documents and closure workflows, reconciliation, approval chains, SUNAT integration flows, country packs, evidence-graph visualization, and the developer/automation surface (API, CLI, SDK).

**Out of scope (owned elsewhere):** mission/candidate/review/gate runtime → `drenyra-ai`; memory storage and search → `drenyra-engram`; Pi-specific operator behavior → `drenyra-pi`; standalone receipt verification for external ERPs → `drenyra-ai`. Long-term, these must not be re-created here; boundary violations are caught in review and by `architecture:check-boundaries`.
