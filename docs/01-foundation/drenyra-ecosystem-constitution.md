# Drenyra Ecosystem Constitution

**Last updated:** 2026-08-14
**Status:** Active — ratified governance baseline
**Applies to:** `drenyra-command-center` and every repository it integrates with in the Drenyra ecosystem
**Alineado con:** [Product Philosophy](./product-philosophy.md) · [Strategic Positioning](./strategic-positioning.md) · [Ecosystem Boundaries](../architecture/ecosystem-boundaries.md) · [ADR-010 Ecosystem Boundary & Authority](../11-adr/ADR-010-ecosystem-boundary-authority.md) · [Private Product Policy](../products/private-product-policy.md) · [Arkelythex Doctrine](../DOCTRINE.md)

---

## Executive summary

> Drenyra is a private commercial ecosystem: one financial authority (the Core), one product surface family (web, CLI, and future adapters), and zero duplicate financial domain logic outside the Core. This constitution is the durable governance contract that fixes **which repositories exist or may exist, what each may and may not do, where financial authority lives, and the quality, security, documentation, and fork rules every repository must honor.**

It binds human maintainers, AI agents, and CI. Any PR, SDD, or repository decision that contradicts it must be rejected with a reference to this document. This document is the navigation layer between the [Operating Model](./drenyra-operating-model.md) (how Drenyra operates) and the [Program Taxonomy](./program-taxonomy.md) (how work is classified).

| Question | Answer |
| --- | --- |
| Who decides financial outcomes? | The Core (`drenyra-ai` runtime) — the single financial authority. |
| What is this repository? | `drenyra-command-center`, the Accounting Command Center product surface. |
| What never lives here? | Core runtime logic, memory engines, harness logic, or duplicate contract types. |
| What is the standing of future repos? | Conditional — they exist only after an explicit creation gate passes. |
| What are the hard constraints? | Fiscal correctness, tenant/RUC scope, receipts/evidence, private-commercial distribution. |

---

## 1. Purpose and non-goals

### Purpose

1. Define the canonical repository taxonomy of the Drenyra ecosystem and the responsibilities of each member.
2. Fix a **single financial authority** and the versioned-contract rule that all surfaces must consume.
3. Set product-surface adapter rules so no surface duplicates financial domain logic.
4. Set baseline quality, security, release, documentation, and fork-governance requirements.
5. Provide a staged adoption roadmap with explicit decision gates for conditional future repositories.

### Non-goals

This constitution is **not**:

- ❌ A product spec, SDD, or feature roadmap — those live in `openspec/changes/` and follow the [Program Taxonomy](./program-taxonomy.md).
- ❌ A substitute for ADRs — architectural decisions still require an ADR in `docs/11-adr/`.
- ❌ An authorization to create repositories. Creating a repository requires the Stage 3 gate (§9).
- ❌ A license grant. Distribution rules are set by the owner and the [Private Product Policy](../products/private-product-policy.md).
- ❌ A replacement for fiscal, tenant/RUC, receipts, or evidence constraints — those are preserved and referenced, never relaxed.

---

## 2. Canonical repository taxonomy and responsibilities

### 2.1 Current repositories

| Repository | Status | Role | Responsibilities | Must never |
| --- | --- | --- | --- | --- |
| `drenyra-command-center` (this repo) | **Current** — private, mature product surface | Accounting Command Center: `apps/web` (primary fiscal web surface), `apps/api`, `apps/data-engine`, `apps/cli` (Go fiscal terminal), workspaces, companies/RUC, fiscal periods, documents, SUNAT flows, human-in-the-loop approval, evidence-graph UI | Own the professional product experience; represent only the authoritative state returned by the Core; consume published contracts | Re-implement Core gates or mutate authoritative state; duplicate financial domain logic; vendor runtime checkouts; treat `packages/pi/src/serve.ts` stubs as product contracts |
| `drenyra-pi` (external repo, `~/Documents/PROYECTOS/drenyra-pi`) | **Current** — separate CLI/harness product | Pi-native accounting harness: accounting persona, commands, operational panel, specialized agents, accounting skills, RDA procedures, model routing, safety guards over the Core runtime | Convert Pi into a disciplined, verifiable accounting operator; consume **published** Core versions | Resolve runtime versions from `PATH`; bypass the Core; be re-implemented inside `drenyra-command-center` |

