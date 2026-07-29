# Drenyra Documentation Index

**Last updated:** 2026-07-29
**Architecture:** Drenyra Financial Engineering OS (FEOS) — 8 planes
**Program:** [CAP-FEOS-00 — Drenyra Financial Engineering Operating System](./01-foundation/feos-program.md)

---

If you read one page besides the README, make it this one. This index does not list every file — it tells you where to start based on **what you need to do**.

---

## Your task → Start here

| If you want to...                                                                    | Start here                                                                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Understand what Drenyra is** and why it exists                                     | [Product Philosophy](./01-foundation/product-philosophy.md) · [Strategic Positioning](./01-foundation/strategic-positioning.md) |
| **Set up your development environment**                                              | [Getting Started](./10-development/getting-started.md)                                                                          |
| **Understand the architecture** — 8 FEOS planes, multi-language stack                | [Canonical Stack](./01-foundation/canonical-stack.md) · [FEOS Program](./01-foundation/feos-program.md)                         |
| **Contribute code** — conventions, testing, adding features                          | [Development Guide](./10-development/README.md)                                                                                 |
| **Learn the FEOS planes** — how the system is organized                              | See [FEOS Planes at a Glance](#feos-planes-at-a-glance) below                                                                   |
| **Understand fiscal compliance for Peru** — SUNAT, IGV, SIRE, PLE                    | [Fiscal Domain (Peru)](./06-fiscal/peru/README.md)                                                                              |
| **Review architecture decisions** — why we chose what we chose                       | [Architecture Decision Records](./11-adr/README.md)                                                                             |
| **Understand security, threat model, tenant isolation**                              | [Security Baseline](./12-security/README.md)                                                                                    |
| **Deploy, monitor, operate** Drenyra in production                                   | [Operations Guide](./13-operations/README.md)                                                                                   |
| **Design a new feature or capability**                                               | [Design Docs](./14-design/README.md)                                                                                            |
| **Understand the capability roadmap** — what's built, what's next                    | [Capability Map](./01-foundation/capability-map.md)                                                                             |
| **Classify or create a new document** — SDD, ADR, FSD, ASD                           | [Program Taxonomy](./01-foundation/program-taxonomy.md)                                                                         |
| **Run a fiscal workflow** — create workspace, review change set, interpret a receipt | [How-to Guides](./02-guides/README.md)                                                                                          |

---

## Audience paths

Not sure which section applies to you? Pick your role:

### 👨‍💻 Developer

```
README.md → 10-development/getting-started.md → 10-development/conventions.md
→ 01-foundation/canonical-stack.md → 01-foundation/program-taxonomy.md
→ 11-adr/ → 14-design/ → 12-security/
```

### 👨‍💼 Product / Strategy

```
README.md → 01-foundation/product-philosophy.md → 01-foundation/strategic-positioning.md
→ 01-foundation/capability-map.md → 01-foundation/feos-program.md
```

### 👩‍⚖️ Fiscal / Compliance

```
README.md → 01-foundation/product-philosophy.md
→ 07-financial-plane/README.md → 05-trust-plane/README.md
→ 06-fiscal/peru/
```

### 🧑‍🔧 Operations / DevOps

```
README.md → 13-operations/README.md → 12-security/README.md
→ 06-execution-plane/README.md → 08-integration-plane/README.md
```

---

## FEOS Planes at a Glance

Drenyra is organized into **8 architectural planes**. No upper plane bypasses a lower one.

```
┌──────────────────────────────────────────────────────────────┐
│  1. EXPERIENCE PLANE   →  02-experience-plane/              │
│  Workbench · CLI · Mobile · API · Embedded UI                │
├──────────────────────────────────────────────────────────────┤
│  2. WORKSPACE PLANE    →  03-workspace-plane/                │
│  Portfolio · Companies · Periods · Change Sets · Attention    │
├──────────────────────────────────────────────────────────────┤
│  3. INTELLIGENCE PLANE →  04-intelligence-plane/              │
│  Pi Runtime · Agents · Skills · Model Routing · Memory        │
├──────────────────────────────────────────────────────────────┤
│  4. TRUST PLANE        →  05-trust-plane/                    │
│  Evidence · Policy · Materiality · Approval · Receipts        │
├──────────────────────────────────────────────────────────────┤
│  5. EXECUTION PLANE    →  06-execution-plane/                │
│  Temporal · Jobs · Idempotency · Fencing · Recovery          │
├──────────────────────────────────────────────────────────────┤
│  6. FINANCIAL PLANE    →  07-financial-plane/                │
│  Ledger · Close · Tax · Treasury · AP · AR · Payroll         │
├──────────────────────────────────────────────────────────────┤
│  7. INTEGRATION PLANE  →  08-integration-plane/              │
│  SUNAT · Banks · ERPs · Documents · Payments · Authorities    │
├──────────────────────────────────────────────────────────────┤
│  8. COUNTRY PLANE      →  09-country-plane/                  │
│  Peru · Colombia · Chile · Ecuador · Mexico · Brazil          │
└──────────────────────────────────────────────────────────────┘
```

Each plane has its own README explaining what it is, what it is NOT, and how it relates to the others.

---

## Documentation Map

### Foundation

| Document                                                          | What it answers                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| [Product Philosophy](./01-foundation/product-philosophy.md)       | Why Drenyra exists. The definitive thesis.                      |
| [Strategic Positioning](./01-foundation/strategic-positioning.md) | Elevator pitch, moat, competition, wedge strategy.              |
| [Canonical Stack](./01-foundation/canonical-stack.md)             | Multi-language stack, hexagonal architecture, evolution stages. |
| [Program Taxonomy](./01-foundation/program-taxonomy.md)           | Document classification: SDD, ADR, FSD, WSD, ASD.               |
| [Capability Map](./01-foundation/capability-map.md)               | 90+ capabilities across 12 domains, with implementation status. |
| [SDD Audit](./01-foundation/sdd-audit.md)                         | Status of 79 SDDs against the taxonomy.                         |
| [FEOS Program](./01-foundation/feos-program.md)                   | The umbrella program: 18 SDDs across 8 planes.                  |

### Development (10)

| Guide                                                            | What it covers                            |
| ---------------------------------------------------------------- | ----------------------------------------- |
| [Getting Started](./10-development/getting-started.md)           | Environment setup, Bun, monorepo.         |
| [Conventions](./10-development/conventions.md)                   | Code style, commit conventions, naming.   |
| [How to Add a Feature](./10-development/how-to-add-a-feature.md) | End-to-end process for new features.      |
| [How to Write a Test](./10-development/how-to-write-a-test.md)   | Testing patterns, property-based testing. |
| [Test Patterns](./10-development/test-patterns.md)               | Specific testing patterns.                |
| [How to Debug](./10-development/how-to-debug.md)                 | Debugging tools and techniques.           |
| [Go-TS Contracts](./10-development/go-ts-contracts.md)           | Contracts between Go and TypeScript.      |
| [Engram Guide](./10-development/engram-guide.md)                 | Persistent memory for AI agents.          |

### Architecture Decision Records (11)

> **When you need to understand why a decision was made.** Each ADR documents context, decision, consequences, and alternatives.

See the [ADR index](./11-adr/README.md) for the full list. Key records:

| ADR                                                           | Decision                                              |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| [ADR-001](./11-adr/ADR-001-bun-elysia-api.md)                 | Bun + Elysia for the API layer.                       |
| [ADR-004](./11-adr/ADR-004-vertical-slices-cqrs.md)           | Vertical slices + CQRS for feature organization.      |
| [ADR-005](./11-adr/ADR-005-domain-package-framework-free.md)  | Domain package must stay framework-free.              |
| [ADR-008](./11-adr/ADR-008-property-based-testing.md)         | Property-based testing for fiscal invariants.         |
| [ADR-009](./11-adr/ADR-009-canonical-idempotency-contract.md) | Canonical idempotency contract across all mechanisms. |

### Security (12)

See the [Security index](./12-security/README.md). Covers threat model, tenant isolation, secret management, incident response, monitoring, and NIST CSF baseline.

### Operations (13)

| Document                                                      | What it covers                               |
| ------------------------------------------------------------- | -------------------------------------------- |
| [Repo Sync](./13-operations/drenyra-repo-sync.md)             | Cross-repo synchronization during Fase 1.    |
| [Platform Connection](./13-operations/platform-connection.md) | Integration with the Drenyra platform shell. |

### How-to Guides (02)

| Guide                                                                     | What you will learn                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------- |
| [Create a Workspace](./02-guides/how-to-create-a-workspace.md)            | Set up a workspace for company, period, and objective.  |
| [Review a Change Set](./02-guides/how-to-review-a-change-set.md)          | Navigate a financial diff, check evidence, approve.     |
| [Interpret a Receipt](./02-guides/how-to-interpret-a-receipt.md)          | Read a receipt, verify integrity, trace to evidence.    |
| [Configure a Country Pack](./02-guides/how-to-configure-a-country-pack.md) | Add or customize fiscal rules for a jurisdiction.       |
| [Add a Fiscal Obligation](./02-guides/how-to-add-a-fiscal-obligation.md)  | Model a tax declaration with FSD and tests.             |

### Reference (03)

| Document                                         | What it covers                                   |
| ------------------------------------------------ | ------------------------------------------------ |
| [Glossary](./03-reference/glossary.md)           | Unified glossary of Drenyra and fiscal terms.    |

### Explanation (04)

| Document                                                          | What it covers                                      |
| ----------------------------------------------------------------- | --------------------------------------------------- |
| [Evidence Graph](./04-explanation/evidence-graph.md)              | How the evidence trail is built and traversed.     |
| [R0–R3 Governance](./04-explanation/r0-r3-governance.md)          | Risk-based governance model for agent actions.     |
| [Receipt-Driven Execution](./04-explanation/receipt-driven-execution.md) | The RED protocol for material operations.    |
| [Materiality](./04-explanation/materiality.md)                    | How risk × amount × deadline drives attention.     |
| [FSD](./04-explanation/fiscal-spec-driven-execution.md)           | Fiscal Specification-Driven Execution discipline.  |

### Fiscal Domain — Peru (06)

| Document                                         | What it covers                                   |
| ------------------------------------------------ | ------------------------------------------------ |
| [Overview](./06-fiscal/peru/README.md)           | Peruvian tax system overview, regimes, roadmap.  |
| [SUNAT Basics](./06-fiscal/peru/sunat-basics.md) | RUC, SOL, tax regimes, SEE, payment schedules.   |
| [IGV](./06-fiscal/peru/igv.md)                   | IGV 18%, IPM gradual 2026–2029, credit tax.      |
| [Detracciones](./06-fiscal/peru/detracciones.md) | SPOT system, percentages, D. Leg. 1713.          |
| [CPE](./06-fiscal/peru/comprobantes.md)          | Electronic invoices, UBL 2.1, SEE, validation.   |
| [CDR](./06-fiscal/peru/cdr.md)                   | Receipt confirmation, states, codes, flow.       |
| [SIRE](./06-fiscal/peru/sire.md)                 | RVIE, RCE, discretionary period until 08/2026.   |
| [PLE](./06-fiscal/peru/ple.md)                   | Electronic books program, formats, migration.    |
| [Renta](./06-fiscal/peru/renta.md)               | Income tax, categories, rates, payments.         |

### Design (14)

| Document                                              | What it covers                                      |
| ----------------------------------------------------- | --------------------------------------------------- |
| [Product Topology](./14-design/product-topology.md)   | How this repo relates to the platform.              |
| [Design Influences](./14-design/design-influences.md) | External design references adopted and rejected.    |
| [RED Spec](./14-design/red-spec.md)                   | Receipt-Driven Execution protocol.                  |
| [Ledger Boundaries](./14-design/ledger-boundaries.md) | Invariants that must NEVER be broken.               |
| [Fiscal Seams](./14-design/fiscal-seams-design.md)    | Peru-first, LATAM-scalable architecture.            |
| [Cap Workbench-00](./14-design/cap-workbench-00.md)   | Transforming Drenyra into an operational workbench. |

---

## Quick reference

### Do

- Start with the plane README before diving into details.
- Follow the [audience paths](#audience-paths) above if you are new.
- Update the **Last updated** line when you change a document.
- Use the [Program Taxonomy](./01-foundation/program-taxonomy.md) to classify new documents.
- Check the [Capability Map](./01-foundation/capability-map.md) before starting a new SDD.
- Run `bun run docs:verify` to check internal links.

### Don't

- Don't create a new document without classifying it first (SDD / ADR / FSD / etc.).
- Don't link to old directory paths (`docs/architecture/`, `docs/adr/`, `docs/development/`). Use canonical FEOS paths.
- Don't add content to a plane that belongs to a different plane (e.g., UI code in Trust plane docs).
- Don't duplicate content across sections — cross-reference instead.

---

## Maintenance

```bash
# Verify all internal links
bun run docs:verify

# Full link check (including external)
bun run docs:check-links --full

# Full maintenance workflow
bun run docs:maintain
```

This index is manually curated. If you add a document to a section, update this index too.
