<div align="center">

<img width="1200" alt="Drenyra flow — operator → command-center planes → dual approval → receipt" src="assets/branding/drenyra-command-center-flow-banner.svg" />

<p><code>operator → command-center planes → dual approval → receipt</code></p>

</div>

# Drenyra — Verifiable Financial Engineering Operating System

> **Drenyra is the verifiable financial operating system for businesses, accountants, and governments across Latin America.**
>
> Financial Engineering Environment: agents propose, deterministic validators check, professionals approve material decisions, and every action produces an immutable evidence receipt.
>
> Drenyra runs on **Drenyra-AI**, the independent accounting agent operating system it consumes — framework, runtime, agents, skills, receipts, and accounting authority. Drenyra-AI also works standalone via CLI, API, other ERPs, other SaaS, and external integrations. Its product protocol is RDA (Receipt-Driven Accounting) built on the RED receipt mechanism.
>
> **Drenyra-Pi** is the Pi-native harness that turns Pi into a disciplined accounting operator — accounting persona, commands, agents, skills, and safety guards layered over the Drenyra-AI runtime, in the same relationship Gentle Pi has to Gentle AI.
>
> **Drenyra-Engram** is the institutional accounting memory that preserves what the organization knows and can prove about its accounting — remember is not authorize.
>
> **Ecosystem contract:** the approved boundary & authority separation (component responsibilities, chain of authority, dependency rule) is formalized in [ADR-010](docs/11-adr/ADR-010-ecosystem-boundary-authority.md) and mirrored in [Ecosystem Boundaries](docs/architecture/ecosystem-boundaries.md) across `drenyra-ai`, `drenyra-pi` and `drenyra-engram`. The agent model — AI proposes, deterministic Core decides ([ADR-011](docs/11-adr/ADR-011-agent-model-ai-proposes-core-decides.md), Design 3) — governs how missions, agents and skills execute. Persistence, security and recovery ([ADR-012](docs/11-adr/ADR-012-persistence-security-recovery.md), Design 4) keeps authoritative state in events, evidence and receipts — never in conversation or model memory. Orchestration roles (Mastra vs `packages/pi` vs `drenyra-pi` — three layers, not duplicates) are fixed in [Orchestration Roles](docs/architecture/orchestration-roles.md).

