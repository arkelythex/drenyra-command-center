# Explanation

**Last updated:** 2026-07-29
**Audience:** Developers, architects, fiscal operators, product managers

---

Explanation docs describe the concepts and principles behind Drenyra. They answer **why** — not how. Read these when you want to understand the reasoning behind the architecture, not when you need a step-by-step guide.

| Document | What it explains |
|---|---|
| [Evidence Graph](./evidence-graph.md) | How every operation leaves a traversable, verifiable evidence trail. |
| [R0–R3 Governance](./r0-r3-governance.md) | Risk-based governance: from read-only queries to dual-approval irreversible actions. |
| [Receipt-Driven Execution (RED)](./receipt-driven-execution.md) | The protocol that ensures every material operation produces an immutable, independently verifiable receipt. |
| [Materiality](./materiality.md) | How risk × amount × deadline drives attention, approval routing, and escalation. |
| [FSD — Fiscal Spec-Driven Execution](./fiscal-spec-driven-execution.md) | The discipline of specifying every fiscal obligation as a structured, versioned, testable document. |
| [Financial Change Sets](./financial-change-sets.md) | How financial changes are isolated, diffed, reviewed, and merged like Git branches. |
| [Country Pack Runtime](./country-pack-runtime.md) | How composable country packs adapt Drenyra to different jurisdictions without forking. |
| [Canonical Hashing](./canonical-hashing.md) | How deterministic hashing ensures evidence integrity across the system. |

---

## How to read explanation docs

They are designed to be read in any order. Pick the topic you want to understand and start there. Each doc is self-contained and cross-references related concepts.

If you are new, start with [Evidence Graph](./evidence-graph.md) — it is the foundation that everything else builds on.