> **Local fact anchors (verified in this repo):**
>
> - `packages/pi/src/serve.ts` exposes **stub execution routes** and is development scaffolding, **not** the canonical GUI backend. A future GUI must consume real adapter/DFAS contracts.
> - `apps/cli` exists in this repo, but the user identifies the external `drenyra-pi` repository as the separate CLI/harness product. Harness behavior must not be duplicated here.
> - `apps/landing` is documented in `AGENTS.md` but **absent** from this repo — it remains conditional (§2.3).
> - `products/kuse` is an existing **fork precedent**, not an automatic production base (§7).

### 2.2 Ecosystem companions (owned elsewhere, referenced)

These repositories are outside this repo's edit surface but define its contracts. Drenyra consumes them; it never re-implements them:

| Repository | Role | Relationship |
| --- | --- | --- |
| `drenyra-ai` | **Core** — missions, candidates, materiality, authority, gates, receipts, ledger, recovery | Consumed as released, versioned artifacts; the single financial authority (§3) |
| `drenyra-engram` | Institutional accounting memory — observations, policies, provenance | Consumed for context; memory **never authorizes** |
| `drenyra-skills` (registry) | Versioned accounting/fiscal/jurisdictional knowledge | Consumed as versioned policies; must not silently change frozen policies |

### 2.3 Conditional future repositories

The following do **not** exist as production surfaces today. They are reserved names and must never be assumed, referenced as live, or built against until the Stage 3 creation gate (§9) passes:

| Reserved name | Conditional role (if created) | Gate required |
| --- | --- | --- |
| `drenyra-command-code` | Potential future split of command/automation surface code out of this repo | Stage 3 — owner decision + approved SDD + published contracts |
| Mobile surface | Capture & approval (photo/share-sheet, approve/reject, supervise) — per SDD-FEOS-013 (planned) | Stage 3 |
| Remote web surface | Remote access/supervision of the control plane | Stage 3 |
| `apps/landing` | Marketing/landing surface (documented, currently absent) | Stage 3 — must not be built against before it exists |

---

## 3. One financial authority and versioned contracts

### 3.1 The single financial authority

The **Core** (`drenyra-ai` runtime) is the only component that computes identity, scope, and materiality, runs gates, signs receipts, and records the ledger.

Chain of authority (ADR-010, condensed):

1. The professional requests an outcome from a Drenyra surface.
2. The surface creates a mission through the **published** Core contract.
3. Agents research, propose, and prepare candidates.
4. The Core computes identity, scope, and materiality.
5. Gates determine which evidence and approval are required.
6. The professional approves when appropriate.
7. An adapter executes or confirms the external action.
8. The Core records the result with a signed receipt and verifiable ledger.
9. The surface only represents the authoritative state returned by the Core.

**Invariants (non-negotiable):**

- **No consumer may convert a Core rejection into an approval.**
- Memory is not authorization; agent narrative is not evidence; a published version is not a checkout.
- The UI may fail and rebuild from Core state; transcripts are disposable.

### 3.2 Versioned contracts rule

- Surfaces and harnesses consume **published versions** of Core contracts (`drenyra-ai`, `drenyra-engram`); the Core never depends on them.
- Version pins are canonical: `DFAS_PROTOCOL_VERSION`, `DATA_ENGINE_CONTRACT_VERSION`, and any contract exposed to surfaces.
- Contract types are canonical in their owning repos; surfaces **import** them, they do not fork or re-declare them.
- Internal contracts depend on **model capability classes** (`frontier-reasoning`, `fast-extraction`, `vision-review`, `deterministic-classifier`), never on commercial model names.
- Dependency direction is one-way; violations are rejected in review.

### 3.3 Preserved fiscal and tenant constraints

These constraints apply to every repository and surface and are **never relaxed** by this constitution:

- Monetary values are `Money` (BigInt cents); floats and raw numbers are prohibited.
- Organization/company/RUC scoping is never bypassed in APIs, queries, jobs, seeds, exports, or tests (tenant guard).
- Every material action produces an immutable receipt (RED) and preserves evidence before posting, closing, or filing.
- Approval is risk-proportional (R0–R3); irreversible actions require explicit human approval.
- The evidence graph is `source → normalized → validated → proposed → approved → promoted`.

---

## 4. Product-surface adapter rules