[![Status](https://img.shields.io/badge/Status-Active-22c55e)](#)
[![Tests](https://img.shields.io/badge/Tests-209_passing-22c55e)](#)
[![Stack](https://img.shields.io/badge/TypeScript-Bun-3178c6)](#)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

> **Private commercial product.** This repository and the Drenyra ecosystem
> (`drenyra-engram`, `drenyra-ai`, `drenyra-pi`) are **private**. Distribution
> of artifacts (container images, releases, packages) is contractual, never
> public. See [Private Product Policy](docs/products/private-product-policy.md).

---

### Drenyra Dominion Program

The ecosystem is governed by the **Drenyra Dominion Program**, a federated program master: one master SDD fixes vision, authority, contracts, dependencies, gates, and sequencing, while vertical SDDs deliver complete capabilities across the repositories they need. Each repository keeps its own implementation, versioning, and tests, and holds only its local changes plus a reference to the master — full specs are never copied into participant repos, so they never diverge. See the [program master](https://github.com/arkelythex/drenyra-ai/tree/main/openspec/programs/drenyra-dominion).

| SDD | Role for Command Center |
| --- | --- |
| SDD-100 — Professional Command Center | Web UI projection of the Core (Wave 3 flagship product) |
| SDD-060 — Multi-Operator Control Plane | Org-scoped views and approval chains for firms and internal teams |
| SDD-050 — Peruvian Monthly Close | The first complete vertical the UI projects: ERP/SIRE/banks → verifiable close |

**Command Center is a projection of the Core — never a second authority.** It renders only `status` and `nextTransition` from `drenyra-ai` and never reconstructs the state machine.

## Who Uses What

> [!IMPORTANT]
> **The accountant never operates agents, terminals, or CLIs.** They work in **Drenyra App** (the web Command Center) and ask for outcomes — "prepare the July 2026 close for Company X". The command center consumes Drenyra-AI underneath (library/SDK/MCP); agents (Pi, Codex, Claude, OpenCode) are internal infrastructure the command center invokes. Only developers, operators, and integrators use the [Drenyra CLI](apps/cli/README.md).

| Role | Interface | Never touches |
| --- | --- | --- |
| **Accountant / professional** | Drenyra App (web Command Center) | Terminals, CLIs, agents, JSON, mission states |
| **Drenyra App** (Command Center) | Consumes Drenyra-AI via SDK/MCP | Reimplements gates or mutates authoritative state |
| **Drenyra-AI** | Headless core underneath | UI; it never proposes — the Core only stages, gates, and receipts |
| **Operators / developers / integrators** | Drenyra CLI, `drenyra-ai` CLI, MCP | The accountant's day-to-day workflow |
| **Agents (Pi, Codex, Claude, OpenCode)** | Internal engine invoked by the command center | Self-authorization, approval, external-execution claims |

**Golden rule:** the professional should never have to learn to operate an agent orchestration — they request an accounting result and receive reviewable candidates, evidence, explicit decisions, and verifiable receipts. Agents propose; the deterministic Core and professional approval decide. See [ADR-010](docs/11-adr/ADR-010-ecosystem-boundary-authority.md) for the frozen boundary.

---

## The Problem

Financial operations across Latin America are fragmented across disconnected tools:

| Tool             | Role                     | Problem                                    |
| ---------------- | ------------------------ | ------------------------------------------ |
| ERP              | Core accounting          | Siloed, no AI, no audit trail per decision |
| Excel            | Analysis, tracking       | No controls, no versioning, no evidence    |
| SUNAT portals    | Tax filing               | One per obligation, no integration         |
| Email            | Approvals, exceptions    | No trail, no accountability                |
| Documents        | Evidence, receipts       | Scattered, no canonical source             |
| Banking          | Payments, reconciliation | No API, manual matching                    |
| Manual knowledge | Fiscal rules, criteria   | Lost when people leave                     |

**Drenyra replaces this with a single operational pipeline:**

```
Workspace → Agents → Deterministic Validation → Evidence →
Professional Review → Controlled Execution → Immutable Receipt
```

---

## What Drenyra Builds

| Capability                          | Description                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Financial Workspaces**            | Portfolio-level organization across companies, periods, and objectives. Every scope is explicit: which RUC, which period, which goal.                                |
| **Fiscal Agents**                   | Specialized AI agents that propose, draft, prepare, and flag work under strict tool contracts (R0–R3). Agents never execute material actions without human approval. |
| **Accounting Ledger**               | Ledger-as-Git: atomic accounting changes with compensating entries, period locking, and full audit trail. PCGE-compliant.                                            |
| **Evidence Graph**                  | Every operation leaves a traceable evidence trail: `source → normalized → validated → proposed → approved → promoted`. No black boxes.                               |
| **Financial Change Sets**           | Isolated financial changes like Git branches, with diff, review, and merge. Every change set carries risk × materiality × deadline context.                          |
| **Continuous Controls**             | Invariant checks running before, during, and after every material operation. Fiscal correctness is not a test phase — it is the architecture.                        |
| **Country Packs**                   | Country-specific fiscal rules as composable, versioned packages. Peru first (SUNAT, IGV, SIRE, PLE, CDR, detracciones), then LATAM.                                  |
| **Approval Control Plane**          | Risk-based human-in-the-loop: R0 (read, high autonomy) → R3 (irreversible, explicit dual approval). Professionals approve candidates, not intentions.                |
| **Execution Receipts**              | Every material execution generates an immutable receipt. Verifiable offline, independently of Drenyra.                                                               |
| **Developer & Automation Platform** | API-first, CLI, SDK, model gateway, skills registry, and automation triggers. Designed for extensibility from day one.                                               |

---

## Architecture: 8 FEOS Planes

Drenyra is organized into **8 architectural planes**. No upper plane bypasses a lower one — an agent cannot call SUNAT directly; it must traverse the full stack.

```
┌──────────────────────────────────────────────────────────────┐
│  1. EXPERIENCE PLANE                                         │
│  Workbench · CLI · Mobile · API · Embedded UI                │
├──────────────────────────────────────────────────────────────┤
│  2. WORKSPACE PLANE                                          │
│  Portfolio · Companies · Periods · Change Sets · Attention    │
├──────────────────────────────────────────────────────────────┤
│  3. INTELLIGENCE PLANE                                       │
│  Pi Runtime · Agents · Skills · Model Routing · Memory        │
├──────────────────────────────────────────────────────────────┤
│  4. TRUST PLANE                                              │
│  Evidence · Policy · Materiality · Approval · Receipts        │
├──────────────────────────────────────────────────────────────┤
│  5. EXECUTION PLANE                                          │
│  Temporal · Jobs · Idempotency · Fencing · Recovery          │
├──────────────────────────────────────────────────────────────┤
│  6. FINANCIAL PLANE                                          │
│  Ledger · Close · Tax · Treasury · AP · AR · Payroll         │
├──────────────────────────────────────────────────────────────┤
│  7. INTEGRATION PLANE                                        │
│  SUNAT · Banks · ERPs · Documents · Payments · Authorities    │
├──────────────────────────────────────────────────────────────┤
│  8. COUNTRY PLANE                                            │
│  Peru · Colombia · Chile · Ecuador · Mexico · Brazil          │
└──────────────────────────────────────────────────────────────┘
```

**Material operation flow:**

```
Agent proposal
→ Typed tool
→ Capability policy
→ Tenant scope
→ Deterministic validator
→ Approval gate
→ Durable workflow
→ External adapter
→ Evidence receipt
```

---

## What Drenyra Adopts (and Does Not Reinvent)

Engineering efficiency means standing on the shoulders of mature infrastructure:

| Technology        | Role in Drenyra                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| **Pi SDK**        | Agent runtime, tool execution, session management                            |
| **Temporal**      | Durable workflows, long-running processes, retries, human-in-the-loop pauses |
| **PostgreSQL**    | Transactional source of truth — ledger, documents, policies, evidence        |
| **OpenTelemetry** | Observability — traces, metrics, logs across every plane                     |
| **S3**            | Evidence objects — XML, PDF, CDR, receipts, artifacts                        |
| **TanStack**      | Web application infrastructure (Router, Query, Forms)                        |
| **Tauri**         | Desktop shell for native CLI and local operations                            |

**What Drenyra builds on top:**

| Original Work                | Purpose                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| **Fiscal semantics**         | Money value object, RUC, IGV, PCGE, SUNAT/UBL/SIRE rules     |
| **Country packs**            | Composible, versioned fiscal rules per country               |
| **Evidence Graph**           | Deterministic evidence trail for every operation             |
| **Materiality**              | Risk × amount × deadline prioritization                      |
| **R0–R3 Governance**         | Risk-based human-in-the-loop control plane                   |
| **Verifiable execution**     | Receipt-driven execution (RED) with offline verification     |
| **Multi-company experience** | Portfolio-level operations across RUCs, regimes, and periods |

---

## Repo Structure

```
drenyra/
├── apps/
│   ├── web/              → Fiscal command center — React 19 + TanStack Router
│   ├── api/              → Fiscal API — Bun + Elysia, vertical slices, CQRS
│   ├── data-engine/      → SIRE & analytics — Python + FastAPI + Polars
│   └── cli/              → Fiscal Terminal — Go + Bubbletea
├── packages/
│   ├── domain/           → Framework-free entities, value objects, fiscal rules
│   ├── application/      → Use cases, DTOs, validators, ports
│   ├── persistence/      → Drizzle schemas, repositories, tenant-scoped queries
│   ├── infrastructure/   → Adapters: DB, S3, SUNAT, AI, XML/UBL
│   ├── ai/               → AI facade, model gateway, tool contracts
│   ├── agents/           → Agent runtime: Mastra orchestration, delegation, approvals
│   ├── drenyra-orchestrator/ → Work routing, skills resolution, review lenses
│   ├── shared/           → Cross-cutting helpers, validation, security, schemas
│   └── ui/               → Design system — Tailwind 4, shadcn/ui, DTCG tokens
├── engines/              → Rust — critical verification (ledger, hashing, receipts)
├── services/             → Go — connectors, ingestion, enterprise bridge
├── contracts/            → Canonical schemas — OpenAPI, AsyncAPI, Protobuf
├── country-packs/        → Fiscal rules per country — peru/, colombia/, chile/
├── docs/                 → Architecture, ADRs, runbooks, capability map, taxonomy
├── ops/                  → Runtime infrastructure, observability, Grafana
└── e2e/                  → Product smoke tests
```

Each app has its own `MAP.md` for detailed navigation. Start there before exploring.

---

## Quickstart

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run dev:stack
bun run db:push
bun run dev:check
```

**Expected services:**

| Service              | URL                             |
| -------------------- | ------------------------------- |
| Web (Command Center) | `http://localhost:5174`         |
| API                  | `http://localhost:3000`         |
| Swagger              | `http://localhost:3000/swagger` |
| Data Engine          | `http://localhost:8000/health`  |

**CLI:**

```bash
cd apps/cli
go run cmd/drenyra/main.go
```

---

## Project Status

| Metric           | Value                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| **Status**       | Active development                                                         |
| **FEOS Phase**   | Fase 1 complete (9/18 SDDs), Fase 2 in progress                            |
| **Source files** | 29 across 3 verified packages (orchestrator, phase-gatekeeper, fiscal-sdd) |
| **Tests**        | 209 passing across 3 packages                                              |
| **SDDs**         | 18 FEOS SDDs defined, 9 implemented                                        |
| **Capabilities** | 90+ mapped across 12 domains                                               |
| **Languages**    | TypeScript (primary), Rust (engines), Go (services), Python (analytics)    |

---

## Design Influences

Inspired by and built upon ideas or infrastructure from:

| Project       | Influence on Drenyra                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Gentle-AI** | Work discipline: SDD, context-bound review, evidence receipts, authority-first lifecycle |
| **Pi SDK**    | Agent runtime, tool contracts, session management                                        |
| **Herdr**     | Persistence, workspace composition, semantic supervision                                 |
| **Ghostty**   | Speed, progressive depth, zero-friction ergonomics                                       |
| **OpenCode**  | Multi-agent coordination, plan/exec modes, change management                             |
| **Codex App** | Agent orchestration, skills registry, automations, remote supervision                    |

The formulation matters: Drenyra is **inspired by** these projects and their methodologies. It is not a wrapper or a derivative — it builds original semantics for fiscal correctness, evidence graphs, materiality-based governance, verifiable execution receipts, and multi-country financial operations.

The core thesis — applying software engineering rigor (Git, CI/CD, specs, reviews, evidence) to accounting — is Drenyra's original contribution, validated by the patterns these projects established.

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Built by DreamCoder

From Peru. For Latin America.

> Drenyra is infrastructure-first: we seek validation that makes us fundable, not funding that hides the lack of validation.
>
> **[Product Philosophy](docs/01-foundation/product-philosophy.md)** · **[Capability Map](docs/01-foundation/capability-map.md)** · **[Program Taxonomy](docs/01-foundation/program-taxonomy.md)**
