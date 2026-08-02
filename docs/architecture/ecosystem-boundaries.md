# Ecosystem Boundaries — Drenyra (Accounting Command Center)

> **Last updated:** 2026-08-01.

> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version/sequence numbers are JSON integers, never floats.

## Role in the ecosystem

Drenyra is the **Accounting Command Center** and the mature product of the ecosystem. It is the end-user surface where professionals run fiscal workflows, review candidates, approve material decisions, and operate the accounting ledger.

Drenyra **consumes** the ecosystem runtime and memory; it does not re-implement them:

| Consumed      | How                                                                  |
| ------------- | -------------------------------------------------------------------- |
| `drenyra-ai`  | Receipt-Driven Accounting runtime: missions, candidates, reviews, gates, receipts, ledger |
| `drenyra-engram` | Institutional accounting memory: scope-first observations, policies, mission learnings |

## What Drenyra is (in scope)

- The product: workspaces, companies (RUC), fiscal periods, documents, accounts, SUNAT flows.
- Human-in-the-loop fiscal workflows with risk-proportional approval (R0–R3).
- Country packs (Peru first: SUNAT, IGV, SIRE, PLE, CDR, detracciones), then LATAM.
- The evidence graph: `source → normalized → validated → proposed → approved → promoted`.
- Professional UI and product surfaces for the above.

## Explicit non-goals

Drenyra is **not**:

- An independent agent runtime. Missions, candidates, review lenses, gates, receipts, and the ledger core belong to `drenyra-ai`.
- A memory engine. Observations, scope-first search, relations, lifecycle, and provenance belong to `drenyra-engram`.
- A Pi extension. The Pi-native harness belongs to `drenyra-pi`.
- A standalone receipt verifier for external ERPs. That is `drenyra-ai`'s public surface.

## What Drenyra must NOT contain long-term

These are extraction targets. They already live (or are being extracted into) other repos and must not be re-created here:

- **Mission / candidate / review / gate runtime logic** → `drenyra-ai`. Drenyra consumes released, versioned artifacts; it never vendors a checkout.
- **Memory storage and search** → `drenyra-engram`. Drenyra reads memory through its surfaces.
- **Pi-specific operator behavior** → `drenyra-pi`.
- **Duplicated contract types** → contracts are canonical in `drenyra-ai` and `drenyra-engram`; Drenyra imports them, it does not fork them.

## Consumers and producers

| Direction | Party | Relation |
| --------- | ----- | -------- |
| Consumes  | `drenyra-ai` | released, versioned runtime (missions, receipts, gates) |
| Consumes  | `drenyra-engram` | memory reads/context (memory never authorizes) |
| Produces for | end users | fiscal workflows, approvals, evidence trail |
| Produces for | professionals | candidates to approve, receipts to certify |

## Current state and maturity

- Drenyra is the **mature product**: it carries the production UI, fiscal workflows, and country packs, and it owns the professional experience.
- Its dependency on `drenyra-ai` / `drenyra-engram` is consumption of released artifacts; extraction continues in those repos until Drenyra's internal copies are gone.

## Ownership and accountability

- Product and professional experience: this repo.
- Runtime contracts and gates: `drenyra-ai`.
- Memory contracts and lifecycle: `drenyra-engram`.
- A defect in a consumed artifact is filed in the owning repo, with the consumer's evidence attached.

## Boundary enforcement

- Direction violations are caught in review: a PR that re-implements `drenyra-ai` or `drenyra-engram` logic inside Drenyra is rejected and redirected to the owning repo.
- Drenyra consumes released `drenyra-ai` versions; the extraction direction is one-way (see `dependency-direction.md` and `RELEASING.md`).