1. **Every surface is an adapter.** Web, CLI, mobile, remote web, and landing surfaces all traverse the same canonical loop (`Agent proposal → Typed tool → Capability policy → Tenant scope → Deterministic validator → Approval gate → Durable workflow → External adapter → Evidence receipt`). No surface skips a step; no agent calls SUNAT directly.
2. **Reuse, don't duplicate.** Surfaces share types through published contracts; desktop reuses the web UI rather than shipping a second implementation; new surfaces never re-implement financial domain logic.
3. **A new GUI must consume real adapter/DFAS contracts** and preserve fiscal scope, approvals, evidence, and receipts. Stub routes (`packages/pi/src/serve.ts`) are scaffolding and must be retired or gated before becoming a backend.
4. **Constrained Fiscal Computer Use only.** Level 1 — official API/connector (always preferred); Level 2 — deterministic browser playbook (versioned selectors, capture-before/after, receipt per action); Level 3 — read-only vision fallback with explicit approval for any submission. No unrestricted computer use.
5. **Credential broker rule.** The model never receives SOL passwords, certificates, or bank secrets directly; a credential broker authenticates and delivers only the authorized session or action.

---

## 5. Ownership and maintainership

| Rule | Requirement |
| --- | --- |
| Product surface and professional experience | Owned by `drenyra-command-center` |
| Runtime contracts, gates, receipts, ledger | Owned by `drenyra-ai` |
| Memory contracts and lifecycle | Owned by `drenyra-engram` |
| Harness behavior | Owned by `drenyra-pi` |
| Defects | Filed in the owning repo with the consumer's evidence attached — never fixed by duplicating logic in the consumer |
| Boundary enforcement | A PR that re-implements Core or memory logic inside a surface is rejected and redirected to the owning repo |

Maintainers of every ecosystem repo must: keep docs-as-code current (same PR as the change), require ADRs for architectural decisions, keep runbooks under `docs/13-operations/`, and treat stale docs as a bug.

---

## 6. Baseline quality, security, and release requirements

### 6.1 Quality baseline

- No floats or raw numbers for money; `Money` everywhere.
- No `any`; precise types, `unknown`, or justified generics.
- Fiscal rules carry property-based tests (invariants: IGV, detracciones, RUC checksum, `Money` operations).
- Contract tests run in the producing repo before ship; consumers do not extend mirrors.
- Small, verifiable, reversible changes; no broad rewrites without an explicit migration plan.

### 6.2 Security baseline

- **Private commercial distribution** (see [Private Product Policy](../products/private-product-policy.md)): ecosystem repos are private; no public collaborators, no public issues/PRs, no public registry artifacts.
- Container images publish to **private GHCR** (`ghcr.io/arkelythex/...`) with authenticated pulls; never switch visibility to public.
- Secrets, real credentials, and production tokens never enter code, docs, or tests.
- Tenant/RUC isolation is a product safety requirement; security changes consult `docs/12-security/threat-model.md` and the security baseline first.
- SBOMs and checksums are private evidence, distributed under contract/NDA; the engine code is **never** published.

### 6.3 Release baseline

- Releases are **versioned, published artifacts** — never checkouts, never `PATH` resolution.
- Release evidence (SBOM, checksums, conformance vectors) is the first line of procurement evidence.
- Escrow/audit requests escalate to the owner; no agent accepts or negotiates them (§7 of the private policy).
- No release, package, or registry switch to public without an explicit owner decision.

---

## 7. Fork intake, upstream syncing, licensing, and adapter rules

### 7.1 Fork intake

- Forks are **intake candidates**, not production bases. `products/kuse` is the existing precedent: it demonstrates that forks exist in this ecosystem but must pass review and provenance recording before any production claim.
- A fork becomes production only through an approved SDD that names its owner, provenance, divergence policy, and test evidence.

### 7.2 Upstream syncing

- Canonical work lands in the owning repository first; mirrors elsewhere are **read-only** and one-way (see [Repository Sync Playbook](../13-operations/drenyra-repo-sync.md)).
- Do not add new fiscal files to mirror paths — CI boundary checks block them.
- Legacy sync scripts are for one-time porting of historical drift, never for new features.

### 7.3 Licensing and distribution

- The product and its engine are **private commercial** — distributed only under contract and NDA, never as public downloads.
- No repository changes to `public` without an explicit owner decision.
- The public trust surface is deliberate and moat-safe: fiscal-rule docs and API contract specs (planned) are public; engine code, SBOMs, and binary checksums are not.

### 7.4 Adapter rules

- Adapters gather evidence from ERP, banks, SUNAT, and files; they **never claim success without a verifiable response**.
- Adapters never bypass tenant scope, approval gates, or receipt generation.

---

## 8. Documentation, ADR, and runbook requirements

| Requirement | Standard |
| --- | --- |
| Structure | Diátaxis quadrants (tutorial / how-to / reference / explanation); cross-link, don't embed |
| Freshness | Every doc has a top-level `**Last updated**` (or `**Última actualización**`) line; update on content change |
| Docs-as-code | Update docs in the same PR as code changes; stale docs are a bug |
| Verification | `bun run docs:verify` (markdownlint + lychee); `bun run docs:check-links` |
| ADRs | Architectural decisions require an ADR in `docs/11-adr/`; ADR-010 governs ecosystem boundary and authority |
| Runbooks | Operational and incident procedures live in `docs/13-operations/` and `docs/12-security/`; keep playbooks executable |
| AI-agent-consumable | Clear h2/h3 headers, direct answers first, structured data (tables, JSON examples), low jargon per section |
| Classification | New work follows the [Program Taxonomy](./program-taxonomy.md) (SDD, ADR, FSD, WSD, ASD) and is registered in the [SDD Audit](./sdd-audit.md) |

---

## 9. Staged adoption roadmap and decision gates

Adoption is staged so each phase is verified before the next begins. **No stage authorizes creating a repository; only the Stage 3 gate does.**

| Stage | Scope | Exit gate (who decides, what evidence) |
| --- | --- | --- |
| **0 — Baseline** | Ratify this constitution; inventory current surfaces (`apps/web`, `apps/api`, `apps/data-engine`, `apps/cli`, external `drenyra-pi`) and stubs (`packages/pi/src/serve.ts`). | Owner review: constitution accepted; inventory recorded. |
| **1 — Boundary enforcement** | Finish extraction of Core/memory/harness logic; remove duplicated contract types; enforce version pins and CI boundary checks; review gates reference ADR-010. | Owner + maintainers: zero duplicate contract types in surfaces; CI boundary checks green; dependency-direction verified. |
| **2 — Surface adapters** | Build any new surface against real adapter/DFAS contracts; retire or gate stub routes; adapter conformance tests prove fiscal scope, approvals, evidence, and receipts are preserved. | Owner + architecture review: conformance suite green; no stub route is a product contract; receipts/evidence verified in a full-loop test. |
| **3 — Conditional repositories** | A future repo (`drenyra-command-code`, mobile, remote web, landing) may be **created** only when the creation gate passes. | **Creation gate:** (1) explicit owner decision, (2) an approved SDD with scope and owner, (3) published contracts the repo will consume, (4) this constitution's boundary and quality rules adopted by the new repo. |

**Gate semantics:** if a stage's exit gate fails, the stage is reworked — work never advances to the next stage on a failed gate. A repository is never "created" by documentation; the constitution only permits creation through Stage 3.

---

## 10. Enforcement

- Code review is the primary enforcement point: direction and boundary violations are rejected with a reference to this document and [ADR-010](../11-adr/ADR-010-ecosystem-boundary-authority.md).
- `AGENTS.md` non-negotiables and the GGA review checklist are the operational checklists for this constitution.
- Conflicts between this constitution and another doc resolve in favor of this constitution unless the other doc records an explicit owner-approved amendment.

---

## Related documents

- [ADR-010 — Ecosystem Boundary & Authority](../11-adr/ADR-010-ecosystem-boundary-authority.md) — the ADR that this constitution formalizes
- [Ecosystem Boundaries](../architecture/ecosystem-boundaries.md) — responsibility contract and chain of authority
- [Private Product Policy](../products/private-product-policy.md) — private-commercial distribution, escrow, and visibility rules
- [Repository Sync Playbook](../13-operations/drenyra-repo-sync.md) — mirror, sync, and ownership rules
- [Product Topology](../14-design/product-topology.md) — repo layout and harness evolution (ADR-034/DFAS)
- [Drenyra-Pi Harness](./drenyra-pi-harness.md) — the Pi-native CLI/harness product
- [Operating Model](./drenyra-operating-model.md) — the four execution planes and operational loop
- [Program Taxonomy](./program-taxonomy.md) — classification of documents and work
- [Arkelythex Doctrine](../DOCTRINE.md) — company-level doctrine (parent governance)
- `AGENTS.md` — engineering rules and non-negotiables
